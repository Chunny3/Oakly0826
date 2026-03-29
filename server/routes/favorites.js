// routers/favorites.js
import express from "express";
import pool from "../connect.js";
import jwt from "jsonwebtoken";

const router = express.Router();
const secretKey = process.env.JWT_SECRET_KEY;

// 複製你 users2.js 裡的 checkToken 或把它抽出去共用
function checkToken(req, res, next) {
    let token = req.get("Authorization");
    if (token && token.startsWith("Bearer ")) {
        token = token.slice(7);
        jwt.verify(token, secretKey, (err, decoded) => {
            if (err) return res.status(401).json({ status: "error", message: "登入驗證失效 ,請重新登入" });
            req.decoded = decoded;
            next();
        });
    } else {
        res.status(401).json({ status: "error", message: "無登入驗證資訊,請重新登入" });
    }
}

// 取得我的收藏清單
router.get("/", checkToken, async (req, res) => {
    try {
        const userId = req.decoded.id;
        const [rows] = await pool.execute(
            `SELECT 
                f.product_id,
                p.name,
                p.price,
                p.product_img
                FROM favorites f
                JOIN products p ON p.id = f.product_id
                WHERE f.user_id = ?
                ORDER BY f.created_at DESC`,
            [userId]
        );
        res.status(200).json({ status: "success", data: rows, message: "已取得收藏清單" });
    } catch (e) {
        console.log(e);
        res.status(500).json({ status: "error", message: "取得收藏清單失敗" });
    }
});

// 加入收藏（body: { productId }）
router.post("/", checkToken, express.json(), async (req, res) => {
    try {
        const userId = req.decoded.id;
        const { productId } = req.body;
        if (!productId) return res.status(400).json({ status: "error", message: "請提供 productId" });

        await pool.execute(
            "INSERT IGNORE INTO favorites (user_id, product_id) VALUES (?, ?)",
            [userId, productId]
        );
        res.status(201).json({ status: "success", message: "已加入收藏" });
    } catch (e) {
        console.log(e);
        res.status(500).json({ status: "error", message: "加入收藏失敗" });
    }
});

// 取消收藏
router.delete("/:productId", checkToken, async (req, res) => {
    try {
        const userId = req.decoded.id;
        const { productId } = req.params;
        await pool.execute(
            "DELETE FROM favorites WHERE user_id=? AND product_id=?",
            [userId, productId]
        );
        res.status(200).json({ status: "success", message: "已取消收藏" });
    } catch (e) {
        console.log(e);
        res.status(500).json({ status: "error", message: "取消收藏失敗" });
    }
});


// 修改後端路由為
router.delete("/:productId/:colorId/:sizeId", checkToken, async (req, res) => {
    try {
        const userId = req.decoded.id;
        const { productId, colorId, sizeId } = req.params;
        
        await pool.execute(
            "DELETE FROM favorites WHERE user_id=? AND product_id=? AND color_id=? AND size_id=?",
            [userId, productId, colorId, sizeId]
        );
        
        res.status(200).json({ status: "success", message: "已取消收藏" });
    } catch (e) {
        res.status(500).json({ status: "error", message: "取消收藏失敗" });
    }
});

export default router;
