-- V4__add_version_to_bookings.sql
-- Add version column for optimistic locking

ALTER TABLE bookings ADD COLUMN version BIGINT NOT NULL DEFAULT 0;
