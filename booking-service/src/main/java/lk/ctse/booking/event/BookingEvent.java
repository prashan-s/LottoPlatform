package lk.ctse.booking.event;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BookingEvent {
    private String eventId;
    private String eventType;
    private String bookingId;
    private String memberId;
    private String slotId;
    private String status;
    private LocalDateTime timestamp;
    private String correlationId;
}
