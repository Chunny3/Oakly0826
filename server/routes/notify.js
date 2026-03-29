import express from 'express';
import nodemailer from 'nodemailer';
import db from "../connect.js";

const router = express.Router();

// 設定郵件發送器 - 修正這裡
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'oakly.service@gmail.com',
    pass: 'dcxufxhscfgyydyp'
  }
});

// 到貨通知 API
router.post('/stock', async (req, res) => {
  try {
    const { productId, colorId, sizeId, email, userId, productName, colorName, sizeName } = req.body;
        
    // 驗證必要欄位
    if (!productId || !colorId || !sizeId || !email || !productName || !colorName || !sizeName) {
      return res.status(400).json({
        status: 'error',
        message: '請提供完整的通知資訊'
      });
    }

    console.log('收到到貨通知請求:', {
      productId, colorId, sizeId, email, userId,
      productName, colorName, sizeName
    });
        
    // 存到資料庫
    await db.execute(
      'INSERT INTO stock_notifications (user_id, product_id, color_id, size_id, email, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
      [userId, productId, colorId, sizeId, email]
    );
        
    // 發送確認郵件 - 直接使用前端傳來的名稱
    await transporter.sendMail({
      from: 'oakly.service@gmail.com',
      to: email,
      subject: '【Oakly】到貨通知設定成功',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; border-bottom: 2px solid #f0f0f0; padding-bottom: 20px; margin-bottom: 20px;">
            <h1 style="color: #333; margin: 0;">Oakly</h1>
            <p style="color: #666; margin: 5px 0;">家具生活美學</p>
          </div>
          
          <h2 style="color: #333; margin-bottom: 20px;">到貨通知設定成功！</h2>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
            親愛的顧客，感謝您對我們商品的關注！您已成功設定以下商品的到貨通知：
          </p>
          
          <div style=" padding: 20px; border-radius: 8px; margin: 20px 0; ">
            <div style="margin-bottom: 12px;">
              <strong style="color: #333;">商品名稱：</strong>
              <span style="color: #666;">${productName}</span>
            </div>
            <div style="margin-bottom: 12px;">
              <strong style="color: #333;">顏色：</strong>
              <span style="color: #666;">${colorName}</span>
            </div>
            <div style="margin-bottom: 12px;">
              <strong style="color: #333;">尺寸：</strong>
              <span style="color: #666;">${sizeName}</span>
            </div>
          </div>
          
          <div style="background:rgb(201, 215, 208); padding: 15px; border-radius: 4px; margin: 20px 0;">
            <p style="color: #719A8B; margin: 0; font-size: 14px;">
              💡 <strong>貼心提醒：</strong>商品一旦到貨，我們會第一時間發送通知郵件到您的信箱，請留意查收。感謝您的耐心等候！
            </p>
          </div>
          
          <div style=" padding: 15px; margin: 20px 0; ">
            <p style="color: #666; margin: 0; font-size: 13px;">
              如果您有任何疑問或需要協助，歡迎隨時聯繫我們的客服團隊：
            </p>
            <p style="color: #666; margin: 8px 0 0 0; font-size: 13px;">
              客服信箱：oakly.service@gmail.com<br>
              客服專線：02-1234-5678（週一至週五 9:00-18:00）
            </p>
          </div>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <div style="text-align: center;">
            <div style=" padding: 10px; border-radius: 6px; margin-bottom: 15px;">
              <p style="color: #666; font-size: 12px; margin: 0;">
                此為系統自動發送的通知信件，請勿直接回覆此郵件
              </p>
            </div>
            <p style="color: #999; font-size: 11px; margin: 8px 0 0 0;">
              © 2025 Oakly 家具生活美學 版權所有 | 讓生活更美好
            </p>
          </div>
        </div>
      `
    });
        
    res.json({
      status: 'success',
      message: '到貨通知設定成功'
    });
       
  } catch (error) {
    console.error('設定到貨通知失敗:', error);
    res.status(500).json({
      status: 'error',
      message: '設定到貨通知時發生錯誤'
    });
  }
});

export default router;