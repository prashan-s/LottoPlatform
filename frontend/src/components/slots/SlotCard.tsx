"use client";

import Link from "next/link";
import { clsx } from "clsx";
import Badge from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/formatters";
import { useCountdown } from "@/hooks/useCountdown";
import type { LotterySlot, MemberTier } from "@/lib/types";

function tierBadgeVariant(tier?: MemberTier) {
  if (!tier) return "muted" as const;
  return tier.toLowerCase() as "gold" | "silver" | "bronze" | "platinum";
}

interface SlotCardProps {
  slot: LotterySlot;
  featured?: boolean;
}

export default function SlotCard({ slot, featured }: SlotCardProps) {
  const timeLeft = useCountdown(slot.closesAt);
  const fillPercent = Math.round(
    (slot.bookedSlots / slot.totalSlots) * 100
  );
  const isFull = slot.status === "FULL" || slot.availableSlots === 0;
  const isClosingSoon = slot.status === "CLOSING_SOON";

  return (
    <article
      className={clsx(
        "relative flex flex-col p-7 rounded-xl border card-lift overflow-hidden",
        "transition-all duration-200",
        featured
          ? "bg-gradient-to-b from-[rgba(139,26,43,0.06)] to-surface-1 border-[rgba(139,26,43,0.15)] shadow-[inset_0_1px_0_rgba(139,26,43,0.1)]"
          : "bg-surface-1 border-[rgba(92,79,66,0.12)] hover:border-[rgba(139,26,43,0.15)]"
      )}
    >
      {/* Top edge accent line */}
      <div
        className={clsx(
          "absolute top-0 left-0 right-0 h-[2px]",
          "bg-gradient-to-r from-transparent via-primary to-transparent",
          featured ? "opacity-100" : "opacity-0"
        )}
      />

      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <span className="font-mono text-[11px] text-text-tertiary tracking-widest">
          DRAW · {slot.slotId.slice(-8).toUpperCase()}
        </span>
        <div className="flex items-center gap-2">
          {slot.minTier && (
            <Badge variant={tierBadgeVariant(slot.minTier)}>
              {slot.minTier}+
            </Badge>
          )}
          {isFull ? (
            <Badge variant="full">Sold out</Badge>
          ) : isClosingSoon ? (
            <Badge variant="closing">Closing soon</Badge>
          ) : (
            <Badge variant="open">Open</Badge>
          )}
        </div>
      </div>

      {/* Name + date */}
      <h3 className="font-fraunces text-[22px] font-normal text-text-primary mb-1 leading-tight">
        {slot.name}
      </h3>
      <p className="text-[13px] text-text-tertiary mb-5">
        {timeLeft === "Closed" ? "Draw closed" : `Closes in ${timeLeft}`}
      </p>

      {/* Prize */}
      <p className="font-mono text-[11px] text-text-tertiary uppercase tracking-widest mb-1">
        {slot.prizeName}
      </p>
      <p className="font-mono text-[28px] font-medium text-gold tabular-nums tracking-tight mb-5">
        {formatCurrency(slot.prizeAmount)}
      </p>

      {/* Meta */}
      <div className="flex gap-4 mb-5">
        <div>
          <p className="text-[13px] font-medium text-text-secondary">
            {slot.availableSlots.toLocaleString()}
          </p>
          <p className="text-[12px] text-text-tertiary">remaining</p>
        </div>
        <div>
          <p className="text-[13px] font-medium text-text-secondary">
            {formatCurrency(slot.ticketPrice)}
          </p>
          <p className="text-[12px] text-text-tertiary">per slot</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-[3px] bg-surface-4 rounded-full mb-2">
        <div
          className="h-full bg-primary rounded-full transition-all duration-300"
          style={{ width: `${fillPercent}%` }}
        />
      </div>
      <p className="text-[12px] text-text-tertiary mb-5">
        {fillPercent}% booked
      </p>

      {/* CTA */}
      <div className="mt-auto">
        {isFull ? (
          <span className="inline-flex items-center justify-center w-full py-2.5 text-[13px] text-text-tertiary border border-[rgba(92,79,66,0.12)] rounded-md opacity-50 cursor-not-allowed">
            Sold Out
          </span>
        ) : (
          <Link
            href={`/draws/${slot.slotId}`}
            className="inline-flex items-center justify-center w-full py-2.5 text-[14px] font-semibold text-white bg-primary hover:bg-primary-light rounded-md transition-all duration-150 hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(139,26,43,0.2)]"
          >
            Book Now →
          </Link>
        )}
      </div>
    </article>
  );
}
