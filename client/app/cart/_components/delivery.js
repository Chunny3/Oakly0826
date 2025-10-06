"use client";

import "@/styles/cart/delivery.css";
import { useEffect, useState } from "react";
import { useShip711StoreOpener } from "@/hooks/use-711-store.js"; // 根據你的路徑調整

export default function Delivery() {
  const [showForm, setShowForm] = useState(false);
  // 先讀 localStorage，初始值如果沒存過就空字串
  const [selectedDelivery, setSelectedDelivery] = useState("");
  const [callbackUrl, setCallbackUrl] = useState(""); //改名為 callbackUrl

  // 在客戶端獲取完整的回調 URL
  useEffect(() => {
    if (typeof window !== "undefined") {
      // 使用 cloudflare 臨時 tunnel，每次重啟都會變
      const CLOUDFLARE_URL =
        "https://vault-tube-protection-investigated.trycloudflare.com";

      // 組成完整的 URL，包含 protocol + host + path
      const fullCallbackUrl = `${CLOUDFLARE_URL}/api/ship/711/callback`;
      setCallbackUrl(fullCallbackUrl);
      console.log("🔗 設定回調 URL:", fullCallbackUrl);

      // 測試你的 Cloudflare Tunnel 是否正常
      const testUrl = `${CLOUDFLARE_URL}/api/ship/711/test`;
      fetch(testUrl)
        .then(response => response.json())
        .then(data => {
          console.log('✅ Cloudflare Tunnel 連線成功:', data);
        })
        .catch(error => {
          console.error('❌ Cloudflare Tunnel 連線失敗:', error);
        });
    }
  }, []);

  // 整合 7-11 門市選擇功能
  const { store711, openWindow } = useShip711StoreOpener(
    callbackUrl || null, // 駔動組成回調 API 路由
    { autoCloseMins: 3 }
  );

  // 在瀏覽器渲染後再讀取 localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedDelivery = localStorage.getItem("delivery");
      if (savedDelivery) {
        setSelectedDelivery(savedDelivery);
      }
    }
  }, []);

  useEffect(() => {
    if (selectedDelivery) {
      localStorage.setItem("delivery", selectedDelivery);
    }
  }, [selectedDelivery]);

  // 安全的開啟視窗函數
  const handleOpenWindow = () => {
    if (!callbackUrl) {
      console.error("❌ 回調 URL 還沒準備好");
      alert("系統還在載入中，請稍後再試");
      return;
    }

    console.log("🚀 開啟門市選擇");
    console.log("📍 使用回調 URL:", callbackUrl);
    openWindow();
  };

  return (
    <>
      <div className="delivery pc">
        <h4>運送方式</h4>
        <div className="d-list pc">
          <div className="form-check pc">
            <input
              className="form-check-input pc"
              type="radio"
              name="delivery"
              id="radioDefault1"
              checked={selectedDelivery === "宅配"}
              onChange={() => setSelectedDelivery("宅配")}
            />
            <label className="form-check-label pc" htmlFor="radioDefault1">
              <h6>宅配</h6>
            </label>
          </div>
          <p>運費 120 元，商品金額滿 1000 元免運費。</p>
        </div>
        <div className="d-list pc">
          <div className="form-check pc">
            <input
              className="form-check-input pc"
              type="radio"
              name="delivery"
              id="radioDefault2"
              checked={selectedDelivery === "超商自取"}
              onChange={() => setSelectedDelivery("超商自取")}
            />
            <label className="form-check-label pc" htmlFor="radioDefault2">
              <h6>超商自取</h6>
            </label>
          </div>
          <p>
            超商取貨之包裹規格限制為重量不超過 5
            公斤（含包裝），三邊長度合計不得超過 105 公分，且最長邊長度不得超過
            45 公分。
          </p>
          {/* 7-11 門市選擇區塊 */}
          {selectedDelivery === "超商自取" && (
            <div
              className="store-selection pc"
              style={{
                marginTop: "15px",
                padding: "15px",
                backgroundColor: "#f8f9fa",
                borderRadius: "5px",
                border: "1px solid #dee2e6",
              }}
            >
              <button
                type="button"
                onClick={openWindow}
                style={{
                  background: "var(--primary-01)",
                  color: "white",
                  border: "none",
                  padding: "8px 16px",
                  borderRadius: "4px",
                  cursor: "pointer",
                  marginBottom: "10px",
                }}
              >
                {store711.storename ? "重新選擇門市" : "選擇 7-11 門市"}
              </button>

              {store711.storename ? (
                <div style={{ fontSize: "14px" }}>
                  <p style={{ margin: "5px 0", color: "#28a745" }}>
                    <strong>✓ 已選擇門市：</strong>
                    {store711.storename}
                  </p>
                  <p style={{ margin: "5px 0", color: "#6c757d" }}>
                    <strong>地址：</strong>
                    {store711.storeaddress}
                  </p>
                </div>
              ) : (
                <p
                  style={{
                    fontSize: "14px",
                    color: "#dc3545",
                    margin: "5px 0",
                  }}
                >
                  請選擇取貨門市
                </p>
              )}
            </div>
          )}
        </div>
      </div>
      {/* 手機------------------------------------- */}
      <div className="delivery phone">
        <button
          className={`toggleBtn ${showForm ? "active" : ""} phone`}
          onClick={() => {
            setShowForm(!showForm);
          }}
          id="toggleBtn"
        >
          <h4>運送方式</h4>
        </button>
        {showForm && (
          <>
            <div className="d-lists phone">
              <div className="d-list phone">
                <div className="form-check phone">
                  <input
                    className="form-check-input phone"
                    type="radio"
                    name="delivery"
                    id="radioDefault1"
                    checked={selectedDelivery === "宅配"}
                    onChange={() => setSelectedDelivery("宅配")}
                  />
                  <label
                    className="form-check-label phone"
                    htmlFor="radioDefault1"
                  >
                    <h6>宅配</h6>
                  </label>
                </div>
                <p>運費 120 元，商品金額滿 1000 元免運費。</p>
              </div>
              <div className="d-list phone">
                <div className="form-check phone">
                  <input
                    className="form-check-input phone"
                    type="radio"
                    name="delivery"
                    id="radioDefault2"
                    checked={selectedDelivery === "超商自取"}
                    onChange={() => setSelectedDelivery("超商自取")}
                  />
                  <label
                    className="form-check-label phone"
                    htmlFor="radioDefault2"
                  >
                    <h6>超商自取</h6>
                  </label>
                </div>
                <p>
                  超商取貨之包裹規格限制為重量不超過 5
                  公斤（含包裝），三邊長度合計不得超過 105
                  公分，且最長邊長度不得超過 45 公分。
                </p>
                {selectedDelivery === "超商自取" && (
                  <div
                    className="store-selection phone"
                    style={{
                      marginTop: "15px",
                      padding: "15px",
                      backgroundColor: "#f8f9fa",
                      borderRadius: "5px",
                    }}
                  >
                    <button
                      type="button"
                      onClick={openWindow}
                      style={{
                        background: "var(--primary-01)",
                        color: "white",
                        border: "none",
                        padding: "10px",
                        borderRadius: "4px",
                        cursor: "pointer",
                        width: "100%",
                        marginBottom: "10px",
                      }}
                    >
                      {store711.storename ? "重新選擇門市" : "選擇 7-11 門市"}
                    </button>

                    {store711.storename ? (
                      <div style={{ fontSize: "13px" }}>
                        <p style={{ margin: "5px 0", color: "#28a745" }}>
                          <strong>✓ 已選擇：</strong>
                          {store711.storename}
                        </p>
                        <p
                          style={{
                            margin: "5px 0",
                            color: "#6c757d",
                            fontSize: "12px",
                          }}
                        >
                          {store711.storeaddress}
                        </p>
                      </div>
                    ) : (
                      <p
                        style={{
                          fontSize: "13px",
                          color: "#dc3545",
                          margin: "5px 0",
                        }}
                      >
                        請選擇取貨門市
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
