package lk.ctse.booking;

import lk.ctse.booking.entity.Lottery;
import lk.ctse.booking.entity.Slot;
import lk.ctse.booking.enums.LotteryStatus;
import lk.ctse.booking.enums.SlotStatus;
import lk.ctse.booking.repository.LotteryRepository;
import lk.ctse.booking.repository.SlotRepository;
import lk.ctse.booking.service.LotteryService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LotteryServiceTest {

    @Mock LotteryRepository lotteryRepository;
    @Mock SlotRepository slotRepository;

    @InjectMocks LotteryService lotteryService;

    @Test
    void generateNext_withPreviousLottery_clonesConfigAndAdvancesTime() {
        Lottery previous = new Lottery();
        previous.setLotteryId("prev-1");
        previous.setTotalSlots(7);
        previous.setPrizeAmount(new BigDecimal("800000"));
        previous.setTicketPrice(new BigDecimal("3000"));
        previous.setClosesAt(LocalDateTime.of(2026, 3, 20, 15, 0));

        when(lotteryRepository.save(any(Lottery.class))).thenAnswer(inv -> inv.getArgument(0));
        when(slotRepository.save(any(Slot.class))).thenAnswer(inv -> inv.getArgument(0));

        Lottery next = lotteryService.generateNext(previous);

        assertThat(next.getTotalSlots()).isEqualTo(7);
        assertThat(next.getPrizeAmount()).isEqualByComparingTo(new BigDecimal("800000"));
        assertThat(next.getTicketPrice()).isEqualByComparingTo(new BigDecimal("3000"));
        // Closes at previous.closesAt + 10 minutes
        assertThat(next.getClosesAt()).isEqualTo(LocalDateTime.of(2026, 3, 20, 15, 10));
        assertThat(next.getStatus()).isEqualTo(LotteryStatus.OPEN);
        assertThat(next.getLotteryId()).isNotNull().isNotBlank();

        // Should create 7 slots
        verify(slotRepository, times(7)).save(any(Slot.class));
    }

    @Test
    void generateNext_withNullPrevious_usesDefaults() {
        when(lotteryRepository.save(any(Lottery.class))).thenAnswer(inv -> inv.getArgument(0));
        when(slotRepository.save(any(Slot.class))).thenAnswer(inv -> inv.getArgument(0));

        Lottery next = lotteryService.generateNext(null);

        assertThat(next.getTotalSlots()).isEqualTo(5);
        assertThat(next.getPrizeAmount()).isEqualByComparingTo(new BigDecimal("500000.00"));
        assertThat(next.getTicketPrice()).isEqualByComparingTo(new BigDecimal("2500.00"));
        assertThat(next.getClosesAt()).isAfter(LocalDateTime.now());

        verify(slotRepository, times(5)).save(any(Slot.class));
    }

    @Test
    void generateNext_allSlotsAreAvailableAndLinked() {
        Lottery previous = new Lottery();
        previous.setLotteryId("prev-1");
        previous.setTotalSlots(3);
        previous.setPrizeAmount(new BigDecimal("500000"));
        previous.setTicketPrice(new BigDecimal("2500"));
        previous.setClosesAt(LocalDateTime.now().plusMinutes(10));

        ArgumentCaptor<Slot> slotCaptor = ArgumentCaptor.forClass(Slot.class);
        when(lotteryRepository.save(any(Lottery.class))).thenAnswer(inv -> inv.getArgument(0));
        when(slotRepository.save(slotCaptor.capture())).thenAnswer(inv -> inv.getArgument(0));

        Lottery next = lotteryService.generateNext(previous);

        List<Slot> savedSlots = slotCaptor.getAllValues();
        assertThat(savedSlots).hasSize(3);
        savedSlots.forEach(slot -> {
            assertThat(slot.getLotteryId()).isEqualTo(next.getLotteryId());
            assertThat(slot.getStatus()).isEqualTo(SlotStatus.AVAILABLE);
            assertThat(slot.getSlotId()).isNotNull();
        });
    }

    @Test
    void getOpenLotteries_returnsMappedSummaryDtos() {
        Lottery lottery = new Lottery();
        lottery.setLotteryId("lot-1");
        lottery.setName("Test Draw");
        lottery.setStatus(LotteryStatus.OPEN);
        lottery.setClosesAt(LocalDateTime.now().plusMinutes(8));
        lottery.setPrizeAmount(new BigDecimal("500000"));
        lottery.setTicketPrice(new BigDecimal("2500"));
        lottery.setTotalSlots(5);

        Slot available = new Slot();
        available.setSlotId("slot-avail-1");
        available.setStatus(SlotStatus.AVAILABLE);

        Slot reserved = new Slot();
        reserved.setSlotId("slot-res-1");
        reserved.setStatus(SlotStatus.RESERVED);

        when(lotteryRepository.findByStatus(LotteryStatus.OPEN)).thenReturn(List.of(lottery));
        when(slotRepository.findByLotteryId("lot-1")).thenReturn(List.of(available, reserved));

        var summaries = lotteryService.getOpenLotteries();

        assertThat(summaries).hasSize(1);
        var dto = summaries.get(0);
        assertThat(dto.getLotteryId()).isEqualTo("lot-1");
        assertThat(dto.getAvailableSlots()).isEqualTo(1);
        assertThat(dto.getBookedSlots()).isEqualTo(1);
        assertThat(dto.getAvailableSlotId()).isEqualTo("slot-avail-1");
    }
}
