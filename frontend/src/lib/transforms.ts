import type { Lottery, LotterySlot, SlotStatus } from "./types";

/**
 * Transform a backend Lottery object into the SlotCard-compatible LotterySlot type.
 * Shared by the home page (featured draws) and the /draws listing page.
 */
export function lotteryToSlot(l: Lottery): LotterySlot {
  const msLeft = new Date(l.closesAt).getTime() - Date.now();
  let status: SlotStatus;
  if (l.status !== "OPEN" || l.availableSlots === 0) {
    status = "FULL";
  } else if (msLeft <= 2 * 60 * 1000) {
    status = "CLOSING_SOON";
  } else {
    status = "OPEN";
  }

  return {
    slotId: l.lotteryId,
    name: l.name,
    prizeName: "Grand Prize",
    prizeAmount: l.prizeAmount,
    ticketPrice: l.ticketPrice,
    totalSlots: l.totalSlots,
    bookedSlots: l.bookedSlots,
    availableSlots: l.availableSlots,
    status,
    closesAt: l.closesAt,
  };
}
