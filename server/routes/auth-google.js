import express from "express";
import jwt from "jsonwebtoken";
import { getFirebaseAuth } from "../utils/firebaseAdmin.js";
import pool from "../connect.js";
const router = express.Router();

/**
 * 前端傳 { idToken }（Firebase ID Token）
 * 後端：驗證 → 找/建使用者 → 發你自己的 JWT
 */
router.post("/google", async (req, res) => {
  try {
    const { idToken } = req.body;

    // 🔎 1) 先確認前端真的有傳到 token
    console.log("[/api/auth/google] 收到 idToken:",
      idToken ? `長度=${idToken.length}, parts=${idToken.split(".").length}` : "❌ 沒有傳"
    );
    if (!idToken) return res.status(400).json({ status: "error", message: "缺少 idToken" });


    // ✅ 2) 用 Firebase Admin 驗證這顆 Firebase ID Token
    const firebaseAuth = getFirebaseAuth();
    const decoded = await firebaseAuth.verifyIdToken(idToken);
    // 🔥 Debug: 看看 Google 驗證後的內容
    console.log("[/api/auth/google] decoded:", {
      uid: decoded.uid,
      email: decoded.email,
      name: decoded.name,
      picture: decoded.picture,
      email_verified: decoded.email_verified,
    });

    // 3) 整理想存到 DB 的欄位
    // Firebase token 會帶：
    // decoded: { uid, email, name, picture, email_verified, ... }
    const googleUid = decoded.uid;
    const email = decoded.email || null;
    const name = decoded.name || (email ? email.split("@")[0] : "Google使用者");
    const avatar = decoded.picture || null;

    if (!email) {
      return res.status(400).json({ status: "error", message: "沒有取得 email，無法建立帳號" });
    }

    // 找使用者：先用 google_uid，其次 email（支援「先有本地帳號，後來綁 Google」）
    const [rows] = await pool.execute(
      "SELECT id, name, email, avatar, google_uid, auth_provider FROM users WHERE google_uid=? OR email=? LIMIT 1",
      [googleUid, email]
    );
    let user = rows[0];

    if (!user) {
      // 不存在 → 建一個新帳號（密碼可為 NULL，provider=google）
      const [result] = await pool.execute(
        `INSERT INTO users (name, email, avatar, google_uid, auth_provider, is_valid)
        VALUES (?, ?, ?, ?, 'google', 1)`,
        [name, email, avatar, googleUid]
      );
      const insertedId = result.insertId;
      const [rows2] = await pool.execute(
        "SELECT id, name, email, avatar, auth_provider FROM users WHERE id=?",
        [insertedId]
      );
      user = rows2[0];
    } else {
      // 已存在但未綁定 google_uid → 幫他綁上 & 補上頭像/名稱（不覆蓋使用者已填資料）
      if (!user.google_uid || !user.avatar || user.auth_provider !== 'google') {
        await pool.execute(
          `UPDATE users 
          SET google_uid = COALESCE(google_uid, ?),
          auth_provider = 'google',
          avatar = CASE 
          WHEN (avatar IS NULL OR avatar = '') AND ? IS NOT NULL THEN ? 
          ELSE avatar 
          END
          WHERE id = ?`,
          [googleUid, avatar, avatar, user.id]
        );
      }
      // 取回最新資料
      const [rows3] = await pool.execute(
        "SELECT id, name, email, avatar, google_uid, auth_provider FROM users WHERE id=?",
        [user.id]
      );
      user = rows3[0];
    }

    // 發你自己的 JWT（沿用你原本的做法）
    const token = jwt.sign(
      { id: String(user.id), email: user.email, provider: "google" },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "7d" }
    );

    // （選用）如果你想用 Cookie 維持登入，就打開下面這段，前端 fetch 要帶 credentials: 'include'
    // res.cookie("token", token, {
    //   httpOnly: true, sameSite: "lax", secure: false, path: "/", maxAge: 7*24*60*60*1000
    // });

    res.json({
      status: "success",
      message: "Google 登入成功",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        provider: "google",
        google_uid: user.google_uid,
      },
    });
  } catch (err) {
    // console.error(err);
    console.error("[/api/auth/google] verify error:", err.code, err.message, err);
    res.status(401).json({
      status: "error",
      message: `Google Token 驗證失敗：${err.code || "unknown"}`
    });
  }
});

export default router;
