package lk.ctse.booking.consumer;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lk.ctse.booking.service.BookingService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.util.HashSet;
import java.util.Set;

@Component
public class PaymentEventConsumer {

    private static final Logger logger = LoggerFactory.getLogger(PaymentEventConsumer.class);
    private final BookingService bookingService;
    private final ObjectMapper objectMapper;
    private final Set<String> processedEvents = new HashSet<>();

    public PaymentEventConsumer(BookingService bookingService, ObjectMapper objectMapper) {
        this.bookingService = bookingService;
        this.objectMapper = objectMapper;
    }

    @KafkaListener(topics = "payment.captured.v1", groupId = "booking-service-group")
    public void handlePaymentCaptured(String message) {
        try {
            JsonNode event = objectMapper.readTree(message);
            String eventId = event.get("eventId").asText();
            String bookingId = event.get("bookingId").asText();

            // Deduplication guard
            if (processedEvents.contains(eventId)) {
                logger.info("Event {} already processed, skipping", eventId);
                return;
            }

            logger.info("Processing payment.captured event for booking: {}", bookingId);

            // Confirm the booking
            bookingService.confirmBooking(bookingId);

            // Mark as processed
            processedEvents.add(eventId);

            logger.info("Successfully confirmed booking {} after payment capture", bookingId);
        } catch (Exception e) {
            logger.error("Error processing payment captured event", e);
            // In production, you might want to implement retry logic or send to DLQ
        }
    }

    @KafkaListener(topics = "payment.failed.v1", groupId = "booking-service-group")
    public void handlePaymentFailed(String message) {
        try {
            JsonNode event = objectMapper.readTree(message);
            String eventId = event.get("eventId").asText();
            String bookingId = event.get("bookingId").asText();

            // Deduplication guard
            if (processedEvents.contains(eventId)) {
                logger.info("Event {} already processed, skipping", eventId);
                return;
            }

            logger.info("Processing payment.failed event for booking: {}", bookingId);

            // Cancel the booking
            bookingService.cancelBooking(bookingId);

            // Mark as processed
            processedEvents.add(eventId);

            logger.info("Successfully cancelled booking {} after payment failure", bookingId);
        } catch (Exception e) {
            logger.error("Error processing payment failed event", e);
            // In production, you might want to implement retry logic or send to DLQ
        }
    }
}
