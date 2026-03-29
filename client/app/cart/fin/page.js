"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useFetch } from "@/hooks/use-fetch";
import Link from "next/link";
import CartCard from "../_components/cartCard";
import Gradation from "../_components/gradation";
import GreenButton from "../_components/greenButton";
import Total from "../_components/total";
import WhiteButton from "../_components/whiteButton";
import "/styles/cart/cartFin.css";
import CartCoupon from "@/app/user/coupon/_components/CartCoupon";

function CartFinContent() {
  const [pageStatus, setPageStatus] = useState("loading"); // loading, success, error, default
  const [orderData, setOrderData] = useState(null);
  const [message, setMessage] = useState("處理中...");
  const [couponData, setCouponData] = useState([]);
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isCollapsed2, setIsCollapsed2] = useState(true);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };
  const toggleCollapse2 = () => {
    setIsCollapsed2(!isCollapsed2);
  };

  useEffect(() => {
    if (orderData) {
      console.log("=== orderData 已更新 ===");
      console.log("orderData 完整內容:", orderData);
      console.log("payment_method:", orderData.payment_method);
      console.log("recipient_name:", orderData.recipient_name);
      console.log("recipient_phone:", orderData.recipient_phone);
      console.log("address:", orderData.address);
      console.log("delivery_method:", orderData.delivery_method);
    }
  }, [orderData]);

  useEffect(() => {
    if (pageStatus === 'success' && orderData) {
      const clearCartDataAfterSuccess = () => {
        const loginToken = localStorage.getItem("reactLoginToken");
        const userData = localStorage.getItem("userData");

        const itemsToRemove = [
          "cart", "selectedCoupon", "orderData", "finalAmount",
          "buyer", "recipient", "store711", "payment", "delivery", "invoice"
        ];

        itemsToRemove.forEach(item => {
          localStorage.removeItem(item);
        });

        if (loginToken) localStorage.setItem("reactLoginToken", loginToken);
        if (userData) localStorage.setItem("userData", userData);

        console.log("✅ 訂單完成後清理購物車資料");
      };

      // 延遲清理，讓用戶看到完成頁面
      const timer = setTimeout(clearCartDataAfterSuccess, 2000);

      return () => clearTimeout(timer);
    }
  }, [pageStatus, orderData]);

  useEffect(() => {
    const userCoupons = localStorage.getItem("selectedCoupon");
    console.log("selectedCoupon 原始值:", userCoupons);
    console.log("selectedCoupon 類型:", typeof userCoupons);
    console.log("selectedCoupon 是否為 null:", userCoupons === null);

    if (userCoupons) {
      try {
        // 轉換成物件
        const couponData = JSON.parse(userCoupons);
        console.log("couponData", couponData);

        // 檢查是否為陣列，如果不是就轉成陣列
        if (Array.isArray(couponData)) {
          setCouponData(couponData);
        } else {
          // 單一優惠券物件，包裝成陣列
          setCouponData([couponData]);
        }
        // 使用資料
        console.log("取得優惠券資料:", couponData);
      } catch (error) {
        console.error("解析 localStorage 資料失敗:", error);
        setCouponData([]);
      }
    } else {
      console.log("沒有找到 selectedCoupon 資料");
      setCouponData([]);
    }
  }, []);

  useEffect(() => {
    console.log("頁面載入，檢查 URL 參數");
    console.log(
      "完整 URL:",
      typeof window !== "undefined" ? window.location.href : "SSR"
    );

    const orderNo = searchParams.get("orderNo");
    console.log("讀取到的 orderNo:", orderNo);

    // 如果沒有 orderNo，表示是直接訪問此頁面，顯示預設內容
    if (!orderNo) {
      console.log("沒有 orderNo，顯示預設頁面");
      setPageStatus("default");
      return;
    }

    // 如果有 orderNo，處理訂單流程
    handleOrderProcess(orderNo);
  }, [searchParams]);

  const handleOrderProcess = async (orderNo) => {
    try {
      console.log("開始處理訂單:", orderNo); // ✅ 移到開頭
      setMessage("正在確認付款並建立訂單..."); // ✅ 移到開頭


      // 在處理訂單前先保存優惠券數據
      const savedCoupons = localStorage.getItem("selectedCoupon");
      let parsedCoupons = [];

      if (savedCoupons) {
        try {
          const couponData = JSON.parse(savedCoupons);
          parsedCoupons = Array.isArray(couponData) ? couponData : [couponData];
        } catch (error) {
          console.error("解析優惠券數據失敗:", error);
        }
      }


      // 判斷訂單類型：根據 orderNo 格式或其他方式判斷
      const isEcpayOrder = orderNo.startsWith("ORD") && orderNo.length > 15; // 綠界訂單格式
      const isStorePaymentOrder = orderNo.startsWith("ORD") && orderNo.length <= 15; // 超商付款格式

      console.log("訂單類型判斷:");
      console.log("isEcpayOrder:", isEcpayOrder);
      console.log("isStorePaymentOrder:", isStorePaymentOrder);

      if (isEcpayOrder) {
        // === 綠界支付流程：需要先確認付款再創建訂單 ===
        console.log("=== 處理綠界支付訂單 ===");

        // 1. 確認付款並創建訂單（一步完成）
        const confirmResponse = await fetch(
          "http://localhost:3005/api/cart/ecpay/confirm",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ orderNo }),
          }
        );

        const confirmResult = await confirmResponse.json();
        console.log("確認結果:", confirmResult);

        if (!confirmResult.success) {
          setPageStatus("error");
          setMessage(confirmResult.message || "訂單確認失敗");
          return;
        }

        // 2. 從資料庫讀取剛創建的完整訂單資料
        setMessage("正在讀取訂單資料...");
        const orderResponse = await fetch(
          `http://localhost:3005/api/cart/orders/${confirmResult.orderId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        const orderResult = await orderResponse.json();
        console.log("API 回應:", orderResult);
        console.log("orderResult.data:", orderResult.data);

        if (!orderResult.success) {
          setPageStatus("error");
          setMessage("讀取訂單資料失敗: " + orderResult.message);
          return;
        }

        // 3. 設置成功狀態和資料（包含優惠券）
        console.log("設置訂單資料:", orderResult.data);

        const finalOrderData = {
          ...confirmResult,
          ...orderResult.data,
          usedCoupons: parsedCoupons, // 保存使用的優惠券
        };

        console.log("最終 orderData:", finalOrderData);

        setPageStatus("success");
        setOrderData(finalOrderData);
        setCouponData(parsedCoupons); // 確保 couponData 有數據

        console.log("✅ 訂單處理完成");
      } else {
        // === 超商付款流程：訂單已存在，直接讀取 ===
        console.log("=== 處理超商付款訂單 ===");
        try {

          const findOrderResponse = await fetch(
            `http://localhost:3005/api/order/find-order-by-number/${orderNo}`,
            { method: "GET", headers: { "Content-Type": "application/json" } }
          );

          if (!findOrderResponse.ok) {
            throw new Error("找不到訂單");
          }

          const findResult = await findOrderResponse.json();
          const orderId = findResult.data?.id;

          if (!orderId) {
            throw new Error("無法獲取訂單ID");
          }

          // 讀取訂單詳情
          const orderResponse = await fetch(
            `http://localhost:3005/api/cart/orders/${orderId}`,
            { method: "GET", headers: { "Content-Type": "application/json" } }
          );

          const orderResult = await orderResponse.json();
          if (!orderResult.success) {
            setPageStatus("error");
            setMessage("讀取訂單資料失敗: " + orderResult.message);
            return;
          }

          // 設置成功狀態
          setPageStatus("success");
          setOrderData({
            ...orderResult.data,
            usedCoupons: parsedCoupons,
          });
          setCouponData(parsedCoupons);

        } catch (error) {
          console.error("處理超商付款訂單失敗:", error);
          setPageStatus("error");
          setMessage("找不到訂單資料，請聯繫客服");
          return;
        }
      }

      console.log("訂單處理完成");

    } catch (error) {
      console.error("處理訂單時發生錯誤:", error);
      setPageStatus("error");
      setMessage("系統錯誤，請聯繫客服: " + error.message);
    }
  };

  // 格式化日期時間
  const formatDateTime = (dateString) => {
    if (!dateString) return new Date().toLocaleString("zh-TW");
    return new Date(dateString).toLocaleString("zh-TW");
  };

  // 添加這兩個函數來處理地址顯示
  const getAddressLabel = () => {
    return orderData?.delivery_method === "超商自取" ? "取貨門市" : "收件地址";
  };

  const getDisplayAddress = () => {
    // 直接顯示 address 欄位的內容
    // 如果是超商自取，address 已經是 "門市名稱 - 門市地址" 的格式
    // 如果是宅配，address 就是一般收件地址
    return orderData?.address || "地址載入中...";
  };

  // 載入中狀態
  if (pageStatus === "loading") {
    return (
      <div className="container-fluid">
        <Gradation />
        <div className="cart">
          <div className="main-side pc">
            <div className="cart-main-first pc">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <h4>處理付款結果中...</h4>
              <h6>{message}</h6>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 錯誤狀態
  if (pageStatus === "error") {
    return (
      <div className="container-fluid">
        <Gradation />
        <div className="cart">
          <div className="main-side pc">
            <div className="cart-main-first pc">
              <h4>處理失敗</h4>
              <i
                className="fa-regular fa-circle-xmark"
                style={{ color: "red", fontSize: "48px" }}
              ></i>
              <p>{message}</p>
              <div className="info-button pc" style={{ marginTop: "20px" }}>
                <button
                  onClick={() => router.push("/cart")}
                  className="btn" style={{ color: "var(--white)", backgroundColor: "var(--primary-05)" }}
                >
                  返回購物車
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 成功狀態或預設狀態 - 顯示訂單完成頁面
  return (
    <div className="container-fluid">
      <Gradation />
      <div className="cart">
        <div className="main-side pc">
          <div className="cart-main-first pc">
            <h2>完成訂單</h2>
            <i className="fa-regular fa-circle-check"></i>
            <h4>
              {pageStatus === "success"
                ? "您的付款已成功，訂單已建立！"
                : "您的訂單已成功成立，我們將盡快為您處理！"}
            </h4>
          </div>

          <div className="cart-main-first fin-card pc">
            <h5
              onClick={toggleCollapse}
              style={{
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              訂單編號:{" "}
              {orderData?.order_number || orderData?.orderNo}
              <span style={{
                fontSize: '14px',
                color: '#666',
                transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s ease'
              }}>
                ▼
              </span>
            </h5>

            {!isCollapsed && (
              <>
                {/* 顯示從資料庫取得的商品資料 */}

                < CartCard />

                <div className="orange-side fin pc">

                  <Total />
                </div>
              </>
            )}
          </div>

          <div className="cart-main-first fin-card pc">
            <h5
              onClick={toggleCollapse2}
              style={{
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >訂單資訊
              <span style={{
                fontSize: '14px',
                color: '#666',
                transform: isCollapsed2 ? 'rotate(-90deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s ease'
              }}>
                ▼
              </span>
            </h5>
            {!isCollapsed2 && (
              <div className="fin-info pc">
                <div className="orange-side pc">
                  <div className="information pc">
                    <div className="info-1 pc">
                      <h6>成立時間</h6>
                      <h6>付款狀態</h6>
                      <h6>付款方式</h6>
                    </div>
                    <div className="info-2 pc">
                      <p>{formatDateTime(orderData?.create_at)}</p>
                      <p>
                        {orderData?.payment_status === "paid"
                          ? "已付款"
                          : orderData?.payment_status === "pending"
                            ? "待付款"
                            : "未付款"}
                      </p>
                      <p>{orderData?.payment_method}</p>
                    </div>
                  </div>
                </div>
                <div className="orange-side pc">
                  <div className="information pc">
                    <div className="info-1 pc">
                      <h6>收件人</h6>
                      <h6>收件人電話</h6>
                      <h6>{getAddressLabel()}</h6>
                    </div>
                    <div className="info-2 pc">
                      <p>{orderData?.recipient_name}</p>
                      <p>{orderData?.recipient_phone}</p>
                      <p>{getDisplayAddress()}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="info-button pc">
            <WhiteButton
              step="檢視訂單詳情"
              to={"/user/order"}
            />
            <GreenButton
              step="繼續購物"
              onClick={() => router.push("/products")}
            />
          </div>
        </div>

        {/* 手機版 ---------------------------------------------- */}
        <div className="main-side phone">
          <div className="cart-main-first phone">
            <h2>完成訂單</h2>
            <i className="fa-regular fa-circle-check"></i>
          </div>
          <div className="cart-main-first fin-card phone">
            <table className="fin-card-table">
              <tbody>
                <tr>
                  <th className="fin-card-title">
                    <i className="fa-solid fa-list-ul"></i>
                    <h6>訂單資訊</h6>
                  </th>
                </tr>
                <tr>
                  <td>
                    <table className="fin-card-details">
                      <tbody>
                        <tr>
                          <td>訂單編號</td>
                          <td>
                            {orderData?.order_number || orderData?.orderNo}
                          </td>
                        </tr>
                        <tr>
                          <td>訂單金額</td>
                          <td>
                            NT$
                            {orderData?.total_amount?.toLocaleString() || "0"}
                          </td>
                        </tr>
                        <tr>
                          <td>商品數量</td>
                          <td>{orderData?.items?.length || 1} 項商品</td>
                        </tr>
                        <tr>
                          <td>詳細資訊</td>
                          <td>
                            <Link href={"/user/order"}>
                              前往查看
                            </Link>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
                <tr>
                  <th className="fin-card-title">
                    <i className="fa-regular fa-credit-card"></i>
                    <h6>付款資訊</h6>
                  </th>
                </tr>
                <tr>
                  <td>
                    <table className="fin-card-details">
                      <tbody>
                        <tr>
                          <td>付款方式</td>
                          <td>{orderData?.payment_method}</td>
                        </tr>
                        <tr>
                          <td>付款狀態</td>
                          <td>
                            {orderData?.payment_status === "paid"
                              ? "已付款"
                              : orderData?.payment_status === "pending"
                                ? "待付款"
                                : "未付款"}
                          </td>
                        </tr>
                        <tr>
                          <td>付款時間</td>
                          <td>
                            {formatDateTime(
                              orderData?.create_at
                            )}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td className="info-button">
                    <WhiteButton
                      step="繼續選購"
                      to="/products"
                    />
                    <p>
                      感謝訂購 Oakly 的商品，
                      {pageStatus === "success"
                        ? "付款已完成，我們會為您盡快處理"
                        : "已完成交易，我們會為您盡快處理"}
                    </p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div >
  );
}

export default function CartFinPage() {
  return (
    <Suspense
      fallback={
        <div className="container-fluid">
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100vh",
            }}
          >
            <div>載入中...</div>
          </div>
        </div>
      }
    >
      <CartFinContent />
    </Suspense>
  );
}
