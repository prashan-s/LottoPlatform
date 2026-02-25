package lk.ctse.booking.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LotteryConfigDto {
    private int durationMinutes;
    private int cooldownMinutes;
    private int totalSlots;
    private BigDecimal prizeAmount;
    private BigDecimal ticketPrice;
    private boolean autoGenerate;
    private LocalDateTime updatedAt; // read-only, not accepted on PUT
}
