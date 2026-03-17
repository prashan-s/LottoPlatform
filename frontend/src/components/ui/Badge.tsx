import { clsx } from "clsx";

type BadgeVariant =
  | "open"
  | "closing"
  | "full"
  | "gold"
  | "silver"
  | "bronze"
  | "platinum"
  | "success"
  | "error"
  | "warning"
  | "info"
  | "muted";

const styles: Record<BadgeVariant, string> = {
  open: "bg-[rgba(26,107,74,0.10)] text-[#1A6B4A] border border-[rgba(26,107,74,0.2)]",
  closing: "bg-[rgba(232,127,36,0.10)] text-[#B85C00] border border-[rgba(232,127,36,0.2)]",
  full: "bg-surface-3 text-text-tertiary border border-[rgba(92,79,66,0.12)]",
  gold: "bg-[rgba(212,160,23,0.12)] text-[#9A7A10] border border-[rgba(212,160,23,0.25)]",
  silver: "bg-surface-3 text-text-secondary border border-[rgba(92,79,66,0.12)]",
  bronze: "bg-[rgba(180,100,50,0.10)] text-[#8B5E34] border border-[rgba(180,100,50,0.2)]",
  platinum: "bg-[rgba(37,99,235,0.08)] text-[#2563EB] border border-[rgba(37,99,235,0.15)]",
  success: "bg-[rgba(26,107,74,0.10)] text-[#1A6B4A] border border-[rgba(26,107,74,0.2)]",
  error: "bg-[rgba(197,48,48,0.08)] text-[#C53030] border border-[rgba(197,48,48,0.15)]",
  warning: "bg-[rgba(217,119,6,0.08)] text-[#D97706] border border-[rgba(217,119,6,0.15)]",
  info: "bg-[rgba(37,99,235,0.06)] text-[#2563EB] border border-[rgba(37,99,235,0.12)]",
  muted: "bg-surface-3 text-text-tertiary border border-[rgba(92,79,66,0.12)]",
};

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

export default function Badge({
  variant = "muted",
  children,
  className,
}: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium leading-none",
        styles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
