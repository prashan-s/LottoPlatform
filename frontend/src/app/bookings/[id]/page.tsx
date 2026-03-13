"use client";

import { use, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { bookingsApi, lotteryApi } from "@/lib/api";
import Badge from "@/components/ui/Badge";
import { formatDate, formatCurrency, statusVariant } from "@/lib/formatters";
import { useCountdown } from "@/hooks/useCountdown";
import type { Booking, Lottery } from "@/lib/types";

export default function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [lottery, setLottery] = useState<Lottery | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const b = await bookingsApi.get(id);
      setBooking(b);
      if (b.slot?.lotteryId) {
        try {
          setLottery(await lotteryApi.get(b.slot.lotteryId));
        } catch {
          // lottery not found — show booking without draw details
        }
      }
    } catch {
      setError("Booking not found.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
    // Poll while the draw might still be pending
    const id = setInterval(load, 15_000);
    return () => clearInterval(id);
  }, [load]);

  const countdown = useCountdown(lottery?.closesAt);
  const isWinner =
    !!lottery &&
    lottery.status === "CLOSED" &&
    lottery.winnerBookingId === booking?.bookingId &&
    booking?.status === "CONFIRMED";
  const notSelected =
    !!lottery &&
    lottery.status === "CLOSED" &&
    !isWinner &&
    booking?.status === "CONFIRMED";

  if (loading) {
    return (
      <div className="max-w-[600px] mx-auto px-6 py-20 text-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="max-w-[600px] mx-auto px-6 py-20 text-center">
        <h1 className="font-fraunces text-[32px] font-normal text-text-primary mb-4">
          Booking not found
        </h1>
        <Link href="/bookings" className="text-primary hover:underline">
          ← Back to bookings
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[700px] mx-auto px-6 py-12">
      <Link
        href="/bookings"
        className="inline-flex items-center gap-1.5 text-[13px] text-text-tertiary hover:text-text-secondary transition-colors mb-8"
      >
        ← My Bookings
      </Link>

      {/* ── Winner banner ───────────────────────────────────────────────────── */}
      {isWinner && (
        <div className="mb-6 rounded-xl overflow-hidden border border-[rgba(212,160,23,0.4)] shadow-[0_0_40px_rgba(212,160,23,0.12)]">
          {/* Gold top bar */}
          <div className="h-1 w-full bg-[#D4A017]" />
          <div className="px-8 py-8 bg-[rgba(212,160,23,0.05)] text-center">
            <div className="text-5xl mb-4">🏆</div>
            <h2 className="font-fraunces text-[32px] font-normal text-[#D4A017] mb-2">
              You Won!
            </h2>
            <p className="text-text-secondary text-[15px] mb-5">
              You were selected in the{" "}
              <strong className="text-text-primary">{lottery?.name}</strong> draw.
            </p>
            {lottery && (
              <div className="inline-flex flex-col items-center bg-[rgba(212,160,23,0.1)] border border-[rgba(212,160,23,0.25)] rounded-xl px-8 py-4">
                <p className="font-mono text-[11px] text-[rgba(212,160,23,0.7)] uppercase tracking-widest mb-1">
                  Prize Awarded
                </p>
                <p className="font-mono text-[28px] font-medium text-[#D4A017] tabular-nums">
                  {formatCurrency(lottery.prizeAmount)}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Not selected banner ─────────────────────────────────────────────── */}
      {notSelected && (
        <div className="mb-6 rounded-xl border border-[rgba(92,79,66,0.1)] bg-surface-1">
          <div className="h-1 w-full bg-[rgba(92,79,66,0.2)]" />
          <div className="px-8 py-8 text-center">
            <div className="text-4xl mb-4">🎫</div>
            <h2 className="font-fraunces text-[26px] font-normal text-text-primary mb-2">
              Not selected this time
            </h2>
            <p className="text-text-secondary text-[14px]">
              The{" "}
              <strong className="text-text-primary">{lottery?.name}</strong>{" "}
              draw has closed. Better luck next time!
            </p>
            <p className="text-[12px] text-text-tertiary mt-3">
              New draws open regularly — check back soon.
            </p>
          </div>
        </div>
      )}

      {/* ── Main card ───────────────────────────────────────────────────────── */}
      <div
        className={`bg-surface-1 rounded-xl p-8 border transition-all ${
          isWinner
            ? "border-[rgba(212,160,23,0.3)]"
            : "border-[rgba(92,79,66,0.08)]"
        }`}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="font-mono text-[11px] text-text-tertiary tracking-widest mb-1">
              BOOKING
            </p>
            <h1 className="font-fraunces text-[28px] font-normal text-text-primary">
              {lottery?.name ?? "Lottery Draw"}
            </h1>
          </div>
          <Badge variant={isWinner ? "gold" : notSelected ? "muted" : statusVariant(booking.status)}>
            {isWinner ? "Won" : notSelected ? "Not selected" : booking.status}
          </Badge>
        </div>

        {/* Booking fields */}
        <div className="space-y-0 mb-6">
          {[
            { label: "Booking ID", value: booking.bookingId.toUpperCase(), mono: true },
            { label: "Member ID", value: booking.memberId.toUpperCase(), mono: true },
            booking.createdAt
              ? { label: "Booked at", value: formatDate(booking.createdAt), mono: false }
              : null,
            !isWinner && !notSelected
              ? { label: "Expires at", value: formatDate(booking.expiresAt), mono: false }
              : null,
          ]
            .filter(Boolean)
            .map((row) => (
              <div
                key={row!.label}
                className="flex justify-between items-center py-3 border-b border-[rgba(92,79,66,0.06)] text-[14px]"
              >
                <span className="text-text-tertiary">{row!.label}</span>
                <span
                  className={
                    row!.mono
                      ? "font-mono text-[13px] text-text-primary"
                      : "text-text-primary"
                  }
                >
                  {row!.value}
                </span>
              </div>
            ))}
        </div>

        {/* Draw details */}
        {lottery && (
          <div className="pt-2">
            <p className="font-mono text-[11px] text-text-tertiary tracking-widest mb-4">
              DRAW DETAILS
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-surface-2 rounded-lg p-4">
                <p className="text-[11px] text-text-tertiary uppercase tracking-widest font-mono mb-1">
                  Prize Pool
                </p>
                <p className="font-mono text-[16px] font-medium text-[#D4A017] tabular-nums">
                  {formatCurrency(lottery.prizeAmount)}
                </p>
              </div>
              <div className="bg-surface-2 rounded-lg p-4">
                <p className="text-[11px] text-text-tertiary uppercase tracking-widest font-mono mb-1">
                  Ticket Price
                </p>
                <p className="font-mono text-[16px] font-medium text-text-primary tabular-nums">
                  {formatCurrency(lottery.ticketPrice)}
                </p>
              </div>
              <div className="bg-surface-2 rounded-lg p-4">
                <p className="text-[11px] text-text-tertiary uppercase tracking-widest font-mono mb-1">
                  Draw Status
                </p>
                <p
                  className={`font-mono text-[16px] font-medium ${
                    lottery.status === "OPEN"
                      ? "text-[#1A6B4A]"
                      : lottery.status === "CLOSED"
                      ? "text-text-tertiary"
                      : "text-[#D97706]"
                  }`}
                >
                  {lottery.status}
                </p>
              </div>
              {lottery.status === "OPEN" && (
                <div className="bg-surface-2 rounded-lg p-4">
                  <p className="text-[11px] text-text-tertiary uppercase tracking-widest font-mono mb-1">
                    Closes In
                  </p>
                  <p className="font-mono text-[16px] font-medium text-primary tabular-nums">
                    {countdown}
                  </p>
                </div>
              )}
              {lottery.status === "CLOSED" && lottery.winnerBookingId && (
                <div
                  className={`rounded-lg p-4 col-span-2 ${
                    isWinner
                      ? "bg-[rgba(212,160,23,0.08)] border border-[rgba(212,160,23,0.2)]"
                      : "bg-surface-2"
                  }`}
                >
                  <p className="text-[11px] text-text-tertiary uppercase tracking-widest font-mono mb-1">
                    Winning Booking
                  </p>
                  <p
                    className={`font-mono text-[13px] ${
                      isWinner ? "text-[#D4A017]" : "text-text-primary"
                    }`}
                  >
                    {lottery.winnerBookingId.toUpperCase()}
                    {isWinner && (
                      <span className="ml-2 text-[#D4A017]">← You</span>
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* CTA for non-winners */}
      {notSelected && (
        <div className="mt-6 text-center">
          <Link
            href="/draws"
            className="inline-flex px-6 py-2.5 bg-primary text-white font-semibold rounded-md hover:bg-primary-light transition-all text-[14px]"
          >
            Browse Open Draws →
          </Link>
        </div>
      )}
    </div>
  );
}
