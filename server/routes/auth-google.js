import express from "express";
import jwt from "jsonwebtoken";
import { getFirebaseAuth } from "../utils/firebaseAdmin.js";
import pool from "../connect.js";

const router = express.Router();

// 添加 CORS 中間件
router.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

router.post("/google", async (req, res) => {
    try {
        const { idToken, userInfo } = req.body;

        console.log("[/api/auth/google] 收到請求");
        console.log("idToken 存在:", !!idToken);
        console.log("userInfo:", userInfo);

        if (!idToken) {
            return res.status(400).json({ 
                status: "error", 
                message: "缺少 Google ID Token" 
            });
        }

        // 驗證 Firebase ID Token
        const firebaseAuth = getFirebaseAuth();
        let decoded;
        
        try {
            decoded = await firebaseAuth.verifyIdToken(idToken);
            console.log("[Firebase] Token 驗證成功:", {
                uid: decoded.uid,
                email: decoded.email,
                name: decoded.name
            });
        } catch (verifyError) {
            console.error("[Firebase] Token 驗證失敗:", verifyError);
            return res.status(401).json({
                status: "error",
                message: `Firebase Token 驗證失敗: ${verifyError.message}`
            });
        }

        // 提取用戶信息
        const googleUid = decoded.uid;
        const email = decoded.email || userInfo?.email;
        const name = decoded.name || userInfo?.displayName || (email ? email.split("@")[0] : "Google用戶");
        const avatar = decoded.picture || userInfo?.photoURL;

        if (!email) {
            return res.status(400).json({ 
                status: "error", 
                message: "無法從 Google 獲取 email 地址" 
            });
        }

        // 數據庫操作
        let user;
        try {
            // 查找用戶
            const [rows] = await pool.execute(
                `SELECT id, name, email, avatar, google_uid, auth_provider, is_valid 
                 FROM users 
                 WHERE google_uid = ? OR email = ? 
                 LIMIT 1`,
                [googleUid, email]
            );
            
            user = rows[0];

            if (!user) {
                // 創建新用戶
                console.log("[DB] 創建新用戶:", { name, email, googleUid });
                
                const [result] = await pool.execute(
                    `INSERT INTO users 
                     (name, email, password, avatar, google_uid, auth_provider, is_valid)
                     VALUES (?, ?, '', ?, ?, 'google', 1)`,
                    [name, email, avatar, googleUid]
                );

                const [newUserRows] = await pool.execute(
                    "SELECT id, name, email, avatar, google_uid, auth_provider FROM users WHERE id = ?",
                    [result.insertId]
                );
                
                user = newUserRows[0];
                console.log("[DB] 新用戶創建成功:", user);
            } else {
                // 更新現有用戶
                console.log("[DB] 用戶已存在，更新資料");
                
                await pool.execute(
                    `UPDATE users 
                     SET google_uid = COALESCE(google_uid, ?),
                         auth_provider = 'google',
                         avatar = CASE 
                             WHEN (avatar IS NULL OR avatar = '') AND ? IS NOT NULL 
                             THEN ? ELSE avatar END,
                         updated_at = CURRENT_TIMESTAMP
                     WHERE id = ?`,
                    [googleUid, avatar, avatar, user.id]
                );

                // 重新查詢更新後的用戶資料
                const [updatedRows] = await pool.execute(
                    "SELECT id, name, email, avatar, google_uid, auth_provider FROM users WHERE id = ?",
                    [user.id]
                );
                user = updatedRows[0];
            }
        } catch (dbError) {
            console.error("[DB] 數據庫錯誤:", dbError);
            return res.status(500).json({
                status: "error",
                message: `數據庫操作失敗: ${dbError.message}`
            });
        }

        // 生成 JWT
        const secretKey = process.env.JWT_SECRET_KEY;
        if (!secretKey) {
            console.error("JWT_SECRET_KEY 未設置");
            return res.status(500).json({
                status: "error",
                message: "服務器配置錯誤"
            });
        }

        const token = jwt.sign(
            { 
                id: String(user.id), 
                email: user.email, 
                provider: "google" 
            },
            secretKey,
            { expiresIn: "7d" }
        );

        console.log("[JWT] Token 生成成功");

        // 返回成功響應
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
        console.error("[/api/auth/google] 未處理的錯誤:", err);
        res.status(500).json({
            status: "error",
            message: `登入處理失敗: ${err.message}`
        });
    }
});

export default router;