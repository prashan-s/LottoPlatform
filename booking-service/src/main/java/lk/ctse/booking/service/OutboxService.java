package lk.ctse.booking.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lk.ctse.booking.entity.Outbox;
import lk.ctse.booking.event.BookingEvent;
import lk.ctse.booking.event.DrawEvent;
import lk.ctse.booking.repository.OutboxRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class OutboxService {

    private final OutboxRepository outboxRepository;
    private final ObjectMapper objectMapper;

    public OutboxService(OutboxRepository outboxRepository, ObjectMapper objectMapper) {
        this.outboxRepository = outboxRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public void saveBookingEvent(String eventType, String bookingId, String memberId, String slotId, String status, String correlationId) {
        try {
            BookingEvent event = new BookingEvent(
                    UUID.randomUUID().toString(),
                    eventType,
                    bookingId,
                    memberId,
                    slotId,
                    status,
                    LocalDateTime.now(),
                    correlationId
            );

            Outbox outbox = new Outbox();
            outbox.setEventId(event.getEventId());
            outbox.setEventType(eventType);
            outbox.setAggregateId(bookingId);
            outbox.setPayload(objectMapper.writeValueAsString(event));
            outbox.setStatus("PENDING");

            outboxRepository.save(outbox);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to serialize event", e);
        }
    }

    @Transactional
    public void saveDrawEvent(String lotteryId, String lotteryName, String winnerId, String winnerBookingId) {
        try {
            String correlationId = UUID.randomUUID().toString();
            DrawEvent event = new DrawEvent(
                    UUID.randomUUID().toString(),
                    "draw.completed.v1",
                    lotteryId,
                    lotteryName,
                    winnerId,
                    winnerBookingId,
                    LocalDateTime.now(),
                    correlationId
            );

            Outbox outbox = new Outbox();
            outbox.setEventId(event.getEventId());
            outbox.setEventType(event.getEventType());
            outbox.setAggregateId(lotteryId);
            outbox.setPayload(objectMapper.writeValueAsString(event));
            outbox.setStatus("PENDING");

            outboxRepository.save(outbox);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to serialize draw event", e);
        }
    }
}
