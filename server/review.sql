-- 建立評論資料表
CREATE TABLE reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    user_name VARCHAR(100),
    avatar VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

SET FOREIGN_KEY_CHECKS = 0;
SET FOREIGN_KEY_CHECKS = 1;

ALTER TABLE reviews ADD COLUMN reviews_img TEXT;

ALTER TABLE reviews ADD COLUMN email VARCHAR(255) AFTER user_name;
UPDATE reviews SET email = CASE 
    WHEN id = 1 THEN 'zhang.xiaoming@gmail.com'
    WHEN id = 2 THEN 'li.meihua@yahoo.com'
    WHEN id = 3 THEN 'wang.dawei@hotmail.com'
    WHEN id = 4 THEN 'chen.xiaofang@163.com'
    WHEN id = 5 THEN 'lin.zhiqiang@outlook.com'
    WHEN id = 6 THEN 'huang.shuling@gmail.com'
    WHEN id = 7 THEN 'wu.jianguo@qq.com'
    WHEN id = 8 THEN 'liu.yating@sina.com'
    WHEN id = 9 THEN 'guo.minghui@foxmail.com'
    WHEN id = 10 THEN 'zhou.peijun@126.com'
    ELSE email
END 
WHERE id BETWEEN 1 AND 10;
-- 插入假資料
INSERT INTO reviews (user_id, product_id, rating, comment, user_name, avatar, created_at) VALUES 
(1, 1, 5, '這張桌子真的很棒！尺寸剛好，清潔起來也很方便。設計簡潔美觀，放在客廳很適合。組裝也很簡單，一個人就能完成。', '安妮', 'https://i.pravatar.cc/150?u=annie', '2024-01-15 10:30:00'),
(2, 1, 4, '品質很好，穩定性佳。雖然組裝有點複雜，但說明書很清楚。顏色和質感都很棒，值得推薦！', '張大名', 'https://i.pravatar.cc/150?u=zhang', '2024-01-10 14:20:00'),
(3, 1, 5, '很喜歡這個設計，簡約但不失質感。組裝過程順利，客服也很貼心。整體來說很滿意！', '琪琪', 'https://i.pravatar.cc/150?u=kiki', '2023-12-28 16:45:00'),
(4, 1, 3, '桌子本身還不錯，但包裝有些小瑕疵。使用起來沒問題，就是收到時有點失望。', '小明', 'https://i.pravatar.cc/150?u=ming', '2023-12-20 09:15:00'),
(5, 1, 5, '超級滿意！質感比預期的還要好，而且運送很快。已經推薦給朋友了。', '莉莉', 'https://i.pravatar.cc/150?u=lily', '2023-12-18 20:30:00'),
(6, 1, 4, '整體來說很不錯，CP值很高。唯一的小缺點是顏色和網站照片有一點點差異，但不影響使用。', '阿強', 'https://i.pravatar.cc/150?u=strong', '2023-12-10 11:20:00'),
(7, 1, 5, '朋友推薦的，果然沒讓我失望！桌面很穩固，高度也剛好。會再次購買其他產品。', '美美', 'https://i.pravatar.cc/150?u=mei', '2023-12-05 13:40:00'),
(8, 1, 2, '收到的商品有些刮痕，雖然客服有處理，但還是有點影響心情。品質有待加強。', '大雄', 'https://i.pravatar.cc/150?u=daxiong', '2023-11-30 15:10:00'),
(9, 1, 4, '材質摸起來很舒服，顏色也很正。組裝說明書寫得很清楚，約莫30分鐘就完成了。', '小華', 'https://i.pravatar.cc/150?u=hua', '2023-11-25 12:15:00'),
(10, 1, 5, '這是我買過最滿意的家具！質感超棒，而且客服回覆很快。強烈推薦！', '玲玲', 'https://i.pravatar.cc/150?u=ling', '2023-11-20 16:30:00');