"use client";

import GreenButton from "./greenButton";
import WhiteButton from "./whiteButton";
import "@/styles/cart/total.css";
// 導入 useCart
import { useCart } from "@/hooks/use-cart";
// sweetalert2
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import CouponSelect from "./couponSelect";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Total({ type }) {
  const [coupon, setCoupon] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("信用卡");
  const [delivery, setDelivery] = useState("standard");
  const { items, onDecrease, onIncrease, onRemove, totalQty, totalAmount } =
    useCart();
  const [userId, setUserId] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    const storedCoupon = localStorage.getItem("selectedCoupon");

    if (
      storedCoupon &&
      (storedCoupon !== "null") & (storedCoupon !== "undefined")
    ) {
      try {
        const couponData = JSON.parse(storedCoupon);
        console.log("找到優惠券:", couponData);
        const orderData = JSON.parse(localStorage.getItem("cart"));
        setSelectedCoupon(couponData);
        setUserId(storedUser.id);
      } catch (error) {
        console.log("解析優惠券失敗:", error);
        setSelectedCoupon(null);
      }
    }
    setUserId(storedUser.id);
  }, []);

  // 讀取並處理優惠券
  useEffect(() => {
    const loadCouponData = () => {
      try {
        console.log("useEffect - totalAmount 變化:", totalAmount);

        // 檢查是否有選中優惠券
        const storedCoupon = localStorage.getItem("selectedCoupon");

        if (
          storedCoupon &&
          storedCoupon !== "null" &&
          storedCoupon !== "undefined"
        ) {
          const couponData = JSON.parse(storedCoupon);
          console.log("找到優惠券:", couponData);

          setSelectedCoupon(couponData);
          // 重要：確保 totalAmount 有值才計算折扣
          if (totalAmount > 0) {
            const discount = calculatedDiscount(couponData, totalAmount);
          }
        } else {
          // 沒有優惠券，重置折扣
          console.log("沒有優惠券，重置折扣");
          setSelectedCoupon(null);
          setDiscountAmount(0);
        }
      } catch (error) {
        console.log("讀取優惠券失敗:", error);
        setSelectedCoupon(null);
        setDiscountAmount(0);
      }
    };
    // 只有當 totalAmount 大於 0 時才執行
    if (totalAmount >= 0) {
      loadCouponData();
    }
  }, [totalAmount]);

  const calculatedDiscount = (coupon, amount) => {
    console.log("=== 開始計算折扣 ===");
    console.log("輸入優惠券:", coupon);
    console.log("輸入金額:", amount);
    if (!coupon || !amount || amount <= 0) {
      console.log("沒有優惠券或總金額為0，設定折扣為0");
      setDiscountAmount(0);
      return;
    }
    let discount = 0;

    try {
      if (coupon.discountType === "percentage") {
        // 處理百分比折扣 - 計算實際節省的金額
        let discountRate = coupon.discountValue;

        console.log("原始 discountValue:", discountRate);

        if (discountRate >= 10 && discountRate <= 100) {
          // 如果是 95，表示 95 折
          // 折價金額 = 原價 - (原價 × 0.95) = 原價 × (1 - 0.95) = 原價 × 0.05
          const discountPercent = (100 - discountRate) / 100; // 95折 -> 0.05 (5%折扣)
          discount = Math.floor(amount * discountPercent);
          console.log(
            `95折計算: 原價 ${amount} - 折後價 ${Math.floor(
              (amount * discountRate) / 100
            )} = 節省 ${discount}`
          );
        } else if (discountRate > 0 && discountRate < 1) {
          // 如果是 0.95，表示打折後的比例
          // 折價金額 = 原價 × (1 - 0.95) = 原價 × 0.05
          discount = Math.floor(amount * (1 - discountRate));
          console.log(
            `小數折扣計算: 原價 ${amount} × (1 - ${discountRate}) = 節省 ${discount}`
          );
        } else if (discountRate >= 1 && discountRate < 10) {
          // 如果是 1.5，可能表示 1.5% 的折扣
          discount = Math.floor(amount * (discountRate / 100));
          console.log(
            `百分比折扣計算: 原價 ${amount} × ${discountRate}% = 節省 ${discount}`
          );
        } else {
          console.log("無法識別的百分比折扣值:", discountRate);
          discount = 0;
        }
      } else if (coupon.discountType === "fixed") {
        // 處理固定金額折扣 - 直接就是節省的金額
        discount = Math.min(coupon.discountValue, amount);
        console.log(`固定折扣: 直接節省 ${discount} 元`);
      } else {
        console.log("未知的折扣類型:", coupon.discountType);
        discount = 0;
      }
    } catch (error) {
      console.error("計算折扣時發生錯誤:", error);
      discount = 0;
    }

    console.log("最終計算的折扣:", discount);
    console.log("=== 折扣計算結束 ===");

    // 確保設置狀態
    setDiscountAmount(discount);
    return discount;
  };
  // 移除優惠券
  const removeCoupon = () => {
    localStorage.removeItem("selectedCoupon");
    setSelectedCoupon(null);
    setDiscountAmount(0);
  };

  // 計算最終金額
  const finalAmount = Math.max(0, totalAmount - discountAmount);

  const handleSelectCoupon = (coupon) => {
    console.log("=== 選擇優惠券 ===");
    console.log("選擇的優惠券:", coupon);
    console.log("當前總金額:", totalAmount);

    if (!coupon) {
      // 如果沒有優惠券（取消選擇）
      localStorage.removeItem("selectedCoupon");
      setSelectedCoupon(null);
      setDiscountAmount(0);
      console.log("已取消選擇優惠券");
      return;
    }

    // 將選中的優惠券存到 localStorage
    localStorage.setItem("selectedCoupon", JSON.stringify(coupon));
    setSelectedCoupon(coupon);

    // 修復：傳遞 totalAmount 參數
    const discount = calculatedDiscount(coupon, totalAmount);
    setDiscountAmount(discount);

    console.log("優惠券選擇完成，折扣金額:", discount);
  };

  // 修正 handleNext 函數，只準備數據，不直接調用 API
  const handleNext = async () => {
    try {
      setLoading(true);

      // 驗證必要數據
      if (!userId) {
        throw new Error("請先登入");
      }

      if (!items || items.length === 0) {
        throw new Error("購物車為空");
      }

      // 從 localStorage 取得收件人資訊
      const recipientData = JSON.parse(localStorage.getItem("recipient"));
      const buyerData = JSON.parse(localStorage.getItem("buyer"));

      const recipientName = recipientData.name;
      const recipientPhone = recipientData.phone;
      const address = recipientData.address;
      const buyerName = buyerData.name;
      const buyerEmail = buyerData.email;
      const buyerPhone = buyerData.phone;
      const deliveryMethod = localStorage.getItem("delivery"); // 添加這行
      const storeData = JSON.parse(localStorage.getItem("store711") || "{}");

      const currentPaymentMethod = localStorage.getItem("payment");
      setPaymentMethod(currentPaymentMethod);

      console.log("=== 配送方式檢查 ===");
      console.log("deliveryMethod:", deliveryMethod);
      console.log("storeData:", storeData);

      // === 開始驗證各項必填資料 ===

      // 1. 驗證聯絡人資訊
      if (!recipientData.name && !buyerData.name) {
        Swal.fire({
          title: "資料不完整",
          text: "請先填寫聯絡人資訊",
          icon: "warning",
          confirmButtonText: "確定",
        });
        setLoading(false);
        return;
      }

      if (!recipientData.phone && !buyerData.phone) {
        Swal.fire({
          title: "資料不完整",
          text: "請先填寫聯絡人電話",
          icon: "warning",
          confirmButtonText: "確定",
        });
        setLoading(false);
        return;
      }

      if (!recipientData.address && !buyerData.address) {
        Swal.fire({
          title: "資料不完整",
          text: "請先填寫聯絡人地址",
          icon: "warning",
          confirmButtonText: "確定",
        });
        setLoading(false);
        return;
      }

      // 2. 驗證運送方式
      if (!deliveryMethod) {
        Swal.fire({
          title: "資料不完整",
          text: "請先選擇運送方式",
          icon: "warning",
          confirmButtonText: "確定",
        });
        setLoading(false);
        return;
      }

      // 3. 驗證付款方式
      if (!currentPaymentMethod) {
        Swal.fire({
          title: "資料不完整",
          text: "請先選擇付款方式",
          icon: "warning",
          confirmButtonText: "確定",
        });
        setLoading(false);
        return;
      }

      // 4. 驗證發票類型
      const invoiceType = localStorage.getItem("invoice");
      if (!invoiceType) {
        Swal.fire({
          title: "資料不完整",
          text: "請先選擇發票類型",
          icon: "warning",
          confirmButtonText: "確定",
        });
        setLoading(false);
        return;
      }

      // 5. 如果選擇超商自取，驗證是否已選擇門市
      if (deliveryMethod === "超商自取") {
        if (!storeData.storename || !storeData.storeaddress) {
          Swal.fire({
            title: "資料不完整",
            text: "請先選擇取貨門市",
            icon: "warning",
            confirmButtonText: "確定",
          });
          setLoading(false);
          return;
        }
      }

      // 處理地址邏輯
      let finalAddress = address;
      if (deliveryMethod === "超商自取") {
        if (storeData.storename && storeData.storeaddress) {
          finalAddress = `${storeData.storename} - ${storeData.storeaddress}`;
          console.log("✅ 超商自取地址已處理:", finalAddress);
        } else {
          throw new Error("請先選擇取貨門市");
        }
      }

      // 準備完整的訂單資料並存到 localStorage
      const orderDataForPayment = {
        userId: userId,
        items: items,
        totalAmount: finalAmount,
        originalAmount: totalAmount,
        coupon: selectedCoupon,
        coupon_id: selectedCoupon ? selectedCoupon.coupon_id : null,
        discountAmount: discountAmount,
        paymentMethod: currentPaymentMethod,
        deliveryMethod: deliveryMethod,
        storeName: storeData.storename || null,
        storeAddress: storeData.storeaddress || null,
        orderNo: `ORD${Date.now()}`, // 生成訂單編號
        timestamp: new Date().toISOString(),

        recipientName: recipientName,
        recipientPhone: recipientPhone,
        address: address,

        buyerName: buyerName,
        buyerEmail: buyerEmail,
        buyerPhone: buyerPhone,
      };

      // 儲存 localStorage 供下一頁使用
      localStorage.setItem("orderData", JSON.stringify(orderDataForPayment));
      localStorage.setItem("finalAmount", finalAmount.toString());

      console.log("準備傳送的資料:", orderDataForPayment);
      console.log("userId:", userId);
      console.log("finalAmount:", finalAmount);
      console.log("recipientName:", recipientName);
      console.log("recipientPhone:", recipientPhone);
      console.log("address:", address);
      console.log("=== 信用卡付款數據檢查 ===");
      console.log("selectedCoupon:", selectedCoupon);
      console.log("selectedCoupon?.coupon_id:", selectedCoupon?.coupon_id);
      console.log(
        "orderDataForPayment.coupon_id:",
        orderDataForPayment.coupon_id
      );

      if (currentPaymentMethod === "信用卡") {
        router.push("/cart/ecpay/check");
      } else if (currentPaymentMethod === "超商付款") {
        // ✅ 超商付款：先建立訂單到資料庫
        const response = await fetch("http://localhost:3005/api/order/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...orderDataForPayment,
            payment_status: "pending", // 超商付款狀態為待付款
            payment_method: "超商付款",
          }),
        });

        const result = await response.json();

        if (result.success) {
          // 清理購物車
          localStorage.removeItem("cart");

          // 導向完成頁面（不需要 orderNo 參數）
          // 顯示處理中訊息
          Swal.fire({
            title: "訂單處理中...",
            text: "正在為您準備訂單完成頁面",
            icon: "success",
            allowOutsideClick: false,
            allowEscapeKey: false,
            showConfirmButton: false,
            timer: 3000, // 3 秒後自動關閉
            timerProgressBar: true,
            didOpen: () => {
              Swal.showLoading();
            }
          }).then(() => {

            router.push(`/cart/fin?orderNo=${result.orderNo}`);
          })
        } else {
          throw new Error(result.message || "訂單建立失敗");
        }
      }
    } catch (error) {
      console.error("準備支付失敗:", error);

      Swal.fire({
        title: "錯誤",
        text: error.message || "準備支付時發生錯誤，請稍後再試",
        icon: "error",
        confirmButtonText: "確定",
      });
    } finally {
      setLoading(false);
    }
  };

  if (type === "order") {
    return (
      <>
        <h5>總金額</h5>
        <div className="amount-list">
          <div className="pAmount">
            <p>商品總金額</p>
            <h6>${totalAmount}</h6>
          </div>
          <div className="choose-cp">
            <p>選擇優惠券</p>
            <CouponSelect onSelect={handleSelectCoupon} />
          </div>
          <div className="cp-discount">
            <p>優惠券折抵</p>
            <h6>${discountAmount}</h6>
          </div>
          <div className="t-line"></div>
          <div className="total">
            <h5 >總金額</h5>
            <h4>${finalAmount}</h4>
          </div>
          <div className="total phone">
            <h3>總金額</h3>
            <h3>${finalAmount}</h3>
          </div>
        </div>
        <div className="nextOrBack">
          <GreenButton step={"前往下一步"} to="/cart/detail" type="order" />
          <WhiteButton step={"繼續購物"} to="/products" />
        </div>
        <div className="nextOrBack-phone">
          <WhiteButton step={"繼續購物"} to="/products" />
          <GreenButton step={"前往下一步"} to="/cart/detail" type="order" />
        </div>
      </>
    );
  } else if (type === "detail") {
    return (
      <>
        <div className="h5">
          <h5>總金額</h5>
        </div>
        <div className="amount-list">
          <div className="pAmount">
            <p>商品總金額</p>
            <h6>${totalAmount}</h6>
          </div>
          <div className="cp-discount">
            <p>優惠券折抵</p>
            <h6>${discountAmount}</h6>
          </div>
          <div className="t-line"></div>
          <div className="total">
            <h6>總金額</h6>
            <h4>${finalAmount}</h4>
          </div>
          <div className="total phone">
            <h6>總金額</h6>
            <h5>${finalAmount}</h5>
          </div>
        </div>
        <div className="nextOrBack">
          <GreenButton
            step={"前往下一步"}
            to="/cart/ecpay/check"
            onClick={handleNext}
          />
          <WhiteButton step={"繼續購物"} to="/products" />
        </div>
        <div className="nextOrBack-phone">
          <WhiteButton step={"繼續購物"} to="/products" />
          <GreenButton
            step={"前往下一步"}
            to="/cart/ecpay/check"
            onClick={handleNext}
          />
        </div>
      </>
    );
  } else {
    return (
      <>
        <div className="amount-list fin">
          <div className="pAmount">
            <p>商品總金額</p>
            <h6>${totalAmount}</h6>
          </div>
          <div className="cp-discount">
            <p>優惠券折抵</p>
            <h6>${discountAmount}</h6>
          </div>
          <div className="t-line"></div>
          <div className="total">
            <h6>總金額</h6>
            <h5 style={{ width: "fit-content" }}>${finalAmount}</h5>
          </div>
        </div>
      </>
    );
  }
}
