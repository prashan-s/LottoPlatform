"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import { membersApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import type { MemberTier } from "@/lib/types";

const TIERS: { value: MemberTier; label: string; desc: string; price: string }[] = [
  {
    value: "BRONZE",
    label: "Bronze",
    desc: "Access to all open draws",
    price: "Free",
  },
  {
    value: "SILVER",
    label: "Silver",
    desc: "Access to Silver & Bronze draws",
    price: "Rs. 750 / mo",
  },
  {
    value: "GOLD",
    label: "Gold",
    desc: "Full access including Gold draws",
    price: "Rs. 2,400 / mo",
  },
  {
    value: "PLATINUM",
    label: "Platinum",
    desc: "All draws + exclusive invites",
    price: "Rs. 8,250 / mo",
  },
];

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    tier: "BRONZE" as MemberTier,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!form.firstName.trim()) errs.firstName = "First name is required";
    if (!form.lastName.trim()) errs.lastName = "Last name is required";
    if (!form.email.trim() || !form.email.includes("@"))
      errs.email = "Valid email is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setApiError(null);
    setLoading(true);
    try {
      const member = await membersApi.create(form);
      login(member.memberId, member);
      router.push("/profile");
    } catch (err: unknown) {
      setApiError(
        err instanceof Error ? err.message : "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-[560px] mx-auto px-6 py-16">
      {/* Header */}
      <div className="mb-10">
        <p className="font-mono text-[11px] text-primary uppercase tracking-widest mb-2">
          Create account
        </p>
        <h1 className="font-fraunces text-[40px] font-normal text-text-primary leading-tight">
          Join LottoPlatform
        </h1>
        <p className="text-text-secondary mt-2">
          Already have an account?{" "}
          <Link
            href="/auth/login"
            className="text-primary hover:text-primary-light transition-colors"
          >
            Sign in →
          </Link>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Name */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="First name"
            placeholder="Jane"
            value={form.firstName}
            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            error={errors.firstName}
            autoComplete="given-name"
          />
          <Input
            label="Last name"
            placeholder="Doe"
            value={form.lastName}
            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            error={errors.lastName}
            autoComplete="family-name"
          />
        </div>

        {/* Email */}
        <Input
          label="Email address"
          type="email"
          placeholder="jane@example.com"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          error={errors.email}
          autoComplete="email"
        />

        {/* Tier selection */}
        <div>
          <p className="text-[13px] font-medium text-text-secondary mb-3">
            Membership tier
          </p>
          <div className="grid grid-cols-2 gap-3">
            {TIERS.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setForm({ ...form, tier: t.value })}
                className={`text-left p-4 rounded-lg border transition-all duration-150 ${
                  form.tier === t.value
                    ? "border-[rgba(139,26,43,0.4)] bg-[rgba(139,26,43,0.06)] shadow-[0_0_0_1px_rgba(139,26,43,0.12)]"
                    : "border-[rgba(92,79,66,0.1)] bg-surface-1 hover:border-[rgba(92,79,66,0.2)]"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-[13px] font-semibold ${
                      form.tier === t.value
                        ? "text-primary"
                        : "text-text-primary"
                    }`}
                  >
                    {t.label}
                  </span>
                  {form.tier === t.value && (
                    <span className="w-4 h-4 rounded-full bg-primary flex items-center justify-center text-[10px] text-white font-bold">
                      ✓
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-text-tertiary mb-1">
                  {t.desc}
                </p>
                <p className="font-mono text-[12px] text-text-secondary">
                  {t.price}
                </p>
              </button>
            ))}
          </div>
        </div>

        {apiError && <Alert variant="error">{apiError}</Alert>}

        <Button type="submit" fullWidth size="lg" loading={loading}>
          Create account
        </Button>
      </form>
    </div>
  );
}
