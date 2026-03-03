package service

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"payment-service/pkg/dto"
	"payment-service/pkg/models"
	"payment-service/pkg/payhere"
	"payment-service/pkg/repository"
	"github.com/confluentinc/confluent-kafka-go/kafka"
	"github.com/go-playground/validator/v10"
	"github.com/google/uuid"
)

// ProfileResponse represents the expected response from the Identity/Profile API.
type ProfileResponse struct {
	MemberID string `json:"memberId"`
	Email    string `json:"email"`
	// Nested profile returned by GET /members/:id
	Profile *struct {
		FirstName string `json:"firstName"`
		LastName  string `json:"lastName"`
		Email     string `json:"email"`
		Phone     string `json:"phone"`
	} `json:"Profile"`
}

// PayhereConfig holds the PayHere merchant configuration loaded from environment variables.
type PayhereConfig struct {
	MerchantID     string
	MerchantSecret string
	NotifyURL      string
	Sandbox        bool
}

// PaymentService defines the business logic for payments.
type PaymentService interface {
	InitiatePayment(request *dto.InitiatePaymentRequest) (*models.Payment, error)
	GetPayment(paymentID string) (*models.Payment, error)
	CapturePayment(paymentID string) (*models.Payment, error)
	InitiatePayherePayment(request *dto.PayhereInitiateRequest) (*dto.PayhereParams, error)
	HandlePayhereNotify(formData map[string]string) error
}

type paymentService struct {
	repo               repository.PaymentRepository
	validator          *validator.Validate
	identityAPIGateway string
	httpClient         *http.Client
	producer           *kafka.Producer
	outboxService      OutboxService
	payhereConfig      PayhereConfig
}

// NewPaymentService creates a new payment service.
func NewPaymentService(
	repo repository.PaymentRepository,
	identityAPIGateway string,
	producer *kafka.Producer,
	outboxService OutboxService,
	payhereConfig PayhereConfig,
) PaymentService {
	return &paymentService{
		repo:               repo,
		validator:          validator.New(),
		identityAPIGateway: identityAPIGateway,
		httpClient: &http.Client{
			Timeout: 10 * time.Second,
		},
		producer:      producer,
		outboxService: outboxService,
		payhereConfig: payhereConfig,
	}
}

// InitiatePayment handles the initiation of a new payment (legacy / internal flow).
func (s *paymentService) InitiatePayment(request *dto.InitiatePaymentRequest) (*models.Payment, error) {
	if err := s.validator.Struct(request); err != nil {
		return nil, fmt.Errorf("invalid request: %w", err)
	}

	existingPayment, err := s.repo.FindPaymentByIdempotencyKey(request.IdempotencyKey)
	if err != nil {
		return nil, fmt.Errorf("error checking idempotency: %w", err)
	}
	if existingPayment != nil {
		return existingPayment, nil
	}

	profile, err := s.fetchProfileFromIdentityService(request.MemberID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch member profile: %w", err)
	}
	_ = profile

	currency := request.Currency
	if currency == "" {
		currency = "LKR"
	}

	payment := &models.Payment{
		PaymentID:      uuid.New().String(),
		BookingID:      request.BookingID,
		MemberID:       request.MemberID,
		Amount:         request.Amount,
		Currency:       currency,
		Status:         models.PaymentStatusInitiated,
		IdempotencyKey: request.IdempotencyKey,
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}

	if err := s.repo.CreatePayment(payment); err != nil {
		return nil, fmt.Errorf("failed to create payment record: %w", err)
	}

	if err := s.outboxService.SavePaymentEvent(
		"payment.initiated.v1",
		payment.PaymentID,
		payment.BookingID,
		payment.MemberID,
		payment.Amount,
		string(payment.Status),
		uuid.New().String(),
	); err != nil {
		fmt.Printf("Failed to save payment initiated event to outbox: %v\n", err)
	}

	return payment, nil
}

// InitiatePayherePayment creates a payment record and returns PayHere JS SDK params
// (including the server-side hash) ready for the frontend to call payhere.startPayment().
func (s *paymentService) InitiatePayherePayment(request *dto.PayhereInitiateRequest) (*dto.PayhereParams, error) {
	if request.BookingID == "" || request.MemberID == "" || request.Amount <= 0 || request.IdempotencyKey == "" {
		return nil, fmt.Errorf("invalid request: bookingId, memberId, amount and idempotencyKey are required")
	}

	// Idempotency check
	existing, err := s.repo.FindPaymentByIdempotencyKey(request.IdempotencyKey)
	if err != nil {
		return nil, fmt.Errorf("error checking idempotency: %w", err)
	}

	currency := request.Currency
	if currency == "" {
		currency = "LKR"
	}

	var paymentID string
	if existing != nil {
		// Reuse the existing payment record
		paymentID = existing.PaymentID
	} else {
		// Create new payment record
		payment := &models.Payment{
			PaymentID:      uuid.New().String(),
			BookingID:      request.BookingID,
			MemberID:       request.MemberID,
			Amount:         request.Amount,
			Currency:       currency,
			Status:         models.PaymentStatusInitiated,
			IdempotencyKey: request.IdempotencyKey,
			CreatedAt:      time.Now(),
			UpdatedAt:      time.Now(),
		}
		if err := s.repo.CreatePayment(payment); err != nil {
			return nil, fmt.Errorf("failed to create payment record: %w", err)
		}
		paymentID = payment.PaymentID

		if err := s.outboxService.SavePaymentEvent(
			"payment.initiated.v1",
			payment.PaymentID,
			payment.BookingID,
			payment.MemberID,
			payment.Amount,
			string(payment.Status),
			uuid.New().String(),
		); err != nil {
			fmt.Printf("Failed to save payment initiated event to outbox: %v\n", err)
		}
	}

	// Resolve customer contact fields — use request values, fall back to identity service
	firstName := request.FirstName
	lastName := request.LastName
	email := request.Email
	phone := request.Phone

	if firstName == "" || lastName == "" || email == "" {
		profile, profileErr := s.fetchProfileFromIdentityService(request.MemberID)
		if profileErr == nil && profile != nil {
			if firstName == "" && profile.Profile != nil {
				firstName = profile.Profile.FirstName
			}
			if lastName == "" && profile.Profile != nil {
				lastName = profile.Profile.LastName
			}
			if email == "" {
				if profile.Profile != nil && profile.Profile.Email != "" {
					email = profile.Profile.Email
				} else {
					email = profile.Email
				}
			}
			if phone == "" && profile.Profile != nil {
				phone = profile.Profile.Phone
			}
		}
	}

	if phone == "" {
		phone = "0000000000"
	}

	// Compute the PayHere hash server-side (must never be done in frontend)
	amountFormatted := payhere.FormatAmount(request.Amount)
	hash := payhere.ComputeHash(s.payhereConfig.MerchantID, paymentID, amountFormatted, currency, s.payhereConfig.MerchantSecret)

	description := request.Description
	if description == "" {
		description = "LottoPlatform ticket payment"
	}

	params := &dto.PayhereParams{
		PaymentID:  paymentID,
		Sandbox:    s.payhereConfig.Sandbox,
		MerchantID: s.payhereConfig.MerchantID,
		NotifyURL:  s.payhereConfig.NotifyURL,
		OrderID:    paymentID,
		Items:      description,
		Amount:     amountFormatted,
		Currency:   currency,
		Hash:       hash,
		FirstName:  firstName,
		LastName:   lastName,
		Email:      email,
		Phone:      phone,
		Address:    "N/A",
		City:       "Colombo",
		Country:    "Sri Lanka",
	}

	return params, nil
}

// HandlePayhereNotify processes a PayHere webhook callback.
// It verifies the md5sig before updating any payment state.
// Always returns nil to ensure the handler responds with HTTP 200 (stops PayHere retries).
func (s *paymentService) HandlePayhereNotify(formData map[string]string) error {
	merchantID := formData["merchant_id"]
	orderID := formData["order_id"]
	payherePaymentID := formData["payment_id"]
	payhereAmount := formData["payhere_amount"]
	payhereCurrency := formData["payhere_currency"]
	statusCode := formData["status_code"]
	md5sig := formData["md5sig"]

	// Verify md5sig — reject unverified callbacks silently (still return nil to ack)
	if !payhere.VerifyNotify(merchantID, orderID, payhereAmount, payhereCurrency, statusCode, s.payhereConfig.MerchantSecret, md5sig) {
		fmt.Printf("[payhere] notify md5sig verification failed for order %s — ignoring\n", orderID)
		return nil
	}

	payment, err := s.repo.GetPaymentByID(orderID)
	if err != nil || payment == nil {
		fmt.Printf("[payhere] notify: payment not found for order %s\n", orderID)
		return nil
	}

	// Determine new payment status from checkout status_code
	newStatus := resolvePayhereStatus(statusCode)
	if newStatus == "" {
		// Pending or unrecognised — log and ack without updating
		fmt.Printf("[payhere] notify: unhandled status_code=%s for order %s\n", statusCode, orderID)
		return nil
	}

	if err := s.repo.UpdatePaymentWithPayhere(orderID, payherePaymentID, newStatus); err != nil {
		fmt.Printf("[payhere] notify: failed to update payment %s: %v\n", orderID, err)
		return nil
	}

	eventType := "payment.captured.v1"
	if newStatus == models.PaymentStatusFailed {
		eventType = "payment.failed.v1"
	} else if newStatus == models.PaymentStatusRefunded {
		eventType = "payment.refunded.v1"
	}

	if err := s.outboxService.SavePaymentEvent(
		eventType,
		payment.PaymentID,
		payment.BookingID,
		payment.MemberID,
		payment.Amount,
		string(newStatus),
		uuid.New().String(),
	); err != nil {
		fmt.Printf("[payhere] notify: failed to save event to outbox: %v\n", err)
	}

	fmt.Printf("[payhere] notify: order %s → %s (payhere_id=%s)\n", orderID, newStatus, payherePaymentID)
	return nil
}

// resolvePayhereStatus maps a PayHere Checkout API status_code to internal PaymentStatus.
// Returns empty string for pending or unhandled states (no DB update needed).
func resolvePayhereStatus(statusCode string) models.PaymentStatus {
	switch statusCode {
	case "2": // success
		return models.PaymentStatusCaptured
	case "-1": // cancelled
		return models.PaymentStatusFailed
	case "-2": // failed
		return models.PaymentStatusFailed
	case "-3": // chargedback
		return models.PaymentStatusRefunded
	case "0": // pending
		return "" // no update
	}
	return ""
}

// GetPayment retrieves a payment by ID (used by the frontend to poll for payment status).
func (s *paymentService) GetPayment(paymentID string) (*models.Payment, error) {
	payment, err := s.repo.GetPaymentByID(paymentID)
	if err != nil {
		return nil, fmt.Errorf("failed to retrieve payment: %w", err)
	}
	if payment == nil {
		return nil, fmt.Errorf("payment with ID %s not found", paymentID)
	}
	return payment, nil
}

// CapturePayment updates the status of an initiated payment to CAPTURED.
func (s *paymentService) CapturePayment(paymentID string) (*models.Payment, error) {
	payment, err := s.repo.GetPaymentByID(paymentID)
	if err != nil {
		return nil, fmt.Errorf("payment not found: %w", err)
	}
	if payment == nil {
		return nil, fmt.Errorf("payment with ID %s not found", paymentID)
	}

	if payment.Status != models.PaymentStatusInitiated && payment.Status != models.PaymentStatusAuthorized {
		return nil, fmt.Errorf("payment with status %s cannot be captured", payment.Status)
	}

	if err := s.repo.UpdatePaymentStatus(payment.PaymentID, models.PaymentStatusCaptured); err != nil {
		return nil, fmt.Errorf("failed to update payment status to CAPTURED: %w", err)
	}
	payment.Status = models.PaymentStatusCaptured
	payment.UpdatedAt = time.Now()

	if err := s.outboxService.SavePaymentEvent(
		"payment.captured.v1",
		payment.PaymentID,
		payment.BookingID,
		payment.MemberID,
		payment.Amount,
		string(payment.Status),
		uuid.New().String(),
	); err != nil {
		fmt.Printf("Failed to save payment captured event to outbox: %v\n", err)
	}

	return payment, nil
}

// fetchProfileFromIdentityService calls the Identity/Profile API through the Gateway.
func (s *paymentService) fetchProfileFromIdentityService(memberID string) (*ProfileResponse, error) {
	url := fmt.Sprintf("%s/members/%s", s.identityAPIGateway, memberID)
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request for identity service: %w", err)
	}

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to call identity service through gateway: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("identity service returned non-OK status: %d", resp.StatusCode)
	}

	var profile ProfileResponse
	if err := json.NewDecoder(resp.Body).Decode(&profile); err != nil {
		return nil, fmt.Errorf("failed to decode identity service response: %w", err)
	}

	return &profile, nil
}
