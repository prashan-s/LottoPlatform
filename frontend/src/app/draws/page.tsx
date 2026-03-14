"use client";

import { useEffect, useState, useCallback } from "react";
import SlotCard from "@/components/slots/SlotCard";
import { lotteryApi } from "@/lib/api";
import { lotteryToSlot } from "@/lib/transforms";
import type { LotterySlot, SlotStatus } from "@/lib/types";

const STATUS_FILTERS: { label: string; value: SlotStatus | "ALL" }[] = [
  { label: "All Draws", value: "ALL" },
  { label: "Open", value: "OPEN" },
  { label: "Closing Soon", value: "CLOSING_SOON" },
  { label: "Sold Out", value: "FULL" },
];

export default function DrawsPage() {
  const [slots, setSlots] = useState<LotterySlot[]>([]);
  const [filter, setFilter] = useState<SlotStatus | "ALL">("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLotteries = useCallback(async () => {
    try {
      const lotteries = await lotteryApi.listOpen();
      setSlots(lotteries.map(lotteryToSlot));
      setError(null);
    } catch {
      setError("Unable to load draws. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLotteries();
    // Re-fetch every 15 seconds to reflect new lotteries after a draw
    const interval = setInterval(fetchLotteries, 15_000);
    return () => clearInterval(interval);
  }, [fetchLotteries]);

  const filtered =
    filter === "ALL" ? slots : slots.filter((s) => s.status === filter);

  const openCount = slots.filter(
    (s) => s.status === "OPEN" || s.status === "CLOSING_SOON"
  ).length;

  return (
    <div className="max-w-[1100px] mx-auto px-6 py-12">
      {/* Header */}
      <div className="mb-10">
        <p className="font-mono text-[11px] text-primary uppercase tracking-widest mb-2">
          Available Draws
        </p>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <h1 className="font-fraunces text-[40px] font-normal text-text-primary leading-tight">
            Open lottery slots
          </h1>
          <p className="text-[14px] text-text-tertiary font-mono">
            {loading ? "Loading…" : `${openCount} draw${openCount !== 1 ? "s" : ""} available`}
          </p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap mb-8">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-all duration-150 ${
              filter === f.value
                ? "bg-primary text-white"
                : "bg-surface-3 text-text-secondary border border-[rgba(92,79,66,0.12)] hover:text-text-primary"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="p-4 bg-surface-1 border border-[rgba(197,48,48,0.2)] rounded-lg text-[14px] text-[#C53030] mb-6">
          {error}
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-[320px] bg-surface-3 rounded-xl border border-[rgba(92,79,66,0.08)] animate-pulse"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-12 h-12 rounded-xl bg-surface-3 flex items-center justify-center text-2xl mb-4">
            🎰
          </div>
          <h3 className="font-fraunces text-[22px] font-normal text-text-primary mb-2">
            No draws in this category
          </h3>
          <p className="text-[14px] text-text-secondary mb-6">
            Try a different filter or check back soon for new draws.
          </p>
          <button
            onClick={() => setFilter("ALL")}
            className="px-5 py-2.5 bg-primary text-white font-semibold text-[14px] rounded-md hover:bg-primary-light transition-all"
          >
            Show all draws
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((slot, i) => (
            <SlotCard key={slot.slotId} slot={slot} featured={i === 0 && filter === "ALL"} />
          ))}
        </div>
      )}
    </div>
  );
}
