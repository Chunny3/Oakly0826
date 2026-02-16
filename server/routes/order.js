import express from "express";
import multer from "multer";
import pool from "../connect.js";
import crypto from "crypto";

const upload = multer();

const router = express.Router();

// 查詢使用者單一訂單
router.get("/detail", async (req, res) => {
  let connection;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const { userId, orderId } = req.query;
    if (!userId || !orderId) {
      const err = new Error("缺少 userId 或 orderId");
      err.code = 400;
      err.status = "fail";
      throw err;
    }


    const sql = `
      SELECT 
        o.id AS order_id,
        o.order_number,
        o.total_amount,
        o.create_at,
        o.buyer_name,
        o.buyer_email,
        o.buyer_phone,
        o.recipient_name,
        o.recipient_phone,
        o.postal_code,
        o.address,
        oi.product_id,
        oi.quantity,
        oi.price,
        oi.size,
        oi.color,
        oi.material,
        p.name AS product_name,
        pi.url AS product_image,
        c.name AS coupon_name,
        c.discount_type,
        c.discount AS coupon_discount_value
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      LEFT JOIN (
          SELECT product_id, MIN(img) AS url
          FROM product_img
          GROUP BY product_id
      ) pi ON p.id = pi.product_id
      LEFT JOIN user_coupons uc ON o.user_id = uc.user_id 
        AND uc.used_at IS NOT NULL 
        AND DATE(uc.used_at) = DATE(o.create_at)
      LEFT JOIN coupons c ON uc.coupon_id = c.id
      WHERE o.user_id = ? AND o.id = ?
      ORDER BY oi.id ASC;
    `;

    const [orders] = await connection.execute(sql, [userId, orderId]);

    if (!orders.length) {
      return res.status(404).json({
        status: "fail",
        message: "查無訂單",
      });
    }
    let couponDiscount = 0;
    if (orders[0].coupon_discount_value && orders[0].discount_type) {
      const subtotal = orders.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      if (orders[0].discount_type === 1) { // 假設1是百分比折扣
        couponDiscount = Math.floor(subtotal * (orders[0].coupon_discount_value / 100));
      } else if (orders[0].discount_type === 2) { // 假設2是固定金額折扣
        couponDiscount = orders[0].coupon_discount_value;
      }
    }
    // 組合完整的訂單資料
    const orderData = {
      order_id: orders[0].order_id,
      order_number: orders[0].order_number,
      total_amount: orders[0].total_amount,
      create_at: orders[0].create_at,
      buyer_name: orders[0].buyer_name,
      buyer_email: orders[0].buyer_email,
      buyer_phone: orders[0].buyer_phone,
      recipient_name: orders[0].recipient_name,
      recipient_phone: orders[0].recipient_phone,
      postal_code: orders[0].postal_code,
      address: orders[0].address,
      coupon_discount: couponDiscount,
      shipping_discount: 0, // 如果有運費折扣邏輯可以加入
      coupon_name: orders[0].coupon_name || null,
      items: orders.map(item => ({
        product_id: item.product_id,
        product_name: item.product_name,
        product_image: item.product_image,
        quantity: item.quantity,
        price: item.price,
        size: item.size,
        color: item.color,
        material: item.material,
      }))
    };

    await connection.commit();

    res.status(200).json({
      status: "success",
      data: orderData,
      message: "訂單查詢成功",
    });
  } catch (error) {
    if (connection) await connection.rollback();

    const statusCode = error.code ?? 500;
    const statusText = error.status ?? "error";
    const message = error.message ?? "訂單查詢錯誤，請洽管理人員";

    res.status(statusCode).json({
      status: statusText,
      message,
    });
  } finally {
    if (connection) connection.release();
  }
});


// 查詢使用者全部訂單
router.get("/", async (req, res) => {
  let connection;
  try {
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    const userId = req.query.userId;
    if (!userId) {
      const err = new Error("缺少 user_id");
      err.code = 400;
      err.status = "fail";
      throw err;
    }

    const sql = `
      SELECT 
    o.id AS order_id,
    o.order_number,
    o.total_amount,
    o.create_at,
    oi.product_id,
    oi.quantity,
    oi.price,
    oi.size,
    oi.color,
    oi.material,
    p.name AS product_name,
    pi.url AS product_image
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
LEFT JOIN products p ON oi.product_id = p.id
LEFT JOIN (
    SELECT product_id, MIN(img) AS url
    FROM product_img
    GROUP BY product_id
) pi ON p.id = pi.product_id
WHERE o.user_id = ?
ORDER BY o.create_at DESC, oi.id ASC;


        `;

    const [orders] = await connection.execute(sql, [userId]);
    if (!orders) {
      const err = new Error("查詢訂單失敗");
      err.code = 400;
      err.status = "fail";
      throw err;
    }

    res.status(200).json({
      status: "success",
      data: orders,
      message: orders.length === 0 ? "目前沒有訂單" : "訂單查詢成功",
    });
    res.status(200).json({
      status: "success",
      data: orders,
      message: "訂單查詢成功",
    });
  } catch (error) {
    if (connection) await connection.rollback();
    const statusCode = typeof error.code === "number" ? error.code : 500;
    const statusText = error.status ?? "error";
    const message = error.message ?? "訂單查詢錯誤，請洽管理人員";
    res.status(statusCode).json({
      status: statusText,
      message,
    });
  } finally {
    if (connection) connection.release();
  }
});

router.post("/create", async (req, res) => {
  let connection;

  try {
    connection = await pool.getConnection();
    console.log("=== 收到超商付款訂單建立請求 ===");
    console.log("完整 req.body:", JSON.stringify(req.body, null, 2));

    const {
      totalAmount,
      userId,
      buyerName,
      buyerEmail,
      buyerPhone,
      recipientName,
      recipientPhone,
      postcode,
      address,
      paymentMethod,
      coupon,
      discountAmount
    } = req.body;

    // 處理購物車商品資料
    let cartItems;
    const cartItemsRaw = req.body.cartItems || req.body.cart_items || req.body.items;

    console.log("cartItems 原始資料:", cartItemsRaw);

    // 解析 cartItems
    if (typeof cartItemsRaw === 'string') {
      try {
        cartItems = JSON.parse(cartItemsRaw);
      } catch (error) {
        console.error("cartItems JSON 解析失敗:", error);
        return res.status(400).json({
          success: false,
          message: "購物車資料格式錯誤: " + error.message
        });
      }
    } else if (Array.isArray(cartItemsRaw)) {
      cartItems = cartItemsRaw;
    } else {
      console.error("cartItems 格式不正確:", cartItemsRaw);
      return res.status(400).json({
        success: false,
        message: "購物車資料格式不正確"
      });
    }

    // 驗證必要資料
    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: '購物車資料為空或格式錯誤'
      });
    }

    if (!totalAmount || !userId || !recipientName || !recipientPhone || !address) {
      return res.status(400).json({
        success: false,
        message: '缺少必要資訊：totalAmount, userId, recipientName, recipientPhone, address'
      });
    }

    console.log("最終 cartItems:", cartItems);

    // === 1. 驗證商品資料與計算金額 ===
    let calculatedAmount = 0;
    const validatedItems = [];

    for (const item of cartItems) {
      console.log("處理商品:", item);

      // 從資料庫取得商品最新資訊
      const [products] = await connection.execute(`
        SELECT id, name, price FROM products WHERE id = ?
      `, [item.product_id || item.id]);

      if (!products || products.length === 0) {
        return res.status(400).json({
          success: false,
          message: `找不到商品 ID: ${item.product_id || item.id}`
        });
      }

      const product = products[0];
      console.log("找到商品:", product);

      // 使用資料庫的最新價格計算
      const itemTotal = product.price * item.quantity;
      calculatedAmount += itemTotal;

      // 儲存驗證後的商品資料
      validatedItems.push({
        product_id: product.id,
        product_name: product.name,
        quantity: item.quantity,
        price: product.price,
        size: item.size || null,
        color: item.color || null,
        material: item.material || null
      });
    }

    console.log("計算總金額:", calculatedAmount);
    console.log("傳入總金額:", totalAmount);

    // 處理折扣
    let finalAmount = calculatedAmount;
    if (discountAmount && discountAmount > 0) {
      finalAmount = calculatedAmount - discountAmount;
    }

    // 驗證總金額（考慮折扣後的金額）
    if (Math.abs(finalAmount - parseInt(totalAmount)) > 1) {
      return res.status(400).json({
        success: false,
        message: `金額驗證失敗，計算金額: ${finalAmount}, 傳入金額: ${totalAmount}`
      });
    }

    // === 2. 生成訂單編號 ===
    const orderNo = "ORD" + Date.now() + userId;

    // === 3. 開始資料庫事務 ===
    await connection.beginTransaction();

    try {
      // 創建正式訂單記錄（根據實際資料庫結構）
      const [orderResult] = await connection.execute(`
        INSERT INTO orders (
          order_number, 
          user_id, 
          total_amount, 
          buyer_name, 
          buyer_email, 
          buyer_phone, 
          recipient_name, 
          recipient_phone, 
          address,
          payment_status,
          payment_method,
          coupon_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        orderNo,
        userId,
        finalAmount, // 使用折扣後的金額
        buyerName || '購買者',
        buyerEmail || null,
        buyerPhone || null,
        recipientName,
        recipientPhone,
        address,
        'pending', // 超商付款狀態為待付款
        paymentMethod || '超商付款',
        coupon?.id || null // 使用 coupon_id 而不是 coupon_code
      ]);

      const orderId = orderResult.insertId;
      console.log("✅ 訂單主表創建成功, ID:", orderId);

      // 創建訂單明細
      let itemCount = 0;
      for (const item of validatedItems) {
        await connection.execute(`
          INSERT INTO order_items (
            order_id, 
            product_id, 
            quantity, 
            price, 
            size, 
            color, 
            material
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          orderId,
          item.product_id,
          item.quantity,
          item.price,
          item.size,
          item.color,
          item.material
        ]);
        itemCount++;
      }

      console.log(`✅ 訂單明細創建成功: ${itemCount} 項商品`);

      // 提交事務
      await connection.commit();
      console.log("✅ 所有資料庫操作完成，事務已提交");

      // 成功回應
      res.json({
        success: true,
        message: "超商付款訂單建立成功",
        orderNo: orderNo,
        orderId: orderId,
        status: 'pending',
        paymentMethod: paymentMethod || '超商付款',
        totalAmount: finalAmount,
        data: {
          order_number: orderNo,
          order_id: orderId,
          total_amount: finalAmount,
          items: validatedItems,
          recipient_name: recipientName,
          recipient_phone: recipientPhone,
          address: address,
          payment_status: 'pending',
          payment_method: paymentMethod || '超商付款',
          created_at: new Date().toISOString()
        }
      });

    } catch (dbError) {
      await connection.rollback();
      console.error("❌ 資料庫操作失敗，事務已回滾:", dbError);
      throw dbError;
    }

  } catch (error) {
    console.error('❌ 建立超商付款訂單失敗:', error);
    res.status(500).json({
      success: false,
      message: "系統錯誤: " + error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  } finally {
    if (connection) connection.release();
  }
});


export default router;
