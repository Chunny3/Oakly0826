--雅嵐
SET FOREIGN_KEY_CHECKS = 0;

-- 修改 room_id 欄位類型
ALTER TABLE chat_messages MODIFY COLUMN room_id VARCHAR(50) NOT NULL;

ALTER TABLE chat_messages MODIFY COLUMN sender_type ENUM('customer', 'agent', 'bot', 'system') NOT NULL;

-- 重新開啟外鍵檢查
SET FOREIGN_KEY_CHECKS = 1;
DELETE FROM chat_rooms 
WHERE status = 'waiting' AND customer_id LIKE 'transfer_%';