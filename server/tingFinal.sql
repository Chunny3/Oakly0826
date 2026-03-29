
-- 建立會員等級表
CREATE TABLE IF NOT EXISTS user_levels (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(20) DEFAULT NULL,
    UNIQUE KEY uq_user_levels_name (name)
);

-- 放入預設等級
INSERT INTO user_levels (id, name) VALUES 
    (1, '木芽會員'),
    (2, '原木會員'),
    (3, '森林會員')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- 建立會員表
CREATE TABLE `users` (
    `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
    `name` varchar(50) NOT NULL,
    `birthday` date DEFAULT NULL,
    `email` varchar(100) NOT NULL,
    `password` varchar(100) NOT NULL,
    `phone` varchar(20) DEFAULT NULL,
    `postcode` varchar(10) DEFAULT NULL,
    `city` varchar(50) DEFAULT NULL,
    `area` varchar(50) DEFAULT NULL,
    `address` varchar(255) DEFAULT NULL,
    `avatar` varchar(255) DEFAULT NULL,
    `level_id` int(10) unsigned DEFAULT 1,
    `is_valid` tinyint(1) NOT NULL DEFAULT 1,
    `created_at` datetime DEFAULT current_timestamp(),
    `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    `google_uid` varchar(200) DEFAULT NULL,
    `auth_provider` enum('local', 'google') NOT NULL DEFAULT 'local',
    `reset_token_hash` char(64) DEFAULT NULL COMMENT 'SHA-256 hashed token',
    `reset_token_expires_at` datetime DEFAULT NULL COMMENT 'token expiry time',
    PRIMARY KEY (`id`),
    UNIQUE KEY `email` (`email`),
    KEY `fk_users_level` (`level_id`),
    KEY `idx_reset_token_hash` (`reset_token_hash`),
    KEY `idx_reset_token_expires` (`reset_token_expires_at`),
    CONSTRAINT `fk_users_level` FOREIGN KEY (`level_id`) REFERENCES `user_levels` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 106 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci


-- favorites：我的最愛（user × product 多對多）
CREATE TABLE `favorites` (
    `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
    `user_id` int(10) unsigned NOT NULL,
    `product_id` int(11) NOT NULL,
    `created_at` datetime DEFAULT current_timestamp(),
    `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    `color_id` int(11) DEFAULT NULL,
    `size_id` int(11) DEFAULT NULL,
    `color_name` varchar(100) DEFAULT NULL,
    `quantity` int(11) NOT NULL DEFAULT 1,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_fav_user_product` (`user_id`, `product_id`),
    UNIQUE KEY `uniq_user_product_variant` (
        `user_id`,
        `product_id`,
        `color_id`,
        `size_id`
    ),
    KEY `idx_fav_user` (`user_id`),
    KEY `idx_fav_product` (`product_id`),
    CONSTRAINT `fk_fav_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_fav_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 18 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci