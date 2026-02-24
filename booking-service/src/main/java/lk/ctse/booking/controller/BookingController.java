package lk.ctse.booking.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lk.ctse.booking.dto.LotterySummaryDto;
import lk.ctse.booking.dto.ReservationRequest;
import lk.ctse.booking.entity.Booking;
import lk.ctse.booking.service.BookingService;
import lk.ctse.booking.service.LotteryService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/booking")
public class BookingController {

    private final BookingService bookingService;
    private final LotteryService lotteryService;

    public BookingController(BookingService bookingService, LotteryService lotteryService) {
        this.bookingService = bookingService;
        this.lotteryService = lotteryService;
    }

    // ── Lottery endpoints ──────────────────────────────────────────────────────

    @Tag(name = "Lotteries")
    @Operation(summary = "List all open lotteries", description = "Returns all lottery campaigns with status OPEN, including slot availability and prize details.")
    @GetMapping("/lotteries")
    public ResponseEntity<List<LotterySummaryDto>> getOpenLotteries() {
        return ResponseEntity.ok(lotteryService.getOpenLotteries());
    }

    @Tag(name = "Lotteries")
    @Operation(summary = "Get lottery by ID", description = "Returns a single lottery campaign by ID regardless of status. Use this to check draw results after a lottery closes.")
    @GetMapping("/lotteries/{lotteryId}")
    public ResponseEntity<LotterySummaryDto> getLottery(@PathVariable String lotteryId) {
        return ResponseEntity.ok(lotteryService.getLotteryById(lotteryId));
    }

    // ── Booking write endpoints ────────────────────────────────────────────────

    @Tag(name = "Bookings")
    @Operation(summary = "Reserve a lottery slot", description = "Creates a RESERVED booking for a slot. The reservation expires at expiresAt unless confirmed by a captured payment.")
    @PostMapping("/reservations")
    public ResponseEntity<Booking> reserveSlot(@Valid @RequestBody ReservationRequest request) {
        Booking booking = bookingService.reserveSlot(request);
        return new ResponseEntity<>(booking, HttpStatus.CREATED);
    }

    @Tag(name = "Bookings")
    @Operation(summary = "Confirm a booking", description = "Transitions a booking from RESERVED to CONFIRMED. Call this after a successful payment capture.")
    @PostMapping("/{bookingId}/confirm")
    public ResponseEntity<Booking> confirmBooking(@PathVariable String bookingId) {
        Booking booking = bookingService.confirmBooking(bookingId);
        return ResponseEntity.ok(booking);
    }

    @Tag(name = "Bookings")
    @Operation(summary = "Cancel a booking", description = "Cancels a booking and frees the slot back to AVAILABLE.")
    @PostMapping("/{bookingId}/cancel")
    public ResponseEntity<Booking> cancelBooking(@PathVariable String bookingId) {
        Booking booking = bookingService.cancelBooking(bookingId);
        return ResponseEntity.ok(booking);
    }

    // ── Booking read endpoints ─────────────────────────────────────────────────
    // Note: literal "/member/" segment takes precedence over "/{bookingId}" in Spring MVC.

    @Tag(name = "Bookings")
    @Operation(summary = "List bookings by member", description = "Returns all bookings for a member, including their slot and lottery references.")
    @GetMapping("/member/{memberId}")
    public ResponseEntity<List<Booking>> getBookingsByMember(@PathVariable String memberId) {
        return ResponseEntity.ok(bookingService.getBookingsByMemberId(memberId));
    }

    @Tag(name = "Bookings")
    @Operation(summary = "Get booking by ID", description = "Returns a single booking with its slot reference.")
    @GetMapping("/{bookingId}")
    public ResponseEntity<Booking> getBooking(@PathVariable String bookingId) {
        return ResponseEntity.ok(bookingService.getBookingById(bookingId));
    }
}
