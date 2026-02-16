USE oakly;

SET FOREIGN_KEY_CHECKS = 0;
SET FOREIGN_KEY_CHECKS = 1;

SELECT * FROM users;

DELETE FROM users 
WHERE DATE(created_at) = '2025-09-07';

SELECT DATABASE();

DESCRIBE products;

SELECT * FROM users WHERE email = 'li.meihao@example.com';

DESCRIBE favorites;

ALTER TABLE favorites
  ADD COLUMN color_id INT NULL,
  ADD COLUMN size_id INT NULL,
  ADD COLUMN color_name VARCHAR(100) NULL,
  ADD COLUMN quantity INT NOT NULL DEFAULT 1;

-- 建議加一個「同一會員、同商品、同規格」的唯一鍵，避免重複收藏
ALTER TABLE favorites
  ADD UNIQUE KEY uniq_user_product_variant (user_id, product_id, color_id, size_id);

DESCRIBE products;

ALTER TABLE products ADD COLUMN product_img VARCHAR(500) NULL;

DESCRIBE colors;
DESCRIBE sizes;

DESCRIBE product_images;

-- 1) 基礎/父表

-- 會員等級
CREATE TABLE IF NOT EXISTS user_levels (
  id   INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(20) DEFAULT NULL,
  UNIQUE KEY uq_user_levels_name (name)
);

-- 顏色
CREATE TABLE colors (
  id INT PRIMARY KEY AUTO_INCREMENT,
  color_name VARCHAR(50)
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

-- 商品分類
CREATE TABLE products_category (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(30)
);

-- 文章分類
CREATE TABLE article_category (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(20)
);

-- 整理師
CREATE TABLE organizers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(20) NOT NULL,
  photo VARCHAR(500),
  introduction VARCHAR(100),
  region TINYINT(1) NOT NULL,
  is_valid TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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

-- 庫存（名稱統一為複數：stocks）
CREATE TABLE stocks (
  id INT,
  color_id INT,
  size_id INT,
  amount INT DEFAULT 0,
  PRIMARY KEY (id, color_id, size_id),
  FOREIGN KEY (color_id) REFERENCES colors (id),
  FOREIGN KEY (size_id) REFERENCES sizes (id)
);


-- 2) 主要資料表（含外鍵指向上方父表）

-- 會員
CREATE TABLE IF NOT EXISTS users (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name       VARCHAR(50)  NOT NULL,
  birthday   DATE DEFAULT NULL,
  email      VARCHAR(100) NOT NULL UNIQUE,
  password   VARCHAR(100) NOT NULL,
  phone      VARCHAR(20)  DEFAULT NULL,
  postcode   VARCHAR(10)  DEFAULT NULL,
  city       VARCHAR(50)  DEFAULT NULL,
  area       VARCHAR(50)  DEFAULT NULL,
  address    VARCHAR(255) DEFAULT NULL,
  avatar        VARCHAR(255) DEFAULT NULL,
  level_id   INT UNSIGNED DEFAULT 1,   -- 可為 NULL；預設 1
  is_valid   TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_users_level
    FOREIGN KEY (level_id) REFERENCES user_levels(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,
  CHECK (is_valid IN (0,1))
);

-- 把 img 直接改名為 avatar
ALTER TABLE `users`
  CHANGE COLUMN `img` `avatar` VARCHAR(255) NULL;

-- 文章
CREATE TABLE articles (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(100),
  content VARCHAR(500),
  author VARCHAR(20),
  article_category_id INT NOT NULL,
  published_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (article_category_id) REFERENCES article_category (id)
);

-- 商品
CREATE TABLE products (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100),
  products_category_id INT NOT NULL,
  description VARCHAR(500),
  price INT NOT NULL,
  quantity INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  upload_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_valid TINYINT NOT NULL DEFAULT 1,
  product_img VARCHAR(500),
  style VARCHAR(500),
  shipping VARCHAR(20),
  colors_id INT NOT NULL,
  designers_id INT NOT NULL,
  materials_id INT NOT NULL,
  sizes_id INT NOT NULL,
  stocks_id INT NOT NULL,
  FOREIGN KEY (products_category_id) REFERENCES products_category (id),
  FOREIGN KEY (colors_id) REFERENCES colors (id),
  FOREIGN KEY (designers_id) REFERENCES designers (id),
  FOREIGN KEY (materials_id) REFERENCES materials (id),
  FOREIGN KEY (sizes_id) REFERENCES sizes (id),
  FOREIGN KEY (stocks_id) REFERENCES stocks (id)
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

-- 訂單
CREATE TABLE orders(
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_number VARCHAR(20) NOT NULL UNIQUE,
  user_id INT UNSIGNED NOT NULL,
  total_amount INT NOT NULL,
  create_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  -- 訂購人
  buyer_name VARCHAR(100) NOT NULL,
  buyer_email VARCHAR(100),
  buyer_phone VARCHAR(20),
  -- 收件人
  recipient_name VARCHAR(100) NOT NULL,
  recipient_phone VARCHAR(20) NOT NULL,
  postal_code VARCHAR(20) NOT NULL,
  address VARCHAR(255) NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);


-- 3) 關聯/延伸表（依附上方主要資料）

-- 我的最愛（商品）
CREATE TABLE IF NOT EXISTS favorites (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id    INT UNSIGNED NOT NULL,
  product_id INT UNSIGNED NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_fav_user_product (user_id, product_id),
  KEY idx_fav_user (user_id),
  KEY idx_fav_product (product_id),
  CONSTRAINT fk_fav_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_fav_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON UPDATE CASCADE ON DELETE CASCADE
);

-- 收藏文章
CREATE TABLE IF NOT EXISTS bookmarks (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id    INT UNSIGNED NOT NULL,
  article_id INT UNSIGNED NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_bookmark_user_article (user_id, article_id),
  KEY idx_bm_user (user_id),
  KEY idx_bm_article (article_id),
  CONSTRAINT fk_bm_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_bm_article
    FOREIGN KEY (article_id) REFERENCES articles(id)
    ON UPDATE CASCADE ON DELETE CASCADE
);

-- 文章圖片
CREATE TABLE article_img (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  article_id INT UNSIGNED NOT NULL,
  img VARCHAR(500),
  FOREIGN KEY (article_id) REFERENCES articles (id)
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
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 預約上傳的環境圖片
CREATE TABLE booking_images (
  id INT PRIMARY KEY AUTO_INCREMENT,
  booking_id INT NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings (id) ON DELETE CASCADE
);

-- 商品留言
CREATE TABLE comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  product_id INT UNSIGNED NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id),
  FOREIGN KEY (product_id) REFERENCES products (id)
);

-- 優惠券 × 商品分類
CREATE TABLE coupon_categories (
  id INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
  coupon_id INT NOT NULL,
  category_id INT NOT NULL,
  FOREIGN KEY (coupon_id) REFERENCES coupons (id),
  FOREIGN KEY (category_id) REFERENCES products_category (id)
);

-- 優惠券 × 會員等級
CREATE TABLE coupon_level (
  id INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
  coupon_id INT NOT NULL,
  level_id INT UNSIGNED NOT NULL,
  FOREIGN KEY (coupon_id) REFERENCES coupons (id),
  FOREIGN KEY (level_id) REFERENCES user_levels (id)
);

-- 用戶擁有的優惠券
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

-- 商品 × 顏色（多對多）
CREATE TABLE product_colors (
  id INT,
  color_id INT,
  product_id INT UNSIGNED NOT NULL,
  PRIMARY KEY (product_id, color_id),
  FOREIGN KEY (product_id) REFERENCES products (id),
  FOREIGN KEY (color_id) REFERENCES colors (id)
);

-- 商品 × 尺寸（多對多）
CREATE TABLE product_sizes (
  id INT,
  size_id INT,
  product_id INT UNSIGNED NOT NULL,
  PRIMARY KEY (product_id, size_id),
  FOREIGN KEY (product_id) REFERENCES products (id),
  FOREIGN KEY (size_id) REFERENCES sizes (id)
);

-- 訂單明細
CREATE TABLE order_items(
  id INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
  order_id INT NOT NULL,
  product_id INT UNSIGNED NOT NULL,
  quantity INT NOT NULL,
  price INT NOT NULL,
  size VARCHAR(10),
  color VARCHAR(30),
  material VARCHAR(30),
  FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY(product_id) REFERENCES products(id)
);


-- 4) 內建基礎資料

INSERT INTO user_levels (id, name) VALUES
  (1, '木芽會員'),
  (2, '原木會員'),
  (3, '森林會員')
ON DUPLICATE KEY UPDATE name = VALUES(name);