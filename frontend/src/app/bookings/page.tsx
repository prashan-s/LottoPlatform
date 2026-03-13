"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import { bookingsApi, lotteryApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { formatDate, formatCurrency } from "@/lib/formatters";
import type { Booking, Lottery } from "@/lib/types";

// ── Outcome helpers ────────────────────────────────────────────────────────────

type DrawOutcome = "won" | "lost" | "active" | "inactive";

function getOutcome(booking: Booking, lottery: Lottery | undefined): DrawOutcome {
  if (!lottery || lottery.status !== "CLOSED") {
    if (booking.status === "CANCELLED" || booking.status === "EXPIRED") return "inactive";
    return "active";
  }
  if (lottery.winnerBookingId === booking.bookingId && booking.status === "CONFIRMED") return "won";
  if (booking.status === "CONFIRMED") return "lost";
  return "inactive";
}

// ── Booking Card ───────────────────────────────────────────────────────────────

function BookingCard({ booking, lottery }: { booking: Booking; lottery: Lottery | undefined }) {
  const outcome = getOutcome(booking, lottery);

  // ── Won ─────────────────────────────────────────────────────────────────────
  if (outcome === "won") {
    return (
      <Link
        href={`/bookings/${booking.bookingId}`}
        className="group relative flex items-stretch gap-0 rounded-xl overflow-hidden border border-[rgba(212,160,23,0.35)] bg-[rgba(212,160,23,0.04)] hover:bg-[rgba(212,160,23,0.07)] hover:border-[rgba(212,160,23,0.5)] transition-all shadow-[0_0_24px_rgba(212,160,23,0.08)]"
      >
        {/* Gold left accent bar */}
        <div className="w-1 flex-shrink-0 bg-[#D4A017]" />

        <div className="flex flex-1 items-center gap-5 px-5 py-5">
          {/* Trophy icon */}
          <div className="w-11 h-11 flex-shrink-0 rounded-full bg-[rgba(212,160,23,0.15)] flex items-center justify-center text-xl">
            🏆
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="font-mono text-[10px] text-[#D4A017] uppercase tracking-widest">
                Draw Result · Won
              </span>
            </div>
            <p className="text-[16px] font-semibold text-text-primary truncate">
              {lottery?.name ?? "Lottery Draw"}
            </p>
            <p className="text-[13px] text-[#D4A017] font-medium mt-0.5">
              You were selected in the raffle
            </p>
            <p className="font-mono text-[11px] text-text-tertiary mt-1.5">
              {booking.bookingId.slice(0, 8).toUpperCase()} · Booked {formatDate(booking.createdAt)}
            </p>
          </div>

          {/* Prize won */}
          <div className="text-right flex-shrink-0">
            <p className="font-mono text-[11px] text-[rgba(212,160,23,0.7)] uppercase tracking-widest mb-1">
              Prize
            </p>
            <p className="font-mono text-[20px] font-medium text-[#D4A017] tabular-nums">
              {lottery ? formatCurrency(lottery.prizeAmount) : "—"}
            </p>
          </div>
        </div>
      </Link>
    );
  }

  // ── Lost ─────────────────────────────────────────────────────────────────────
  if (outcome === "lost") {
    return (
      <Link
        href={`/bookings/${booking.bookingId}`}
        className="group relative flex items-stretch gap-0 rounded-xl overflow-hidden border border-[rgba(92,79,66,0.08)] bg-surface-1 hover:border-[rgba(92,79,66,0.16)] transition-all opacity-70 hover:opacity-90"
      >
        {/* Muted left accent bar */}
        <div className="w-1 flex-shrink-0 bg-[rgba(92,79,66,0.2)]" />

        <div className="flex flex-1 items-center gap-5 px-5 py-5">
          {/* Neutral icon */}
          <div className="w-11 h-11 flex-shrink-0 rounded-full bg-surface-2 flex items-center justify-center text-xl">
            🎫
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="font-mono text-[10px] text-text-tertiary uppercase tracking-widest">
                Draw Result · Not selected
              </span>
            </div>
            <p className="text-[16px] font-medium text-text-secondary truncate">
              {lottery?.name ?? "Lottery Draw"}
            </p>
            <p className="text-[13px] text-text-tertiary mt-0.5">
              Better luck next time
            </p>
            <p className="font-mono text-[11px] text-text-tertiary mt-1.5">
              {booking.bookingId.slice(0, 8).toUpperCase()} · Booked {formatDate(booking.createdAt)}
            </p>
          </div>

          {/* Amount paid */}
          <div className="text-right flex-shrink-0">
            <p className="font-mono text-[11px] text-text-tertiary uppercase tracking-widest mb-1">
              Paid
            </p>
            <p className="font-mono text-[16px] text-text-tertiary tabular-nums">
              {lottery ? formatCurrency(lottery.ticketPrice) : "—"}
            </p>
          </div>
        </div>
      </Link>
    );
  }

  // ── Inactive (cancelled / expired) ──────────────────────────────────────────
  if (outcome === "inactive") {
    return (
      <Link
        href={`/bookings/${booking.bookingId}`}
        className="flex items-center gap-4 px-5 py-4 rounded-xl border border-[rgba(92,79,66,0.06)] bg-surface-1 opacity-50 hover:opacity-70 transition-all"
      >
        <div className="flex-1 min-w-0">
          <p className="text-[14px] text-text-secondary truncate">
            {lottery?.name ?? "Lottery Draw"}
          </p>
          <p className="font-mono text-[11px] text-text-tertiary mt-0.5">
            {booking.status} · {booking.bookingId.slice(0, 8).toUpperCase()}
          </p>
        </div>
        {lottery && (
          <p className="font-mono text-[14px] text-text-tertiary flex-shrink-0">
            {formatCurrency(lottery.ticketPrice)}
          </p>
        )}
      </Link>
    );
  }

  // ── Active ───────────────────────────────────────────────────────────────────
  const isReserved = booking.status === "RESERVED" || booking.status === "PENDING";
  return (
    <Link
      href={`/bookings/${booking.bookingId}`}
      className="flex items-center gap-4 px-5 py-5 bg-surface-1 border border-[rgba(92,79,66,0.08)] rounded-xl hover:border-[rgba(92,79,66,0.18)] transition-all"
    >
      <div className="w-11 h-11 flex-shrink-0 rounded-full bg-surface-2 flex items-center justify-center text-xl">
        🎟
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span
            className={`font-mono text-[10px] uppercase tracking-widest ${
              isReserved ? "text-[#D97706]" : "text-[#1A6B4A]"
            }`}
          >
            {isReserved ? "Reserved · Awaiting payment" : "Confirmed · Draw open"}
          </span>
        </div>
        <p className="text-[15px] font-medium text-text-primary truncate">
          {lottery?.name ?? "Lottery Draw"}
        </p>
        <p className="font-mono text-[11px] text-text-tertiary mt-1.5">
          {booking.bookingId.slice(0, 8).toUpperCase()} · Booked {formatDate(booking.createdAt)}
        </p>
      </div>
      {lottery && (
        <div className="text-right flex-shrink-0">
          <p className="font-mono text-[18px] text-primary tabular-nums">
            {formatCurrency(lottery.ticketPrice)}
          </p>
          <p className="text-[11px] text-text-tertiary">ticket</p>
        </div>
      )}
    </Link>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function BookingsPage() {
  const { isAuthenticated, memberId } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [lotteries, setLotteries] = useState<Record<string, Lottery>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!memberId) return;
    try {
      const data = await bookingsApi.listByMember(memberId);
      setBookings(data);
      const lotteryIds = [
        ...new Set(data.flatMap((b) => (b.slot?.lotteryId ? [b.slot.lotteryId] : []))),
      ];
      const lotteryMap: Record<string, Lottery> = {};
      await Promise.all(
        lotteryIds.map(async (id) => {
          try {
            lotteryMap[id] = await lotteryApi.get(id);
          } catch {
            // ignore
          }
        })
      );
      setLotteries(lotteryMap);
    } catch {
      setError("Failed to load bookings.");
    } finally {
      setLoading(false);
    }
  }, [memberId]);

  useEffect(() => {
    load();
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, [load]);

  if (!isAuthenticated) {
    return (
      <div className="max-w-[600px] mx-auto px-6 py-20 text-center">
        <div className="text-4xl mb-4">🔒</div>
        <h1 className="font-fraunces text-[28px] font-normal text-text-primary mb-4">
          Sign in to view bookings
        </h1>
        <Link
          href="/auth/login"
          className="inline-flex px-6 py-2.5 bg-primary text-white font-semibold rounded-md hover:bg-primary-light transition-all"
        >
          Sign in
        </Link>
      </div>
    );
  }

  // Separate bookings into buckets for display ordering
  const wonBookings = bookings.filter(
    (b) => getOutcome(b, lotteries[b.slot?.lotteryId ?? ""]) === "won"
  );
  const activeBookings = bookings.filter(
    (b) => getOutcome(b, lotteries[b.slot?.lotteryId ?? ""]) === "active"
  );
  const lostBookings = bookings.filter(
    (b) => getOutcome(b, lotteries[b.slot?.lotteryId ?? ""]) === "lost"
  );
  const inactiveBookings = bookings.filter(
    (b) => getOutcome(b, lotteries[b.slot?.lotteryId ?? ""]) === "inactive"
  );

  return (
    <div className="max-w-[900px] mx-auto px-6 py-12">
      <div className="mb-10">
        <p className="font-mono text-[11px] text-primary uppercase tracking-widest mb-2">
          My account
        </p>
        <h1 className="font-fraunces text-[40px] font-normal text-text-primary">
          My Bookings
        </h1>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-xl skeleton" />
          ))}
        </div>
      ) : error ? (
        <Alert variant="error">{error}</Alert>
      ) : bookings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-[rgba(92,79,66,0.08)] rounded-xl bg-surface-1">
          <div className="w-12 h-12 rounded-xl bg-surface-2 flex items-center justify-center text-2xl mb-4">
            🎟
          </div>
          <h3 className="font-fraunces text-[22px] font-normal text-text-primary mb-2">
            No bookings yet
          </h3>
          <p className="text-[14px] text-text-secondary mb-6 max-w-[300px]">
            You haven&apos;t booked any lottery slots yet. Browse open draws and secure your spot.
          </p>
          <Button onClick={() => (window.location.href = "/draws")}>Browse Open Draws</Button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Won */}
          {wonBookings.length > 0 && (
            <section>
              <p className="font-mono text-[10px] text-[rgba(212,160,23,0.7)] uppercase tracking-widest mb-3">
                🏆 Draw Results · Won
              </p>
              <div className="space-y-3">
                {wonBookings.map((b) => (
                  <BookingCard key={b.bookingId} booking={b} lottery={lotteries[b.slot?.lotteryId ?? ""]} />
                ))}
              </div>
            </section>
          )}

          {/* Active */}
          {activeBookings.length > 0 && (
            <section>
              <p className="font-mono text-[10px] text-text-tertiary uppercase tracking-widest mb-3">
                Active Bookings
              </p>
              <div className="space-y-3">
                {activeBookings.map((b) => (
                  <BookingCard key={b.bookingId} booking={b} lottery={lotteries[b.slot?.lotteryId ?? ""]} />
                ))}
              </div>
            </section>
          )}

          {/* Lost */}
          {lostBookings.length > 0 && (
            <section>
              <p className="font-mono text-[10px] text-text-tertiary uppercase tracking-widest mb-3">
                Draw Results · Not Selected
              </p>
              <div className="space-y-3">
                {lostBookings.map((b) => (
                  <BookingCard key={b.bookingId} booking={b} lottery={lotteries[b.slot?.lotteryId ?? ""]} />
                ))}
              </div>
            </section>
          )}

          {/* Inactive */}
          {inactiveBookings.length > 0 && (
            <section>
              <p className="font-mono text-[10px] text-text-tertiary uppercase tracking-widest mb-3">
                Cancelled / Expired
              </p>
              <div className="space-y-2">
                {inactiveBookings.map((b) => (
                  <BookingCard key={b.bookingId} booking={b} lottery={lotteries[b.slot?.lotteryId ?? ""]} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
