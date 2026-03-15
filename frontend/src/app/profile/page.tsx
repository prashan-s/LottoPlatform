"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import { membersApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import type { MemberTier } from "@/lib/types";

function tierBadge(tier: MemberTier) {
  return tier.toLowerCase() as "gold" | "silver" | "bronze" | "platinum";
}

export default function ProfilePage() {
  const router = useRouter();
  const { isAuthenticated, member, memberId, loading: authLoading, logout, refreshMember } = useAuth();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    firstName: member?.firstName ?? "",
    lastName: member?.lastName ?? "",
    email: member?.email ?? "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (authLoading) {
    return null;
  }

  if (!isAuthenticated || !member) {
    return (
      <div className="max-w-[600px] mx-auto px-6 py-20 text-center">
        <div className="text-4xl mb-4">🔒</div>
        <h1 className="font-fraunces text-[28px] font-normal text-text-primary mb-4">
          Sign in to view your profile
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

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!memberId) return;
    setError(null);
    setSuccess(false);
    setLoading(true);
    try {
      const updated = await membersApi.updateProfile(memberId, form);
      refreshMember({ ...member!, ...updated });
      setSuccess(true);
      setEditing(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    logout();
    router.push("/");
  }

  return (
    <div className="max-w-[680px] mx-auto px-6 py-12">
      <div className="mb-10">
        <p className="font-mono text-[11px] text-primary uppercase tracking-widest mb-2">
          My account
        </p>
        <h1 className="font-fraunces text-[40px] font-normal text-text-primary">
          Profile
        </h1>
      </div>

      {/* Member card */}
      <div className="bg-surface-1 border border-[rgba(92,79,66,0.08)] rounded-xl p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="font-fraunces text-[24px] font-normal text-text-primary mb-1">
              {member.firstName} {member.lastName}
            </p>
            <p className="text-[14px] text-text-secondary">{member.email}</p>
          </div>
          <Badge variant={tierBadge(member.tier)}>{member.tier}</Badge>
        </div>
        <div className="flex gap-3 mt-1">
          <div>
            <p className="font-mono text-[11px] text-text-tertiary uppercase tracking-widest mb-1">
              Member ID
            </p>
            <p className="font-mono text-[13px] text-text-secondary">
              {member.memberId}
            </p>
          </div>
        </div>
      </div>

      {/* Edit form */}
      <div className="bg-surface-1 border border-[rgba(92,79,66,0.08)] rounded-xl p-6 mb-4">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-fraunces text-[20px] font-normal text-text-primary">
            Account details
          </h2>
          {!editing && (
            <button
              onClick={() => {
                setEditing(true);
                setForm({
                  firstName: member.firstName,
                  lastName: member.lastName,
                  email: member.email,
                });
              }}
              className="text-[13px] text-text-tertiary hover:text-primary transition-colors"
            >
              Edit
            </button>
          )}
        </div>

        {editing ? (
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="First name"
                value={form.firstName}
                onChange={(e) =>
                  setForm({ ...form, firstName: e.target.value })
                }
              />
              <Input
                label="Last name"
                value={form.lastName}
                onChange={(e) =>
                  setForm({ ...form, lastName: e.target.value })
                }
              />
            </div>
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />

            {error && <Alert variant="error">{error}</Alert>}

            <div className="flex gap-3">
              <Button type="submit" loading={loading}>
                Save changes
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setEditing(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-3">
            {[
              { label: "First name", value: member.firstName },
              { label: "Last name", value: member.lastName },
              { label: "Email", value: member.email },
              { label: "Tier", value: member.tier },
            ].map((row) => (
              <div key={row.label} className="flex justify-between items-center text-[14px]">
                <span className="text-text-tertiary">{row.label}</span>
                <span className="text-text-primary">{row.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {success && (
        <Alert variant="success" className="mb-4">
          Profile updated successfully.
        </Alert>
      )}

      {/* Sign out */}
      <div className="mt-8 pt-8 border-t border-[rgba(92,79,66,0.06)]">
        <Button variant="ghost" onClick={handleLogout}>
          Sign out
        </Button>
      </div>
    </div>
  );
}
