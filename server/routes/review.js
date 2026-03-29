import express from 'express';
import db from '../connect.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';


const secretKey = process.env.JWT_SECRET_KEY || "myTestSecretKey123";


const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      status: 'error',
      message: '需要登入'
    });
  }

  jwt.verify(token, secretKey, (err, user) => {
    if (err) {
      return res.status(403).json({
        status: 'error',
        message: '無效的token'
      });
    }
    req.user = user;
    next();
  });
};

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 確保上傳目錄存在
const uploadDir = path.join(__dirname, '../public/uploads/reviews');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
// 設定 multer 存儲
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // 生成唯一檔名: 時間戳-隨機數-原檔名
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'review-' + uniqueSuffix + ext);
  }
});

// 檔案過濾器
const fileFilter = (req, file, cb) => {
  // 只允許圖片類型
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('只允許上傳圖片檔案'), false);
  }
};

// multer 設定
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB 限制
    files: 5 // 最多 5 張圖片
  }
});

// 圖片上傳 API
router.post('/upload/review-images', upload.array('images', 5), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: '沒有上傳任何檔案'
      });
    }

    // 回傳圖片 URLs
    const imageUrls = req.files.map(file => {
      return '/uploads/reviews/' + file.filename;
    });

    res.json({
      status: 'success',
      message: '圖片上傳成功',
      imageUrls: imageUrls
    });

  } catch (error) {
    console.error('圖片上傳錯誤:', error);
    res.status(500).json({
      status: 'error',
      message: '圖片上傳失敗'
    });
  }
});


router.get('/products/:productId/reviews', async (req, res) => {
  const { productId } = req.params;
  const { sortBy = 'newest', limit = 50, offset = 0 } = req.query;

  try {
    // 排序選項對應的 SQL
    const sortOptions = {
      'newest': 'created_at DESC',           // 最新優先
      'oldest': 'created_at ASC',            // 最舊優先
      'highest_rating': 'rating DESC',       // 評分高到低
      'lowest_rating': 'rating ASC'          // 評分低到高
    };

    // 驗證排序參數
    const orderBy = sortOptions[sortBy] || sortOptions['newest'];

    // 基本查詢 SQL
    let sql = `
      SELECT id, user_id,  user_name, email, rating, comment, avatar, reviews_img, created_at,
             DATE_FORMAT(created_at, '%Y-%m-%d %H:%i') as formatted_date
      FROM reviews 
      WHERE product_id = ? 
      ORDER BY ${orderBy}
    `;

    // 如果有分頁參數，加上 LIMIT 和 OFFSET
    if (limit && offset !== undefined) {
      sql += ` LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;
    }

    const [reviews] = await db.execute(sql, [productId]);

    // 另外查詢總數量 (用於分頁)
    const [countResult] = await db.execute(
      'SELECT COUNT(*) as total FROM reviews WHERE product_id = ?',
      [productId]
    );

    // 計算評分統計
    const [statsResult] = await db.execute(`
      SELECT 
        AVG(rating) as average_rating,
        COUNT(*) as total_reviews,
        SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as five_stars,
        SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as four_stars,
        SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as three_stars,
        SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as two_stars,
        SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as one_star
      FROM reviews 
      WHERE product_id = ?
    `, [productId]);

    res.json({
      status: 'success',
      data: {
        reviews: reviews,
        pagination: {
          total: countResult[0].total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: (parseInt(offset) + parseInt(limit)) < countResult[0].total
        },
        statistics: {
          averageRating: parseFloat(statsResult[0].average_rating).toFixed(1),
          totalReviews: statsResult[0].total_reviews,
          ratingDistribution: {
            5: statsResult[0].five_stars,
            4: statsResult[0].four_stars,
            3: statsResult[0].three_stars,
            2: statsResult[0].two_stars,
            1: statsResult[0].one_star
          }
        },
        sortBy: sortBy
      }
    });
  } catch (err) {
    console.error('獲取評論失敗:', err);
    res.status(500).json({ status: 'error', message: '獲取評論失敗' });
  }
});

// 獲取所有排序選項 (前端可以用來產生下拉選單)
router.get('/reviews/sort-options', (req, res) => {
  res.json({
    status: 'success',
    data: {
      sortOptions: [
        { value: 'newest', label: '最新評論',},
        { value: 'oldest', label: '最早評論', },
        { value: 'highest_rating', label: '評分：高到低'},
        { value: 'lowest_rating', label: '評分：低到高' }
      ]
    }
  });
});

router.post('/reviews', async (req, res) => {

  if (!req.body) {
    return res.status(400).json({
      status: 'error',
      message: 'req.body is undefined'
    });
  }

  try {
    const { user_id, user_name, email, rating, comment, product_id, avatar, reviews_img } = req.body;

    if (!user_id || !user_name || !email || !rating || !comment || !product_id) {
      return res.status(400).json({
        status: 'error',
        message: '缺少必要欄位'
      });
    }

    const sql = `
      INSERT INTO reviews (user_id, user_name, email, rating, comment, product_id, avatar, reviews_img)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;



    const [result] = await db.query(sql, [
      user_id,
      user_name,
      email,
      rating,
      comment,
      product_id,
      avatar,
      reviews_img || null // 如果沒有圖片就存 null

    ]);

    res.json({
      status: 'success',
      message: '評論新增成功',
      insertId: result.insertId,
      data: { user_id, user_name, email, rating, comment, product_id, avatar, reviews_img }
    });
  } catch (err) {
    console.error('新增評論失敗:', err);
    res.status(500).json({
      status: 'error',
      message: '伺服器錯誤，新增評論失敗',
      error: err.message
    });
  }
});

// 處理 multer 錯誤的中間件
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        status: 'error',
        message: '檔案大小超過限制 (5MB)'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        status: 'error',
        message: '檔案數量超過限制 (最多5張)'
      });
    }
  }

  res.status(400).json({
    status: 'error',
    message: error.message || '上傳錯誤'
  });
});

router.put('/reviews/:reviewId', authenticateToken, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment, reviews_img } = req.body;
    const userId = req.user.id; 
  
    const [existingReview] = await db.execute(
      'SELECT user_id FROM reviews WHERE id = ?',
      [reviewId]
    );

    if (existingReview.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: '評論不存在'
      });
    }

    if (existingReview[0].user_id !== userId) {
      return res.status(403).json({
        status: 'error',
        message: '無權編輯此評論'
      });
    }

    // 更新
    await db.execute(
      'UPDATE reviews SET rating = ?, comment = ?, reviews_img = ? WHERE id = ?',
      [rating, comment, reviews_img, reviewId]
    );

    res.json({
      status: 'success',
      message: '評論修改成功'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: '修改評論失敗，請洽客服'
    });
  }
});

// 删除评论
router.delete('/reviews/:reviewId', authenticateToken, async (req, res) => {
  console.log('DELETE路由被調用');
  console.log('reviewId:', req.params.reviewId);
  console.log('req.user:', req.user);

  try {
    const { reviewId } = req.params;
    const userId = req.user.id;

    // 验证评论所有权
    const [existingReview] = await db.execute(
      'SELECT user_id FROM reviews WHERE id = ?',
      [reviewId]
    );

    if (existingReview.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: '評論不存在'
      });
    }

    if (existingReview[0].user_id !== userId) {
      return res.status(403).json({
        status: 'error',
        message: '無權删除此評論'
      });
    }

    // 删除
    await db.execute('DELETE FROM reviews WHERE id = ?', [reviewId]);

    res.json({
      status: 'success',
      message: '評論删除成功'
    });
  } catch (error) {
    console.error('DELETE路由错误详情:', error);
    res.status(500).json({
      status: 'error',
      message: '删除評論失敗',
      error: error.message
    });
  }
});

export default router;