import express from "express";

const router = express.Router();

// 在所有其他路由之前添加這個測試路由
router.post("/simple-test", (req, res) => {
  console.log('=== 簡單測試路由 ===');
  console.log('收到請求');
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  console.log('Body type:', typeof req.body);
  
  // 直接返回成功響應
  res.status(200).json({
    success: true,
    message: 'Simple test passed',
    receivedBody: req.body
  });
});

// 簡化版本用於測試
router.post("/ecpay", (req, res) => {
    console.log('=== 收到 ecpay 請求 ===');
    console.log('req.body:', req.body);

    try {
        const { totalAmount, orderNo, itemName, userId, coupon, items } = req.body;

        if (!totalAmount) {
            return res.status(400).json({
                success: false,
                message: 'totalAmount is required'
            });
        }

        // 暫時返回模擬數據，不使用綠界 SDK
        const mockPaymentData = {
            params: {
                MerchantID: "2000132",
                PaymentType: "aio",
                MerchantTradeNo: orderNo || `ORDER${Date.now()}`,
                MerchantTradeDate: new Date().toISOString().slice(0, 19).replace('T', ' '),
                TotalAmount: totalAmount,
                TradeDesc: "測試交易",
                ItemName: itemName || "測試商品",
                ReturnURL: "http://localhost:3005/api/cart/return",
                ClientBackURL: "http://localhost:3000/cart/success",
                ChoosePayment: "ALL"
            },
            action: "https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5"
        };

        console.log('✅ 回傳模擬付款資料:', mockPaymentData);

        res.json({
            success: true,
            paymentData: mockPaymentData,
            message: '付款資料準備完成（測試模式）'
        });

    } catch (error) {
        console.error('❌ 處理付款請求失敗:', error);
        res.status(500).json({
            success: false,
            message: error.message,
            stack: error.stack
        });
    }
});

export default router;