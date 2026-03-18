// ─── Member / Identity ───────────────────────────────────────────────────────

export type MemberTier = "BRONZE" | "SILVER" | "GOLD" | "PLATINUM";

export interface Member {
  memberId: string;
  email: string;
  firstName: string;
  lastName: string;
  tier: MemberTier;
  createdAt?: string;
}

export interface Profile {
  memberId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  tier: MemberTier;
  preferences?: Record<string, unknown>;
}

// ─── Slots / Draws ───────────────────────────────────────────────────────────

export type SlotStatus = "OPEN" | "CLOSING_SOON" | "FULL" | "CLOSED" | "DRAWN";

export type LotteryApiStatus = "SCHEDULED" | "OPEN" | "DRAWING" | "CLOSED";

export interface Lottery {
  lotteryId: string;
  name: string;
  status: LotteryApiStatus;
  opensAt?: string;
  closesAt: string;
  prizeAmount: number;
  ticketPrice: number;
  totalSlots: number;
  bookedSlots: number;
  availableSlots: number;
  availableSlotId?: string;
  winnerId?: string;
  winnerBookingId?: string;
  createdAt?: string;
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export interface LotteryConfig {
  durationMinutes: number;
  cooldownMinutes: number;
  totalSlots: number;
  prizeAmount: number;
  ticketPrice: number;
  autoGenerate: boolean;
  updatedAt?: string;
}

export interface AdminStats {
  openLotteries: number;
  scheduledLotteries: number;
  drawingLotteries: number;
  closedLotteries: number;
  config: LotteryConfig;
  recentLotteries: Lottery[];
}

export interface LotterySlot {
  slotId: string;
  name: string;
  description?: string;
  prizeName: string;
  prizeAmount: number;
  ticketPrice: number;
  totalSlots: number;
  bookedSlots: number;
  availableSlots: number;
  status: SlotStatus;
  closesAt: string;
  drawAt?: string;
  minTier?: MemberTier;
  createdAt?: string;
}

// ─── Bookings ────────────────────────────────────────────────────────────────

export type BookingStatus =
  | "PENDING"
  | "RESERVED"
  | "CONFIRMED"
  | "CANCELLED"
  | "EXPIRED";

// Shape returned by the booking-service API (nested slot object)
export interface BackendSlot {
  slotId: string;
  lotteryId: string;
  status: string;
}

export interface Booking {
  bookingId: string;
  slot?: BackendSlot;
  memberId: string;
  status: BookingStatus;
  expiresAt: string;
  createdAt?: string;
}

// ─── Payments ────────────────────────────────────────────────────────────────

export type PaymentStatus =
  | "INITIATED"
  | "AUTHORIZED"
  | "CAPTURED"
  | "FAILED"
  | "REFUNDED";

export interface Payment {
  paymentId: string;
  bookingId: string;
  memberId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  idempotencyKey: string;
  payherePaymentId?: string;
  subscriptionId?: string;
  createdAt?: string;
}

/** Parameters returned by POST /payments/payhere/initiate.
 *  Pass these directly to window.payhere.startPayment(). */
export interface PayhereParams {
  paymentId: string;
  sandbox: boolean;
  merchant_id: string;
  notify_url: string;
  order_id: string;
  items: string;
  amount: string;
  currency: string;
  hash: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
}

// ─── Notifications ───────────────────────────────────────────────────────────

export type NotificationType =
  | "BOOKING_CONFIRMED"
  | "BOOKING_CANCELLED"
  | "PAYMENT_CAPTURED"
  | "PAYMENT_AUTHORIZED"
  | "PAYMENT_FAILED"
  | "PAYMENT_REFUNDED"
  | "DRAW_CLOSING"
  | "DRAW_RESULT";

export type NotificationStatus = "PENDING" | "SENT" | "FAILED";

export interface Notification {
  notificationId: string;
  memberId: string;
  type: NotificationType;
  title: string;
  message: string;
  status: NotificationStatus;
  read?: boolean;
  createdAt: string;
}

// ─── API Responses ───────────────────────────────────────────────────────────

export interface ApiError {
  status: number;
  message: string;
  code?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
