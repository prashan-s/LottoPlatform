package dto

// PayhereInitiateRequest is the request body for POST /payments/payhere/initiate.
// The frontend provides customer contact fields (firstName, lastName, email, phone)
// from the authenticated member session.
type PayhereInitiateRequest struct {
	BookingID      string  `json:"bookingId" validate:"required"`
	MemberID       string  `json:"memberId" validate:"required"`
	Amount         float64 `json:"amount" validate:"required,min=0.01"`
	Currency       string  `json:"currency"`      // defaults to "LKR"
	IdempotencyKey string  `json:"idempotencyKey" validate:"required"`
	Description    string  `json:"description"`
	// Customer contact — sourced from the authenticated member in the frontend.
	FirstName string `json:"firstName"`
	LastName  string `json:"lastName"`
	Email     string `json:"email"`
	Phone     string `json:"phone"`
}

// PayhereParams is returned to the frontend and passed directly to payhere.startPayment().
// All fields match the PayHere Checkout API parameter names.
type PayhereParams struct {
	// Internal reference
	PaymentID string `json:"paymentId"`

	// PayHere SDK fields
	Sandbox    bool   `json:"sandbox"`
	MerchantID string `json:"merchant_id"`
	NotifyURL  string `json:"notify_url"`
	OrderID    string `json:"order_id"`
	Items      string `json:"items"`
	Amount     string `json:"amount"`
	Currency   string `json:"currency"`
	Hash       string `json:"hash"`

	// Customer
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	Email     string `json:"email"`
	Phone     string `json:"phone"`
	Address   string `json:"address"`
	City      string `json:"city"`
	Country   string `json:"country"`
}
