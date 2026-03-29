USE oakly;

SET FOREIGN_KEY_CHECKS = 0;
SET FOREIGN_KEY_CHECKS = 1;

SELECT * FROM users;

SELECT DATABASE();


SELECT * FROM users WHERE email = 'li.meihao@example.com';


SELECT *
FROM products
WHERE products_id = 123
  AND is_valid = 0;
SHOW CREATE TABLE users;

SHOW CREATE TABLE favorites;


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
  level_id INT UNSIGNED DEFAULT 1,
  is_valid TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_users_level
    FOREIGN KEY (level_id) REFERENCES user_levels(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,
  CHECK (is_valid IN (0,1))
);

--- Add.sql

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

ALTER TABLE favorites
  ADD COLUMN color_id INT NULL,
  ADD COLUMN size_id INT NULL,
  ADD COLUMN color_name VARCHAR(100) NULL,
  ADD COLUMN quantity INT NOT NULL DEFAULT 1;

-- 建議加一個「同一會員、同商品、同規格」的唯一鍵，避免重複收藏
ALTER TABLE favorites
  ADD UNIQUE KEY uniq_user_product_variant (user_id, product_id, color_id, size_id);

ALTER TABLE products ADD COLUMN product_img VARCHAR(500) NULL;

-- 插入100筆會員假資料
INSERT INTO users (name, birthday, email, password, phone, postcode, city, area, address, avatar, level_id, is_valid) VALUES
('王小明', '1985-03-15', 'wang.xiaoming@example.com', '123456', '0912345678', '100', '台北市', '中正區', '重慶南路一段122號', NULL, 1, 1),
('李美華', '1990-07-22', 'li.meihua@example.com', 'abc123', '0923456789', '110', '台北市', '信義區', '信義路四段1號', NULL, 2, 1),
('張志強', '1988-12-03', 'zhang.zhiqiang@example.com', 'pass01', '0934567890', '220', '新北市', '板橋區', '民權路158號', NULL, 1, 1),
('陈雅玲', '1992-05-18', 'chen.yaling@example.com', '789456', '0945678901', '300', '新竹市', '東區', '光復路二段101號', NULL, 3, 1),
('林大偉', '1987-09-10', 'lin.dawei@example.com', 'qwe123', '0956789012', '400', '台中市', '中區', '台灣大道一段75號', NULL, 1, 1),
('黃淑芬', '1991-11-25', 'huang.shufen@example.com', 'test99', '0967890123', '500', '彰化縣', '彰化市', '中山路三段200號', NULL, 2, 1),
('吳建國', '1986-02-14', 'wu.jianguo@example.com', 'user01', '0978901234', '600', '嘉義市', '西區', '民族路88號', NULL, 1, 1),
('劉麗娟', '1989-08-07', 'liu.lijuan@example.com', 'pwd123', '0989012345', '700', '台南市', '中西區', '中正路155號', NULL, 2, 1),
('蔡志明', '1993-04-30', 'cai.zhiming@example.com', '321654', '0990123456', '800', '高雄市', '前金區', '中正四路99號', NULL, 3, 1),
('鄭美玲', '1984-10-12', 'zheng.meiling@example.com', 'mypass', '0911234567', '260', '宜蘭縣', '宜蘭市', '中山路二段66號', NULL, 1, 1),
('楊文傑', '1990-06-08', 'yang.wenjie@example.com', 'hello1', '0922345678', '330', '桃園市', '桃園區', '復興路111號', NULL, 2, 1),
('許雅婷', '1988-01-20', 'xu.yating@example.com', 'pass88', '0933456789', '540', '南投縣', '南投市', '中興路77號', NULL, 1, 1),
('周志偉', '1991-12-15', 'zhou.zhiwei@example.com', 'abc789', '0944567890', '880', '澎湖縣', '馬公市', '民族路33號', NULL, 3, 1),
('賴美惠', '1987-03-28', 'lai.meihui@example.com', '555666', '0955678901', '970', '花蓮縣', '花蓮市', '中華路188號', NULL, 1, 1),
('馬俊豪', '1992-09-02', 'ma.junhao@example.com', 'temp01', '0966789012', '950', '台東縣', '台東市', '中華路一段55號', NULL, 2, 1),
('謝淑雲', '1985-11-17', 'xie.shuyun@example.com', 'login1', '0977890123', '890', '金門縣', '金城鎮', '民族路22號', NULL, 1, 1),
('邱志華', '1989-05-04', 'qiu.zhihua@example.com', '999888', '0988901234', '900', '屏東縣', '屏東市', '中山路144號', NULL, 2, 1),
('孫美麗', '1993-08-11', 'sun.meili@example.com', 'sun123', '0999012345', '350', '苗栗縣', '苗栗市', '中正路66號', NULL, 3, 1),
('何建志', '1986-12-23', 'he.jianzhi@example.com', 'he9999', '0910123456', '420', '台中市', '豐原區', '中正路333號', NULL, 1, 1),
('盧雅雯', '1990-02-19', 'lu.yawen@example.com', 'lu2023', '0921234567', '710', '台南市', '永康區', '中華路二段199號', NULL, 2, 1),
('羅文雄', '1988-07-26', 'luo.wenxiong@example.com', 'luo456', '0932345678', '810', '高雄市', '鼓山區', '美術東二路88號', NULL, 1, 1),
('韓美珍', '1991-04-13', 'han.meizhen@example.com', 'han789', '0943456789', '200', '基隆市', '仁愛區', '仁一路55號', NULL, 3, 1),
('朱志成', '1987-10-05', 'zhu.zhicheng@example.com', 'zhu001', '0954567890', '320', '桃園市', '中壢區', '中北路二段111號', NULL, 1, 1),
('洪雅芳', '1992-06-21', 'hong.yafang@example.com', 'hong22', '0965678901', '640', '雲林縣', '斗六市', '雲林路77號', NULL, 2, 1),
('葉志宏', '1989-01-16', 'ye.zhihong@example.com', 'ye1989', '0976789012', '630', '雲林縣', '虎尾鎮', '林森路44號', NULL, 1, 1),
('蘇美華', '1985-11-09', 'su.meihua@example.com', 'su8520', '0987890123', '302', '新竹縣', '竹北市', '光明六路222號', NULL, 2, 1),
('石建明', '1993-03-24', 'shi.jianming@example.com', 'shi333', '0998901234', '411', '台中市', '太平區', '中山路一段166號', NULL, 3, 1),
('顏雅慧', '1986-08-12', 'yan.yahui@example.com', 'yan888', '0909123456', '436', '台中市', '清水區', '中華路99號', NULL, 1, 1),
('江文豪', '1990-12-28', 'jiang.wenhao@example.com', 'jiang1', '0919234567', '502', '彰化縣', '員林市', '中山路二段188號', NULL, 2, 1),
('范美玲', '1988-04-07', 'fan.meiling@example.com', 'fan456', '0929345678', '613', '嘉義縣', '朴子市', '開元路55號', NULL, 1, 1),
('童志強', '1991-09-14', 'tong.zhiqiang@example.com', 'tong99', '0939456789', '730', '台南市', '新營區', '民治路77號', NULL, 3, 1),
('曾雅惠', '1987-01-03', 'zeng.yahui@example.com', 'zeng11', '0949567890', '820', '高雄市', '岡山區', '岡山路333號', NULL, 1, 1),
('游建國', '1992-05-29', 'you.jianguo@example.com', 'you789', '0959678901', '912', '屏東縣', '內埔鄉', '內埔路44號', NULL, 2, 1),
('溫美華', '1989-11-16', 'wen.meihua@example.com', 'wen222', '0969789012', '268', '宜蘭縣', '五結鄉', '五結路111號', NULL, 1, 1),
('簡志明', '1985-07-25', 'jian.zhiming@example.com', 'jian88', '0979890123', '366', '苗栗縣', '銅鑼鄉', '銅鑼路66號', NULL, 2, 1),
('藍雅玲', '1993-02-11', 'lan.yaling@example.com', 'lan123', '0989901234', '551', '南投縣', '名間鄉', '彰南路188號', NULL, 3, 1),
('方文傑', '1986-10-18', 'fang.wenjie@example.com', 'fang01', '0990012345', '648', '雲林縣', '西螺鎮', '延平路99號', NULL, 1, 1),
('施美惠', '1990-03-05', 'shi.meihui@example.com', 'shi555', '0901123456', '621', '嘉義縣', '民雄鄉', '大學路一段77號', NULL, 2, 1),
('魏志偉', '1988-08-22', 'wei.zhiwei@example.com', 'wei999', '0912234567', '741', '台南市', '善化區', '中山路333號', NULL, 1, 1),
('高雅芬', '1991-06-09', 'gao.yafen@example.com', 'gao666', '0923345678', '831', '高雄市', '大寮區', '鳳林三路44號', NULL, 3, 1),
('田建志', '1987-12-26', 'tian.jianzhi@example.com', 'tian77', '0934456789', '920', '屏東縣', '潮州鎮', '中山路二段155號', NULL, 1, 1),
('余美玲', '1992-04-14', 'yu.meiling@example.com', 'yu2024', '0945567890', '970', '花蓮縣', '花蓮市', '中美路88號', NULL, 2, 1),
('沈志華', '1989-09-01', 'shen.zhihua@example.com', 'shen11', '0956678901', '954', '台東縣', '關山鎮', '中華路99號', NULL, 1, 1),
('白雅雯', '1985-01-28', 'bai.yawen@example.com', 'bai888', '0967789012', '209', '連江縣', '南竿鄉', '介壽路33號', NULL, 2, 1),
('柯文雄', '1993-05-15', 'ke.wenxiong@example.com', 'ke1993', '0978890123', '891', '金門縣', '金湖鎮', '環島東路77號', NULL, 3, 1),
('姚美珍', '1986-11-02', 'yao.meizhen@example.com', 'yao456', '0989001234', '103', '台北市', '大同區', '重慶北路二段222號', NULL, 1, 1),
('袁志宏', '1990-07-19', 'yuan.zhihong@example.com', 'yuan01', '0990112345', '112', '台北市', '北投區', '中央北路一段111號', NULL, 2, 1),
('金雅慧', '1988-03-06', 'jin.yahui@example.com', 'jin789', '0901223456', '116', '台北市', '文山區', '羅斯福路六段333號', NULL, 1, 1),
('秦文豪', '1991-08-23', 'qin.wenhao@example.com', 'qin999', '0912334567', '231', '新北市', '新店區', '北新路三段99號', NULL, 3, 1),
('尹美玲', '1987-12-10', 'yin.meiling@example.com', 'yin123', '0923445678', '242', '新北市', '新莊區', '中正路555號', NULL, 1, 1),
('卓志強', '1992-02-27', 'zhuo.zhiqiang@example.com', 'zhuo88', '0934556789', '251', '新北市', '淡水區', '中正路東段188號', NULL, 2, 1),
('鍾雅惠', '1989-06-14', 'zhong.yahui@example.com', 'zhong1', '0945667890', '310', '新竹市', '香山區', '中華路四段77號', NULL, 1, 1),
('龍建國', '1985-10-31', 'long.jianguo@example.com', 'long77', '0956778901', '324', '桃園市', '平鎮區', '中豐路山頂段444號', NULL, 2, 1),
('葛美華', '1993-01-18', 'ge.meihua@example.com', 'ge2023', '0967889012', '338', '桃園市', '蘆竹區', '南崁路一段222號', NULL, 3, 1),
('雷志明', '1986-04-05', 'lei.zhiming@example.com', 'lei456', '0978990123', '360', '苗栗縣', '苗栗市', '為公路999號', NULL, 1, 1),
('史雅玲', '1990-09-22', 'shi2.yaling@example.com', 'shi2_1', '0989001234', '369', '苗栗縣', '卓蘭鎮', '中山路155號', NULL, 2, 1),
('柳文傑', '1988-01-09', 'liu2.wenjie@example.com', 'liu2_9', '0990112345', '401', '台中市', '東區', '復興路四段88號', NULL, 1, 1),
('花美惠', '1991-05-26', 'hua.meihui@example.com', 'hua526', '0901223456', '407', '台中市', '西屯區', '台灣大道四段333號', NULL, 3, 1),
('莊志偉', '1987-11-13', 'zhuang.zhiwei@example.com', 'zhuang', '0912334567', '413', '台中市', '霧峰區', '中正路777號', NULL, 1, 1),
('嚴雅芬', '1992-03-30', 'yan2.yafen@example.com', 'yan2_3', '0923445678', '432', '台中市', '大肚區', '沙田路二段111號', NULL, 2, 1),
('紀建志', '1989-07-17', 'ji.jianzhi@example.com', 'ji7777', '0934556789', '515', '彰化縣', '大村鄉', '中正西路99號', NULL, 1, 1),
('柴美玲', '1985-12-04', 'chai.meiling@example.com', 'chai12', '0945667890', '520', '彰化縣', '田中鎮', '中州路二段444號', NULL, 2, 1),
('費志華', '1993-04-21', 'fei.zhihua@example.com', 'fei421', '0956778901', '555', '南投縣', '魚池鄉', '魚池街188號', NULL, 3, 1),
('倪雅雯', '1986-08-08', 'ni.yawen@example.com', 'ni8888', '0967889012', '557', '南投縣', '竹山鎮', '集山路三段222號', NULL, 1, 1),
('湯文雄', '1990-12-25', 'tang.wenxiong@example.com', 'tang25', '0978990123', '604', '嘉義縣', '竹崎鄉', '和平路77號', NULL, 2, 1),
('滕美珍', '1988-02-12', 'teng.meizhen@example.com', 'teng22', '0989001234', '611', '嘉義縣', '鹿草鄉', '中正路555號', NULL, 1, 1),
('竇志宏', '1991-06-29', 'dou.zhihong@example.com', 'dou629', '0990112345', '704', '台南市', '北區', '公園路333號', NULL, 3, 1),
('閔雅慧', '1987-10-16', 'min.yahui@example.com', 'min101', '0901223456', '717', '台南市', '仁德區', '中正路一段188號', NULL, 1, 1),
('單文豪', '1992-01-03', 'dan.wenhao@example.com', 'dan103', '0912334567', '725', '台南市', '將軍區', '忠興里99號', NULL, 2, 1),
('季美玲', '1989-05-20', 'ji2.meiling@example.com', 'ji2520', '0923445678', '744', '台南市', '新市區', '中興街77號', NULL, 1, 1),
('辛志強', '1985-09-07', 'xin.zhiqiang@example.com', 'xin907', '0934556789', '802', '高雄市', '苓雅區', '四維三路444號', NULL, 2, 1),
('牛雅惠', '1993-02-24', 'niu.yahui@example.com', 'niu224', '0945667890', '806', '高雄市', '前鎮區', '中山三路222號', NULL, 3, 1),
('喬建國', '1986-06-11', 'qiao.jianguo@example.com', 'qiao61', '0956778901', '813', '高雄市', '左營區', '博愛二路555號', NULL, 1, 1),
('賀美華', '1990-10-28', 'he2.meihua@example.com', 'he2102', '0967889012', '825', '高雄市', '橋頭區', '橋南路188號', NULL, 2, 1),
('雲志明', '1988-03-15', 'yun.zhiming@example.com', 'yun315', '0978990123', '840', '高雄市', '大樹區', '中正一路99號', NULL, 1, 1),
('項雅玲', '1991-07-02', 'xiang.yaling@example.com', 'xiang7', '0989001234', '851', '高雄市', '茄萣區', '濱海路四段333號', NULL, 3, 1),
('景文傑', '1987-11-19', 'jing.wenjie@example.com', 'jing19', '0990112345', '901', '屏東縣', '三地門鄉', '中正路二段77號', NULL, 1, 1),
('充美惠', '1992-04-06', 'chong.meihui@example.com', 'chong4', '0901223456', '906', '屏東縣', '高樹鄉', '興中路444號', NULL, 2, 1),
('權志偉', '1989-08-23', 'quan.zhiwei@example.com', 'quan23', '0912334567', '911', '屏東縣', '竹田鄉', '中山路188號', NULL, 1, 1),
('樂雅芬', '1985-12-10', 'le.yafen@example.com', 'le1210', '0923445678', '927', '屏東縣', '林邊鄉', '中山路222號', NULL, 2, 1),
('厚建志', '1993-05-27', 'hou.jianzhi@example.com', 'hou527', '0934556789', '971', '花蓮縣', '新城鄉', '新興路99號', NULL, 3, 1),
('友美玲', '1986-09-14', 'you2.meiling@example.com', 'you914', '0945667890', '972', '花蓮縣', '秀林鄉', '和平路555號', NULL, 1, 1),
('滑志華', '1990-01-31', 'hua2.zhihua@example.com', 'hua131', '0956778901', '973', '花蓮縣', '卓溪鄉', '中正路333號', NULL, 2, 1),
('務雅雯', '1988-06-18', 'wu2.yawen@example.com', 'wu618', '0967889012', '974', '花蓮縣', '豐濱鄉', '豐濱路188號', NULL, 1, 1),
('廣文雄', '1991-10-05', 'guang.wenxiong@example.com', 'guang5', '0978990123', '951', '台東縣', '綠島鄉', '中寮村77號', NULL, 3, 1),
('康美珍', '1987-02-22', 'kang.meizhen@example.com', 'kang22', '0989001234', '952', '台東縣', '蘭嶼鄉', '椰油村444號', NULL, 1, 1),
('庸志宏', '1992-07-09', 'yong.zhihong@example.com', 'yong79', '0990112345', '953', '台東縣', '延平鄉', '桃源村222號', NULL, 2, 1),
('應雅慧', '1989-11-26', 'ying.yahui@example.com', 'ying26', '0901223456', '955', '台東縣', '鹿野鄉', '鹿野路555號', NULL, 1, 1),
('懷文豪', '1985-04-13', 'huai.wenhao@example.com', 'huai13', '0912334567', '956', '台東縣', '池上鄉', '中西三路99號', NULL, 2, 1),
('戈美玲', '1993-08-30', 'ge2.meiling@example.com', 'ge830', '0923445678', '957', '台東縣', '東河鄉', '東河路333號', NULL, 3, 1),
('成志強', '1986-12-17', 'cheng.zhiqiang@example.com', 'cheng7', '0934556789', '958', '台東縣', '成功鎮', '中山東路188號', NULL, 1, 1),
('戰雅惠', '1990-03-04', 'zhan.yahui@example.com', 'zhan34', '0945667890', '959', '台東縣', '長濱鄉', '長濱路777號', NULL, 2, 1),
('胥建國', '1988-07-21', 'xu2.jianguo@example.com', 'xu721', '0956778901', '892', '金門縣', '烈嶼鄉', '后頭村44號', NULL, 1, 1),
('能美華', '1991-11-08', 'neng.meihua@example.com', 'neng18', '0967889012', '893', '金門縣', '烏坵鄉', '坵南村111號', NULL, 3, 1),
('通志明', '1987-01-25', 'tong2.zhiming@example.com', 'tong25', '0978990123', '210', '連江縣', '北竿鄉', '塘岐村222號', NULL, 1, 1),
('逢雅玲', '1992-06-12', 'feng.yaling@example.com', 'feng12', '0989001234', '211', '連江縣', '莒光鄉', '田澳村555號', NULL, 2, 1),
('連文傑', '1989-10-29', 'lian.wenjie@example.com', 'lian29', '0990112345', '212', '連江縣', '東引鄉', '中柳村99號', NULL, 1, 1),
('郎美惠', '1985-02-16', 'lang.meihui@example.com', 'lang16', '0901223456', '115', '台北市', '南港區', '研究院路二段333號', NULL, 2, 1),
('邸志偉', '1993-06-03', 'di.zhiwei@example.com', 'di603', '0912334567', '117', '台北市', '內湖區', '成功路四段188號', NULL, 3, 1),
('安雅芬', '1986-09-20', 'an.yafen@example.com', 'an920', '0923445678', '248', '新北市', '五股區', '成泰路一段777號', NULL, 1, 1),
('常建志', '1990-01-07', 'chang.jianzhi@example.com', 'chang7', '0934556789', '253', '新北市', '石門區', '尖鹿路44號', NULL, 2, 1),
('樂美玲', '1988-05-24', 'le2.meiling@example.com', 'le524', '0945667890', '207', '基隆市', '中山區', '中山一路222號', NULL, 1, 1);



