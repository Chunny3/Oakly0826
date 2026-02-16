"use client"

import express from "express";
import connection from "../connect.js";


const router = express.Router();

// GET /api/coupons - 取得領取後計時 並 有效的優惠券內容
router.get("/", async (req, res) => {
  try {
    const sql = `SELECT 
      c.*,
      GROUP_CONCAT(cc.category_id) as category_ids,
      GROUP_CONCAT(pc.category_name) as category_names 
    FROM coupons c 
    LEFT JOIN coupon_categories cc ON c.id = cc.coupon_id 
    LEFT JOIN products_category pc ON cc.category_id = pc.category_id 
    WHERE c.is_valid = 1 AND c.valid_days IS NOT NULL 
    GROUP BY c.id`;

    const [coupons] = await connection.execute(sql);
    res.status(200).json({
      status: "success",
      data: coupons,
      message: "已獲取領取後計時 並 有效的優惠券"
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: "error",
      message: error.message ?? "獲取失敗，請洽管理人員"
    });
  }
});

export default router;
