-- Add opens_at to lotteries for cooldown / scheduled-start support
ALTER TABLE lotteries
    ADD COLUMN opens_at TIMESTAMP NULL AFTER status;

-- Create singleton config table (always one row: config_id = 'default')
CREATE TABLE lottery_config (
    config_id        VARCHAR(36)   NOT NULL,
    duration_minutes INT           NOT NULL DEFAULT 10,
    cooldown_minutes INT           NOT NULL DEFAULT 2,
    total_slots      INT           NOT NULL DEFAULT 5,
    prize_amount     DECIMAL(15,2) NOT NULL DEFAULT 500000.00,
    ticket_price     DECIMAL(15,2) NOT NULL DEFAULT 2500.00,
    auto_generate    BOOLEAN       NOT NULL DEFAULT TRUE,
    updated_at       TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (config_id)
) ENGINE=InnoDB;

INSERT INTO lottery_config (config_id, duration_minutes, cooldown_minutes, total_slots, prize_amount, ticket_price, auto_generate)
VALUES ('default', 10, 2, 5, 500000.00, 2500.00, TRUE);
