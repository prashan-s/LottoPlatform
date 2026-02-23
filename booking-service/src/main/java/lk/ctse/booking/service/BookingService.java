package lk.ctse.booking.service;

import jakarta.persistence.EntityManager;
import lk.ctse.booking.dto.ReservationRequest;
import lk.ctse.booking.entity.Booking;
import lk.ctse.booking.entity.Slot;
import lk.ctse.booking.enums.BookingStatus;
import lk.ctse.booking.enums.SlotStatus;
import lk.ctse.booking.exception.BookingConflictException;
import lk.ctse.booking.exception.SlotNotFoundException;
import lk.ctse.booking.repository.BookingRepository;
import lk.ctse.booking.repository.SlotRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class BookingService {

    private final SlotRepository slotRepository;
    private final BookingRepository bookingRepository;
    private final OutboxService outboxService;
    private final EntityManager entityManager;

    public BookingService(SlotRepository slotRepository, BookingRepository bookingRepository, OutboxService outboxService, EntityManager entityManager) {
        this.slotRepository = slotRepository;
        this.bookingRepository = bookingRepository;
        this.outboxService = outboxService;
        this.entityManager = entityManager;
    }

    @Transactional(readOnly = true)
    public Booking getBookingById(String bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new SlotNotFoundException("Booking not found: " + bookingId));
        // Access slot within transaction to initialise the lazy proxy
        booking.getSlot().getSlotId();
        return booking;
    }

    @Transactional(readOnly = true)
    public List<Booking> getBookingsByMemberId(String memberId) {
        List<Booking> bookings = bookingRepository.findByMemberId(memberId);
        bookings.forEach(b -> b.getSlot().getSlotId());
        return bookings;
    }

    @Transactional
    public Booking reserveSlot(ReservationRequest request) {
        // 1. Find the Slot by slotId and AVAILABLE status
        Slot slot = slotRepository.findBySlotIdAndStatus(request.getSlotId(), SlotStatus.AVAILABLE)
                .orElseThrow(() -> new SlotNotFoundException("Slot not found or not available: " + request.getSlotId()));

        // 2. Update the Slot status to RESERVED
        slot.setStatus(SlotStatus.RESERVED);
        // The @Version field handles optimistic locking. If another transaction modifies this slot concurrently,
        // a StaleObjectStateException will be thrown during save, preventing double reservation.
        slotRepository.save(slot); // Save the updated slot to trigger optimistic locking check
        entityManager.flush(); // Ensure slot changes are persisted
        entityManager.detach(slot); // Detach to prevent further tracking

        // 3. Create a new Booking - reload the slot to get a fresh reference
        Slot freshSlot = slotRepository.findById(request.getSlotId()).orElseThrow();
        Booking booking = new Booking();
        // Don't set booking ID manually - let Hibernate generate it
        booking.setSlot(freshSlot);
        booking.setMemberId(request.getMemberId());
        booking.setStatus(BookingStatus.RESERVED);
        booking.setExpiresAt(request.getExpiresAt());

        // 4. Save the Booking
        Booking savedBooking = bookingRepository.save(booking);
        entityManager.flush(); // Ensure booking is persisted and ID is generated

        // 5. Save event to outbox (same transaction)
        outboxService.saveBookingEvent(
                "booking.reserved.v1",
                savedBooking.getBookingId(),
                savedBooking.getMemberId(),
                request.getSlotId(), // Use the slot ID from request to avoid lazy loading
                savedBooking.getStatus().name(),
                UUID.randomUUID().toString()
        );

        return savedBooking;
    }

    @Transactional
    public Booking confirmBooking(String bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new SlotNotFoundException("Booking not found: " + bookingId));

        if (booking.getStatus() != BookingStatus.RESERVED) {
            throw new BookingConflictException("Booking cannot be confirmed from status: " + booking.getStatus());
        }

        booking.setStatus(BookingStatus.CONFIRMED);
        booking.getSlot().setStatus(SlotStatus.CONFIRMED); // Update associated slot status
        slotRepository.save(booking.getSlot()); // Save updated slot
        Booking savedBooking = bookingRepository.save(booking);

        // Save event to outbox
        outboxService.saveBookingEvent(
                "booking.confirmed.v1",
                savedBooking.getBookingId(),
                savedBooking.getMemberId(),
                savedBooking.getSlot().getSlotId(),
                savedBooking.getStatus().name(),
                UUID.randomUUID().toString()
        );

        return savedBooking;
    }

    @Transactional
    public Booking cancelBooking(String bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new SlotNotFoundException("Booking not found: " + bookingId));

        if (booking.getStatus() == BookingStatus.CONFIRMED) {
            throw new BookingConflictException("Confirmed bookings cannot be cancelled directly.");
        }
        if (booking.getStatus() == BookingStatus.CANCELLED) {
            return booking; // Already cancelled, idempotent operation
        }

        // If RESERVED, change to CANCELLED and free up the slot
        if (booking.getStatus() == BookingStatus.RESERVED) {
            booking.setStatus(BookingStatus.CANCELLED);
            booking.getSlot().setStatus(SlotStatus.AVAILABLE); // Free up the slot
            slotRepository.save(booking.getSlot()); // Save updated slot
        } else {
            // For other statuses (e.g., PENDING_PAYMENT, FAILED_PAYMENT - if introduced later)
            // simply cancel the booking without freeing the slot if it's not RESERVED
            booking.setStatus(BookingStatus.CANCELLED);
        }

        Booking savedBooking = bookingRepository.save(booking);

        // Save event to outbox
        outboxService.saveBookingEvent(
                "booking.cancelled.v1",
                savedBooking.getBookingId(),
                savedBooking.getMemberId(),
                savedBooking.getSlot().getSlotId(),
                savedBooking.getStatus().name(),
                UUID.randomUUID().toString()
        );

        return savedBooking;
    }
}
