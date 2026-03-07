-- Add member_id, type, title columns and rename body → message
ALTER TABLE notifications
  ADD COLUMN member_id  VARCHAR(36)   AFTER notification_id,
  ADD COLUMN type       VARCHAR(50)   NOT NULL DEFAULT 'EMAIL',
  ADD COLUMN title      VARCHAR(255),
  CHANGE COLUMN body message TEXT NOT NULL;

ALTER TABLE notifications ADD INDEX idx_member_id (member_id);
