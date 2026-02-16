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