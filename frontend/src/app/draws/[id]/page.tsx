"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import BookingSteps from "@/components/booking/BookingSteps";
import PayhereCheckout from "@/components/payment/PayhereCheckout";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { lotteryApi, bookingsApi, paymentsApi, ApiError } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { useCountdown } from "@/hooks/useCountdown";
import type { Lottery, PayhereParams } from "@/lib/types";

// Payment step — full lifecycle after booking confirmation:
//  idle → loading → ready → [popup] → processing → paid | declined | dismissed | error
type PayStep =
  | "idle"
  | "loading"       // fetching PayhereParams from backend
  | "ready"         // popup not yet opened; Pay Now visible
  | "processing"    // popup closed, polling backend for real status
  | "paid"          // notify confirmed CAPTURED
  | "declined"      // notify confirmed FAILED / card declined
  | "dismissed"     // user closed popup without paying
  | "error";        // SDK error or network failure

export default function DrawDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { isAuthenticated, memberId, member } = useAuth();

  const [lottery, setLottery] = useState<Lottery | null>(null);
  const [lotteryLoading, setLotteryLoading] = useState(true);
  const [lotteryError, setLotteryError] = useState<string | null>(null);

  const [confirmed, setConfirmed] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // PayHere payment state
  const [payStep, setPayStep] = useState<PayStep>("idle");
  const [payhereParams, setPayhereParams] = useState<PayhereParams | null>(null);
  const [payError, setPayError] = useState<string | null>(null);

  useEffect(() => {
    lotteryApi
      .get(id)
      .then(setLottery)
      .catch(() => setLotteryError("Draw not found or no longer available."))
      .finally(() => setLotteryLoading(false));
  }, [id]);

  const countdown = useCountdown(lottery?.closesAt);

  if (lotteryLoading) {
    return (
      <div className="max-w-[600px] mx-auto px-6 py-20 text-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (lotteryError || !lottery) {
    return (
      <div className="max-w-[600px] mx-auto px-6 py-20 text-center">
        <h1 className="font-fraunces text-[32px] font-normal text-text-primary mb-4">
          Draw not found
        </h1>
        <p className="text-text-secondary mb-6">
          {lotteryError ?? "This draw doesn't exist or has been removed."}
        </p>
        <Link href="/draws" className="text-primary hover:underline">
          ← Back to draws
        </Link>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-[600px] mx-auto px-6 py-20 text-center">
        <div className="text-4xl mb-4">🔒</div>
        <h1 className="font-fraunces text-[28px] font-normal text-text-primary mb-3">
          Sign in to book
        </h1>
        <p className="text-text-secondary mb-8">
          Create an account or sign in to book a slot in{" "}
          <strong className="text-text-primary">{lottery.name}</strong>.
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/auth/register"
            className="px-6 py-2.5 bg-primary text-white font-semibold rounded-md hover:bg-primary-light transition-all"
          >
            Create account
          </Link>
          <Link
            href="/auth/login"
            className="px-6 py-2.5 border border-[rgba(92,79,66,0.15)] text-text-secondary rounded-md hover:bg-surface-3 transition-all"
          >
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  // ── Book: reserve then immediately confirm ────────────────────────────────

  async function handleBook() {
    if (!memberId || !lottery?.availableSlotId) return;
    setError(null);
    setLoading(true);
    try {
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      const booking = await bookingsApi.reserve({
        slotId: lottery.availableSlotId!,
        memberId,
        expiresAt,
      });
      await bookingsApi.confirm(booking.bookingId);
      setBookingId(booking.bookingId);
      setConfirmed(true);
      // Automatically fetch PayHere params after booking confirmation
      await fetchPayhereParams(booking.bookingId);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Booking failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function fetchPayhereParams(bId: string) {
    if (!memberId || !lottery) return;
    setPayStep("loading");
    setPayError(null);
    try {
      const params = await paymentsApi.initiatePayhere({
        bookingId: bId,
        memberId,
        amount: lottery.ticketPrice,
        idempotencyKey: crypto.randomUUID(),
        description: `${lottery.name} — lottery ticket`,
        firstName: member?.firstName ?? "",
        lastName: member?.lastName ?? "",
        email: member?.email ?? "",
        phone: "",
      });
      setPayhereParams(params);
      setPayStep("ready");
    } catch (e: unknown) {
      setPayError(e instanceof Error ? e.message : "Could not prepare payment. Please try again.");
      setPayStep("error");
    }
  }

  // Poll GET /payments/{paymentId} until we get a definitive status from the
  // PayHere notify webhook (CAPTURED = success, FAILED/REFUNDED = declined).
  // Gives up after 45 s and lets the user check their bookings page.
  async function pollPaymentStatus(paymentId: string) {
    const POLL_INTERVAL_MS = 2500;
    const MAX_POLLS = 18; // 45 s total

    for (let i = 0; i < MAX_POLLS; i++) {
      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
      try {
        const payment = await paymentsApi.get(paymentId);
        if (payment.status === "CAPTURED" || payment.status === "AUTHORIZED") {
          setPayStep("paid");
          return;
        }
        if (payment.status === "FAILED" || payment.status === "REFUNDED") {
          setPayError(
            payment.status === "REFUNDED"
              ? "Your payment was charged back. Please contact support."
              : "Your payment was declined. Please try a different card or contact your bank."
          );
          setPayStep("declined");
          return;
        }
        // INITIATED / AUTHORIZED — keep polling
      } catch (e: unknown) {
        if (e instanceof ApiError && e.status === 404) {
          // Payment record not found — shouldn't happen, but bail out
          setPayError("Payment record not found. Please check your bookings.");
          setPayStep("error");
          return;
        }
        // Network blip — continue polling
      }
    }

    // Timeout: notify may not have arrived (e.g. ngrok expired). Treat as unknown.
    setPayError(
      "Payment status is still being confirmed. Check your bookings page in a minute — if payment succeeded you'll see it there."
    );
    setPayStep("error");
  }

  // ── Payment screen (after booking confirmed) ─────────────────────────────

  if (confirmed && payStep !== "paid") {
    // ── Declined screen ────────────────────────────────────────────────────
    if (payStep === "declined") {
      return (
        <div className="max-w-[700px] mx-auto px-6 py-16">
          <BookingSteps currentStep={1} />
          <div className="bg-surface-1 border border-[rgba(197,48,48,0.2)] rounded-xl p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-[rgba(197,48,48,0.06)] border border-[rgba(197,48,48,0.15)] flex items-center justify-center text-3xl mx-auto mb-5">
              ❌
            </div>
            <h2 className="font-fraunces text-[28px] font-normal text-text-primary mb-2">
              Payment declined
            </h2>
            <p className="text-text-secondary text-[14px] max-w-[420px] mx-auto mb-6">
              {payError ?? "Your payment was not approved. Please try a different card or contact your bank."}
            </p>
            <div className="inline-block mb-8 bg-surface-3 border border-[rgba(92,79,66,0.12)] rounded-md px-4 py-2 font-mono text-[13px] text-text-tertiary tracking-wide">
              BOOKING · {bookingId?.toUpperCase()}
            </div>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => bookingId && fetchPayhereParams(bookingId)}>
                Try Again
              </Button>
              <Button variant="ghost" onClick={() => router.push("/bookings")}>
                View Bookings
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-[700px] mx-auto px-6 py-16">
        <BookingSteps currentStep={1} />

        <div className="bg-surface-1 border border-[rgba(92,79,66,0.08)] rounded-xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-[rgba(139,26,43,0.06)] border border-[rgba(139,26,43,0.12)] flex items-center justify-center text-3xl mx-auto mb-4">
              🎫
            </div>
            <h2 className="font-fraunces text-[28px] font-normal text-text-primary mb-2">
              {payStep === "processing"
                ? "Confirming payment…"
                : "Slot reserved — complete payment"}
            </h2>
            <p className="text-text-secondary text-[14px] max-w-[420px] mx-auto">
              {payStep === "processing" ? (
                "We're waiting for PayHere to confirm your payment. This usually takes a few seconds."
              ) : (
                <>
                  Your slot for{" "}
                  <strong className="text-text-primary">{lottery.name}</strong> is
                  held. Complete your payment to secure your place in the draw.
                </>
              )}
            </p>
            <div className="inline-block mt-4 bg-surface-3 border border-[rgba(139,26,43,0.12)] rounded-md px-4 py-2 font-mono text-[13px] text-primary tracking-wide">
              BOOKING · {bookingId?.toUpperCase()}
            </div>
          </div>

          {/* Order summary — hide while processing to keep the UI clean */}
          {payStep !== "processing" && (
            <div className="bg-surface-2 rounded-lg p-5 mb-6">
              <p className="font-mono text-[11px] text-text-tertiary tracking-widest mb-3">
                ORDER SUMMARY
              </p>
              {[
                { label: "Draw", value: lottery.name },
                { label: "Ticket price", value: formatCurrency(lottery.ticketPrice), mono: true },
                { label: "Currency", value: "LKR", mono: true },
                { label: "Billing", value: "One-time payment", mono: false },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex justify-between items-center py-2 border-b border-[rgba(92,79,66,0.06)] text-[13px]"
                >
                  <span className="text-text-tertiary">{row.label}</span>
                  <span className={row.mono ? "font-mono text-text-primary" : "text-text-primary"}>
                    {row.value}
                  </span>
                </div>
              ))}
              <div className="flex justify-between items-center pt-3 text-[15px] font-semibold">
                <span className="text-text-primary">Total today</span>
                <span className="font-mono text-[20px] text-gold tabular-nums">
                  {formatCurrency(lottery.ticketPrice)}
                </span>
              </div>
            </div>
          )}

          {/* Processing spinner */}
          {payStep === "processing" && (
            <div className="flex flex-col items-center py-8 gap-4">
              <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-text-tertiary text-[13px]">Checking payment status…</p>
            </div>
          )}

          {/* Timeout / network error — show message + fallback actions */}
          {payStep === "error" && payError && (
            <Alert variant="error" className="mb-5">
              {payError}
            </Alert>
          )}

          {/* Dismissed: user closed popup without paying */}
          {payStep === "dismissed" && (
            <Alert variant="error" className="mb-5">
              Payment window was closed. Your slot is still held — you can pay now.
            </Alert>
          )}

          {/* Loading params */}
          {payStep === "loading" && (
            <div className="flex items-center justify-center py-4">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="ml-3 text-text-secondary text-[14px]">Preparing payment…</span>
            </div>
          )}

          {/* Pay Now button */}
          {(payStep === "ready" || payStep === "dismissed") && payhereParams && (
            <PayhereCheckout
              params={payhereParams}
              onCompleted={(orderId) => {
                // popup closed after a payment attempt — real result comes via notify webhook
                setPayStep("processing");
                pollPaymentStatus(orderId);
              }}
              onDismissed={() => {
                setPayStep("dismissed");
              }}
              onError={(err) => {
                setPayError(`PayHere error: ${err}`);
                setPayStep("error");
              }}
            />
          )}

          {/* Retry after network/SDK error (but not after dismissed — that has its own Pay Now) */}
          {payStep === "error" && (
            <div className="flex gap-3 mt-4">
              <Button
                fullWidth
                onClick={() => bookingId && fetchPayhereParams(bookingId)}
              >
                Retry Payment
              </Button>
              <Button variant="ghost" fullWidth onClick={() => router.push("/bookings")}>
                Check Bookings
              </Button>
            </div>
          )}

          <p className="text-center text-[11px] text-text-tertiary mt-5">
            Secured by PayHere · Sandbox mode
          </p>
        </div>
      </div>
    );
  }

  // ── Post-payment success screen ──────────────────────────────────────────

  if (confirmed && payStep === "paid") {
    return (
      <div className="max-w-[700px] mx-auto px-6 py-16">
        <BookingSteps currentStep={1} />
        <div className="text-center py-16 bg-surface-1 border border-[rgba(26,107,74,0.15)] rounded-xl relative overflow-hidden">
          <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full bg-[radial-gradient(circle,rgba(26,107,74,0.06)_0%,transparent_70%)] pointer-events-none" />
          <div className="relative z-[1]">
            <div className="w-[72px] h-[72px] rounded-full bg-[rgba(26,107,74,0.08)] border border-[rgba(26,107,74,0.15)] flex items-center justify-center text-3xl mx-auto mb-6">
              🎉
            </div>
            <h2 className="font-fraunces text-[36px] font-normal text-text-primary mb-2">
              You&apos;re in the draw.
            </h2>
            <p className="text-text-secondary mb-6 max-w-[400px] mx-auto">
              Payment confirmed for{" "}
              <strong className="text-text-primary">{lottery.name}</strong>. The
              draw closes in{" "}
              <span className="font-mono text-gold">{countdown}</span>.
            </p>
            <div className="inline-block bg-surface-3 border border-[rgba(139,26,43,0.12)] rounded-md px-4 py-2 font-mono text-[14px] text-primary mb-8 tracking-wide">
              BOOKING · {bookingId?.toUpperCase()}
            </div>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => router.push("/bookings")}>
                View My Bookings
              </Button>
              <Button variant="ghost" onClick={() => router.push("/draws")}>
                Browse More Draws
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Draw detail + book button ─────────────────────────────────────────────

  const isFull = lottery.availableSlots === 0 || lottery.status !== "OPEN" || countdown === "Closed";
  const isClosingSoon = !isFull && countdown.includes(":") && parseInt(countdown) < 2;
  const badgeVariant = isFull ? "full" : isClosingSoon ? "closing" : "open";

  const fillPercent =
    lottery.totalSlots > 0
      ? Math.round((lottery.bookedSlots / lottery.totalSlots) * 100)
      : 0;

  return (
    <div className="max-w-[1100px] mx-auto px-6 py-12">
      <Link
        href="/draws"
        className="inline-flex items-center gap-1.5 text-[13px] text-text-tertiary hover:text-text-secondary transition-colors mb-8"
      >
        ← All draws
      </Link>

      <BookingSteps currentStep={0} />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">
        {/* Main */}
        <div className="bg-surface-1 border border-[rgba(92,79,66,0.08)] rounded-xl p-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="font-mono text-[11px] text-text-tertiary tracking-widest mb-2">
                {lottery.lotteryId.toUpperCase()}
              </p>
              <h1 className="font-fraunces text-[32px] font-normal text-text-primary leading-tight">
                {lottery.name}
              </h1>
            </div>
            <Badge variant={badgeVariant}>
              {isFull
                ? "Sold out"
                : countdown === "Closed"
                ? "Closed"
                : isClosingSoon
                ? "Closing soon"
                : "Open"}
            </Badge>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
            {[
              { label: "Prize pool", value: formatCurrency(lottery.prizeAmount), gold: true },
              { label: "Ticket price", value: formatCurrency(lottery.ticketPrice), gold: false },
              { label: "Slots left", value: lottery.availableSlots.toLocaleString(), gold: false },
              { label: "Closes in", value: countdown, gold: false },
              { label: "Draw closes", value: formatDate(lottery.closesAt), gold: false },
              { label: "Your tier", value: member?.tier ?? "—", gold: false },
            ].map((item) => (
              <div key={item.label} className="bg-surface-2 rounded-lg p-4">
                <p className="text-[11px] text-text-tertiary uppercase tracking-widest font-mono mb-1">
                  {item.label}
                </p>
                <p
                  className={`font-mono text-[16px] font-medium tabular-nums ${
                    item.gold ? "text-gold" : "text-text-primary"
                  }`}
                >
                  {item.value}
                </p>
              </div>
            ))}
          </div>

          {/* Fill progress */}
          <div className="mb-8">
            <div className="flex justify-between text-[12px] text-text-tertiary mb-2">
              <span>
                {lottery.bookedSlots.toLocaleString()} /{" "}
                {lottery.totalSlots.toLocaleString()} slots booked
              </span>
              <span>{fillPercent}%</span>
            </div>
            <div className="w-full h-1.5 bg-surface-4 rounded-full">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${fillPercent}%` }}
              />
            </div>
          </div>

          {error && (
            <Alert variant="error" className="mb-4">
              {error}
            </Alert>
          )}

          <Button
            fullWidth
            size="lg"
            onClick={handleBook}
            loading={loading}
            disabled={isFull}
          >
            {isFull ? "Sold Out" : loading ? "Booking…" : "Book My Slot →"}
          </Button>
        </div>

        {/* Sidebar */}
        <aside>
          <div className="bg-surface-1 border border-[rgba(92,79,66,0.08)] rounded-xl p-6 sticky top-[76px]">
            <h3 className="font-fraunces text-[18px] font-normal text-text-primary mb-5">
              Order summary
            </h3>

            {[
              { label: "Draw", value: lottery.name },
              { label: "Slot qty", value: "× 1" },
              { label: "Member", value: member ? `${member.firstName} ${member.lastName}` : "—" },
              { label: "Ticket price", value: formatCurrency(lottery.ticketPrice), mono: true },
              { label: "Service fee", value: "Rs. 0.00", mono: true },
            ].map((row) => (
              <div
                key={row.label}
                className="flex justify-between items-center py-2.5 border-b border-[rgba(92,79,66,0.06)] text-[14px]"
              >
                <span className="text-text-secondary">{row.label}</span>
                <span className={row.mono ? "font-mono text-text-primary" : "text-text-primary"}>
                  {row.value}
                </span>
              </div>
            ))}

            <div className="flex justify-between items-center py-3 text-[15px] font-semibold">
              <span className="text-text-primary">Total</span>
              <span className="font-mono text-[20px] text-gold tabular-nums">
                {formatCurrency(lottery.ticketPrice)}
              </span>
            </div>

            <div className="mt-4 p-3 bg-surface-2 rounded-md text-center">
              <p className="text-[11px] text-text-tertiary uppercase tracking-widest font-mono mb-1">
                Draw closes in
              </p>
              <p className="font-mono text-[22px] font-medium text-primary tabular-nums">
                {countdown}
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
