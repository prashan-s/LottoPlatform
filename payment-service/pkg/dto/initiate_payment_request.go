package dto

import "time"

// InitiatePaymentRequest defines the structure for a payment initiation request.
type InitiatePaymentRequest struct {
	BookingID      string    `json:"bookingId" validate:"required,uuid"`
	MemberID       string    `json:"memberId" validate:"required,uuid"`
	Amount         float64   `json:"amount" validate:"required,min=0.01"`
	IdempotencyKey string    `json:"idempotencyKey" validate:"required"`
	Description    string    `json:"description"`
	Currency       string    `json:"currency" validate:"required,iso4217"`
	ReturnURL      string    `json:"returnUrl" validate:"required,url"`
	CancelURL      string    `json:"cancelUrl" validate:"required,url"`
	ExpiresAt      time.Time `json:"expiresAt" validate:"required,gt=now"`
}
