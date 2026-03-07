ALTER TABLE notifications
  ADD COLUMN `read` TINYINT(1) NOT NULL DEFAULT 0 AFTER status,
  ADD INDEX idx_member_unread (member_id, `read`);
