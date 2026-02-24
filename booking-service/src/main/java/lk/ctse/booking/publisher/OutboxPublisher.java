package lk.ctse.booking.publisher;

import lk.ctse.booking.entity.Outbox;
import lk.ctse.booking.repository.OutboxRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
public class OutboxPublisher {

    private static final Logger logger = LoggerFactory.getLogger(OutboxPublisher.class);
    private final OutboxRepository outboxRepository;
    private final KafkaTemplate<String, String> kafkaTemplate;

    public OutboxPublisher(OutboxRepository outboxRepository, KafkaTemplate<String, String> kafkaTemplate) {
        this.outboxRepository = outboxRepository;
        this.kafkaTemplate = kafkaTemplate;
    }

    @Scheduled(fixedDelay = 5000) // Run every 5 seconds
    public void publishPendingEvents() {
        List<Outbox> pendingEvents = outboxRepository.findByStatusOrderByCreatedAtAsc("PENDING");

        for (Outbox event : pendingEvents) {
            try {
                String topic = getTopicForEventType(event.getEventType());
                if (topic == null) {
                    // Unknown event type — mark as SKIPPED so it won't block the outbox
                    event.setStatus("SKIPPED");
                    outboxRepository.save(event);
                    continue;
                }

                try {
                    kafkaTemplate.send(topic, event.getAggregateId(), event.getPayload()).get();
                    event.setStatus("PUBLISHED");
                    outboxRepository.save(event);
                    logger.info("Published event {} to topic {}", event.getEventId(), topic);
                } catch (Exception kafkaEx) {
                    logger.error("Failed to publish event {} to topic {}", event.getEventId(), topic, kafkaEx);
                }
            } catch (Exception e) {
                logger.error("Error processing outbox event {}", event.getEventId(), e);
            }
        }
    }

    private String getTopicForEventType(String eventType) {
        return switch (eventType) {
            case "booking.reserved.v1" -> "booking.reserved.v1";
            case "booking.confirmed.v1" -> "booking.confirmed.v1";
            case "booking.cancelled.v1" -> "booking.cancelled.v1";
            case "draw.completed.v1" -> "draw.completed.v1";
            case "payment.initiated.v1" -> "payment.initiated.v1";
            case "payment.captured.v1" -> "payment.captured.v1";
            case "payment.failed.v1" -> "payment.failed.v1";
            default -> {
                logger.warn("Unknown event type: {} — skipping", eventType);
                yield null;
            }
        };
    }
}
