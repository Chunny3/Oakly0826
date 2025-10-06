use oakly;

SET FOREIGN_KEY_CHECKS = 0;

-- SET FOREIGN_KEY_CHECKS = 1;

drop table users;

-- 會員
CREATE TABLE IF NOT EXISTS users (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    birthday DATE DEFAULT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL,
    phone VARCHAR(20) DEFAULT NULL,
    postcode VARCHAR(10) DEFAULT NULL,
    city VARCHAR(50) DEFAULT NULL,
    area VARCHAR(50) DEFAULT NULL,
    address VARCHAR(255) DEFAULT NULL,
    avatar VARCHAR(255) DEFAULT NULL,
    level_id INT UNSIGNED DEFAULT 1, -- 可為 NULL；預設 1
    is_valid TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_users_level FOREIGN KEY (level_id) REFERENCES user_levels (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CHECK (is_valid IN (0, 1))
);

-- CREATE TABLE `member_levels` (
--     id INT AUTO_INCREMENT NOT NULL PRIMARY KEY,
--     name VARCHAR(20)
-- );

-- 會員等級
DROP TABLE user_levels;

CREATE TABLE IF NOT EXISTS user_levels (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(20) DEFAULT NULL,
    UNIQUE KEY uq_user_levels_name (name)
);

-- 我的最愛
CREATE TABLE IF NOT EXISTS favorites (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    product_id INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_fav_user_product (user_id, product_id),
    KEY idx_fav_user (user_id),
    KEY idx_fav_product (product_id),
    CONSTRAINT fk_fav_user FOREIGN KEY (user_id) REFERENCES users (id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_fav_product FOREIGN KEY (product_id) REFERENCES products (id) ON UPDATE CASCADE ON DELETE CASCADE
);
SELECT f.product_id, f.color_id, f.color_name, f.size_id, f.quantity,
       p.name, p.price, p.product_img
FROM favorites f
JOIN products p ON f.product_id = p.id
WHERE f.user_id = 3;

ALTER TABLE service_conversations ADD COLUMN guest_id VARCHAR(50);
SELECT * FROM service_conversations WHERE id = 16;
SELECT current_chats, max_chats FROM service_agents WHERE status = 'online';
SELECT * FROM service_messages 
WHERE conversation_id = 1 
ORDER BY sent_at;
UPDATE service_agents SET max_chats = 20 WHERE username = 'alice';
----加進去
ALTER TABLE favorites 
ADD COLUMN color_id INT NULL,
ADD COLUMN size_id INT NULL,
ADD COLUMN quantity INT DEFAULT 1;
-- UNSIGNED 不一致
-- product_id → INT UNSIGNED
-- id → INT
-- 必須一致，否則會錯。 
ALTER TABLE favorites
DROP COLUMN id;
SELECT 
  p.id,
  p.name,
  m.material_name,
  ml.product_id,
  ml.materials_id
FROM products p
LEFT JOIN materials_list ml ON p.id = ml.product_id
LEFT JOIN materials m ON ml.materials_id = m.id
WHERE p.id = 1
LIMIT 5;ALTER TABLE favorites 
ADD COLUMN color_name VARCHAR(50);

-- 複合唯一索引（防止重複收藏同商品同顏色）

DROP INDEX IF EXISTS idx_favorites_unique;
CREATE UNIQUE INDEX idx_favorites_unique 
ON favorites(user_id, product_id, color_id);
SELECT * FROM favorites WHERE user_id = 1 AND product_id = 52 AND color_id = 1;

CREATE TABLE stock_notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  product_id INT,
  color_id INT,
  size_id INT,
  email VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-------------------------------------
-- 收藏文章
CREATE TABLE IF NOT EXISTS bookmarks (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    article_id INT UNSIGNED NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_bookmark_user_article (user_id, article_id),
    KEY idx_bm_user (user_id),
    KEY idx_bm_article (article_id),
    CONSTRAINT fk_bm_user FOREIGN KEY (user_id) REFERENCES users (id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_bm_article FOREIGN KEY (article_id) REFERENCES articles (id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- 優惠券
CREATE TABLE coupons (
    id INT AUTO_INCREMENT NOT NULL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    code VARCHAR(20),
    discount_type TINYINT(1) NOT NULL,
    discount DECIMAL(7, 2) NOT NULL,
    min_discount INT DEFAULT 0,
    max_amount INT DEFAULT NULL,
    start_at DATE,
    end_at DATE,
    valid_days INT DEFAULT NULL,
    is_valid TINYINT(1) DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE coupon_categories (
    id INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
    coupon_id INT NOT NULL,
    category_id INT NOT NULL,
    FOREIGN KEY (coupon_id) REFERENCES coupons (id),
    FOREIGN KEY (category_id) REFERENCES products_category (category_id)
);

CREATE TABLE coupon_level (
    id INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
    coupon_id INT NOT NULL,
    level_id INT UNSIGNED NOT NULL,
    FOREIGN KEY (coupon_id) REFERENCES coupons (id),
    FOREIGN KEY (level_id) REFERENCES user_levels (id)
);

CREATE TABLE user_coupons (
    id INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
    user_id INT UNSIGNED NOT NULL,
    coupon_id INT NOT NULL,
    get_at DATETIME,
    used_at DATETIME,
    expire_at DATETIME,
    status TINYINT(1) DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (coupon_id) REFERENCES coupons (id)
);

-- 文章
CREATE TABLE articles (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(100),
    content VARCHAR(500),
    author VARCHAR(20),
    article_category_id INT NOT NULL,
    published_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`article_category_id`) REFERENCES article_category (`id`)
);

CREATE TABLE `article_category` (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(20)
);

CREATE TABLE `article_img` (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    article_id INT UNSIGNED NOT NULL,
    img VARCHAR(500),
    FOREIGN KEY (`article_id`) REFERENCES articles (`id`)
);

-- 文章追蹤
CREATE TABLE article_tracking (
    id INT AUTO_INCREMENT PRIMARY KEY,
    article_id INT UNSIGNED NOT NULL,
    user_id INT UNSIGNED NULL,
    event_type ENUM('view', 'like', 'share') NOT NULL,
    event_data JSON,
    create_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (article_id) REFERENCES articles (id),
    FOREIGN KEY (user_id) REFERENCES users (id)
);

UPDATE products SET is_valid = 0 WHERE id = 123;

UPDATE products SET is_valid = 0 WHERE id = 162;

-- 商品
CREATE TABLE `products` (
    `id` INT UNSIGNED NOT NULL auto_increment PRIMARY KEY,
    `name` VARCHAR(100),
    `products_category_id` INT NOT NULL,
    `description` VARCHAR(500),
    `price` INT NOT NULL,
    `quantity` INT NOT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `upload_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `is_valid` TINYINT NOT NULL DEFAULT 1,
    `product_img` VARCHAR(500),
    `style` VARCHAR(500),
    `shipping` VARCHAR(20),
    `colors_id` INT NOT NULL,
    `designers_id` INT NOT NULL,
    `materials_id` INT NOT NULL,
    `sizes_id` INT NOT NULL,
    `stocks_id` INT NOT NULL,
    FOREIGN KEY (`products_category_id`) REFERENCES products_category (`id`),
    FOREIGN KEY (`colors_id`) REFERENCES colors (`id`),
    FOREIGN KEY (`designers_id`) REFERENCES designers (`id`),
    FOREIGN KEY (`materials_id`) REFERENCES materials (`id`),
    FOREIGN KEY (`sizes_id`) REFERENCES sizes (`id`),
    FOREIGN KEY (`stocks_id`) REFERENCES stocks (`id`)
);

CREATE TABLE `products_category` (
    `id` INT NOT NULL auto_increment PRIMARY KEY,
    `name` VARCHAR(30)
);

-- 用戶預約記錄主表
CREATE TABLE bookings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNSIGNED NOT NULL,
    city VARCHAR(20) NOT NULL,
    district VARCHAR(20) NOT NULL,
    address VARCHAR(100) NOT NULL,
    organizer_id INT NOT NULL,
    price INT DEFAULT NULL,
    service_datetime DATETIME NOT NULL,
    note VARCHAR(255),
    status TINYINT(1) NOT NULL DEFAULT 1 COMMENT '1=諮詢中，2=預約成功，3=服務完成，4=已取消',
    is_valid TINYINT(1) NOT NULL DEFAULT 1 COMMENT '1=有效，0=刪除',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organizer_id) REFERENCES organizers (id),
    FOREIGN KEY (user_id) REFERENCES users (id)
);

-- 用戶家裡環境圖片
CREATE TABLE booking_images (
    id INT PRIMARY KEY AUTO_INCREMENT,
    booking_id INT NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings (id) ON DELETE CASCADE
);

-- 整理師表
CREATE TABLE organizers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(20) NOT NULL,
    photo VARCHAR(500),
    introduction VARCHAR(100),
    region TINYINT(1) NOT NULL,
    is_valid TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 商品留言
CREATE TABLE comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    product_id INT NOT NULL,
    comment TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (product_id) REFERENCES products (id)
);
-- 顏色表
CREATE TABLE colors (
    id INT PRIMARY KEY AUTO_INCREMENT,
    color_name VARCHAR(50)
);

-- 商品與顏色關聯表（多對多）
CREATE TABLE product_colors (
    id INT,
    color_id INT,
    product_id INT UNSIGNED NOT NULL,
    PRIMARY KEY (product_id, color_id),
    FOREIGN KEY (product_id) REFERENCES products (id),
    FOREIGN KEY (color_id) REFERENCES colors (id)
);

-- 設計師
CREATE TABLE designers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100)
);

-- 材質
CREATE TABLE materials (
    id INT PRIMARY KEY AUTO_INCREMENT,
    material_name VARCHAR(100)
);

-- 尺寸
CREATE TABLE sizes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    size_label VARCHAR(50)
);

-- 商品-尺寸（多對多）
CREATE TABLE product_sizes (
    id INT,
    size_id INT,
    product_id INT UNSIGNED NOT NULL,
    PRIMARY KEY (product_id, size_id),
    FOREIGN KEY (product_id) REFERENCES products (id),
    FOREIGN KEY (size_id) REFERENCES sizes (id)
);

CREATE TABLE stock (
    id INT,
    color_id INT,
    size_id INT,
    amount INT DEFAULT 0,
    PRIMARY KEY (id, color_id, size_id),
    FOREIGN KEY (color_id) REFERENCES colors (id),
    FOREIGN KEY (size_id) REFERENCES sizes (id)
);

-- 訂單表
CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_number VARCHAR(20) NOT NULL UNIQUE,
    user_id INT UNSIGNED NOT NULL,
    total_amount INT NOT NULL,
    create_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    -- 訂購人資訊
    buyer_name VARCHAR(100) NOT NULL,
    buyer_email VARCHAR(100),
    buyer_phone VARCHAR(20),
    -- 收件人資訊
    recipient_name VARCHAR(100) NOT NULL,
    recipient_phone VARCHAR(20) NOT NULL,
    address VARCHAR(255) NOT NULL,
    -- 付款資訊
    payment_status VARCHAR(20),
    payment_method VARCHAR(20),
    coupon_id INT,
    FOREIGN KEY (user_id) REFERENCES users (id)
);

-- 訂單商品表
CREATE TABLE order_items (
    id INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    price INT NOT NULL,
    size VARCHAR(10),
    color VARCHAR(30),
    material VARCHAR(30),
    FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products (id)
)

UPDATE order_items oi
JOIN product_sizes ps 
  ON oi.product_id = ps.product_id
JOIN sizes s 
  ON ps.size_id = s.id
  SET oi.size = s.size_label
  WHERE oi.size = s.size_label;

ALTER TABLE order_items MODIFY COLUMN size VARCHAR(500);

-- 商品補充
-- --------------------------------------------------------
INSERT INTO
    `colors` (`id`, `color_name`)
VALUES (1, '白色'),
    (2, '黑色'),
    (3, '原木色'),
    (4, '淺灰'),
    (5, '深灰'),
    (6, '淺藍'),
    (7, '深藍'),
    (8, '淺綠'),
    (9, '深綠'),
    (10, '米黃色');

-- product--------------------------------------------------------

CREATE TABLE `colors` (
    `id` int(11) NOT NULL,
    `color_name` varchar(50) DEFAULT NULL
)

CREATE TABLE `designers` (
    `id` int(11) NOT NULL,
    `name` varchar(100) DEFAULT NULL
)

CREATE TABLE `materials` (
    `id` int(11) NOT NULL,
    `material_name` varchar(100) DEFAULT NULL
)

CREATE TABLE `materials_list` (
    `product_id` int(11) NOT NULL,
    `materials_id` int(11) NOT NULL
)

CREATE TABLE `products` (
    `id` int(11) UNSIGNED NOT NULL,
    `name` varchar(100) DEFAULT NULL,
    `category_id` int(11) NOT NULL,
    `description` text DEFAULT NULL,
    `price` int(11) NOT NULL,
    `quantity` int(11) NOT NULL,
    `create_at` datetime DEFAULT current_timestamp(),
    `update_at` datetime DEFAULT current_timestamp(),
    `is_valid` tinyint(4) DEFAULT 1,
    `style` varchar(255) DEFAULT NULL,
    `status` tinyint(1) DEFAULT 1,
    `colors` int(11) NOT NULL DEFAULT 1,
    `designers_id` int(11) NOT NULL DEFAULT 1,
    `materials_id` int(11) NOT NULL DEFAULT 1,
    PRIMARY KEY (`id`)
)

CREATE TABLE `products_category` (
    `category_id` int(11) NOT NULL,
    `category_name` varchar(30) DEFAULT NULL
)

CREATE TABLE `product_colors` (
    `product_id` int(11) NOT NULL,
    `color_id` int(11) NOT NULL
)

CREATE TABLE `product_img` (
    `id` int(11) NOT NULL,
    `product_id` int(11) NOT NULL,
    `img` varchar(500) DEFAULT NULL
)

CREATE TABLE `product_sizes` (
    `product_id` int(11) NOT NULL,
    `size_id` int(11) NOT NULL
)

CREATE TABLE `reviews` (
    `id` int(11) NOT NULL,
    `user_id` int(11) NOT NULL,
    `product_id` int(11) NOT NULL,
    `rating` int(11) NOT NULL CHECK (
        `rating` >= 1
        and `rating` <= 5
    ),
    `comment` text NOT NULL,
    `user_name` varchar(100) DEFAULT NULL,
    `email` varchar(255) DEFAULT NULL,
    `avatar` varchar(255) DEFAULT NULL,
    `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
    `reviews_img` text DEFAULT NULL
)

CREATE TABLE `sizes` (
    `id` int(11) NOT NULL,
    `size_label` varchar(50) DEFAULT NULL
)

CREATE TABLE `stocks` (
    `id` int(11) NOT NULL,
    `color_id` int(11) NOT NULL,
    `size_id` int(11) NOT NULL,
    `amount` int(11) DEFAULT 0
)

CREATE TABLE `style` (
    `id` int(11) NOT NULL,
    `product_id` int(11) NOT NULL,
    `des` varchar(255) DEFAULT NULL
)