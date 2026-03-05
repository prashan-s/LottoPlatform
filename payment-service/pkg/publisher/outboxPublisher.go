package publisher

import (
	"log"
	"payment-service/pkg/repository"
	"time"

	"github.com/confluentinc/confluent-kafka-go/kafka"
)

// OutboxPublisher handles publishing pending outbox events to Kafka
type OutboxPublisher struct {
	repo     repository.OutboxRepository
	producer *kafka.Producer
	stopChan chan struct{}
}

// NewOutboxPublisher creates a new outbox publisher
func NewOutboxPublisher(repo repository.OutboxRepository, producer *kafka.Producer) *OutboxPublisher {
	return &OutboxPublisher{
		repo:     repo,
		producer: producer,
		stopChan: make(chan struct{}),
	}
}

// Start begins the outbox publisher polling loop
func (p *OutboxPublisher) Start() {
	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()

	log.Println("Outbox publisher started")

	for {
		select {
		case <-ticker.C:
			p.publishPendingEvents()
		case <-p.stopChan:
			log.Println("Outbox publisher stopped")
			return
		}
	}
}

// Stop stops the outbox publisher
func (p *OutboxPublisher) Stop() {
	close(p.stopChan)
}

// publishPendingEvents retrieves and publishes pending events
func (p *OutboxPublisher) publishPendingEvents() {
	events, err := p.repo.GetPendingEvents()
	if err != nil {
		log.Printf("Error fetching pending outbox events: %v", err)
		return
	}

	for _, event := range events {
		topic := getTopicForEventType(event.EventType)

		err := p.producer.Produce(&kafka.Message{
			TopicPartition: kafka.TopicPartition{Topic: &topic, Partition: kafka.PartitionAny},
			Key:            []byte(event.AggregateID),
			Value:          []byte(event.Payload),
		}, nil)

		if err != nil {
			log.Printf("Failed to publish event %s to topic %s: %v", event.EventID, topic, err)
			continue
		}

		// Wait for delivery confirmation
		e := <-p.producer.Events()
		m := e.(*kafka.Message)

		if m.TopicPartition.Error != nil {
			log.Printf("Delivery failed for event %s: %v", event.EventID, m.TopicPartition.Error)
		} else {
			// Mark as published only after successful acknowledgement
			if err := p.repo.MarkEventAsPublished(event.EventID); err != nil {
				log.Printf("Failed to mark event %s as published: %v", event.EventID, err)
			} else {
				log.Printf("Published event %s to topic %s", event.EventID, topic)
			}
		}
	}
}

func getTopicForEventType(eventType string) string {
	switch eventType {
	case "payment.initiated.v1":
		return "payment.initiated.v1"
	case "payment.captured.v1":
		return "payment.captured.v1"
	case "payment.failed.v1":
		return "payment.failed.v1"
	default:
		log.Printf("Unknown event type: %s", eventType)
		return eventType
	}
}
