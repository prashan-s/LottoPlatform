package lk.ctse.booking.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Data
@Builder
public class LotterySummaryDto {
    private String lotteryId;
    private String name;
    private String status;
    private OffsetDateTime opensAt;
    private OffsetDateTime closesAt;
    private BigDecimal prizeAmount;
    private BigDecimal ticketPrice;
    private int totalSlots;
    private long bookedSlots;
    private long availableSlots;
    private String availableSlotId;
    private String winnerId;
    private String winnerBookingId;
    private OffsetDateTime createdAt;
}
