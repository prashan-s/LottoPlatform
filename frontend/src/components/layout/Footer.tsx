import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-[rgba(92,79,66,0.08)] mt-auto">
      <div className="max-w-[1100px] mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-primary opacity-60" />
          <span className="font-fraunces text-[15px] text-text-tertiary">
            LottoPlatform
          </span>
        </div>
        <p className="text-[12px] text-text-tertiary">
          SLIIT CTSE Assignment · {new Date().getFullYear()}
        </p>
        <nav className="flex gap-4 text-[12px] text-text-tertiary">
          <Link href="/draws" className="hover:text-text-secondary transition-colors">
            Draws
          </Link>
          <Link href="/auth/register" className="hover:text-text-secondary transition-colors">
            Register
          </Link>
        </nav>
      </div>
    </footer>
  );
}
