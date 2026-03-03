package repository

import (
	"database/sql"
	"fmt"
	"time"

	"payment-service/pkg/models"
)

// PaymentRepository defines the interface for payment data operations.
type PaymentRepository interface {
	CreatePayment(payment *models.Payment) error
	FindPaymentByIdempotencyKey(key string) (*models.Payment, error)
	GetPaymentByID(paymentID string) (*models.Payment, error)
	UpdatePaymentStatus(paymentID string, status models.PaymentStatus) error
	UpdatePaymentWithPayhere(paymentID, payherePaymentID string, status models.PaymentStatus) error
}

// NewMySQLPaymentRepository creates a new MySQL implementation of PaymentRepository.
func NewMySQLPaymentRepository(db *sql.DB) PaymentRepository {
	return &mysqlPaymentRepository{db: db}
}

type mysqlPaymentRepository struct {
	db *sql.DB
}

// CreatePayment inserts a new payment record into the database.
func (r *mysqlPaymentRepository) CreatePayment(payment *models.Payment) error {
	query := `
		INSERT INTO payments (payment_id, booking_id, member_id, amount, currency, status, idempotency_key, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
	`
	_, err := r.db.Exec(
		query,
		payment.PaymentID,
		payment.BookingID,
		payment.MemberID,
		payment.Amount,
		payment.Currency,
		payment.Status,
		payment.IdempotencyKey,
		payment.CreatedAt,
		payment.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("failed to create payment: %w", err)
	}
	return nil
}

// FindPaymentByIdempotencyKey retrieves a payment by its idempotency key.
func (r *mysqlPaymentRepository) FindPaymentByIdempotencyKey(key string) (*models.Payment, error) {
	query := `
		SELECT payment_id, booking_id, member_id, amount, currency, status, idempotency_key,
		       COALESCE(payhere_payment_id, ''), COALESCE(subscription_id, ''), created_at, updated_at
		FROM payments WHERE idempotency_key = ?`
	row := r.db.QueryRow(query, key)
	return scanPayment(row)
}

// GetPaymentByID retrieves a payment by its ID.
func (r *mysqlPaymentRepository) GetPaymentByID(paymentID string) (*models.Payment, error) {
	query := `
		SELECT payment_id, booking_id, member_id, amount, currency, status, idempotency_key,
		       COALESCE(payhere_payment_id, ''), COALESCE(subscription_id, ''), created_at, updated_at
		FROM payments WHERE payment_id = ?`
	row := r.db.QueryRow(query, paymentID)
	return scanPayment(row)
}

// UpdatePaymentStatus updates the status of a payment.
func (r *mysqlPaymentRepository) UpdatePaymentStatus(paymentID string, status models.PaymentStatus) error {
	query := `UPDATE payments SET status = ?, updated_at = ? WHERE payment_id = ?`
	_, err := r.db.Exec(query, status, time.Now(), paymentID)
	if err != nil {
		return fmt.Errorf("failed to update payment status: %w", err)
	}
	return nil
}

// UpdatePaymentWithPayhere updates payment status and stores the PayHere payment ID from a notify callback.
func (r *mysqlPaymentRepository) UpdatePaymentWithPayhere(paymentID, payherePaymentID string, status models.PaymentStatus) error {
	query := `
		UPDATE payments
		SET status = ?, payhere_payment_id = ?, updated_at = ?
		WHERE payment_id = ?`
	_, err := r.db.Exec(query, status, payherePaymentID, time.Now(), paymentID)
	if err != nil {
		return fmt.Errorf("failed to update payment with payhere data: %w", err)
	}
	return nil
}

// scanPayment scans a single row into a Payment model.
func scanPayment(row *sql.Row) (*models.Payment, error) {
	payment := &models.Payment{}
	err := row.Scan(
		&payment.PaymentID,
		&payment.BookingID,
		&payment.MemberID,
		&payment.Amount,
		&payment.Currency,
		&payment.Status,
		&payment.IdempotencyKey,
		&payment.PayherePaymentID,
		&payment.SubscriptionID,
		&payment.CreatedAt,
		&payment.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("failed to scan payment: %w", err)
	}
	return payment, nil
}
