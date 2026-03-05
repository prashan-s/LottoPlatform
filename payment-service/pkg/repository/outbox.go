package repository

import (
	"database/sql"
	"payment-service/pkg/models"
)

// OutboxRepository defines methods for outbox data access
type OutboxRepository interface {
	SaveOutboxEvent(event *models.Outbox) error
	GetPendingEvents() ([]*models.Outbox, error)
	MarkEventAsPublished(eventID string) error
}

type outboxRepository struct {
	db *sql.DB
}

// NewOutboxRepository creates a new outbox repository
func NewOutboxRepository(db *sql.DB) OutboxRepository {
	return &outboxRepository{db: db}
}

// SaveOutboxEvent saves an outbox event to the database
func (r *outboxRepository) SaveOutboxEvent(event *models.Outbox) error {
	query := `
		INSERT INTO outbox (event_id, event_type, aggregate_id, payload, status, created_at)
		VALUES (?, ?, ?, ?, ?, ?)
	`
	_, err := r.db.Exec(query, event.EventID, event.EventType, event.AggregateID, event.Payload, event.Status, event.CreatedAt)
	return err
}

// GetPendingEvents retrieves all pending outbox events
func (r *outboxRepository) GetPendingEvents() ([]*models.Outbox, error) {
	query := `
		SELECT id, event_id, event_type, aggregate_id, payload, status, created_at
		FROM outbox
		WHERE status = 'PENDING'
		ORDER BY created_at ASC
	`
	rows, err := r.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var events []*models.Outbox
	for rows.Next() {
		var event models.Outbox
		if err := rows.Scan(&event.ID, &event.EventID, &event.EventType, &event.AggregateID, &event.Payload, &event.Status, &event.CreatedAt); err != nil {
			return nil, err
		}
		events = append(events, &event)
	}
	return events, nil
}

// MarkEventAsPublished marks an outbox event as published
func (r *outboxRepository) MarkEventAsPublished(eventID string) error {
	query := `UPDATE outbox SET status = 'PUBLISHED' WHERE event_id = ?`
	_, err := r.db.Exec(query, eventID)
	return err
}
