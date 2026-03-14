// Mock lottery draw data for development.
// In production, this would come from /api/slots.
// The backend doesn't expose a public slot listing endpoint yet —
// replace these with real API calls when the endpoint is available.

import type { LotterySlot } from "./types";

export const MOCK_SLOTS: LotterySlot[] = [
  {
    slotId: "550e8400-e29b-41d4-a716-446655440006",
    name: "Grand Weekly Draw",
    description:
      "Our flagship weekly lottery. The highest prize pool, the most exclusive slots. GOLD tier and above only.",
    prizeName: "Grand Prize",
    prizeAmount: 2500000,
    ticketPrice: 4999,
    totalSlots: 500,
    bookedSlots: 358,
    availableSlots: 142,
    status: "CLOSING_SOON",
    closesAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    minTier: "GOLD",
  },
  {
    slotId: "550e8400-e29b-41d4-a716-446655440007",
    name: "Evening Flash Draw",
    description:
      "A fast-paced evening draw open to all members. Book a slot before it closes tonight.",
    prizeName: "Top Prize",
    prizeAmount: 750000,
    ticketPrice: 1999,
    totalSlots: 400,
    bookedSlots: 152,
    availableSlots: 248,
    status: "OPEN",
    closesAt: new Date(Date.now() + 18 * 60 * 60 * 1000).toISOString(),
    minTier: "BRONZE",
  },
  {
    slotId: "550e8400-e29b-41d4-a716-446655440008",
    name: "Silver Members Draw",
    description:
      "Exclusive to Silver and above. A curated draw with generous odds.",
    prizeName: "Silver Jackpot",
    prizeAmount: 1200000,
    ticketPrice: 2999,
    totalSlots: 300,
    bookedSlots: 218,
    availableSlots: 82,
    status: "OPEN",
    closesAt: new Date(Date.now() + 36 * 60 * 60 * 1000).toISOString(),
    minTier: "SILVER",
  },
  {
    slotId: "550e8400-e29b-41d4-a716-446655440009",
    name: "Weekend Mega Draw",
    description:
      "The biggest draw of the week. Sold out — join the waitlist for next week.",
    prizeName: "Mega Prize",
    prizeAmount: 5000000,
    ticketPrice: 9999,
    totalSlots: 200,
    bookedSlots: 200,
    availableSlots: 0,
    status: "FULL",
    closesAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    minTier: "PLATINUM",
  },
  {
    slotId: "550e8400-e29b-41d4-a716-446655440010",
    name: "Bronze Starter Draw",
    description:
      "Perfect for new members. Low ticket price, good odds, open to everyone.",
    prizeName: "Starter Prize",
    prizeAmount: 250000,
    ticketPrice: 999,
    totalSlots: 600,
    bookedSlots: 210,
    availableSlots: 390,
    status: "OPEN",
    closesAt: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
    minTier: "BRONZE",
  },
  {
    slotId: "550e8400-e29b-41d4-a716-446655440001",
    name: "Platinum Elite Draw",
    description:
      "By invitation only. The most prestigious draw in the platform.",
    prizeName: "Elite Prize",
    prizeAmount: 10000000,
    ticketPrice: 24999,
    totalSlots: 100,
    bookedSlots: 45,
    availableSlots: 55,
    status: "OPEN",
    closesAt: new Date(Date.now() + 96 * 60 * 60 * 1000).toISOString(),
    minTier: "PLATINUM",
  },
];

export function getMockSlot(slotId: string): LotterySlot | undefined {
  return MOCK_SLOTS.find((s) => s.slotId === slotId);
}
