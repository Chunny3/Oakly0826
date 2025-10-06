ALTER TABLE users
  ADD COLUMN reset_token_hash CHAR(64) NULL COMMENT 'SHA-256 hashed token',
  ADD COLUMN reset_token_expires_at DATETIME NULL COMMENT 'token expiry time',
  ADD INDEX idx_reset_token_hash (reset_token_hash),
  ADD INDEX idx_reset_token_expires (reset_token_expires_at);

  ALTER TABLE users
  ADD COLUMN google_uid VARCHAR(128) UNIQUE NULL AFTER password,
  ADD COLUMN auth_provider ENUM('local','google') NOT NULL DEFAULT 'local' AFTER google_uid;


----區分「本地註冊」和「Google 登入」
  ALTER TABLE users
  ADD COLUMN auth_provider ENUM('local','google') NOT NULL DEFAULT 'local' AFTER google_uid;


SELECT * FROM chat_rooms WHERE status = 'waiting' AND customer_id LIKE 'transfer_%' ORDER BY created_at DESC;
  CREATE TABLE transfer_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  room_id VARCHAR(50),
  customer_id INT,
  transfer_reason TEXT,
  status ENUM('waiting', 'accepted', 'rejected'),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  accepted_by INT NULL,
  accepted_at TIMESTAMP NULL
);

