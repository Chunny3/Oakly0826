use oakly;
SELECT * FROM users WHERE id = 1;
SELECT DATABASE();

--關閉外建檢查
SET FOREIGN_KEY_CHECKS = 0;
--開啟外鍵檢查
SET FOREIGN_KEY_CHECKS = 1;

DROP TABLE `coupons`;
-- 1.coupons 主表
CREATE TABLE coupons (
  id INT AUTO_INCREMENT NOT NULL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  code VARCHAR(20),
  discount_type TINYINT(1) NOT NULL,
  discount DECIMAL(7,2) NOT NULL,
  min_discount INT DEFAULT 0,
  max_amount INT DEFAULT NULL,
  start_at DATE,
  end_at DATE,
  valid_days INT DEFAULT NULL,
  is_valid TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE coupon_categories;
-- 2.coupon_categories 商品優惠類別
CREATE TABLE coupon_categories (
  id INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
  coupon_id INT NOT NULL,
  category_id INT NOT NULL,
  FOREIGN KEY (coupon_id) REFERENCES coupons(id),
  FOREIGN KEY (category_id) REFERENCES products_category(id)
);

DROP TABLE coupon_level;
-- 3.coupon_levels 會員優惠
CREATE TABLE coupon_level (
  id INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
  coupon_id INT NOT NULL,
  levels_id INT NOT NULL,
  FOREIGN KEY (coupon_id) REFERENCES coupons(id),
  FOREIGN KEY (levels_id) REFERENCES  user_levels(id)
);

DROP TABLE user_coupons;
-- 4.user_coupons 使用者的優惠券
CREATE TABLE user_coupons (
  id INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
  user_id INT NOT NULL,
  coupon_id INT NOT NULL,
  get_at DATETIME,
  used_at DATETIME,
  expire_at DATETIME,
  status TINYINT(1) DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (coupon_id) REFERENCES coupons(id),
  UNIQUE KEY unique_user_coupon (user_id, coupon_id)  -- 9/7新增
);




-----------------------------優惠券假資料---------------------------------

-- 1.coupons 主表 假資料
-- 1 價格  2 折數
INSERT INTO `coupons` (`id`, `name`, `code`, `discount_type`, `discount`, `min_discount`, `max_amount`, `start_at`, `end_at`, `valid_days`, `is_valid`) VALUES
(1, '期間限定優惠券', 'GRAB001A', 2, 0.98, 0, NULL, NULL, NULL, 7, 1),
(2, '期間限定優惠券', 'GRAB002B', 1, 120.00, 1400, NULL, NULL, NULL, 7, 1),
(3, '期間限定優惠券', 'GRAB003C', 2, 0.85, 1600, NULL, NULL, NULL, 7, 1),
(4, '新會員專屬券', 'NEW2025A', 1, 200.00, 1000, NULL, '2025-09-01', '2025-10-01', NULL, 1),
(5, '滿額折扣券', 'SAVE500B', 1, 500.00, 3000, NULL, '2025-09-01', '2025-09-30', NULL, 1),
(6, '高級會員折扣', 'VIP15OFF', 2, 0.85, 2000, NULL, '2025-09-01', '2025-09-30', NULL, 1),
(7, '生活用品特惠', 'LIFE10PC', 2, 0.90, 800, NULL, '2025-09-05', '2025-09-30', NULL, 1),
(8, '限時搶購券', 'FLASH50', 1, 50.00, 500, NULL, '2025-09-05', '2025-09-30', NULL, 1);



-- 2.coupon_categories 商品優惠類別 假資料
INSERT INTO `coupon_categories` (`id`, `coupon_id`, `category_id`) VALUES
-- 券1：所有產品適用
(1, 1, 1), (2, 1, 2), (3, 1, 3), (4, 1, 4), (5, 1, 5), (6, 1, 6),
-- 券2：收納用品
(7, 2, 6),
-- 券3：辦公空間
(8, 3, 5),
-- 券4 (獨家會員專屬)：客廳 + 臥室
(9, 4, 1), (10, 4, 3),
-- 券5 (滿額折扣券)：所有產品適用
(11, 5, 1), (12, 5, 2), (13, 5, 3), (14, 5, 4), (15, 5, 5), (16, 5, 6),
-- 券6 (夏季特別折扣)：兒童房 + 辦公空間
(17, 6, 4), (18, 6, 5),
-- 券7 (臥室空間特惠)：客廳 + 臥室 + 收納用品
(19, 7, 3),
-- 券8 (限時搶購券)：餐廳/廚房
(20, 8, 2);


-- 3.coupon_levels 會員優惠 假資料
INSERT INTO `coupon_level` (`id`, `coupon_id`, `level_id`) VALUES
-- 三張券都適用所有會員等級
(1, 1, 1), (2, 1, 2), (3, 1, 3),
(4, 2, 1), (5, 2, 2), (6, 2, 3),
(7, 3, 1), (8, 3, 2), (9, 3, 3),
-- 券4 (新會員專屬券)：僅限木芽會員
(10, 4, 1),
-- 券5 (滿額折扣券)：所有會員等級
(11, 5, 1), (12, 5, 2), (13, 5, 3),
-- 券6 (高級會員折扣)：僅限森林會員
(14, 6, 3),
-- 券7 (生活用品特惠)：原木會員以上
(15, 7, 2), (16, 7, 3),
-- 券8 (限時搶購券)：所有會員等級
(17, 8, 1), (18, 8, 2), (19, 8, 3);

DROP TABLE user_coupons;
-- 4.user_coupons 使用者的優惠券
-- 0	get（已領但未用）-- 1	used（已使用）-- 2	expired（已過期）
-- 修正後的 user_coupons 資料
INSERT INTO `user_coupons` (`id`, `user_id`, `coupon_id`, `get_at`, `used_at`, `expire_at`, `status`) VALUES
-- 1號user 
(1, 1, 1, '2025-08-25 10:30:00', '2025-08-28 15:30:00', '2025-09-01 23:59:59', 1),  -- 已使用 (coupon_id=1, 領取+7天)
(2, 1, 4, '2025-08-30 14:20:00', NULL, '2025-10-01 23:59:59', 0),  -- 已領未用 (按 coupons 表期限)
(3, 1, 8, '2025-08-31 16:45:00', NULL, '2025-09-30 23:59:59', 0),  -- 已領未用 (按 coupons 表期限)
(9, 1, 5, '2025-08-28 09:00:00', NULL, '2025-09-30 23:59:59', 0),  -- 已領未用 (按 coupons 表期限)
-- 2號user 
(4, 2, 2, '2025-08-20 09:15:00', '2025-08-28 15:30:00', '2025-08-27 23:59:59', 1),  -- 已使用 (coupon_id=2, 領取+7天)
(5, 2, 5, '2025-08-29 11:00:00', NULL, '2025-09-30 23:59:59', 0),  -- 已領未用 (按 coupons 表期限)
(10, 2, 6, '2025-08-25 14:30:00', '2025-08-30 10:20:00', '2025-09-30 23:59:59', 1),  -- 已使用 (按 coupons 表期限)
-- 3號user 
(6, 3, 3, '2025-08-15 13:25:00', NULL, '2025-08-22 23:59:59', 2),  -- 已過期 (coupon_id=3, 領取+7天)
(7, 3, 6, '2025-08-31 10:40:00', NULL, '2025-09-30 23:59:59', 0),  -- 已領未用 (按 coupons 表期限)
(8, 3, 7, '2025-08-31 18:20:00', NULL, '2025-09-30 23:59:59', 0);  -- 已領未用 (按 coupons 表期限)

SELECT * FROM user_coupons WHERE user_id = 1;
SELECT * FROM coupons WHERE id IN (1, 4, 5, 8);
------------------------------------------------------------------------

DROP TABLE `bookings`;
-- 1.用戶預約記錄主表
CREATE TABLE bookings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
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
    
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (organizer_id) REFERENCES organizers(id)
);

DROP TABLE booking_images;
-- 2.用戶家裡環境圖片
CREATE TABLE booking_images (
    id INT PRIMARY KEY AUTO_INCREMENT,
    booking_id INT NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);

-- 3.整理師表
DROP TABLE `organizers`;
CREATE TABLE organizers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(20) NOT NULL,
    photo VARCHAR(500),
    introduction VARCHAR(100),
    region TINYINT(1) NOT NULL,
    is_valid TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);          

DESCRIBE organizers;

---------------------------整理師假資料------------------------------------

-- 1.用戶預約記錄主表 假資料 *****要再修改改改改改改
INSERT INTO `bookings` (`id`, `user_id`, `city`, `district`, `address`, `organizer_id`, `price`, `service_datetime`, `note`, `status`, `is_valid`, `created_at`) VALUES
(1, 1, '新竹市', '東區', '晚安', 2, NULL, '2025-09-18 00:00:00', '安安', 1, 1, '2025-09-02 09:55:06'),
(2, 1, '臺中市', '東區', '好類路一段148號', 8, 10000, '2025-09-24 14:00:00', '', 2, 1, '2025-09-02 14:51:43'),
(3, 1, '屏東縣', '高樹鄉', '第三段', 13, 12000, '2025-09-25 12:00:00', '今天天氣真好', 3, 1, '2025-09-02 14:52:22'),
(4, 1, '臺中市', '豐原區', '第四個', 8, NULL, '2025-09-25 00:00:00', '515ㄚㄚ', 4, 1, '2025-09-02 14:52:50');


-- 2.用戶家裡環境圖片 假資料 *****要再修改改改改改改
INSERT INTO `booking_images` (`id`, `booking_id`, `image_url`, `created_at`) VALUES
(1, 1, '/uploads/booking_images/216802e4-1027-42bf-b741-61def169fcd6.jpg', '2025-09-02 09:55:06'),
(2, 1, '/uploads/booking_images/d767afb3-b557-4336-b517-79121df344e7.jpg', '2025-09-02 09:55:06'),
(3, 1, '/uploads/booking_images/760872c1-f95f-4547-bdb3-e2467dcf6024.jpg', '2025-09-02 09:55:06'),
(4, 2, '/uploads/booking_images/8f60cd9f-d93e-455a-b216-24b54f815257.jpg', '2025-09-02 14:51:43'),
(5, 3, '/uploads/booking_images/28772084-369a-430a-827f-a8f7b2f41bed.jpg', '2025-09-02 14:52:22'),
(6, 3, '/uploads/booking_images/3b7c8fe8-f194-4b22-ba8d-de2f7df35f8f.jpg', '2025-09-02 14:52:22'),
(7, 4, '/uploads/booking_images/d60fbea5-ddcb-4e5e-acf0-378115ae0f5d.jpg', '2025-09-02 14:52:50');


-- 3.整理師表 假資料
INSERT INTO organizers (name, photo, introduction, region, is_valid) VALUES
-- 北部地區 (6位)
('Mia', '/img/organizers/005.jpg', '以系統化整理為核心，深度了解居住者需求，專精小坪數空間規劃與收納美學設計。', 1, 1),

('雅婷', '/img/organizers/006.jpg', '專注親子家庭空間規劃，擅長兒童物品分類收納，打造安全舒適的成長環境。', 1, 1),

('魷魚', '/img/organizers/007.jpg', '衣物整理專業顧問，致力於建構個人風格衣櫥，提升日常穿搭效率與生活品質。', 1, 1),

('蕭諟', '/img/organizers/008.jpg', '廚房空間整理達人，專精廚具收納與食材管理，創造高效率的烹飪環境。', 1, 1),

('Evan', '/img/organizers/001.jpg', '工作空間整理專家，提升居家辦公效率，打造專注力與創意並存的環境。', 1, 1),

('花花', '/img/organizers/009.jpg', '極簡生活實踐者，引導客戶重新審視物品價值，建立清爽有質感的生活空間。', 1, 1),
-- 中部地區 (4位)
('Jason', '/img/organizers/002.jpg', '商業空間整理顧問，專精辦公環境優化，提升團隊工作效率與空間使用價值。', 2, 1),

('小宜', '/img/organizers/010.jpg', '老屋空間改造專家，善於挖掘舊空間潛力，重新定義居住功能與動線規劃。', 2, 1),

('瑜恩', '/img/organizers/011.jpg', '兒童教育整理師，培養孩子自主收納能力，建立良好生活習慣與責任感。', 2, 1),

('Emma', '/img/organizers/012.jpg', '季節收納規劃師，建立完整換季整理系統，讓衣物管理變得輕鬆有條理。', 2, 1),
-- 南部地區 (3位)
('阿賢', '/img/organizers/003.jpg', '斷捨離生活導師，協助客戶釋放空間壓力，重新找回生活的輕盈與自在感。', 3, 1),

('Sophie', '/img/organizers/013.jpg', '收納工具專業顧問，精通各類收納產品應用，打造最適合的個人化收納方案。', 3, 1),

('柏丞', '/img/organizers/004.jpg', '數位生活整理師，整合實體與虛擬空間管理，創造現代人的高效生活模式。', 3, 1);
DROP TABLE `organizers`;

------------------------------------------------------------------------

--------------怡卉的部分結束--------------------







----=========================================
--======================user類 不是我的不是我的不是我的不是我的不是我的==========----------------
DROP TABLE user_levels;
-- 1.會員等級資料
CREATE TABLE user_levels (
  id int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name varchar(20) DEFAULT NULL
);

DROP TABLE users;
-- 2.會員資料
CREATE TABLE users (
  id INT(11) NOT NULL AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL,
  birthday DATE DEFAULT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(100) NOT NULL,
  phone VARCHAR(20) DEFAULT NULL,
  postcode VARCHAR(10) DEFAULT NULL,
  city VARCHAR(50) DEFAULT NULL,
  area VARCHAR(50) DEFAULT NULL,
  address VARCHAR(255) DEFAULT NULL,
  img VARCHAR(255) DEFAULT NULL,
  level_id INT(11) DEFAULT 1,  
  is_valid TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT fk_users_level FOREIGN KEY (`level_id`) REFERENCES `user_levels`(`id`)
    ON UPDATE CASCADE
);

-----------------會員假資料------------
-- 1.會員等級資料 假資料
INSERT INTO `user_levels` (`id`, `name`) VALUES
(1, '木芽會員'),
(2, '原木會員'),
(3, '森林會員');

-- 2.會員假資料
INSERT INTO users (name, birthday, email, password, phone, postcode, city, area, address, img, level_id, is_valid) VALUES
('王小明', '1990-05-15', 'xiaoming@gmail.com', 'a12345', '0912345678', '10001', '台北市', '中正區', '忠孝東路一段123號', NULL, 1, 1),
('李美華', '1985-12-20', 'meihua@yahoo.com.tw', 'a12345', '0923456789', '40001', '台中市', '西區', '台灣大道二段456號', NULL, 1, 1),
('張志強', '1992-08-03', 'zhiqiang@hotmail.com', 'a12345', '0934567890', '80001', '高雄市', '前金區', '中山一路789號', NULL, 2, 1);


--======================產品類 不是我的不是我的不是我的不是我的不是我的==========----------------

DROP TABLE products_category;
--1. 產品類別
CREATE TABLE `products_category` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name` varchar(30) DEFAULT NULL
);

--1. 產品類別 假資料
INSERT INTO `products_category` (`id`, `name`) VALUES
(1, '客廳'),
(2, '餐廳/廚房'),
(3, '臥室'),
(4, '兒童房'),
(5, '辦公空間'),
(6, '收納用品');


