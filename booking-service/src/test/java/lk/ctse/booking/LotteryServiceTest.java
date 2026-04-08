package lk.ctse.booking;

import lk.ctse.booking.entity.Lottery;
import lk.ctse.booking.entity.LotteryConfig;
import lk.ctse.booking.entity.Slot;
import lk.ctse.booking.enums.LotteryStatus;
import lk.ctse.booking.enums.SlotStatus;
import lk.ctse.booking.repository.LotteryRepository;
import lk.ctse.booking.repository.SlotRepository;
import lk.ctse.booking.service.LotteryConfigService;
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
    @Mock LotteryConfigService configService;

    @InjectMocks LotteryService lotteryService;

    @Test
    void generateNext_withZeroCooldown_createsOpenLotteryFromConfig() {
        LotteryConfig config = buildConfig(0, 10, 7, new BigDecimal("800000"), new BigDecimal("3000"));

        when(configService.getOrCreateDefault()).thenReturn(config);
        when(lotteryRepository.save(any(Lottery.class))).thenAnswer(inv -> inv.getArgument(0));
        when(slotRepository.save(any(Slot.class))).thenAnswer(inv -> inv.getArgument(0));

        Lottery next = lotteryService.generateNext(null);

        assertThat(next.getTotalSlots()).isEqualTo(7);
        assertThat(next.getPrizeAmount()).isEqualByComparingTo(new BigDecimal("800000"));
        assertThat(next.getTicketPrice()).isEqualByComparingTo(new BigDecimal("3000"));
        assertThat(next.getStatus()).isEqualTo(LotteryStatus.OPEN);
        assertThat(next.getOpensAt()).isNull();
        assertThat(next.getLotteryId()).isNotNull().isNotBlank();

        verify(slotRepository, times(7)).save(any(Slot.class));
    }

    @Test
    void generateNext_withCooldown_createsScheduledLotteryAndSetsOpenTime() {
        LotteryConfig config = buildConfig(2, 10, 5, new BigDecimal("500000.00"), new BigDecimal("2500.00"));

        when(configService.getOrCreateDefault()).thenReturn(config);
        when(lotteryRepository.save(any(Lottery.class))).thenAnswer(inv -> inv.getArgument(0));
        when(slotRepository.save(any(Slot.class))).thenAnswer(inv -> inv.getArgument(0));

        Lottery next = lotteryService.generateNext(null);

        assertThat(next.getStatus()).isEqualTo(LotteryStatus.SCHEDULED);
        assertThat(next.getOpensAt()).isNotNull();
        assertThat(next.getClosesAt()).isAfter(next.getOpensAt());
        assertThat(next.getTotalSlots()).isEqualTo(5);

        verify(slotRepository, times(5)).save(any(Slot.class));
    }

    @Test
    void generateNext_allSlotsAreAvailableAndLinked() {
        LotteryConfig config = buildConfig(3, 10, 3, new BigDecimal("500000"), new BigDecimal("2500"));

        ArgumentCaptor<Slot> slotCaptor = ArgumentCaptor.forClass(Slot.class);
        when(configService.getOrCreateDefault()).thenReturn(config);
        when(lotteryRepository.save(any(Lottery.class))).thenAnswer(inv -> inv.getArgument(0));
        when(slotRepository.save(slotCaptor.capture())).thenAnswer(inv -> inv.getArgument(0));

        Lottery next = lotteryService.generateNext(null);

        List<Slot> savedSlots = slotCaptor.getAllValues();
        assertThat(savedSlots).hasSize(3);
        savedSlots.forEach(slot -> {
            assertThat(slot.getLotteryId()).isEqualTo(next.getLotteryId());
            assertThat(slot.getStatus()).isEqualTo(SlotStatus.AVAILABLE);
            assertThat(slot.getStartTime()).isEqualTo(next.getOpensAt());
            assertThat(slot.getEndTime()).isEqualTo(next.getClosesAt());
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

    private LotteryConfig buildConfig(int cooldownMinutes,
                                      int durationMinutes,
                                      int totalSlots,
                                      BigDecimal prizeAmount,
                                      BigDecimal ticketPrice) {
        LotteryConfig config = new LotteryConfig();
        config.setConfigId("default");
        config.setCooldownMinutes(cooldownMinutes);
        config.setDurationMinutes(durationMinutes);
        config.setTotalSlots(totalSlots);
        config.setPrizeAmount(prizeAmount);
        config.setTicketPrice(ticketPrice);
        return config;
    }
}
