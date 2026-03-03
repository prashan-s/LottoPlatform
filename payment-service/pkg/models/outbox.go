package models

import "time"

// Outbox represents an outbox event record in the database
type Outbox struct {
	ID          int64     `json:"id"`
	EventID     string    `json:"eventId"`
	EventType   string    `json:"eventType"`
	AggregateID string    `json:"aggregateId"`
	Payload     string    `json:"payload"`
	Status      string    `json:"status"`
	CreatedAt   time.Time `json:"createdAt"`
}

// PaymentEvent represents the structure of a payment event
type PaymentEvent struct {
	EventID       string    `json:"eventId"`
	EventType     string    `json:"eventType"`
	PaymentID     string    `json:"paymentId"`
	BookingID     string    `json:"bookingId"`
	MemberID      string    `json:"memberId"`
	Amount        float64   `json:"amount"`
	Status        string    `json:"status"`
	Timestamp     time.Time `json:"timestamp"`
	CorrelationID string    `json:"correlationId"`
}
