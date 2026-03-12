"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import { membersApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const member = await membersApi.getByEmail(email.trim());
      login(member.memberId, member);
      router.push("/profile");
    } catch {
      setError(
        "No account found for that email. Check the address or create an account."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-[440px] mx-auto px-6 py-20">
      <div className="mb-10">
        <p className="font-mono text-[11px] text-primary uppercase tracking-widest mb-2">
          Sign in
        </p>
        <h1 className="font-fraunces text-[40px] font-normal text-text-primary leading-tight mb-2">
          Welcome back.
        </h1>
        <p className="text-text-secondary text-[15px]">
          Don&apos;t have an account?{" "}
          <Link
            href="/auth/register"
            className="text-primary hover:text-primary-light transition-colors"
          >
            Register for free →
          </Link>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email address"
          type="email"
          placeholder="jane@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />

        {error && <Alert variant="error">{error}</Alert>}

        <Button type="submit" fullWidth size="lg" loading={loading}>
          Sign in
        </Button>
      </form>

      <p className="mt-8 text-[13px] text-text-tertiary text-center leading-relaxed">
        Enter the email you registered with.
        <br />
        No password required.
      </p>
    </div>
  );
}
