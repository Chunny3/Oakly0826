"use client"

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function CartEcpayCheck() {
  const [countdown, setCountdown] = useState(3);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showManualButton, setShowManualButton] = useState(false);
  const [error, setError] = useState(null);
  const [orderData, setOrderData] = useState(null);
  const [shippingInfo, setShippingInfo] = useState({});
  const router = useRouter();

  useEffect(() => {
    console.log("=== 開始讀取 localStorage 資料 ===");

    // 從 localStorage 獲取訂單資料
    const storedOrderData = localStorage.getItem("orderData");
    const finalAmount = localStorage.getItem("finalAmount");
    const storedBuyer = localStorage.getItem("buyer");
    const storedRecipient = localStorage.getItem("recipient");

    console.log("Raw localStorage data:");
    console.log("storedOrderData存在:", !!storedOrderData);
    console.log("finalAmount存在:", !!finalAmount);
    console.log("storedBuyer存在:", !!storedBuyer);
    console.log("storedRecipient存在:", !!storedRecipient);

    if (!storedOrderData || !finalAmount) {
      console.error("缺少關鍵資料");
      setError("找不到訂單資料，請重新下單");
      setShowManualButton(true);
      return;
    }

    try {
      const parseOrderData = JSON.parse(storedOrderData);
      const buyerData = storedBuyer ? JSON.parse(storedBuyer) : {};
      const recipientData = storedRecipient ? JSON.parse(storedRecipient) : {};

      console.log("Parsed data:", parseOrderData);
      console.log("buyerData:", buyerData);
      console.log("recipientData:", recipientData);

      // 安全的地址拼接函數
      const buildSafeAddress = (data) => {
        if (data.address) return data.address; // 如果已有完整地址直接使用

        const parts = [
          data.postcode,
          data.city,
          data.area,
          data.address
        ].filter(part => part && part !== '' && part !== 'undefined');
        return parts.join('');
      };

      const combinedShippingInfo = {
        // 購買人資料
        buyerName: buyerData.name || "",
        buyerEmail: buyerData.email || "",
        buyerPhone: buyerData.phone || "",
        buyerAddress: buildSafeAddress(buyerData),

        // 收件人資料
        recipientName: recipientData.name || "",
        recipientPhone: recipientData.phone || "",
        recipientAddress: buildSafeAddress(recipientData),

        // 相容欄位
        name: recipientData.name || buyerData.name || "",
        phone: recipientData.phone || buyerData.phone || "",
        address: buildSafeAddress(recipientData) || buildSafeAddress(buyerData),
        email: recipientData.email || buyerData.email || "",
        postcode: recipientData.postcode || buyerData.postcode || ""
      };

      console.log("Combined shippingInfo:", combinedShippingInfo);

      setOrderData(parseOrderData);
      setShippingInfo(combinedShippingInfo);

      // 檢查是否有收件資訊
      if (hasCompleteShippingInfo(combinedShippingInfo)) {
        console.log("收件資訊完整，啟動倒數計時");
        startCountdown(parseOrderData, parseInt(finalAmount));
      } else {
        console.log("收件資訊不完整，顯示手動按鈕");
        setShowManualButton(true);
      }

    } catch (error) {
      console.error("解析資料失敗:", error);
      console.error("錯誤詳情:", error.message);
      setError(`資料解析失敗: ${error.message}`);
      setShowManualButton(true);
    }
  }, [router]);

  // 檢查收件資訊是否完整 - 修正變數未定義問題
  const hasCompleteShippingInfo = (info) => {
    const hasRecipientInfo = info.recipientName && info.recipientPhone && info.recipientAddress;
    const hasCompatibleInfo = info.name && info.phone && info.address; // 定義這個變數

    console.log("檢查收件資訊完整性:");
    console.log("recipientName:", info.recipientName);
    console.log("recipientPhone:", info.recipientPhone);
    console.log("recipientAddress:", info.recipientAddress);
    console.log("name:", info.name);
    console.log("phone:", info.phone);
    console.log("address:", info.address);
    console.log("hasRecipientInfo:", hasRecipientInfo);
    console.log("hasCompatibleInfo:", hasCompatibleInfo);

    return hasRecipientInfo || hasCompatibleInfo;
  };

  // 啟動倒數計時
  const startCountdown = (orderInfo, amount) => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit(orderInfo, amount);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  };

  // 自動提交到付款頁面
  const handleAutoSubmit = (orderInfo, amount) => {
    setIsSubmitting(true);
    submitPaymentForm(orderInfo, amount);
  };

  // 手動提交
  const handleManualSubmit = () => {
    if (!orderData) {
      setError("找不到訂單資料");
      return;
    }
    const finalAmount = localStorage.getItem("finalAmount");
    if (!finalAmount) {
      setError("找不到付款金額");
      return;
    }

    if (!hasCompleteShippingInfo(shippingInfo)) {
      setError("請先填寫完整的收件資訊");
      return;
    }

    setIsSubmitting(true);
    submitPaymentForm(orderData, parseInt(finalAmount));
  };

  // 提交付款表單到後端 - 修正所有資料解析問題

  // 在 CartEcpayCheck 組件的 submitPaymentForm 函數開頭加入詳細的調試
  const submitPaymentForm = (orderInfo, amount) => {
    try {
      console.log("=== 開始調試付款流程 ===");

      // 1. 檢查傳入的參數
      console.log("傳入的 orderInfo:", orderInfo);
      console.log("傳入的 amount (最終金額):", amount);

      // 2. 檢查 localStorage 中的所有相關數據
      console.log("=== localStorage 數據檢查 ===");
      const orderDataRaw = localStorage.getItem("orderData");
      const finalAmountRaw = localStorage.getItem("finalAmount");
      const selectedCouponRaw = localStorage.getItem("selectedCoupon");
      const cartItemsRaw = localStorage.getItem("cart");

      console.log("orderData (raw):", orderDataRaw);
      console.log("finalAmount (raw):", finalAmountRaw);
      console.log("selectedCoupon (raw):", selectedCouponRaw);
      console.log("cart (raw):", cartItemsRaw?.substring(0, 200) + "...");

      // 3. 解析並檢查 orderData 中的金額信息
      let parsedOrderData = null;
      if (orderDataRaw) {
        try {
          parsedOrderData = JSON.parse(orderDataRaw);
          console.log("=== orderData 解析結果 ===");
          console.log("totalAmount:", parsedOrderData.totalAmount);
          console.log("originalAmount:", parsedOrderData.originalAmount);
          console.log("discountAmount:", parsedOrderData.discountAmount);
          console.log("coupon:", parsedOrderData.coupon);
        } catch (error) {
          console.error("orderData 解析失敗:", error);
        }
      }

      // 4. 解析並檢查優惠券信息
      let selectedCoupon = null;
      let discountAmount = 0;

      if (selectedCouponRaw && selectedCouponRaw !== "null") {
        try {
          selectedCoupon = JSON.parse(selectedCouponRaw);
          console.log("=== 優惠券信息 ===");
          console.log("selectedCoupon:", selectedCoupon);
        } catch (error) {
          console.warn("優惠券資料解析失敗:", error);
        }
      }

      // 5. 從不同來源獲取折扣金額
      discountAmount = parsedOrderData?.discountAmount || orderInfo?.discountAmount || 0;
      console.log("最終確定的 discountAmount:", discountAmount);

      // 6. 解析購物車商品
      let cartItems = [];
      if (cartItemsRaw) {
        try {
          cartItems = JSON.parse(cartItemsRaw);
          console.log("=== 購物車商品 ===");
          console.log("商品數量:", cartItems.length);

          // 計算購物車原始總金額
          const calculatedOriginalAmount = cartItems.reduce((sum, item) => {
            const itemTotal = (item.price || 0) * (item.quantity || 0);
            console.log(`商品 ${item.name}: 單價 ${item.price} × 數量 ${item.quantity} = ${itemTotal}`);
            return sum + itemTotal;
          }, 0);

          console.log("前端計算的原始總金額:", calculatedOriginalAmount);
          console.log("前端計算的最終金額:", calculatedOriginalAmount - discountAmount);
          console.log("實際傳入的最終金額:", amount);

          // 檢查金額是否匹配
          const expectedFinalAmount = calculatedOriginalAmount - discountAmount;
          console.log("=== 金額比較 ===");
          console.log("原始金額:", calculatedOriginalAmount);
          console.log("折扣金額:", discountAmount);
          console.log("預期最終金額:", expectedFinalAmount);
          console.log("實際傳入金額:", amount);
          console.log("金額差異:", Math.abs(expectedFinalAmount - amount));

        } catch (error) {
          console.error("購物車資料解析失敗:", error);
        }
      }

      // 7. 解析購買人和收件人資料
      const buyerDataRaw = localStorage.getItem("buyer");
      const recipientDataRaw = localStorage.getItem("recipient");

      let buyerData = {};
      let recipientData = {};

      try {
        if (buyerDataRaw) buyerData = JSON.parse(buyerDataRaw);
        if (recipientDataRaw) recipientData = JSON.parse(recipientDataRaw);
      } catch (parseError) {
        console.error("解析購買人/收件人資料失敗:", parseError);
      }

      console.log("=== 購買人/收件人資料 ===");
      console.log("buyerData:", buyerData);
      console.log("recipientData:", recipientData);

      // 新增：讀取配送方式和門市資訊
      const deliveryMethod = localStorage.getItem("delivery");
      const storeDataRaw = localStorage.getItem("store711");

      let storeData = {};
      if (storeDataRaw) {
        try {
          storeData = JSON.parse(storeDataRaw);
        } catch (error) {
          console.error("解析門市資料失敗:", error);
        }
      }

      console.log("=== 配送方式和門市資訊 ===");
      console.log("deliveryMethod:", deliveryMethod);
      console.log("storeData:", storeData);

      // 8. 準備付款請求（使用從 orderData 中獲取的完整信息）
      const paymentRequest = {
        // 金額相關
        totalAmount: amount,                                    // 最終付款金額
        originalAmount: parsedOrderData?.originalAmount || 0,   // 原始商品總金額
        discountAmount: discountAmount,                         // 優惠券折扣金額

        // 優惠券資訊
        coupon: selectedCoupon || parsedOrderData?.coupon,      // 完整優惠券資訊
        couponId: selectedCoupon?.coupon_id || parsedOrderData?.coupon?.coupon_id || null,
        coupon_id: selectedCoupon?.coupon_id || parsedOrderData?.coupon?.coupon_id || null, // 加這行確保相容性

        userId: orderInfo.userId,

        // 購買人資訊
        buyerName: buyerData?.name || shippingInfo?.buyerName || '購買者',
        buyerEmail: buyerData?.email || shippingInfo?.buyerEmail || '',
        buyerPhone: buyerData?.phone || shippingInfo?.buyerPhone || '',

        // 收件人資訊
        recipientName: recipientData?.name || shippingInfo?.recipientName || buyerData?.name || '收件人',
        recipientPhone: recipientData?.phone || shippingInfo?.recipientPhone || buyerData?.phone || '',
        postcode: recipientData?.postcode || shippingInfo?.postcode || '',
        address: recipientData?.address || shippingInfo?.recipientAddress || shippingInfo?.address || '',

        // 新增：配送方式和門市資訊
        deliveryMethod: deliveryMethod || "宅配",
        storeName: storeData.storename || null,
        storeAddress: storeData.storeaddress || null,

        // 購物車商品
        cartItems: cartItems.map(item => ({
          product_id: item.id || item.product_id,
          quantity: item.quantity || 1,
          price: item.price || 0,
          size: item.size || null,
          color: item.color || null,
          material: item.material || null,
          name: item.name || '商品'
        })).filter(item => item !== null)
      };

      console.log("=== 最終付款請求 ===");
      console.log("完整付款請求:", paymentRequest);
      console.log("=== 調試結束 ===");

      // 檢查關鍵問題：折扣金額是否正確
      if (discountAmount === 0 && selectedCoupon) {
        console.error("⚠️ 警告：有優惠券但折扣金額為 0！");
        console.log("請檢查 Total 組件的 calculatedDiscount 函數是否正確執行");
      }

      console.log("準備提交付款表單:", paymentRequest);

      // 檢查必要欄位
      const missingFields = [];
      if (!paymentRequest.totalAmount) missingFields.push('totalAmount');
      if (!paymentRequest.userId) missingFields.push('userId');
      if (!paymentRequest.recipientName) missingFields.push('recipientName');
      if (!paymentRequest.recipientPhone) missingFields.push('recipientPhone');
      if (!paymentRequest.address) missingFields.push('address');
      if (!paymentRequest.cartItems || paymentRequest.cartItems.length === 0) missingFields.push('cartItems');

      if (missingFields.length > 0) {
        console.error("Missing required fields:", missingFields);
        setError(`缺少必要資訊: ${missingFields.join(', ')}`);
        setIsSubmitting(false);
        return;
      }

      // 創建表單
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = 'http://localhost:3005/api/cart/ecpay/create';
      form.style.display = 'none';

      // 添加所有付款參數（包含優惠券資訊）
      Object.keys(paymentRequest).forEach(key => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;

        if (key === "cartItems" || key === "coupon") {
          input.value = JSON.stringify(paymentRequest[key]);
        } else {
          input.value = paymentRequest[key] || '';
        }
        form.appendChild(input);
      });


      console.log("Form created successfully, submitting...");

      // 提交表單
      document.body.appendChild(form);
      form.submit();

    } catch (error) {
      console.error("提交付款表單失敗:", error);
      console.error("錯誤堆疊:", error.stack);
      setError(`付款提交失敗: ${error.message}`);
      setIsSubmitting(false);
      setShowManualButton(true);
    }
  };

  // 從商品陣列中提取商品名稱
  const getItemNames = (items) => {
    if (!items || items.length === 0) return "商品";

    if (items.length === 1) {
      return items[0].name || "商品";
    } else {
      return `${items[0].name || "商品"} 等 ${items.length} 項商品`;
    }
  };

  // 處理收件資訊更新
  const handleShippingInfoChange = (field, value) => {
    const updatedInfo = { ...shippingInfo, [field]: value };
    setShippingInfo(updatedInfo);
    localStorage.setItem("shippingInfo", JSON.stringify(updatedInfo));
  };

  const handleGoBack = () => {
    router.back();
  };

  // 載入中畫面
  if (!orderData) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <div className="card shadow-lg" style={{ maxWidth: '400px', width: '100%' }}>
          <div className="card-body p-4">
            <div className="text-center">
              <div className="rounded-circle d-flex align-items-center justify-content-center mx-auto mb-4"
                style={{ width: '64px', height: '64px', backgroundColor: 'var(--primary-04)' }}>
                <div className="spinner-border text-white" role="status" style={{ width: '24px', height: '24px' }}>
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
              <h2 className="h4 fw-semibold text-dark mb-2">
                準備付款中...
              </h2>
              <p className="text-muted">正在初始化付款資訊</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center p-3">
      <div className="card shadow-lg" style={{ maxWidth: '500px', width: '100%' }}>
        <div className="card-body p-4">

          {/* Header */}
          <div className="text-center mb-4">
            <div className="rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3"
              style={{ width: '80px', height: '80px', backgroundColor: 'var(--primary-04)' }}>
              <i className="fas fa-credit-card text-white" style={{ fontSize: '40px' }}></i>
            </div>
            <h1 className="h3 fw-bold text-dark mb-2">安全付款</h1>
            <p className="text-muted">
              {isSubmitting
                ? "正在跳轉至付款頁面..."
                : showManualButton
                  ? "請確認資訊後點擊付款"
                  : `${countdown} 秒後自動跳轉`}
            </p>
          </div>

          {/* 錯誤訊息 */}
          {error && (
            <div className="alert alert-danger d-flex align-items-center mb-4" role="alert">
              <i className="fas fa-exclamation-triangle me-2"></i>
              <div>{error}</div>
            </div>
          )}

          {/* Order Info */}
          <div className="card bg-light mb-4">
            <div className="card-body">
              <h5 className="card-title fw-semibold text-dark mb-3">訂單資訊</h5>
              <div className="row mb-2">
                <div className="col-6 text-muted">訂單編號:</div>
                <div className="col-6 fw-medium text-end">{orderData.orderNo}</div>
              </div>
              <div className="row mb-2">
                <div className="col-6 text-muted">商品:</div>
                <div className="col-6 fw-medium text-end">{getItemNames(orderData.items)}</div>
              </div>
              {orderData.discountAmount > 0 && (
                <div className="row mb-2">
                  <div className="col-6 text-muted">優惠券折抵:</div>
                  <div className="col-6 text-danger text-end">-NT$ {orderData.discountAmount.toLocaleString()}</div>
                </div>
              )}
              <hr />
              <div className="row">
                <div className="col-6 text-muted">付款金額:</div>
                <div className="col-6 text-success fw-bold text-end h5 mb-0">
                  NT$ {orderData.totalAmount.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Shipping Info */}
          <div className="card bg-info bg-opacity-10 mb-4">
            <div className="card-body">
              <h5 className="card-title fw-semibold text-dark mb-3">收件資訊</h5>
              <div className="row mb-2">
                <div className="col-4 text-muted small">收件人:</div>
                <div className="col-8 fw-medium small text-end">{shippingInfo.recipientName || shippingInfo.name || '未設定'}</div>
              </div>
              <div className="row mb-2">
                <div className="col-4 text-muted small">電話:</div>
                <div className="col-8 fw-medium small text-end">{shippingInfo.recipientPhone || shippingInfo.phone || '未設定'}</div>
              </div>
              <div className="row mb-3">
                <div className="col-4 text-muted small">地址:</div>
                <div className="col-8 fw-medium small text-end">{shippingInfo.recipientAddress || shippingInfo.address || '未設定'}</div>
              </div>

              {/* 購買人資訊 */}
              <hr className="border-info" />
              <h6 className="fw-medium text-dark mb-2">訂購人資訊</h6>
              <div className="row mb-2">
                <div className="col-4 text-muted small">訂購人:</div>
                <div className="col-8 fw-medium small text-end">{shippingInfo.buyerName || '未設定'}</div>
              </div>
              <div className="row mb-2">
                <div className="col-4 text-muted small">Email:</div>
                <div className="col-8 fw-medium small text-end">{shippingInfo.buyerEmail || '未設定'}</div>
              </div>
              <div className="row mb-3">
                <div className="col-4 text-muted small">電話:</div>
                <div className="col-8 fw-medium small text-end">{shippingInfo.buyerPhone || '未設定'}</div>
              </div>

            </div>
          </div>

          {/* Loading Spinner */}
          {isSubmitting && (
            <div className="text-center mb-4">
              <div className="spinner-border text-success" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="d-grid gap-2">
            {(showManualButton || error) && (
              <button
                onClick={handleManualSubmit}
                disabled={isSubmitting}
                className={`btn fw-semibold py-2 ${isSubmitting
                  ? 'btn-secondary disabled'
                  : 'btn-success'
                  }`}
              >
                {isSubmitting ? '處理中...' : '前往付款'}
              </button>
            )}

            <button
              onClick={handleGoBack}
              disabled={isSubmitting}
              className={`btn fw-semibold py-2 ${isSubmitting
                ? 'btn-outline-secondary disabled'
                : 'btn-outline-secondary'
                }`}
            >
              返回購物車
            </button>
          </div>

          {/* Security Notice */}
          <div className="text-center mt-4">
            <p className="text-muted small mb-0">🔒 您的交易資訊經過加密保護</p>
          </div>
        </div>
      </div>
    </div>
  );
}