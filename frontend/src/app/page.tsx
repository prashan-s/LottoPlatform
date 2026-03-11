"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import SlotCard from "@/components/slots/SlotCard";
import { useAuth } from "@/hooks/useAuth";
import { lotteryApi } from "@/lib/api";
import { lotteryToSlot } from "@/lib/transforms";
import type { LotterySlot } from "@/lib/types";

const TIERS = [
  {
    name: "Bronze",
    price: "Free",
    desc: "All open draws",
    color: "text-[#8B5E34]",
    bg: "bg-[rgba(180,100,50,0.06)]",
    border: "border-[rgba(180,100,50,0.15)]",
  },
  {
    name: "Silver",
    price: "LKR 750/mo",
    desc: "Silver & Bronze draws",
    color: "text-text-secondary",
    bg: "bg-surface-1",
    border: "border-[rgba(92,79,66,0.12)]",
  },
  {
    name: "Gold",
    price: "LKR 2,400/mo",
    desc: "Full access + Gold draws",
    color: "text-[#9A7A10]",
    bg: "bg-[rgba(212,160,23,0.04)]",
    border: "border-[rgba(212,160,23,0.18)]",
  },
  {
    name: "Platinum",
    price: "LKR 8,250/mo",
    desc: "All draws + exclusive invites",
    color: "text-[#2563EB]",
    bg: "bg-[rgba(37,99,235,0.04)]",
    border: "border-[rgba(37,99,235,0.12)]",
  },
];

export default function HomePage() {
  const { isAuthenticated } = useAuth();
  const [featuredSlots, setFeaturedSlots] = useState<LotterySlot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const lotteries = await lotteryApi.listOpen();
        if (!cancelled) {
          setFeaturedSlots(lotteries.map(lotteryToSlot).slice(0, 3));
        }
      } catch {
        // Graceful degradation — Featured Draws section will simply be hidden
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden border-b border-[rgba(92,79,66,0.06)]">
        {/* Warm radial glow behind hero text */}
        <div className="absolute top-[10%] left-[15%] w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(139,26,43,0.05)_0%,transparent_70%)] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[5%] w-[400px] h-[400px] rounded-full bg-[radial-gradient(circle,rgba(212,160,23,0.04)_0%,transparent_70%)] pointer-events-none" />

        <div className="max-w-[1100px] mx-auto px-6 pt-20 pb-16 relative z-[1]">
          {/* Live badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[rgba(139,26,43,0.06)] border border-[rgba(139,26,43,0.12)] text-[12px] text-primary font-mono tracking-wide mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-dot" />
            Sri Lanka&apos;s Premier Lottery Platform
          </div>

          <h1 className="font-fraunces font-light text-text-primary leading-[1.05] mb-6 text-[clamp(40px,7vw,72px)]">
            Your fortune
            <br />
            <em className="italic text-primary">starts here.</em>
          </h1>

          <p className="text-[17px] text-text-secondary leading-relaxed mb-10 max-w-[520px]">
            Book your slots, track your draws, and get notified the moment
            results are live. Fair, transparent, and trusted by thousands
            across Sri Lanka.
          </p>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/draws"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-primary hover:bg-primary-light text-white font-semibold text-[16px] rounded-md transition-all duration-150 hover:-translate-y-px hover:shadow-[0_6px_24px_rgba(139,26,43,0.2)]"
            >
              Browse Open Draws
              <span aria-hidden>→</span>
            </Link>
            {isAuthenticated ? (
              <Link
                href="/bookings"
                className="inline-flex items-center gap-2 px-7 py-3.5 text-text-secondary border border-[rgba(92,79,66,0.15)] text-[16px] rounded-md hover:text-text-primary hover:bg-surface-3 transition-all duration-150"
              >
                My Bookings
              </Link>
            ) : (
              <Link
                href="/auth/register"
                className="inline-flex items-center gap-2 px-7 py-3.5 text-text-secondary border border-[rgba(92,79,66,0.15)] text-[16px] rounded-md hover:text-text-primary hover:bg-surface-3 transition-all duration-150"
              >
                Create account
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ── Kandyan Divider ── */}
      <div className="kandyan-divider my-0" />

      {/* ── Featured Draws (hidden when no open lotteries) ── */}
      {loading ? (
        <section className="max-w-[1100px] mx-auto px-6 py-16">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="font-mono text-[11px] text-primary uppercase tracking-widest mb-2">
                Featured Draws
              </p>
              <h2 className="font-fraunces text-[32px] font-normal text-text-primary leading-tight">
                Open lottery slots
              </h2>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-[320px] bg-surface-3 rounded-xl border border-[rgba(92,79,66,0.08)] animate-pulse"
              />
            ))}
          </div>
        </section>
      ) : featuredSlots.length > 0 ? (
        <section className="max-w-[1100px] mx-auto px-6 py-16">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="font-mono text-[11px] text-primary uppercase tracking-widest mb-2">
                Featured Draws
              </p>
              <h2 className="font-fraunces text-[32px] font-normal text-text-primary leading-tight">
                Open lottery slots
              </h2>
            </div>
            <Link
              href="/draws"
              className="text-[14px] text-text-tertiary hover:text-primary transition-colors hidden sm:block"
            >
              View all →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {featuredSlots.map((slot, i) => (
              <SlotCard key={slot.slotId} slot={slot} featured={i === 0} />
            ))}
          </div>

          <div className="mt-8 text-center sm:hidden">
            <Link
              href="/draws"
              className="text-[14px] text-text-tertiary hover:text-primary transition-colors"
            >
              View all draws →
            </Link>
          </div>
        </section>
      ) : null}

      {/* ── Kandyan Divider ── */}
      <div className="kandyan-divider" />

      {/* ── How it works ── */}
      <section className="bg-surface-1">
        <div className="max-w-[1100px] mx-auto px-6 py-16">
          <div className="text-center mb-14">
            <p className="font-mono text-[11px] text-primary uppercase tracking-widest mb-2">
              How it works
            </p>
            <h2 className="font-fraunces text-[32px] font-normal text-text-primary leading-tight">
              From zero to booked in 60 seconds
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
            {[
              {
                step: "01",
                title: "Create an account",
                desc: "Register in seconds with your email. Choose your membership tier — Bronze, Silver, Gold, or Platinum.",
                icon: "👤",
              },
              {
                step: "02",
                title: "Pick a draw",
                desc: "Browse open lottery draws. Check the prize pool, remaining slots, and closing time. Book your spot.",
                icon: "🎟",
              },
              {
                step: "03",
                title: "Pay & confirm",
                desc: "Secure payment via PayHere. Instant confirmation and notifications. You're in the draw.",
                icon: "✓",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                {/* Step circle */}
                <div className="w-14 h-14 rounded-full bg-[rgba(139,26,43,0.06)] border border-[rgba(139,26,43,0.12)] flex items-center justify-center mx-auto mb-5">
                  <span className="text-xl">{item.icon}</span>
                </div>
                <p className="font-mono text-[11px] text-primary tracking-widest mb-2">
                  Step {item.step}
                </p>
                <h3 className="font-fraunces text-[20px] font-normal text-text-primary mb-2">
                  {item.title}
                </h3>
                <p className="text-[15px] text-text-secondary leading-relaxed max-w-[300px] mx-auto">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Kandyan Divider ── */}
      <div className="kandyan-divider" />

      {/* ── Membership Tiers ── */}
      <section className="max-w-[1100px] mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <p className="font-mono text-[11px] text-primary uppercase tracking-widest mb-2">
            Membership Tiers
          </p>
          <h2 className="font-fraunces text-[32px] font-normal text-text-primary leading-tight mb-3">
            Choose your level
          </h2>
          <p className="text-[15px] text-text-secondary max-w-[460px] mx-auto">
            Higher tiers unlock exclusive draws with bigger prize pools.
            Start free with Bronze and upgrade anytime.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`${tier.bg} border ${tier.border} rounded-xl p-5 text-center transition-all duration-200 hover:-translate-y-px hover:shadow-[0_4px_16px_rgba(28,20,16,0.06)]`}
            >
              <p className={`font-semibold text-[15px] mb-1 ${tier.color}`}>
                {tier.name}
              </p>
              <p className="font-mono text-[13px] text-text-primary font-medium mb-2">
                {tier.price}
              </p>
              <p className="text-[12px] text-text-tertiary leading-relaxed">
                {tier.desc}
              </p>
            </div>
          ))}
        </div>

        <div className="text-center mt-8">
          {isAuthenticated ? (
            <Link
              href="/draws"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-light text-white font-semibold text-[15px] rounded-md transition-all duration-150 hover:-translate-y-px hover:shadow-[0_4px_16px_rgba(139,26,43,0.2)]"
            >
              Browse draws
              <span aria-hidden>→</span>
            </Link>
          ) : (
            <Link
              href="/auth/register"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-light text-white font-semibold text-[15px] rounded-md transition-all duration-150 hover:-translate-y-px hover:shadow-[0_4px_16px_rgba(139,26,43,0.2)]"
            >
              Get started for free
              <span aria-hidden>→</span>
            </Link>
          )}
        </div>
      </section>

      {/* ── Kandyan Divider ── */}
      <div className="kandyan-divider" />

      {/* ── Trust Section ── */}
      <section className="bg-surface-1">
        <div className="max-w-[1100px] mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <p className="font-mono text-[11px] text-primary uppercase tracking-widest mb-2">
              Why LottoPlatform
            </p>
            <h2 className="font-fraunces text-[32px] font-normal text-text-primary leading-tight">
              Built for trust
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                icon: "🔒",
                title: "Secure payments",
                desc: "Every transaction is processed through PayHere with idempotency protection. Your money is safe.",
              },
              {
                icon: "🎯",
                title: "Fair & transparent",
                desc: "Random draw selection with auditable results. Every booking is tracked, every outcome is verifiable.",
              },
              {
                icon: "⚡",
                title: "Instant notifications",
                desc: "Real-time updates on bookings, payments, and draw results. Never miss a moment.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-surface-0 border border-[rgba(92,79,66,0.08)] rounded-xl p-6 transition-all duration-200 hover:-translate-y-px hover:shadow-[0_4px_16px_rgba(28,20,16,0.05)]"
              >
                <div className="w-11 h-11 rounded-lg bg-[rgba(139,26,43,0.06)] flex items-center justify-center text-xl mb-4">
                  {item.icon}
                </div>
                <h3 className="font-fraunces text-[18px] font-normal text-text-primary mb-2">
                  {item.title}
                </h3>
                <p className="text-[14px] text-text-secondary leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="border-t border-[rgba(92,79,66,0.06)]">
        <div className="max-w-[1100px] mx-auto px-6 py-20 text-center">
          <div className="kandyan-divider mb-10" />
          <h2 className="font-fraunces text-[36px] font-normal text-text-primary leading-tight mb-4">
            Ready to try your luck?
          </h2>
          <p className="text-[17px] text-text-secondary max-w-[460px] mx-auto mb-8">
            Join thousands of Sri Lankans already on the platform.
            Your next big moment is one click away.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              href="/draws"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-primary hover:bg-primary-light text-white font-semibold text-[16px] rounded-md transition-all duration-150 hover:-translate-y-px hover:shadow-[0_6px_24px_rgba(139,26,43,0.2)]"
            >
              Browse Open Draws
              <span aria-hidden>→</span>
            </Link>
            {isAuthenticated ? (
              <Link
                href="/bookings"
                className="inline-flex items-center gap-2 px-7 py-3.5 text-text-secondary border border-[rgba(92,79,66,0.15)] text-[16px] rounded-md hover:text-text-primary hover:bg-surface-3 transition-all duration-150"
              >
                View my bookings
              </Link>
            ) : (
              <Link
                href="/auth/register"
                className="inline-flex items-center gap-2 px-7 py-3.5 text-text-secondary border border-[rgba(92,79,66,0.15)] text-[16px] rounded-md hover:text-text-primary hover:bg-surface-3 transition-all duration-150"
              >
                Create free account
              </Link>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
