
-- V1__create_booking_tables.sql

CREATE TABLE slots (
    slot_id VARCHAR(36) PRIMARY KEY,
    lottery_id VARCHAR(36) NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'AVAILABLE',
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_lottery_id (lottery_id),
    INDEX idx_slot_status (status)
);

CREATE TABLE bookings (
    booking_id VARCHAR(36) PRIMARY KEY,
    slot_id VARCHAR(36) NOT NULL,
    member_id VARCHAR(36) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'RESERVED',
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (slot_id) REFERENCES slots(slot_id),
    INDEX idx_member_id (member_id),
    INDEX idx_booking_status (status)
);
