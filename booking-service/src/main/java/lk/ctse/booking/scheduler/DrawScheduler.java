package lk.ctse.booking.scheduler;

import lk.ctse.booking.entity.Lottery;
import lk.ctse.booking.entity.LotteryConfig;
import lk.ctse.booking.enums.LotteryStatus;
import lk.ctse.booking.repository.LotteryRepository;
import lk.ctse.booking.service.DrawService;
import lk.ctse.booking.service.LotteryConfigService;
import lk.ctse.booking.service.LotteryService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
public class DrawScheduler {

    private static final Logger log = LoggerFactory.getLogger(DrawScheduler.class);

    private final LotteryRepository lotteryRepository;
    private final DrawService drawService;
    private final LotteryService lotteryService;
    private final LotteryConfigService configService;

    public DrawScheduler(LotteryRepository lotteryRepository,
                         DrawService drawService,
                         LotteryService lotteryService,
                         LotteryConfigService configService) {
        this.lotteryRepository = lotteryRepository;
        this.drawService = drawService;
        this.lotteryService = lotteryService;
        this.configService = configService;
    }

    @Scheduled(fixedDelay = 10_000)
    public void processExpiredLotteries() {

        // Step 1: Activate SCHEDULED lotteries whose cooldown has elapsed
        List<Lottery> toActivate = lotteryRepository.findByStatusAndOpensAtLessThanEqual(
                LotteryStatus.SCHEDULED, LocalDateTime.now());

        for (Lottery l : toActivate) {
            l.setStatus(LotteryStatus.OPEN);
            l.setOpensAt(null);
            lotteryRepository.save(l);
            log.info("Lottery [{}] '{}' activated — SCHEDULED -> OPEN.", l.getLotteryId(), l.getName());
        }

        // Step 2: Execute draws for expired OPEN lotteries
        List<Lottery> expired = lotteryRepository.findByStatusAndClosesAtBefore(
                LotteryStatus.OPEN, LocalDateTime.now());

        for (Lottery lottery : expired) {
            boolean hadWinner;
            try {
                hadWinner = drawService.executeDraw(lottery);
                log.info("Draw completed for [{}] '{}' — {}.",
                        lottery.getLotteryId(), lottery.getName(),
                        hadWinner ? "winner selected" : "no confirmed bookings, no winner");
            } catch (ObjectOptimisticLockingFailureException e) {
                log.debug("Optimistic lock conflict for [{}] — already claimed.", lottery.getLotteryId());
                continue;
            } catch (Exception e) {
                log.error("Draw failed for [{}]: {}", lottery.getLotteryId(), e.getMessage(), e);
                continue;
            }

            // Step 3: Auto-generate next lottery (respects cooldown + autoGenerate flag)
            try {
                LotteryConfig config = configService.getOrCreateDefault();
                if (!config.isAutoGenerate()) {
                    log.info("Auto-generate disabled — skipping next lottery generation.");
                    continue;
                }

                long pending = lotteryRepository.countByStatus(LotteryStatus.OPEN)
                             + lotteryRepository.countByStatus(LotteryStatus.SCHEDULED);

                if (pending > 0) {
                    log.info("Skipping generation — {} pending/open lottery(s) already exist.", pending);
                    continue;
                }

                Lottery next = lotteryService.generateNext(lottery);
                if (next.getStatus() == LotteryStatus.SCHEDULED) {
                    log.info("Next lottery [{}] '{}' scheduled — opens at {}, closes at {}.",
                            next.getLotteryId(), next.getName(), next.getOpensAt(), next.getClosesAt());
                } else {
                    log.info("Next lottery [{}] '{}' is open — closes at {}.",
                            next.getLotteryId(), next.getName(), next.getClosesAt());
                }
            } catch (Exception e) {
                log.error("Failed to generate next lottery after draw [{}]: {}",
                        lottery.getLotteryId(), e.getMessage(), e);
            }
        }
    }
}
