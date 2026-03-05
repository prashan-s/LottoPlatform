package service

import (
	"encoding/json"
	"payment-service/pkg/models"
	"payment-service/pkg/repository"
	"time"

	"github.com/google/uuid"
)

// OutboxService handles outbox event operations
type OutboxService interface {
	SavePaymentEvent(eventType, paymentID, bookingID, memberID string, amount float64, status, correlationID string) error
}

type outboxService struct {
	repo repository.OutboxRepository
}

// NewOutboxService creates a new outbox service
func NewOutboxService(repo repository.OutboxRepository) OutboxService {
	return &outboxService{repo: repo}
}

// SavePaymentEvent saves a payment event to the outbox
func (s *outboxService) SavePaymentEvent(eventType, paymentID, bookingID, memberID string, amount float64, status, correlationID string) error {
	event := models.PaymentEvent{
		EventID:       uuid.New().String(),
		EventType:     eventType,
		PaymentID:     paymentID,
		BookingID:     bookingID,
		MemberID:      memberID,
		Amount:        amount,
		Status:        status,
		Timestamp:     time.Now(),
		CorrelationID: correlationID,
	}

	payload, err := json.Marshal(event)
	if err != nil {
		return err
	}

	outbox := &models.Outbox{
		EventID:     event.EventID,
		EventType:   eventType,
		AggregateID: paymentID,
		Payload:     string(payload),
		Status:      "PENDING",
		CreatedAt:   time.Now(),
	}

	return s.repo.SaveOutboxEvent(outbox)
}
