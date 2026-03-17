import { clsx } from "clsx";

type AlertVariant = "success" | "error" | "warning" | "info";

const styles: Record<
  AlertVariant,
  { container: string; icon: string; text: string }
> = {
  success: {
    container:
      "bg-[rgba(26,107,74,0.08)] border border-[rgba(26,107,74,0.2)]",
    icon: "text-[#1A6B4A]",
    text: "text-[#1A6B4A]",
  },
  error: {
    container:
      "bg-[rgba(197,48,48,0.06)] border border-[rgba(197,48,48,0.15)]",
    icon: "text-[#C53030]",
    text: "text-[#C53030]",
  },
  warning: {
    container:
      "bg-[rgba(217,119,6,0.06)] border border-[rgba(217,119,6,0.15)]",
    icon: "text-[#D97706]",
    text: "text-[#D97706]",
  },
  info: {
    container:
      "bg-[rgba(37,99,235,0.06)] border border-[rgba(37,99,235,0.12)]",
    icon: "text-[#2563EB]",
    text: "text-[#2563EB]",
  },
};

const icons: Record<AlertVariant, string> = {
  success: "\u2713",
  error: "\u2715",
  warning: "\u26A0",
  info: "\u2139",
};

interface AlertProps {
  variant: AlertVariant;
  children: React.ReactNode;
  className?: string;
}

export default function Alert({ variant, children, className }: AlertProps) {
  const s = styles[variant];
  return (
    <div
      className={clsx(
        "flex items-start gap-2.5 px-4 py-3 rounded-md text-[14px]",
        s.container,
        className
      )}
    >
      <span className={clsx("font-bold mt-px flex-shrink-0", s.icon)}>
        {icons[variant]}
      </span>
      <span className={s.text}>{children}</span>
    </div>
  );
}
