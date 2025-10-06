import express from "express";
import pool from "../connect.js";
import jwt from "jsonwebtoken";


const router = express.Router();
const secretKey = process.env.JWT_SECRET_KEY;


// 後端檢查token
function checkToken(req, res, next) {
  let token = req.get("Authorization");
  if (token && token.includes("Bearer ")) {
    token = token.slice(7);
    jwt.verify(token, secretKey, (error, decoded) => {
      if (error) {
        return res.status(401).json({
          status: "error",
          message: "登入驗證失效，請重新登入",
        });
      }
      req.decoded = decoded;
      next();
    });
  } else {
    res.status(401).json({
      status: "error",
      message: "無登入驗證資訊，請重新登入",
    });
  }
}

// GET /api/user - 取得領取 有效(沒過期未使用) 以及 已使用 兩個狀態
router.get("/", checkToken, async (req, res) => {
  try {
    const userId = req.decoded.id; // 從 token 取得
    const sql = `SELECT 
      uc.*,
      uc.get_at,      
      uc.expire_at,      
      c.name,
      c.discount,
      c.discount_type,
      c.min_discount,
      c.start_at,
      c.end_at,
      GROUP_CONCAT(pc.category_name) as category_names
    FROM user_coupons uc
    JOIN coupons c ON uc.coupon_id = c.id
    LEFT JOIN coupon_categories cc ON c.id = cc.coupon_id
    LEFT JOIN products_category pc ON cc.category_id = pc.category_id
    WHERE uc.user_id = ? AND uc.status IN (0, 1)
    GROUP BY uc.id
    ORDER BY uc.status ASC`;

    const [coupons] = await pool.execute(sql, [userId]);
    res.status(200).json({
      status: "success",
      data: coupons,
      message: "取得使用者的優惠券資料",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: "error",
      message: error.message ?? "獲取失敗，請洽管理人員",
    });
  }
});


// POST /api/user:couponId - 領取優惠券
router.post("/:couponId", checkToken, async (req, res) => {
  try {
    const userId = req.decoded.id; // 從 token 取得真正的 userId
    const { couponId } = req.params;

    // 1. 檢查優惠券是否存在且有效
    const [couponCheck] = await pool.execute(
      "SELECT * FROM coupons WHERE id = ? AND is_valid = 1",
      [couponId]
    );

    if (couponCheck.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "優惠券不存在或已失效",
      });
    }

    const coupon = couponCheck[0];

    // 2. 檢查用戶是否已經領取過這張券
    const [existingCoupon] = await pool.execute(
      "SELECT * FROM user_coupons WHERE user_id = ? AND coupon_id = ?",
      [userId, couponId]
    );

    if (existingCoupon.length > 0) {
      return res.status(400).json({
        status: "error",
        message: "您已經領取過這張優惠券",
      });
    }

    // 3. 計算過期時間
    let expireAt;
    if (coupon.valid_days) {
      // 使用台灣時區
      const now = new Date();
      const taipeiTime = new Date(now.getTime() + 8 * 60 * 60 * 1000); // UTC+8

      const expireDate = new Date(taipeiTime);
      expireDate.setDate(expireDate.getDate() + coupon.valid_days);
      expireDate.setHours(23, 59, 59, 999);

      expireAt = expireDate.toISOString().slice(0, 19).replace("T", " ");
    } else if (coupon.end_at) {
      expireAt = coupon.end_at;
    }

    // 4. 新增領取記錄 (get_at 也要用台灣時間)
    const taipeiNow = new Date(new Date().getTime() + 8 * 60 * 60 * 1000);
    const now = taipeiNow.toISOString().slice(0, 19).replace("T", " ");

    // 實際插入資料庫
    await pool.execute(
      "INSERT INTO user_coupons (user_id, coupon_id, get_at, expire_at, status) VALUES (?, ?, ?, ?, 0)",
      [userId, couponId, now, expireAt]
    );

    res.status(201).json({
      status: "success",
      message: "優惠券領取成功",
      data: {
        userId: parseInt(userId),
        couponId: parseInt(couponId),
        expireAt: expireAt,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: "error",
      message: error.message ?? "領取失敗，請洽管理人員",
    });
  }
});

// GET /api/user/coupons/status/canUse/[id] - 有效的優惠券
router.get("/status/canUse/:userId", async (req, res) => {
  console.log("=== API 被呼叫 ==="); // 添加這行來確認
  try {
    const { userId } = req.params; // 取得路由參數
    const sql = `SELECT
    uc.*,
      uc.get_at,      
      uc.expire_at,      
      c.name,
      c.discount,
      c.discount_type,
      c.min_discount,
      c.start_at,
      c.end_at,
      GROUP_CONCAT(pc.category_name) as category_names
    FROM user_coupons uc
    JOIN coupons c ON uc.coupon_id = c.id
    LEFT JOIN coupon_categories cc ON c.id = cc.coupon_id
    LEFT JOIN products_category pc ON cc.category_id = pc.category_id
    WHERE uc.user_id = ? AND uc.status = 0
    GROUP BY uc.id
    ORDER BY uc.status ASC`;

    const [coupons] = await pool.execute(sql, [userId]);
    res.status(200).json({
      status: "success",
      data: coupons,
      message: "取得使用者的優惠券資料",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: "error",
      message: error.message ?? "獲取失敗，請洽管理人員",
    });
  }
});

// UPDATE /api/user/:userId/status/used
router.put("/:userId/status/used", async (req, res) => {
  try {
    const { userId } = req.params; // 取得路由參數
    const sql = `UPDATE user_coupons SET status = 1 WHERE user_id = ? AND coupon_id = ?`;
    const [coupons] = await pool.execute(sql, [userId]);
    res.status(200).json({
      status: "success",
      data: coupons,
      message: "取得使用者的優惠券資料",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: "error",
      message: error.message ?? "獲取失敗，請洽管理人員",
    });
  }
})

router.get("/test", (req, res) => {
  res.json({ message: "User coupons router is working!" });
});

export default router;
