"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { clsx } from "clsx";

const navLinks = [
  { href: "/draws", label: "Browse Draws" },
  { href: "/bookings", label: "My Bookings" },
  { href: "/notifications", label: "Notifications" },
  { href: "/profile", label: "Profile" },
  { href: "/admin", label: "Admin" },
];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, member, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-50 bg-[rgba(253,251,247,0.92)] backdrop-blur-md border-b border-[rgba(92,79,66,0.08)]">
      <div className="max-w-[1100px] mx-auto px-6 h-[60px] flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse-dot" />
          <span className="font-fraunces text-xl font-medium text-primary group-hover:text-primary-light transition-colors duration-150">
            LottoPlatform
          </span>
        </Link>

        {/* Nav */}
        {isAuthenticated && (
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={clsx(
                  "text-[14px] transition-colors duration-150",
                  pathname.startsWith(link.href)
                    ? "text-primary font-medium"
                    : "text-text-secondary hover:text-text-primary"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <span className="hidden sm:block text-[13px] text-text-tertiary font-mono">
                {member?.tier}
              </span>
              <span className="hidden sm:block text-[13px] text-text-secondary">
                {member?.firstName}
              </span>
              <button
                onClick={handleLogout}
                className="text-[13px] text-text-tertiary hover:text-text-secondary transition-colors px-3 py-1.5 border border-[rgba(92,79,66,0.12)] rounded-md hover:bg-surface-3"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="text-[14px] text-text-secondary hover:text-text-primary transition-colors px-3.5 py-[7px] border border-[rgba(92,79,66,0.12)] rounded-md hover:bg-surface-3"
              >
                Sign in
              </Link>
              <Link
                href="/auth/register"
                className="text-[14px] font-semibold text-white bg-primary hover:bg-primary-light px-3.5 py-[7px] rounded-md transition-all duration-150 hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(139,26,43,0.2)]"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
