package lk.ctse.booking.service;

import lk.ctse.booking.entity.Booking;
import lk.ctse.booking.entity.Lottery;
import lk.ctse.booking.entity.Slot;
import lk.ctse.booking.enums.BookingStatus;
import lk.ctse.booking.enums.LotteryStatus;
import lk.ctse.booking.enums.SlotStatus;
import lk.ctse.booking.repository.BookingRepository;
import lk.ctse.booking.repository.LotteryRepository;
import lk.ctse.booking.repository.SlotRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;

@Service
public class DrawService {

    private final LotteryRepository lotteryRepository;
    private final BookingRepository bookingRepository;
    private final SlotRepository slotRepository;
    private final OutboxService outboxService;

    public DrawService(LotteryRepository lotteryRepository,
                       BookingRepository bookingRepository,
                       SlotRepository slotRepository,
                       OutboxService outboxService) {
        this.lotteryRepository = lotteryRepository;
        this.bookingRepository = bookingRepository;
        this.slotRepository = slotRepository;
        this.outboxService = outboxService;
    }

    /**
     * Atomically executes a draw for the given lottery.
     * Claims the lottery via optimistic lock, picks a random CONFIRMED booking
     * as the winner, marks all slots DRAWN, and publishes draw.completed.v1.
     *
     * If there are no CONFIRMED bookings, the lottery is closed with no winner
     * and the next lottery is generated regardless.
     *
     * @return true if a winner was selected, false if closed with no winner
     */
    @Transactional
    public boolean executeDraw(Lottery lottery) {
        // Re-load with optimistic lock to prevent concurrent draws
        Lottery locked = lotteryRepository.findById(lottery.getLotteryId())
                .orElseThrow(() -> new IllegalStateException("Lottery disappeared: " + lottery.getLotteryId()));

        if (locked.getStatus() != LotteryStatus.OPEN) {
            // Another instance already claimed it — skip
            return false;
        }

        // Claim the lottery
        locked.setStatus(LotteryStatus.DRAWING);
        lotteryRepository.save(locked); // version check fires here

        // Find all CONFIRMED bookings for this lottery's slots
        List<Slot> slots = slotRepository.findByLotteryId(locked.getLotteryId());
        List<String> slotIds = slots.stream().map(Slot::getSlotId).toList();

        List<Booking> confirmedBookings = bookingRepository.findAll()
                .stream()
                .filter(b -> slotIds.contains(b.getSlot().getSlotId()) && b.getStatus() == BookingStatus.CONFIRMED)
                .toList();

        String winnerId = null;
        String winnerBookingId = null;

        if (!confirmedBookings.isEmpty()) {
            // Pick a random winner
            List<Booking> shuffled = new java.util.ArrayList<>(confirmedBookings);
            Collections.shuffle(shuffled);
            Booking winner = shuffled.get(0);
            winnerId = winner.getMemberId();
            winnerBookingId = winner.getBookingId();

            locked.setWinnerId(winnerId);
            locked.setWinnerBookingId(winnerBookingId);
        }

        // Mark all slots as DRAWN
        for (Slot slot : slots) {
            slot.setStatus(SlotStatus.DRAWN);
            slotRepository.save(slot);
        }

        // Close the lottery
        locked.setStatus(LotteryStatus.CLOSED);
        lotteryRepository.save(locked);

        // Publish draw event via outbox (same transaction)
        outboxService.saveDrawEvent(locked.getLotteryId(), locked.getName(), winnerId, winnerBookingId);

        return winnerId != null;
    }
}
