package models

import (
	"time"
)

// PaymentStatus defines the status of a payment.
type PaymentStatus string

const (
	PaymentStatusInitiated PaymentStatus = "INITIATED"
	PaymentStatusAuthorized PaymentStatus = "AUTHORIZED"
	PaymentStatusCaptured PaymentStatus = "CAPTURED"
	PaymentStatusFailed PaymentStatus = "FAILED"
	PaymentStatusRefunded PaymentStatus = "REFUNDED"
)

// Payment represents a payment record in the database.
type Payment struct {
	PaymentID        string        `json:"paymentId"`
	BookingID        string        `json:"bookingId"`
	MemberID         string        `json:"memberId"`
	Amount           float64       `json:"amount"`
	Currency         string        `json:"currency"`
	Status           PaymentStatus `json:"status"`
	IdempotencyKey   string        `json:"idempotencyKey"`
	PayherePaymentID string        `json:"payherePaymentId,omitempty"`
	SubscriptionID   string        `json:"subscriptionId,omitempty"`
	CreatedAt        time.Time     `json:"createdAt"`
	UpdatedAt        time.Time     `json:"updatedAt"`
}
