
USE PRODUCT;

-- - 顏色表
CREATE TABLE colors (
id INT PRIMARY KEY AUTO_INCREMENT,
color_name VARCHAR(50)
);

UPDATE products SET is_valid = 0 WHERE id = 118;
INSERT INTO colors (color_name) VALUES
('白色'),
('黑色'),
('原木色'),
('淺灰'),
('深灰'),
('淺藍'),
('深藍'),
('淺綠'),
('深綠'),
('米黃色');

-- - 商品與顏色關聯表（多對多）
CREATE TABLE product_colors (
product_id INT,
color_id INT,
PRIMARY KEY (product_id, color_id),
FOREIGN KEY (product_id) REFERENCES products(id),
FOREIGN KEY (color_id) REFERENCES colors(id)
);
SHOW TABLES LIKE 'product_img';

SELECT img FROM product_img WHERE product_id = 5 LIMIT 1;
 
SELECT p.*, pi.img
  FROM products p
  LEFT JOIN product_img pi ON p.id = pi.product_id

INSERT INTO product_colors (product_id, color_id) VALUES
(1, 2), (1, 5), (1, 9),
(2, 1), (2, 4), (2, 10),
(3, 3), (3, 6), (3, 8),
(4, 2), (4, 7), (4, 10),
(5, 1), (5, 3), (5, 8),
(6, 2), (6, 4), (6, 6),
(7, 5), (7, 7), (7, 9),
(8, 1), (8, 3), (8, 10),
(9, 2), (9, 5), (9, 7),
(10, 4), (10, 6), (10, 8),
(11, 1), (11, 9),
(12, 3), (12, 5), (12, 10),
(13, 2), (13, 4), (13, 7),
(14, 6), (14, 8), (14, 9),
(15, 1), (15, 4), (15, 10),
(16, 3), (16, 6), (16, 7),
(17, 2), (17, 5), (17, 8),
(18, 1), (18, 3), (18, 9),
(19, 4), (19, 6), (19, 10),
(20, 2), (20, 7), (20, 8),
(21, 1), (21, 5), (21, 9),
(22, 3), (22, 4), (22, 10),
(23, 2), (23, 6), (23, 8),
(24, 1), (24, 7), (24, 9),
(25, 3), (25, 5), (25, 10),
(26, 2), (26, 4), (26, 8),
(27, 1), (27, 6), (27, 9),
(28, 3), (28, 7), (28, 10),
(29, 2), (29, 5), (29, 8),
(30, 4), (30, 6), (30, 9);

-- 設計師
CREATE TABLE designers (
id INT PRIMARY KEY AUTO_INCREMENT,
name VARCHAR(100)
);
ALTER TABLE products
ADD COLUMN designer_id INT UNSIGNED,
ADD CONSTRAINT fk_designer
FOREIGN KEY (designer_id) REFERENCES designers(id)

UPDATE products 
SET designer_id = FLOOR(RAND() * 10) + 1
WHERE designer_id IS NULL;

INSERT INTO designers (name) VALUES
('Charles and Ray Eames'),
('Isamu Noguchi'),
('Le Corbusier'),
('Eero Saarinen'),
('Arne Jacobsen'),
('Hans Wegner'),
('Josef Frank'),
('Piero Fornasetti'),
('Frank Lloyd Wright'),
('Eileen Gray'),
('Ludwig Mies van der Rohe'),
('Verner Panton'),
('Dieter Rams'),
('Konstantin Grcic'),
('Charlotte Perriand');

-- - **材質(要改)**
CREATE TABLE materials (
id INT PRIMARY KEY AUTO_INCREMENT,
material_name VARCHAR(100)
)


INSERT INTO materials (material_name) VALUES
('木質 / Wood'),
('金屬 / Metal'),
('塑膠 / Plastic'),
('皮革 / Leather'),
('布料 / Fabric'),
('玻璃 / Glass'),
('大理石 / Marble'),
('藤 / Rattan'),
('亞克力 / Acrylic'),
('竹 / Bamboo');
SELECT * FROM product_img WHERE product_id = 1;
-- - **商品與材質關聯表（多對多）
CREATE TABLE materials_list (
product_id INT UNSIGNED,
materials_id INT,
PRIMARY KEY (product_id, materials_id),
FOREIGN KEY (product_id) REFERENCES products(id),
FOREIGN KEY (materials_id) REFERENCES materials(id));
    
INSERT INTO materials_list (product_id, materials_id) VALUES
    (1, 1),
    (1, 3),
    (1, 5),
    (2, 2),
    (2, 4),
    (2, 6),
    (3, 1),
    (3, 2),
    (3, 7),
    (4, 3),
    (4, 5),
    (4, 8),
    (5, 2),
    (5, 6),
    (5, 9),
    (6, 1),
    (6, 4),
    (6, 7),
    (7, 3),
    (7, 5),
    (7, 10),
    (8, 2),
    (8, 4),
    (8, 6),
    (9, 1),
    (9, 3),
    (9, 8),
    (10, 2),
    (10, 5),
    (10, 9),
    (11, 1),
    (11, 4),
    (11, 7),
    (12, 3),
    (12, 6),
    (12, 10),
    (13, 2),
    (13, 5),
    (13, 8),
    (14, 1),
    (14, 3),
    (14, 9),
    (15, 2),
    (15, 4),
    (15, 7),
    (16, 1),
    (16, 5),
    (16, 8),
    (17, 3),
    (17, 6),
    (18, 2),
    (18, 5),
    (18, 9),
    (19, 1),
    (19, 3),
    (19, 7),
    (20, 2),
    (20, 4),
    (20, 6),
    (21, 1),
    (21, 5),
    (21, 8),
    (22, 3),
    (22, 6),
    (22, 10),
    (23, 2),
    (23, 4),
    (23, 7),
    (24, 1),
    (24, 3),
    (24, 9),
    (25, 2),
    (25, 5),
    (25, 8),
    (26, 1),
    (26, 4),
    (26, 6),
    (27, 3),
    (27, 7),
    (27, 10),
    (28, 2),
    (28, 5),
    (28, 9),
    (29, 1),
    (29, 3),
    (29, 6),
    (30, 2),
    (30, 4),
    (30, 7),
    (31, 1),
    (31, 5),
    (31, 8),
    (32, 3),
    (32, 6),
    (32, 10),
    (33, 2),
    (33, 4),
    (33, 9),
    (34, 1),
    (34, 3),
    (34, 7);
    

-- - 尺寸
CREATE TABLE sizes (
id INT PRIMARY KEY AUTO_INCREMENT,
size_label VARCHAR(50)
);
- 

INSERT INTO sizes (size_label) VALUES
('單人 / 3.5x6 尺'),
('雙人 / 5x6.2 尺'),
('加大雙人 / 6x6.2 尺'),
('特大 / 6.2x6.6 尺'),
('2 人座沙發 / 1.8x0.9 m'),
('3 人座沙發 / 2.4x0.9 m'),
('L 型沙發 / 2.5x1.8 m'),
('單人桌 / 60x60x75 cm'),
('雙人桌 / 120x60x75 cm'),
('三人桌 / 180x60x75 cm');

-- - **-商品-尺寸（多對多）<<保留**
CREATE TABLE product_sizes (
product_id INT,
size_id INT,
PRIMARY KEY (product_id, size_id),
FOREIGN KEY (product_id) REFERENCES products(id),
FOREIGN KEY (size_id) REFERENCES sizes(id)
);

CREATE TABLE stocks(
id INT,
color_id INT,
size_id INT,
amount INT DEFAULT 0,
PRIMARY KEY (id, color_id, size_id),
FOREIGN KEY (id) REFERENCES products(id),
FOREIGN KEY (color_id) REFERENCES colors(id),
FOREIGN KEY (size_id) REFERENCES sizes(id)
);

INSERT INTO stocks (id, color_id, size_id, amount) VALUES
(1, 1, 1, 20),
(1, 2, 2, 15),
(1, 3, 3, 10),
(2, 1, 2, 25),
(2, 4, 1, 30),
(2, 5, 3, 12),
(3, 2, 1, 18),
(3, 3, 2, 22),
(3, 4, 3, 16),
(4, 1, 1, 28),
(4, 2, 2, 14),
(4, 3, 3, 19),
(5, 5, 1, 24),
(5, 6, 2, 20),
(5, 7, 3, 15),
(6, 1, 1, 12),
(6, 2, 2, 17),
(6, 3, 3, 13),
(7, 4, 1, 21),
(7, 5, 2, 18),
(7, 6, 3, 25),
(8, 1, 1, 30),
(8, 2, 2, 28),
(8, 3, 3, 22),
(9, 4, 1, 16),
(9, 5, 2, 14),
(9, 6, 3, 19),
(10, 1, 1, 20),
(10, 2, 2, 23),
(10, 3, 3, 21);

ALTER TABLE products 
ADD COLUMN colors INT NOT NULL DEFAULT 1,
ADD COLUMN designers_id INT NOT NULL DEFAULT 1,
ADD COLUMN materials_id INT NOT NULL DEFAULT 1;

UPDATE products 
SET colors = FLOOR(RAND() * 10) + 1;

UPDATE products 
SET designers_id = FLOOR(RAND() * 10) + 1;

UPDATE products 
SET materials_id = FLOOR(RAND() * 10) + 1;

INSERT INTO product_colors (product_id, color_id)
SELECT id, colors FROM products
ON DUPLICATE KEY UPDATE color_id = color_id;

INSERT INTO product_sizes (product_id, size_id)
SELECT 
    p.id as product_id,
    FLOOR(RAND() * 10) + 1 as size_id
FROM products p
ON DUPLICATE KEY UPDATE size_id = size_id;

INSERT IGNORE INTO product_colors (product_id, color_id)
SELECT 
    p.id as product_id,
    FLOOR(RAND() * 10) + 1 as color_id
FROM products p
WHERE RAND() > 0.7;

INSERT IGNORE INTO product_sizes (product_id, size_id)
SELECT 
    p.id as product_id,
    FLOOR(RAND() * 10) + 1 as size_id
FROM products p
WHERE RAND() > 0.8;

-- 驗證結果
SELECT 
    p.id,
    p.name,
    c.color_name,
    s.size_label
FROM products p
LEFT JOIN product_colors pc ON p.id = pc.product_id
LEFT JOIN colors c ON pc.color_id = c.id
LEFT JOIN product_sizes ps ON p.id = ps.product_id
LEFT JOIN sizes s ON ps.size_id = s.id
WHERE p.id <= 10
ORDER BY p.id;