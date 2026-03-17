import { forwardRef, InputHTMLAttributes } from "react";
import { clsx } from "clsx";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  fullWidth?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, fullWidth = true, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className={clsx("flex flex-col gap-1.5", fullWidth && "w-full")}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-[13px] font-medium text-text-secondary"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={clsx(
            "bg-surface-0 border rounded-md px-3.5 py-[11px] text-[14px] text-text-primary",
            "placeholder:text-text-tertiary",
            "transition-all duration-150",
            "focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(139,26,43,0.08)]",
            error
              ? "border-[rgba(197,48,48,0.4)]"
              : "border-[rgba(92,79,66,0.12)]",
            fullWidth && "w-full",
            className
          )}
          {...props}
        />
        {hint && !error && (
          <p className="text-[12px] text-text-tertiary">{hint}</p>
        )}
        {error && <p className="text-[12px] text-[#C53030]">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
