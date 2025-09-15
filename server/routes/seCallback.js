import express from "express";
import multer from "multer";

// Express.js 版本 - 711 門市回調 API
const router = express.Router();

// 設定 multer 來處理表單資料
const upload = multer();

// POST /api/ship/711/callback
router.post("/callback", upload.none(), (req, res) => {
  try {
    const body = req.body;
    console.log("Received 711 store data:", body);

    // 驗證必要欄位
    if (!body) {
      return res.status(400).json({
        success: false,
        message: "沒有接收到資料",
      });
    }

    // 建立查詢字串
    const queryParams = new URLSearchParams(body).toString();

    // 組成重新導向 URL
    const redirectUrl = `${process.env.FRONTEND_URL}/ship/callback?${queryParams}`;

    // 重新導向到前端回調頁面
    res.redirect(302, redirectUrl);
  } catch (error) {
    console.error("711 callback error:", error);
    res.status(500).json({
      success: false,
      message: "伺服器錯誤",
      error: error.message,
    });
  }
});

// GET 測試用端點
router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "711 API 運作正常",
    timestamp: new Date().toISOString(),
  });
});

export default router;
