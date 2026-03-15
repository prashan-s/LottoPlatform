import { clsx } from "clsx";
import type { Notification } from "@/lib/types";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return "Just now";
}

function iconForType(type: Notification["type"]): { emoji: string; bg: string } {
  const map: Record<Notification["type"], { emoji: string; bg: string }> = {
    BOOKING_CONFIRMED:  { emoji: "✓",  bg: "bg-[rgba(26,107,74,0.10)]" },
    BOOKING_CANCELLED:  { emoji: "✕",  bg: "bg-[rgba(197,48,48,0.08)]" },
    PAYMENT_CAPTURED:   { emoji: "✓",  bg: "bg-[rgba(26,107,74,0.10)]" },
    PAYMENT_AUTHORIZED: { emoji: "🔒", bg: "bg-[rgba(37,99,235,0.08)]" },
    PAYMENT_FAILED:     { emoji: "!",  bg: "bg-[rgba(197,48,48,0.08)]" },
    PAYMENT_REFUNDED:   { emoji: "↩",  bg: "bg-[rgba(197,48,48,0.08)]" },
    DRAW_CLOSING:       { emoji: "⏰", bg: "bg-[rgba(232,127,36,0.10)]" },
    DRAW_RESULT:        { emoji: "🏆", bg: "bg-[rgba(212,160,23,0.12)]" },
  };
  return map[type] ?? { emoji: "ℹ", bg: "bg-[rgba(37,99,235,0.08)]" };
}

interface NotificationItemProps {
  notification: Notification;
  onMarkRead?: (notificationId: string) => void;
}

export default function NotificationItem({ notification, onMarkRead }: NotificationItemProps) {
  const { emoji, bg } = iconForType(notification.type);
  const unread = !notification.read;

  function handleClick() {
    if (unread && onMarkRead) {
      onMarkRead(notification.notificationId);
    }
  }

  return (
    <div
      onClick={handleClick}
      className={clsx(
        "flex items-start gap-4 px-6 py-4 transition-colors duration-150",
        unread
          ? "bg-[rgba(139,26,43,0.04)] hover:bg-[rgba(139,26,43,0.07)] cursor-pointer"
          : "bg-surface-1 hover:bg-surface-2 cursor-default"
      )}
    >
      {/* Icon */}
      <div
        className={clsx(
          "w-9 h-9 rounded-full flex items-center justify-center text-base flex-shrink-0 mt-0.5",
          bg
        )}
      >
        {emoji}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-medium text-text-primary mb-0.5 leading-snug">
          {notification.title}
        </p>
        <p className="text-[13px] text-text-secondary leading-relaxed">
          {notification.message}
        </p>
      </div>

      {/* Time + unread dot */}
      <div className="flex flex-col items-end gap-2 flex-shrink-0">
        <span className="font-mono text-[11px] text-text-tertiary">
          {timeAgo(notification.createdAt)}
        </span>
        {unread && (
          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
        )}
      </div>
    </div>
  );
}
