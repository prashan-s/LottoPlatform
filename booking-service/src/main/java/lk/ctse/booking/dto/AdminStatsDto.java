package lk.ctse.booking.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class AdminStatsDto {
    private long openLotteries;
    private long scheduledLotteries;
    private long drawingLotteries;
    private long closedLotteries;
    private LotteryConfigDto config;
    private List<LotterySummaryDto> recentLotteries;
}
