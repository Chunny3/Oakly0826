// server/routes/authReset.js
import express from "express";
import rateLimit from "express-rate-limit";
import bcrypt from "bcrypt";
import crypto from "crypto";

import { sendResetEmail } from "../utils/mailer.js";
import { createResetToken, expiresAfterMinutes } from "../utils/reset-token.js";

// 🟡 換成你專案的 pool 匯入路徑（和其他路由一致）
import pool from "../connect.js"; // ←←← 這行請依你專案實際路徑調整

const router = express.Router();

// 忘記密碼請求節流（同 IP 每小時最多 5 次）
const forgotLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
});

// 1) 申請重設密碼：產生 token、存 hash、寄信（固定回覆避免 Email 枚舉）
router.post("/forgot-password", forgotLimiter, async (req, res) => {
    try {
        const { email } = req.body || {};
        const generic = {
            status: "ok",
            message: "如果此 Email 有註冊，我們已寄出重設連結，請查收信箱。",
        };
        if (!email) return res.status(200).json(generic);

        const [rows] = await pool.execute(
            "SELECT id, email FROM users WHERE email=? LIMIT 1",
            [email]
        );
        if (!rows.length) return res.status(200).json(generic);

        const user = rows[0];
        const { token, hash } = createResetToken();
        const ttlMin = Number(process.env.RESET_TOKEN_TTL_MIN || 15);
        const expiresAt = expiresAfterMinutes(ttlMin);

        await pool.execute(
            "UPDATE users SET reset_token_hash=?, reset_token_expires_at=? WHERE id=?",
            [hash, expiresAt, user.id]
        );

        const base = process.env.APP_URL || "http://localhost:3000";
        const link = `${base}/auth/reset?token=${token}`;

        await sendResetEmail(user.email, link, ttlMin);

        if (process.env.NODE_ENV !== "production") {
            console.log("[DEV] Password reset link:", link);
        }
        
        // 直接把 token 也一起回傳出來（方便測試）
        // return res.status(200).json({
        //     status: "ok",
        //     message: "如果此 Email 有註冊，我們已寄出重設連結，請查收信箱。",
        //     devToken: token  // ← 測試用
        // });
        // 上線換這個
        return res.status(200).json(generic);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ status: "error", message: "系統錯誤" });
    }
});

// 2) 送出新密碼：驗證 token、更新密碼、清空 token
router.post("/reset-password", async (req, res) => {
    try {
        const { token, password } = req.body || {};
        if (!token || !password) {
            return res.status(400).json({ status: "error", message: "缺少必要欄位" });
        }
        if (String(password).length < 8) {
            return res.status(400).json({ status: "error", message: "密碼至少 8 碼" });
        }

        const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

        const [rows] = await pool.execute(
            "SELECT id, reset_token_expires_at FROM users WHERE reset_token_hash=? LIMIT 1",
            [tokenHash]
        );
        if (!rows.length) {
            return res
                .status(400)
                .json({ status: "error", message: "連結已失效，請重新申請" });
        }

        const user = rows[0];
        const now = new Date();
        const expiry = new Date(user.reset_token_expires_at);

        if (isNaN(expiry.getTime()) || expiry < now) {
            await pool.execute(
                "UPDATE users SET reset_token_hash=NULL, reset_token_expires_at=NULL WHERE id=?",
                [user.id]
            );
            return res
                .status(400)
                .json({ status: "error", message: "連結已過期，請重新申請" });
        }

        const hashed = await bcrypt.hash(password, 10);
        await pool.execute(
            "UPDATE users SET password=?, reset_token_hash=NULL, reset_token_expires_at=NULL WHERE id=?",
            [hashed, user.id]
        );

        return res
            .status(200)
            .json({ status: "success", message: "密碼已更新，請用新密碼登入" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ status: "error", message: "系統錯誤" });
    }
});

export default router;
