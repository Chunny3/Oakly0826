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

    if (storedCoupon && storedCoupon !== "null" & storedCoupon !== "undefined") {
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
          calculatedDiscount(couponData);
        } else {
          // 沒有優惠券，重置折扣
          setSelectedCoupon(null);
          setDiscountAmount(0);
        }
      } catch (error) {
        console.log("讀取優惠券失敗:", error);
        setSelectedCoupon(null);
        setDiscountAmount(0);
      }
    };
    loadCouponData();
  }, [totalAmount]);

  const calculatedDiscount = (coupon) => {
    if (!coupon || !totalAmount) {
      setDiscountAmount(0);
      return;
    }
    let discount = 0;

    // 根據優惠券類型計算折扣
    if (coupon.discountType === "percentage") {
      // 百分比折扣 (例如：10% = 0.1)
      discount = Math.floor(totalAmount * coupon.discountValue);
    } else if (coupon.discountType === "fixed") {
      // 固定金額折扣
      discount = Math.min(coupon.discountValue, totalAmount);
    }
    setDiscountAmount(discount);
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
    console.log("選擇的優惠券:", coupon);
    // 將選中的優惠券存到 localStorage
    localStorage.setItem("selectedCoupon", JSON.stringify(coupon));
    setSelectedCoupon(coupon);
    calculatedDiscount(coupon);
    // 將選中的優惠券存到 localStorage
    localStorage.setItem("selectedCoupon", JSON.stringify(coupon));
    setSelectedCoupon(coupon);
    calculatedDiscount(coupon);
  };

  // 修正 handleNext 函數，只準備數據，不直接調用 API
  const handleNext = async () => {
    try {
      setLoading(true);

      // 驗證必要數據
      if (!userId) {
        throw new Error("請先登入")
      }

      if (!items || items.length === 0) {
        throw new Error("購物車為空");
      }

      // 準備完整的訂單資料並存到 localStorage
      const orderDataForPayment = {
        userId: userId,
        items: items,
        totalAmount: finalAmount,
        originalAmount: totalAmount,
        coupon: selectedCoupon,
        discountAmount: discountAmount,
        paymentMethod: paymentMethod,
        delivery: delivery,
        orderNo: `ORD${Date.now()}`, // 生成訂單編號
        timestamp: new Date().toISOString()
      };

      // 儲存 localStorage 供下一頁使用
      localStorage.setItem("orderData", JSON.stringify(orderDataForPayment));
      localStorage.setItem("finalAmount", finalAmount.toString());

      console.log("準備的訂單資料:", orderDataForPayment);

      // 導向付款確認頁面
      if (paymentMethod === "信用卡") {
        router.push("/cart/ecpay/check");
      } else {
        // 其他支付方式的處理
        console.log("使用其他支付方式:", paymentMethod);

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
            <CouponSelect onSelectCoupon={handleSelectCoupon} />
          </div>
          <div className="cp-discount">
            <p>優惠券折抵</p>
            <h6>-${discountAmount}</h6>
          </div>
          <div className="t-line"></div>
          <div className="total">
            <h5>總金額</h5>
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
            <h6>-${discountAmount}</h6>
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
          <GreenButton step={"前往下一步"} to="/cart/ecpay/check" onClick={handleNext} />
          <WhiteButton step={"繼續購物"} to="/products" />
        </div>
        <div className="nextOrBack-phone">
          <WhiteButton step={"繼續購物"} to="/products" />
          <GreenButton step={"前往下一步"} to="/cart/detail" />
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
            <h6>-${discountAmount}</h6>
          </div>
          <div className="t-line"></div>
          <div className="total">
            <h6>總金額</h6>
            <h6>${finalAmount}</h6>
          </div>
        </div>
      </>
    );
  }
}