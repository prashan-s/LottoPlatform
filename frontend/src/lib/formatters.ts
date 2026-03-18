import type { Booking } from "./types";

export function formatDate(iso: string | undefined): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function statusVariant(
  status: Booking["status"]
): "open" | "closing" | "full" | "error" | "muted" {
  const map: Record<
    Booking["status"],
    "open" | "closing" | "full" | "error" | "muted"
  > = {
    PENDING: "closing",
    RESERVED: "closing",
    CONFIRMED: "open",
    CANCELLED: "error",
    EXPIRED: "muted",
  };
  return map[status];
}
