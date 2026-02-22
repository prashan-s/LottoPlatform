package lk.ctse.booking.event;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DrawEvent {
    private String eventId;
    private String eventType;
    private String lotteryId;
    private String lotteryName;
    private String winnerId;
    private String winnerBookingId;
    private LocalDateTime timestamp;
    private String correlationId;
}
