import { forwardRef, ButtonHTMLAttributes } from "react";
import { clsx } from "clsx";

type Variant = "primary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
}

const variants: Record<Variant, string> = {
  primary:
    "bg-primary text-white font-semibold hover:bg-primary-light hover:-translate-y-px hover:shadow-[0_4px_16px_rgba(139,26,43,0.2)] active:translate-y-0 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none",
  ghost:
    "bg-transparent text-text-secondary border border-[rgba(92,79,66,0.15)] hover:text-text-primary hover:bg-surface-3 hover:border-[rgba(139,26,43,0.1)] disabled:opacity-40 disabled:cursor-not-allowed",
  danger:
    "bg-[#C53030] text-white hover:bg-[#9B2C2C] disabled:opacity-40 disabled:cursor-not-allowed",
};

const sizes: Record<Size, string> = {
  sm: "px-3.5 py-[7px] text-[13px] rounded-md",
  md: "px-5 py-2.5 text-sm rounded-md",
  lg: "px-7 py-3.5 text-base rounded-md",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      fullWidth = false,
      className,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={clsx(
          "inline-flex items-center justify-center gap-2 font-sans transition-all duration-150 cursor-pointer",
          variants[variant],
          sizes[size],
          fullWidth && "w-full",
          className
        )}
        {...props}
      >
        {loading ? (
          <>
            <svg
              className="animate-spin h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            {children}
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
