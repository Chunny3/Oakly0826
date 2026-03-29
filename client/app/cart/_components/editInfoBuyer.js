"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import "@/styles/cart/editInfo.css";

export default function EditInfo({ type, onClose }) {
  // 抓會員資料 + 更新函式
  const { user, updateUser } = useAuth();
  const [isClient, setIsClient] = useState(false); // 追蹤是否在客戶端
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    postcode: "",
    city: "",
    address: "",
    email: "",
  });

  // 確保只在客戶端執行
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 取得完整資料的函數，只在客戶端執行
  const getFullUserData = () => {
    if (!isClient) return null; // 伺服器端直接返回 null

    if (user?.phone) {
      return user; // useAuth 有完整資料就用它
    }
    // 否則讀取 localStorage
    try {
      const savedUser = localStorage.getItem("user");
      return savedUser ? JSON.parse(savedUser) : user;
    } catch (error) {
      console.log("讀取 localStorage 失敗:", error);
      return user;
    }
  };

  useEffect(() => {
    if (!isClient) return; // 確保只在客戶端執行

    const fullUserData = getFullUserData();
    console.log("完整用戶資料:", fullUserData);

    if (fullUserData) {
      // 檢查是否有有效的 buyer 資料
      const hasBuyer =
        fullUserData.buyer &&
        (fullUserData.buyer.name ||
          fullUserData.buyer.phone ||
          fullUserData.buyer.email);

      const buyerData = hasBuyer
        ? {
            // 有 buyer 就用 buyer 資料
            name: fullUserData.buyer.name || "",
            phone: fullUserData.buyer.phone || "",
            email: fullUserData.buyer.email || "",
          }
        : {
            // 沒有 buyer 就用 user 資料
            name: fullUserData.name || "",
            phone: fullUserData.phone || "",
            email: fullUserData.email || "",
          };
      console.log("buyer formData:", buyerData);
      setFormData(buyerData);
    }
  }, [user, isClient]);

  // 除錯：檢查 user 資料
  console.log("user:", user);
  console.log("user.buyer:", user?.buyer);
  console.log("user.recipient:", user?.recipient);

  // 沒有抓到 user 資料
  if (!isClient || !user) {
    return (
      <div className="overlay">
        <div className="list">
          <div>載入中...</div>
        </div>
      </div>
    );
  }
  const cleanType = String(type).trim();

  const handleSave = () => {
    // 更新 user 資料

    updateUser({ buyer: formData });
    window.location.reload();
    onClose();
  };

  return (
    <div className="overlay">
      <div className="list">
        <h3 className="title">編輯資料</h3>

        {/* 訂購人 --------------------*/}
        {/* 表單欄位 */}
        <h6>訂購人</h6>
        <div className="form-row">
          <label>姓名</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>

        <div className="form-row">
          <label>電話</label>
          <input
            type="text"
            value={formData.phone}
            onChange={(e) =>
              setFormData({ ...formData, phone: e.target.value })
            }
          />
        </div>

        <div className="form-row">
          <label>Email</label>
          <input
            type="text"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
          />
        </div>

        {/* 按鈕 */}
        <div className="form-actions">
          <button onClick={onClose} className="cancel">
            取消
          </button>
          <button onClick={handleSave} className="save">
            儲存
          </button>
        </div>
      </div>
    </div>
  );
}
