package lk.ctse.booking;

import lk.ctse.booking.entity.Booking;
import lk.ctse.booking.entity.Lottery;
import lk.ctse.booking.entity.Slot;
import lk.ctse.booking.enums.BookingStatus;
import lk.ctse.booking.enums.LotteryStatus;
import lk.ctse.booking.enums.SlotStatus;
import lk.ctse.booking.repository.BookingRepository;
import lk.ctse.booking.repository.LotteryRepository;
import lk.ctse.booking.repository.SlotRepository;
import lk.ctse.booking.service.DrawService;
import lk.ctse.booking.service.OutboxService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DrawServiceTest {

    @Mock LotteryRepository lotteryRepository;
    @Mock BookingRepository bookingRepository;
    @Mock SlotRepository slotRepository;
    @Mock OutboxService outboxService;

    @InjectMocks DrawService drawService;

    private Lottery openLottery;
    private Slot slot1;
    private Slot slot2;

    @BeforeEach
    void setUp() {
        openLottery = new Lottery();
        openLottery.setLotteryId("lottery-1");
        openLottery.setName("Test Draw");
        openLottery.setStatus(LotteryStatus.OPEN);
        openLottery.setClosesAt(LocalDateTime.now().minusMinutes(1));
        openLottery.setPrizeAmount(new BigDecimal("500000"));
        openLottery.setTicketPrice(new BigDecimal("2500"));
        openLottery.setTotalSlots(2);

        slot1 = new Slot();
        slot1.setSlotId("slot-1");
        slot1.setLotteryId("lottery-1");
        slot1.setStatus(SlotStatus.CONFIRMED);

        slot2 = new Slot();
        slot2.setSlotId("slot-2");
        slot2.setLotteryId("lottery-1");
        slot2.setStatus(SlotStatus.AVAILABLE);
    }

    @Test
    void executeDraw_withConfirmedBooking_selectsWinner() {
        Booking booking = new Booking();
        booking.setBookingId("booking-1");
        booking.setMemberId("member-1");
        booking.setStatus(BookingStatus.CONFIRMED);
        booking.setSlot(slot1);

        when(lotteryRepository.findById("lottery-1")).thenReturn(Optional.of(openLottery));
        when(slotRepository.findByLotteryId("lottery-1")).thenReturn(List.of(slot1, slot2));
        when(bookingRepository.findAll()).thenReturn(List.of(booking));

        boolean hadWinner = drawService.executeDraw(openLottery);

        assertThat(hadWinner).isTrue();
        assertThat(openLottery.getStatus()).isEqualTo(LotteryStatus.CLOSED);
        assertThat(openLottery.getWinnerId()).isEqualTo("member-1");
        assertThat(openLottery.getWinnerBookingId()).isEqualTo("booking-1");

        verify(lotteryRepository, times(2)).save(openLottery);
        verify(slotRepository, times(2)).save(any(Slot.class)); // both slots marked DRAWN
        verify(outboxService).saveDrawEvent(eq("lottery-1"), eq("Test Draw"), eq("member-1"), eq("booking-1"));
    }

    @Test
    void executeDraw_withNoConfirmedBookings_closesWithNoWinner() {
        Booking reservedBooking = new Booking();
        reservedBooking.setBookingId("booking-2");
        reservedBooking.setMemberId("member-2");
        reservedBooking.setStatus(BookingStatus.RESERVED); // not CONFIRMED
        reservedBooking.setSlot(slot2);

        when(lotteryRepository.findById("lottery-1")).thenReturn(Optional.of(openLottery));
        when(slotRepository.findByLotteryId("lottery-1")).thenReturn(List.of(slot1, slot2));
        when(bookingRepository.findAll()).thenReturn(List.of(reservedBooking));

        boolean hadWinner = drawService.executeDraw(openLottery);

        assertThat(hadWinner).isFalse();
        assertThat(openLottery.getStatus()).isEqualTo(LotteryStatus.CLOSED);
        assertThat(openLottery.getWinnerId()).isNull();
        verify(outboxService).saveDrawEvent(eq("lottery-1"), eq("Test Draw"), isNull(), isNull());
    }

    @Test
    void executeDraw_whenLotteryAlreadyClaimed_returnsFalse() {
        openLottery.setStatus(LotteryStatus.DRAWING); // already claimed by another instance

        when(lotteryRepository.findById("lottery-1")).thenReturn(Optional.of(openLottery));

        boolean hadWinner = drawService.executeDraw(openLottery);

        assertThat(hadWinner).isFalse();
        verifyNoInteractions(slotRepository, outboxService);
    }

    @Test
    void executeDraw_allSlotsMarkedDrawn() {
        Booking booking = new Booking();
        booking.setBookingId("booking-1");
        booking.setMemberId("member-1");
        booking.setStatus(BookingStatus.CONFIRMED);
        booking.setSlot(slot1);

        when(lotteryRepository.findById("lottery-1")).thenReturn(Optional.of(openLottery));
        when(slotRepository.findByLotteryId("lottery-1")).thenReturn(List.of(slot1, slot2));
        when(bookingRepository.findAll()).thenReturn(List.of(booking));

        drawService.executeDraw(openLottery);

        assertThat(slot1.getStatus()).isEqualTo(SlotStatus.DRAWN);
        assertThat(slot2.getStatus()).isEqualTo(SlotStatus.DRAWN);
    }
}
