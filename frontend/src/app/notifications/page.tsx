"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import NotificationItem from "@/components/notifications/NotificationItem";
import { notificationsApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import type { Notification } from "@/lib/types";

export default function NotificationsPage() {
  const { isAuthenticated, memberId } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  const load = useCallback(async () => {
    if (!memberId) return;
    try {
      const data = await notificationsApi.list(memberId);
      setNotifications(data);
    } catch {
      // API unavailable — show empty state rather than crashing
    } finally {
      setLoading(false);
    }
  }, [memberId]);

  useEffect(() => {
    load();
  }, [load]);

  // Optimistic mark-as-read for a single notification
  async function handleMarkRead(notificationId: string) {
    // Update local state immediately so the dot disappears instantly
    setNotifications((prev) =>
      prev.map((n) =>
        n.notificationId === notificationId ? { ...n, read: true } : n
      )
    );
    try {
      await notificationsApi.markRead(notificationId);
    } catch {
      // Revert on failure
      setNotifications((prev) =>
        prev.map((n) =>
          n.notificationId === notificationId ? { ...n, read: false } : n
        )
      );
    }
  }

  async function handleMarkAllRead() {
    if (!memberId || markingAll) return;
    setMarkingAll(true);
    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await notificationsApi.markAllRead(memberId);
    } catch {
      // Revert and reload from server on failure
      await load();
    } finally {
      setMarkingAll(false);
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-[600px] mx-auto px-6 py-20 text-center">
        <div className="text-4xl mb-4">🔒</div>
        <h1 className="font-fraunces text-[28px] font-normal text-text-primary mb-4">
          Sign in to view notifications
        </h1>
        <Link
          href="/auth/login"
          className="inline-flex px-6 py-2.5 bg-primary text-white font-semibold rounded-md hover:bg-primary-light transition-all"
        >
          Sign in
        </Link>
      </div>
    );
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="max-w-[800px] mx-auto px-6 py-12">
      <div className="flex items-end justify-between mb-10">
        <div>
          <p className="font-mono text-[11px] text-primary uppercase tracking-widest mb-2">
            My account
          </p>
          <h1 className="font-fraunces text-[40px] font-normal text-text-primary leading-tight">
            Notifications
          </h1>
        </div>

        <div className="flex items-center gap-4">
          {unreadCount > 0 && (
            <span className="font-mono text-[13px] text-text-tertiary">
              {unreadCount} unread
            </span>
          )}
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              disabled={markingAll}
              className="text-[12px] text-text-tertiary hover:text-text-secondary transition-colors disabled:opacity-50 underline underline-offset-2"
            >
              {markingAll ? "Marking…" : "Mark all as read"}
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="space-y-px bg-[rgba(92,79,66,0.06)] rounded-xl overflow-hidden border border-[rgba(92,79,66,0.08)]">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-[80px] skeleton" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-[rgba(92,79,66,0.08)] rounded-xl bg-surface-1">
          <div className="w-12 h-12 rounded-xl bg-surface-2 flex items-center justify-center text-2xl mb-4">
            🔔
          </div>
          <h3 className="font-fraunces text-[22px] font-normal text-text-primary mb-2">
            No notifications yet
          </h3>
          <p className="text-[14px] text-text-secondary max-w-[300px]">
            Notifications will appear here when you book slots, make payments,
            or when draw results are published.
          </p>
        </div>
      ) : (
        <div className="space-y-px bg-[rgba(92,79,66,0.06)] rounded-xl overflow-hidden border border-[rgba(92,79,66,0.08)]">
          {notifications.map((n) => (
            <NotificationItem
              key={n.notificationId}
              notification={n}
              onMarkRead={handleMarkRead}
            />
          ))}
        </div>
      )}
    </div>
  );
}
