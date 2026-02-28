-- V5__create_lotteries_table.sql

CREATE TABLE lotteries (
    lottery_id        VARCHAR(36)    PRIMARY KEY,
    name              VARCHAR(255)   NOT NULL DEFAULT 'Lottery Draw',
    status            VARCHAR(20)    NOT NULL DEFAULT 'OPEN',
    closes_at         TIMESTAMP      NOT NULL,
    winner_id         VARCHAR(36),
    winner_booking_id VARCHAR(36),
    prize_amount      DECIMAL(15, 2) NOT NULL DEFAULT 500000.00,
    ticket_price      DECIMAL(15, 2) NOT NULL DEFAULT 2500.00,
    total_slots       INT            NOT NULL DEFAULT 5,
    version           BIGINT         NOT NULL DEFAULT 0,
    created_at        TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status_closes_at (status, closes_at)
);
