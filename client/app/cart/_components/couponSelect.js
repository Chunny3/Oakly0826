"use client";

import { useEffect, useState } from "react";
import { useFetch } from "@/hooks/use-fetch";
import { useRouter } from "next/navigation";
import { useCart } from "@/hooks/use-cart";
import Swal from "sweetalert2";
import "@/styles/cart/couponSelect.css";
import CartCoupon from "@/app/user/coupon/_components/CartCoupon";

export default function CouponSelect({ coupons, onSelect }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [token, setToken] = useState(null);
  const [userStr, setUserStr] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState(null);

  const router = useRouter();
  const { totalAmount } = useCart(); // 獲取當前購物車總金額

  const handleSelect = (coupon) => {
    // 如果點擊的是已選中的優惠券，則取消選擇
    if (selectedCoupon && selectedCoupon.id === coupon.id) {
      setSelectedCoupon(null);
      if (onSelect) onSelect(null);
      return;
    }
    // ✅ 檢查總金額是否符合優惠券最低使用條件
    if (coupon.min_discount && totalAmount < coupon.min_discount) {
      console.log("❌ 總金額不足，無法使用此優惠券");

      // 顯示錯誤提示
      Swal.fire({
        title: "優惠券無法使用",
        html: `
          <div style="text-align: left; line-height: 1.6;">
            <p><strong>優惠券：</strong>${coupon.name}</p>
            <p><strong>使用條件：</strong>需滿 $${coupon.min_discount} 元</p>
            <p><strong>目前金額：</strong>$${totalAmount} 元</p>
            <p style="color: #ff6b35; margin-top: 15px;">
              <i class="fa fa-exclamation-triangle"></i>
              還需要再購買 $${coupon.min_discount - totalAmount} 元才能使用此優惠券
            </p>
          </div>
        `,
        icon: "warning",
        confirmButtonText: "我知道了",
        confirmButtonColor: "#3085d6",
        showCancelButton: true,
        cancelButtonText: "繼續購物",
        cancelButtonColor: "#6c757d",
      }).then((result) => {
        if (result.dismiss === Swal.DismissReason.cancel) {
          // 用戶選擇繼續購物，關閉優惠券選擇器並跳轉
          setIsOpen(false);
          router.push("/products");
        }
      });

      return; // 中斷選擇流程
    }

    console.log("✅ 總金額符合條件，可以使用此優惠券");


    // 轉換優惠券數據格式以匹配 Total 組件的期待
    const normalizedCoupon = {
      id: coupon.id,
      coupon_id: coupon.coupon_id,
      name: coupon.name,
      code: coupon.code || `COUPON${coupon.id}`,
      discountType: coupon.discount_type === 1 ? "fixed" : "percentage",
      discountValue: coupon.discount_type === 1
        ? parseInt(coupon.discount)
        : parseFloat(coupon.discount * 100), // 注意：這裡假設資料庫儲存的是小數格式（如 0.1 代表 10%）
      minDiscount: coupon.min_discount,
      expireAt: coupon.expire_at,
      categoryNames: coupon.category_names
    };

    console.log("轉換後的優惠券格式:", normalizedCoupon);

    // 否則選擇新的優惠券
    setSelectedCoupon(normalizedCoupon);
    if (onSelect) onSelect(normalizedCoupon);
  
};
const handleConfirm = () => {
  setIsOpen(false);
  // 儲存到 localStorage
  if (selectedCoupon) {
    const couponData = {
      ...selectedCoupon,
      selectedAt: new Date().toISOString(),
      isUsed: false,
    };
    localStorage.setItem("selectedCoupon", JSON.stringify(couponData));
    console.log("儲存的優惠券資料:", couponData);

    // 立即通知父組件
    if (onSelect) {
      onSelect(couponData);
    }
  } else {
    // 如果沒有選擇優惠券，清除 localStorage
    localStorage.removeItem("selectedCoupon");
  }
};

// 取消選擇優惠券
const handleClearSelection = () => {
  setSelectedCoupon(null);
  if (onSelect) onSelect(null);
  localStorage.removeItem("selectedCoupon");
};

// 處理登入
useEffect(() => {
  try {
    const tokenFromStorage = localStorage.getItem("reactLoginToken");
    const userFromStorage = localStorage.getItem("user");

    setToken(tokenFromStorage);
    setUserStr(userFromStorage);

    // 解析用戶資料並設定 userId
    if (userFromStorage) {
      const user = JSON.parse(userFromStorage);
      const id = user?.id;
      setUserId(id);
      console.log("userId=", userId);
    }

    // 載入已選擇的優惠券
    const saveCoupon = localStorage.getItem("selectedCoupon");
    if (saveCoupon) {
      try {
        const couponData = JSON.parse(saveCoupon);
        setSelectedCoupon(couponData);
        if (onSelect) onSelect(couponData);
      } catch (error) {
        console.log("載入已選擇優惠券失敗", error);
      }
    }

    //沒登入的跳轉
    if (!tokenFromStorage || !userFromStorage) {
      router.push("/auth/login");
      return;
    }
    setIsLoading(false);
  } catch (error) {
    console.log("初始化錯誤:", error);
    setIsLoading(false);
  }
}, [router]);

// 使用 useFetch 獲取優惠券資料
const userCanUseCoupons = useFetch(
  userId
    ? `http://localhost:3005/api/user/coupons/status/canUse/${userId}`
    : null
);
//解析token
if (isLoading || !token || !userStr) {
  return <div>載入中...</div>;
}
if (!userCanUseCoupons) {
  console.log("沒有載入優惠券", userCanUseCoupons);
}

// 檢查是否有錯誤
// if (userCanUseCoupons.error) {
//     console.error("載入使用者優惠券失敗:", userCanUseCoupons.error);
// }
// 取得使用者 fetch
const userCoupons = userCanUseCoupons.data ? userCanUseCoupons.data.data : [];
console.log("使用者的優惠券資料", userCoupons);

// 如果沒有可用的優惠券，不顯示選擇優惠券的功能
if (!userCoupons || userCoupons.length === 0) {
  console.log("使用者沒有可用的優惠券");
}

return (
  <>
    {/* 按鈕可以放在 page 裡 */}
    <div className="coupon-select-container">
      <button className="choose-coupon" onClick={() => setIsOpen(true)}>
        {selectedCoupon
          ? `已選擇: ${selectedCoupon.discountType === "fixed"
            ? `${selectedCoupon.discountValue}元`
            : `${selectedCoupon.discountValue}折`
          } 優惠券`
          : "選擇優惠券"}
      </button>

      {/* 如果有選擇優惠券，顯示取消按鈕 */}
      {selectedCoupon && (
        <button
          className="clear-coupon-btn"
          onClick={handleClearSelection}
          title="取消選擇優惠券"
        >
          <i className="fa-solid fa-times"></i>
        </button>
      )}
    </div>

    {isOpen && (
      <div className="overlay">
        <div className="my-coupon">
          {/* X 關閉按鈕 */}
          {/* <button className="closeButton" onClick={() => setIsOpen(false)}>
                            <i className="fa-solid fa-xmark"></i>
                        </button> */}
          <h5>選擇可用優惠券</h5>
          <div className="my-coupon-line"></div>
          {/* <ul>
                            {coupons.map((coupon) => (
                                <li key={coupon.id}>
                                    <button
                                        className="couponButton"
                                        onClick={() => handleSelect(coupon)}
                                    >
                                        {coupon.code} - {coupon.desc}
                                    </button>
                                </li>
                            ))}
                        </ul> */}
          {/* 優惠券列表 */}
          <div className="coupons-container">
            {userCoupons.map((coupon) => (
              <div
                key={coupon.id}
                className={`cart-coupon ${selectedCoupon && selectedCoupon.id === coupon.id
                  ? "selected"
                  : ""
                  }`}
                onClick={() => handleSelect(coupon)}
              >
                {/* 選中標記 */}
                {selectedCoupon && selectedCoupon.id === coupon.id && (
                  <div className="selected-check">
                    <i className="fa-solid fa-check"></i>
                  </div>
                )}

                <CartCoupon
                  key={coupon.id}
                  tag={
                    coupon.category_names &&
                      coupon.category_names.split(",").length >= 6
                      ? "全館適用"
                      : `${coupon.category_names}適用`
                  }
                  name={coupon.name}
                  smallCost={`滿 $${coupon.min_discount} 使用`}
                  date={` ${coupon.expire_at.split("T")[0]}到期`}
                  costCate1={coupon.discount_type === 1 ? "$ " : ""}
                  cost={
                    coupon.discount_type === 1
                      ? parseInt(coupon.discount)
                      : parseInt(coupon.discount * 100)
                  }
                  costCate2={coupon.discount_type === 1 ? "" : " 折"}
                />
              </div>
            ))}
          </div>
          {/* 底部按鈕區 */}
          <div className="coupon-modal-footer">
            {/* {selectedCoupon && (
                                <button
                                    className="clear-selection-btn"
                                    onClick={() => setSelectedCoupon(null)}
                                >
                                    不使用優惠券
                                </button>
                            )} */}
            <button className="confirm-selection-btn" onClick={handleConfirm}>
              {selectedCoupon ? "確認選擇" : "關閉"}
            </button>
          </div>
        </div>
      </div>
    )}
  </>
);
}
