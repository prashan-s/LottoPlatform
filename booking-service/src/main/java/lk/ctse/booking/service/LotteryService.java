package lk.ctse.booking.service;

import lk.ctse.booking.dto.AdminStatsDto;
import lk.ctse.booking.dto.LotterySummaryDto;
import lk.ctse.booking.entity.Lottery;
import lk.ctse.booking.entity.LotteryConfig;
import lk.ctse.booking.entity.Slot;
import lk.ctse.booking.enums.LotteryStatus;
import java.util.UUID;
import lk.ctse.booking.enums.SlotStatus;
import lk.ctse.booking.exception.LotteryNotFoundException;
import lk.ctse.booking.repository.LotteryRepository;
import lk.ctse.booking.repository.SlotRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class LotteryService {

    private static final String[] DRAW_NAMES = {
            "Spring Jackpot Draw", "Evening Flash Draw", "Night Rush Draw",
            "Midnight Mega Draw", "Dawn Break Draw", "Peak Hour Draw",
            "Sunset Draw", "Golden Hour Draw", "Afternoon Special", "Prime Time Draw"
    };

    private final LotteryRepository lotteryRepository;
    private final SlotRepository slotRepository;
    private final LotteryConfigService configService;

    public LotteryService(LotteryRepository lotteryRepository,
                          SlotRepository slotRepository,
                          LotteryConfigService configService) {
        this.lotteryRepository = lotteryRepository;
        this.slotRepository = slotRepository;
        this.configService = configService;
    }

    // ── Public API ────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<LotterySummaryDto> getOpenLotteries() {
        return lotteryRepository.findByStatus(LotteryStatus.OPEN)
                .stream()
                .map(this::toSummaryDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public LotterySummaryDto getLotteryById(String lotteryId) {
        Lottery lottery = lotteryRepository.findById(lotteryId)
                .orElseThrow(() -> new LotteryNotFoundException(
                        "Lottery not found: " + lotteryId));
        return toSummaryDto(lottery);
    }

    // ── Admin ─────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public AdminStatsDto getAdminStats() {
        return AdminStatsDto.builder()
                .openLotteries(lotteryRepository.countByStatus(LotteryStatus.OPEN))
                .scheduledLotteries(lotteryRepository.countByStatus(LotteryStatus.SCHEDULED))
                .drawingLotteries(lotteryRepository.countByStatus(LotteryStatus.DRAWING))
                .closedLotteries(lotteryRepository.countByStatus(LotteryStatus.CLOSED))
                .config(configService.getConfigDto())
                .recentLotteries(getRecentLotteries())
                .build();
    }

    @Transactional(readOnly = true)
    public List<LotterySummaryDto> getRecentLotteries() {
        return lotteryRepository.findTop20ByOrderByCreatedAtDesc()
                .stream()
                .map(this::toSummaryDto)
                .collect(Collectors.toList());
    }

    // ── Generation ────────────────────────────────────────────────────────────

    /**
     * Generates the next lottery using the current global config.
     * If cooldown > 0 the lottery starts in SCHEDULED status and opens automatically
     * when the scheduler activates it. If cooldown == 0 it opens immediately.
     *
     * @param previous used only for logging; config values are always authoritative
     */
    @Transactional
    public Lottery generateNext(Lottery previous) {
        LotteryConfig config = configService.getOrCreateDefault();

        int cooldown = config.getCooldownMinutes();
        int duration = config.getDurationMinutes();

        LocalDateTime opensAt = LocalDateTime.now().plusMinutes(cooldown);
        LocalDateTime closesAt = opensAt.plusMinutes(duration);

        LotteryStatus initialStatus = cooldown > 0 ? LotteryStatus.SCHEDULED : LotteryStatus.OPEN;

        String name = DRAW_NAMES[(int) (Math.random() * DRAW_NAMES.length)];

        Lottery lottery = new Lottery();
        lottery.setLotteryId(UUID.randomUUID().toString());
        lottery.setName(name);
        lottery.setStatus(initialStatus);
        lottery.setOpensAt(cooldown > 0 ? opensAt : null);
        lottery.setClosesAt(closesAt);
        lottery.setPrizeAmount(config.getPrizeAmount());
        lottery.setTicketPrice(config.getTicketPrice());
        lottery.setTotalSlots(config.getTotalSlots());
        lotteryRepository.save(lottery);

        for (int i = 0; i < config.getTotalSlots(); i++) {
            Slot slot = new Slot();
            slot.setLotteryId(lottery.getLotteryId());
            slot.setStartTime(opensAt);
            slot.setEndTime(closesAt);
            slot.setStatus(SlotStatus.AVAILABLE);
            slotRepository.save(slot);
        }

        return lottery;
    }

    // ── Internal ──────────────────────────────────────────────────────────────

    private LotterySummaryDto toSummaryDto(Lottery lottery) {
        List<Slot> slots = slotRepository.findByLotteryId(lottery.getLotteryId());

        long availableSlots = slots.stream()
                .filter(s -> s.getStatus() == SlotStatus.AVAILABLE).count();
        long bookedSlots = slots.stream()
                .filter(s -> s.getStatus() == SlotStatus.RESERVED
                          || s.getStatus() == SlotStatus.CONFIRMED).count();

        String availableSlotId = slots.stream()
                .filter(s -> s.getStatus() == SlotStatus.AVAILABLE)
                .map(Slot::getSlotId)
                .findFirst()
                .orElse(null);

        return LotterySummaryDto.builder()
                .lotteryId(lottery.getLotteryId())
                .name(lottery.getName())
                .status(lottery.getStatus().name())
                .opensAt(toUtc(lottery.getOpensAt()))
                .closesAt(toUtc(lottery.getClosesAt()))
                .prizeAmount(lottery.getPrizeAmount())
                .ticketPrice(lottery.getTicketPrice())
                .totalSlots(lottery.getTotalSlots())
                .bookedSlots(bookedSlots)
                .availableSlots(availableSlots)
                .availableSlotId(availableSlotId)
                .winnerId(lottery.getWinnerId())
                .winnerBookingId(lottery.getWinnerBookingId())
                .createdAt(toUtc(lottery.getCreatedAt()))
                .build();
    }

    /** Treats a LocalDateTime stored in the DB as UTC and wraps it with the UTC offset. */
    private static OffsetDateTime toUtc(LocalDateTime ldt) {
        return ldt == null ? null : ldt.atOffset(ZoneOffset.UTC);
    }
}
