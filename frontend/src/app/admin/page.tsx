"use client";

import { useEffect, useState, useCallback } from "react";
import { adminApi } from "@/lib/api";
import type { AdminStats, LotteryConfig, Lottery } from "@/lib/types";

import { formatDate, formatCurrency } from "@/lib/formatters";

// ── Helpers ───────────────────────────────────────────────────────────────────

function statusColor(status: Lottery["status"]) {
  const m: Record<Lottery["status"], string> = {
    SCHEDULED: "text-[#2563EB]",
    OPEN: "text-[#1A6B4A]",
    DRAWING: "text-[#D97706]",
    CLOSED: "text-[#8A7D6F]",
  };
  return m[status];
}

function statusDot(status: Lottery["status"]) {
  const m: Record<Lottery["status"], string> = {
    SCHEDULED: "bg-[#2563EB]",
    OPEN: "bg-[#1A6B4A]",
    DRAWING: "bg-[#D97706]",
    CLOSED: "bg-[#8A7D6F]",
  };
  return m[status];
}

// ── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number | string;
  accent?: string;
}) {
  return (
    <div className="bg-surface-1 border border-[rgba(92,79,66,0.08)] rounded-xl p-5">
      <p className="font-mono text-[11px] text-text-tertiary uppercase tracking-widest mb-2">
        {label}
      </p>
      <p className={`font-mono text-[32px] font-medium tabular-nums ${accent ?? "text-text-primary"}`}>
        {value}
      </p>
    </div>
  );
}

// ── Config Form ───────────────────────────────────────────────────────────────

function ConfigForm({
  initial,
  onSave,
}: {
  initial: LotteryConfig;
  onSave: (cfg: LotteryConfig) => Promise<void>;
}) {
  const [form, setForm] = useState<LotteryConfig>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Sync if parent reloads stats
  useEffect(() => setForm(initial), [initial]);

  function field(key: keyof LotteryConfig, label: string, hint?: string) {
    const value = form[key];
    return (
      <div>
        <label className="block font-mono text-[11px] text-text-tertiary uppercase tracking-widest mb-1">
          {label}
        </label>
        <input
          type="number"
          min={1}
          value={typeof value === "number" ? value : ""}
          onChange={(e) =>
            setForm((f) => ({ ...f, [key]: Number(e.target.value) }))
          }
          className="w-full px-3 py-2 bg-surface-0 border border-[rgba(92,79,66,0.12)] rounded-md text-text-primary font-mono text-[14px] focus:outline-none focus:border-[rgba(139,26,43,0.4)]"
        />
        {hint && (
          <p className="text-[11px] text-text-tertiary mt-1">{hint}</p>
        )}
      </div>
    );
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      await onSave(form);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-surface-1 border border-[rgba(92,79,66,0.08)] rounded-xl p-6">
      <p className="font-mono text-[11px] text-text-tertiary uppercase tracking-widest mb-5">
        Draw Configuration
      </p>

      <div className="space-y-4 mb-6">
        {field("durationMinutes", "Duration (minutes)", "How long each lottery runs")}
        {field("cooldownMinutes", "Cooldown (minutes)", "Wait time between draw end and next open")}
        {field("totalSlots", "Slots per lottery", "Number of purchasable slots")}
        {field("prizeAmount", "Prize pool (LKR)", "Total prize for the winner")}
        {field("ticketPrice", "Ticket price (LKR)", "Cost per slot")}
      </div>

      {/* Auto-generate toggle */}
      <div className="flex items-center justify-between py-3 border-t border-[rgba(92,79,66,0.08)] mb-6">
        <div>
          <p className="text-[14px] text-text-primary">Auto-generate</p>
          <p className="text-[12px] text-text-tertiary">
            Automatically start the next campaign after each draw
          </p>
        </div>
        <button
          onClick={() => setForm((f) => ({ ...f, autoGenerate: !f.autoGenerate }))}
          className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
            form.autoGenerate ? "bg-primary" : "bg-surface-3"
          }`}
        >
          <span
            className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all duration-200 ${
              form.autoGenerate ? "left-5" : "left-0.5"
            }`}
          />
        </button>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-2.5 text-[14px] font-semibold text-white bg-primary hover:bg-primary-light rounded-md transition-all disabled:opacity-50"
      >
        {saving ? "Saving…" : saved ? "Saved ✓" : "Save Configuration"}
      </button>

      {initial.updatedAt && (
        <p className="text-[11px] text-text-tertiary text-center mt-3">
          Last saved {formatDate(initial.updatedAt)}
        </p>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setStats(await adminApi.getStats());
      setError(null);
    } catch {
      setError("Failed to load admin stats. Is the booking service running?");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 15_000);
    return () => clearInterval(id);
  }, [load]);

  async function handleSaveConfig(cfg: LotteryConfig) {
    const updated = await adminApi.updateConfig(cfg);
    setStats((s) => s ? { ...s, config: updated } : s);
  }

  async function handleGenerate() {
    try {
      await adminApi.generate();
      setActionMsg("New lottery campaign generated.");
      await load();
    } catch (e: unknown) {
      setActionMsg(e instanceof Error ? e.message : "Generation failed.");
    }
    setTimeout(() => setActionMsg(null), 4000);
  }

  async function handleDraw(lotteryId: string) {
    try {
      await adminApi.drawLottery(lotteryId);
      setActionMsg("Draw executed.");
      await load();
    } catch (e: unknown) {
      setActionMsg(e instanceof Error ? e.message : "Draw failed.");
    }
    setTimeout(() => setActionMsg(null), 4000);
  }

  async function handleActivate(lotteryId: string) {
    try {
      await adminApi.activateLottery(lotteryId);
      setActionMsg("Lottery activated.");
      await load();
    } catch (e: unknown) {
      setActionMsg(e instanceof Error ? e.message : "Activation failed.");
    }
    setTimeout(() => setActionMsg(null), 4000);
  }

  if (loading) {
    return (
      <div className="max-w-[1100px] mx-auto px-6 py-20 text-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-[1100px] mx-auto px-6 py-20 text-center">
        <p className="text-[#C53030] text-[14px]">{error}</p>
      </div>
    );
  }

  const s = stats!;

  return (
    <div className="max-w-[1100px] mx-auto px-6 py-12">
      {/* Header */}
      <div className="mb-10">
        <p className="font-mono text-[11px] text-primary uppercase tracking-widest mb-2">
          Administration
        </p>
        <h1 className="font-fraunces text-[40px] font-normal text-text-primary">
          Draw Dashboard
        </h1>
        <p className="text-text-secondary text-[14px] mt-1">
          Configure lottery campaigns and monitor draw activity.
        </p>
      </div>

      {/* Action message toast */}
      {actionMsg && (
        <div className="mb-6 px-4 py-3 bg-[rgba(26,107,74,0.08)] border border-[rgba(26,107,74,0.2)] rounded-lg text-[#1A6B4A] text-[13px] font-mono">
          {actionMsg}
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <StatCard label="Open" value={s.openLotteries} accent="text-[#1A6B4A]" />
        <StatCard label="Scheduled" value={s.scheduledLotteries} accent="text-[#2563EB]" />
        <StatCard label="Drawing" value={s.drawingLotteries} accent="text-[#D97706]" />
        <StatCard label="Closed" value={s.closedLotteries} accent="text-[#8A7D6F]" />
      </div>

      {/* Config + Controls side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 mb-10">
        <ConfigForm initial={s.config} onSave={handleSaveConfig} />

        {/* Manual controls */}
        <div className="bg-surface-1 border border-[rgba(92,79,66,0.08)] rounded-xl p-6 flex flex-col gap-4">
          <p className="font-mono text-[11px] text-text-tertiary uppercase tracking-widest">
            Manual Controls
          </p>

          <div>
            <p className="text-[14px] text-text-primary mb-1">Generate Campaign</p>
            <p className="text-[12px] text-text-tertiary mb-3">
              Immediately create the next lottery using current config.
            </p>
            <button
              onClick={handleGenerate}
              className="w-full py-2.5 text-[13px] font-semibold text-white bg-primary hover:bg-primary-light rounded-md transition-all"
            >
              Generate Next →
            </button>
          </div>

          <div className="pt-4 border-t border-[rgba(92,79,66,0.08)]">
            <p className="text-[13px] text-text-secondary mb-2">
              Current config applies to all future campaigns.
              Existing campaigns are unaffected.
            </p>
            <p className="text-[12px] text-text-tertiary">
              Auto-generate:{" "}
              <span className={s.config.autoGenerate ? "text-[#1A6B4A]" : "text-[#C53030]"}>
                {s.config.autoGenerate ? "ON" : "OFF"}
              </span>
            </p>
            <p className="text-[12px] text-text-tertiary">
              Cooldown: {s.config.cooldownMinutes}m · Duration: {s.config.durationMinutes}m
            </p>
          </div>
        </div>
      </div>

      {/* Recent lotteries */}
      <div>
        <p className="font-mono text-[11px] text-text-tertiary uppercase tracking-widest mb-4">
          Recent Campaigns (last 20)
        </p>

        <div className="bg-surface-1 border border-[rgba(92,79,66,0.08)] rounded-xl overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[1fr_100px_140px_160px_120px] gap-3 px-5 py-3 border-b border-[rgba(92,79,66,0.08)]">
            {["Name", "Status", "Prize", "Closes at", "Actions"].map((h) => (
              <p key={h} className="font-mono text-[10px] text-text-tertiary uppercase tracking-widest">
                {h}
              </p>
            ))}
          </div>

          {s.recentLotteries.length === 0 ? (
            <div className="px-5 py-10 text-center text-text-tertiary text-[13px]">
              No campaigns yet.
            </div>
          ) : (
            s.recentLotteries.map((l) => (
              <div
                key={l.lotteryId}
                className="grid grid-cols-[1fr_100px_140px_160px_120px] gap-3 px-5 py-3.5 border-b border-[rgba(92,79,66,0.04)] last:border-0 items-center hover:bg-surface-2 transition-colors"
              >
                {/* Name */}
                <div className="min-w-0">
                  <p className="text-[13px] text-text-primary truncate">{l.name}</p>
                  {l.winnerId && (
                    <p className="text-[11px] text-gold font-mono truncate">
                      Winner: {l.winnerId.slice(-8).toUpperCase()}
                    </p>
                  )}
                </div>

                {/* Status */}
                <div className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${statusDot(l.status)}`} />
                  <span className={`font-mono text-[11px] ${statusColor(l.status)}`}>
                    {l.status}
                  </span>
                </div>

                {/* Prize */}
                <p className="font-mono text-[13px] text-gold tabular-nums">
                  {formatCurrency(l.prizeAmount)}
                </p>

                {/* Closes at */}
                <p className="font-mono text-[11px] text-text-tertiary">
                  {l.status === "SCHEDULED"
                    ? `Opens ${formatDate(l.opensAt)}`
                    : formatDate(l.closesAt)}
                </p>

                {/* Actions */}
                <div className="flex gap-1.5">
                  {l.status === "OPEN" && (
                    <button
                      onClick={() => handleDraw(l.lotteryId)}
                      className="px-2.5 py-1 text-[11px] font-mono text-[#D97706] border border-[rgba(217,119,6,0.2)] rounded hover:bg-[rgba(217,119,6,0.08)] transition-colors"
                    >
                      Draw
                    </button>
                  )}
                  {l.status === "SCHEDULED" && (
                    <button
                      onClick={() => handleActivate(l.lotteryId)}
                      className="px-2.5 py-1 text-[11px] font-mono text-[#1A6B4A] border border-[rgba(26,107,74,0.2)] rounded hover:bg-[rgba(26,107,74,0.08)] transition-colors"
                    >
                      Activate
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
