USE oakly002;

DESCRIBE oakly002.users;



--看有沒有改成功
SHOW CREATE TABLE users\G

SHOW CREATE TABLE

-- 1) 讓 OAuth 帳號的 password 可以為 NULL
ALTER TABLE users
  MODIFY password VARCHAR(100) NULL;

-- 2) 建議把 google_uid 設唯一（避免同一個 Google 帳號被重複建）
ALTER TABLE users
  ADD UNIQUE KEY uq_google_uid (google_uid);

-- 3) 確認 level_id 預設 1 的外鍵在 user_levels 存在，避免外鍵錯
-- INSERT IGNORE INTO user_levels (id, name)
-- VALUES (1, 'basic');  -- 如果已存在會被忽略

-- 4) 再檢查一次 password 欄位設定
SHOW COLUMNS FROM users LIKE 'password';

SHOW CREATE TABLE oakly002.users;
