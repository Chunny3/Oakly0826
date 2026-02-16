CREATE TABLE article_tracking (
    id INT AUTO_INCREMENT PRIMARY KEY,
    article_id INT NOT NULL,
    user_id INT NULL,
    event_type ENUM('view', 'like', 'share') NOT NULL,
    event_data JSON,
    ip_address VARCHAR(50),
    create_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (article_id) REFERENCES article (id),
    FOREIGN KEY (user_id) REFERENCES user (id)
)

-- 每篇文章瀏覽次數
SELECT article_id, COUNT(*) AS share_count
FROM article_tracking
WHERE
    event_type = 'view'
GROUP BY
    article_id;
-- event_type 定義的事件類型，這樣資料庫只允許 event_type 裡的值

-- 每篇文章收藏數
SELECT article_id, COUNT(*) AS likes
FROM article_tracking
WHERE
    event_type = 'like'
GROUP BY
    article_id;

-- 每篇文章分享數量
SELECT article_id, COUNT(*) AS share_count
FROM article_tracking
WHERE
    event_type = 'share'
GROUP BY
    article_id;

-- insert進文章瀏覽數
INSERT INTO
    article_tracking (
        article_id,
        user_id,
        event_type,
        event_data,
        ip_address
    )
VALUES (?,?,'view',?,?);

-- insert進文章收藏數
INSERT INTO
    article_tracking (
        article_id,
        user_id,
        event_type,
        event_data,
        ip_address
    )
VALUES (?,?,'like',?,?);

-- insert進文章分享數
INSERT INTO
    article_tracking (
        article_id,
        user_id,
        event_type,
        event_data,
        ip_address
    )
VALUES (?,?,'share',?,?);

-- 訂單表
CREATE TABLE orders{
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_number VARCHAR(20) NOT NULL UNIQUE,
    user_id INT NOT NULL,
    total_amount INT NOT NULL,
    create_at DATETIME DEFAULT CURRENT_TIMESTAMP
}
-- UNIQUE 代表這個欄位的值，每一筆都不能重複

-- 訂單商品表
CREATE TABLE order_items{
    id INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    price INT NOT NULL,
    size VARCHAR(10),
    color VARCHAR(30),
    FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE
}
-- ON DELETE CASCADE 刪除父表的資料 -> 自動刪除所有子表對應資料

-- insert 進訂單表
INSERT INTO orders(order_number, user_id, total_amount, create_at)
VALUES(?,?,?,?);

-- insert 進order_items
INSERT INTO order_items(order_id, product_id, quantity,price, size, color)
VALUES(?,?,?,?,?,?);