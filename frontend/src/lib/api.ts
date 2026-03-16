import type {
  Member,
  Profile,
  Lottery,
  LotteryConfig,
  AdminStats,
  Booking,
  Payment,
  PayhereParams,
  Notification,
} from "./types";

// All requests go through the Next.js rewrite → Gateway at localhost:8080
const BASE = "/api";

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
    ...options,
  });

  if (!res.ok) {
    let message = `Request failed: ${res.status} ${res.statusText}`;
    try {
      const body = await res.json();
      message = body.message ?? body.error ?? message;
    } catch {
      // ignore parse error
    }
    throw new ApiError(res.status, message);
  }

  // 204 No Content
  if (res.status === 204) return undefined as unknown as T;

  return res.json() as Promise<T>;
}

// ─── Identity / Members ──────────────────────────────────────────────────────

// Normalize backend response into a flat Member object.
// POST /members returns { memberId, membershipTier }.
// GET /members/:id returns { memberId, membershipTier, Profile: { firstName, ... } }.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeMember(raw: any): Member {
  const profile = raw.Profile ?? raw.profile ?? {};
  return {
    ...raw,
    tier: raw.membershipTier ?? raw.tier,
    firstName: raw.firstName ?? profile.firstName ?? "",
    lastName: raw.lastName ?? profile.lastName ?? "",
    email: raw.email ?? profile.email ?? "",
  };
}

export const membersApi = {
  create: async (data: {
    email: string;
    firstName: string;
    lastName: string;
    tier: string;
  }): Promise<Member> => {
    // Only send membershipTier — backend ignores unknown fields but keep it clean
    const created = await request<Member>("/members", {
      method: "POST",
      body: JSON.stringify({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        membershipTier: data.tier,
      }),
    });
    // POST response only has memberId + membershipTier; fetch full record for name/email
    return request<Member>(`/members/${created.memberId}`).then(normalizeMember);
  },

  get: (memberId: string) =>
    request<Member>(`/members/${memberId}`).then(normalizeMember),

  getByEmail: (email: string) =>
    request<Member>(`/members?email=${encodeURIComponent(email)}`).then(normalizeMember),

  getProfile: (memberId: string) =>
    request<Profile>(`/profiles/${memberId}`),

  updateProfile: (memberId: string, data: Partial<Profile>) =>
    request<Profile>(`/profiles/${memberId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
};

// ─── Lotteries / Draws ───────────────────────────────────────────────────────

export const lotteryApi = {
  listOpen: () => request<Lottery[]>("/booking/lotteries"),
  get: (lotteryId: string) => request<Lottery>(`/booking/lotteries/${lotteryId}`),
};

// ─── Bookings ────────────────────────────────────────────────────────────────

export const bookingsApi = {
  reserve: (data: {
    slotId: string;
    memberId: string;
    expiresAt: string;
  }) =>
    request<Booking>("/booking/reservations", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  confirm: (bookingId: string) =>
    request<Booking>(`/booking/${bookingId}/confirm`, { method: "POST" }),

  cancel: (bookingId: string) =>
    request<Booking>(`/booking/${bookingId}/cancel`, { method: "POST" }),

  get: (bookingId: string) =>
    request<Booking>(`/booking/${bookingId}`),

  listByMember: (memberId: string) =>
    request<Booking[]>(`/booking/member/${memberId}`),
};

// ─── Payments ────────────────────────────────────────────────────────────────

export const paymentsApi = {
  initiate: (data: {
    bookingId: string;
    memberId: string;
    amount: number;
    idempotencyKey: string;
    currency?: string;
    returnUrl?: string;
    cancelUrl?: string;
    expiresAt?: string;
    description?: string;
  }) =>
    request<Payment>("/payments", {
      method: "POST",
      body: JSON.stringify({
        currency: "LKR",
        returnUrl: typeof window !== "undefined" ? `${window.location.origin}/bookings` : "/bookings",
        cancelUrl: typeof window !== "undefined" ? window.location.href : "/draws",
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        ...data,
      }),
    }),

  /** Initiate a PayHere sandbox payment.
   *  Returns PayhereParams ready to pass to window.payhere.startPayment(). */
  initiatePayhere: (data: {
    bookingId: string;
    memberId: string;
    amount: number;
    idempotencyKey: string;
    description?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
  }) =>
    request<PayhereParams>("/payments/payhere/initiate", {
      method: "POST",
      body: JSON.stringify({ currency: "LKR", ...data }),
    }),

  capture: (paymentId: string) =>
    request<Payment>(`/payments/${paymentId}/capture`, { method: "POST" }),

  get: (paymentId: string) => request<Payment>(`/payments/${paymentId}`),
};

// ─── Admin ───────────────────────────────────────────────────────────────────

export const adminApi = {
  getStats: () => request<AdminStats>("/booking/admin/stats"),
  getConfig: () => request<LotteryConfig>("/booking/admin/config"),
  updateConfig: (data: Omit<LotteryConfig, "updatedAt">) =>
    request<LotteryConfig>("/booking/admin/config", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  generate: () =>
    request<Lottery>("/booking/admin/generate", { method: "POST" }),
  drawLottery: (lotteryId: string) =>
    request<Lottery>(`/booking/admin/lotteries/${lotteryId}/draw`, { method: "POST" }),
  activateLottery: (lotteryId: string) =>
    request<Lottery>(`/booking/admin/lotteries/${lotteryId}/activate`, { method: "POST" }),
};

// ─── Notifications ───────────────────────────────────────────────────────────

export const notificationsApi = {
  list: (memberId: string) =>
    request<Notification[]>(`/notifications/member/${memberId}`),

  unreadCount: (memberId: string) =>
    request<{ count: number }>(`/notifications/member/${memberId}/unread-count`),

  markRead: (notificationId: string) =>
    request<Notification>(`/notifications/${notificationId}/read`, { method: "PATCH" }),

  markAllRead: (memberId: string) =>
    request<{ updated: number }>(`/notifications/member/${memberId}/read-all`, { method: "PATCH" }),
};

export { ApiError };
