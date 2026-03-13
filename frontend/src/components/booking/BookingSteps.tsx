import { clsx } from "clsx";

const STEPS = ["Select Draw", "Confirmed"] as const;

interface BookingStepsProps {
  currentStep: 0 | 1;
}

export default function BookingSteps({ currentStep }: BookingStepsProps) {
  return (
    <div className="flex items-center mb-10">
      {STEPS.map((label, i) => (
        <div key={label} className="flex items-center">
          {i > 0 && (
            <div
              className={clsx(
                "h-px flex-1 min-w-[32px] mx-4",
                i <= currentStep
                  ? "bg-[rgba(139,26,43,0.3)]"
                  : "bg-[rgba(92,79,66,0.12)]"
              )}
            />
          )}
          <div className="flex items-center gap-2.5">
            <div
              className={clsx(
                "w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-semibold flex-shrink-0",
                i < currentStep
                  ? "bg-primary text-white"
                  : i === currentStep
                  ? "bg-surface-4 text-text-primary border-2 border-primary"
                  : "bg-surface-3 text-text-tertiary border border-[rgba(92,79,66,0.12)]"
              )}
            >
              {i < currentStep ? "✓" : i + 1}
            </div>
            <span
              className={clsx(
                "text-[13px] hidden sm:block",
                i === currentStep ? "text-text-primary font-medium" : "text-text-tertiary"
              )}
            >
              {label}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
