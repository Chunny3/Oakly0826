"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import "@/styles/cart/editInfo.css";

export default function EditInfoRecipient({ type, onClose }) {
  // 抓會員資料 + 更新函式
  const { user, updateUser } = useAuth();
  const [isClient, setIsClient] = useState(false); // 追蹤是否在客戶端
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    postcode: "",
    city: "",
    address: "",
  });

  // 確保只在客戶端執行
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 取得完整資料的函數，只在客戶端執行
  const getFullUserData = () => {
    if (!isClient) return null; // 伺服器端直接返回 null

    // 優先讀取 localStorage
    try {
      const savedUser = localStorage.getItem("user");
      if (savedUser) {
        const parsedUser = JSON.parse(savedUser);
        console.log("從 localStorage 讀取到的資料:", parsedUser);
        return parsedUser;
      }
    } catch (error) {
      console.log("讀取 localStorage 失敗:", error);
    }
    // localStorage 沒資料才用 useAuth 的 user
    console.log("使用 useAuth 的 user:", user);
    return user;
  };

  useEffect(() => {
    if (!isClient) return; // 確保只在客戶端執行

    const fullUserData = getFullUserData();
    console.log("完整用戶資料:", fullUserData);

    if (fullUserData) {
      const recipientData = {
        name: fullUserData.recipient?.name || "",
        phone: fullUserData.recipient?.phone || "",
        postcode: fullUserData.recipient?.postcode || "",
        city: fullUserData.recipient?.city || "",
        address: fullUserData.recipient?.address || "",
      };
      console.log("recipient formData:", recipientData);
      setFormData(recipientData);
    }
  }, [user, isClient]);

  // 除錯：檢查 user 資料
  console.log("user:", user);
  console.log("user.buyer:", user?.buyer);
  console.log("user.recipient:", user?.recipient);


  const cleanType = String(type).trim();

  const handleSave = () => {
    // 更新 user 資料
    updateUser({ recipient: formData });

    // 延遲一點重新初始化表單（等待 updateUser 完成）
    setTimeout(() => {
      const fullUserData = getFullUserData();
      if (fullUserData?.recipient) {
        const recipientData = {
          name: fullUserData.recipient.name || "",
          phone: fullUserData.recipient.phone || "",
          postcode: fullUserData.recipient.postcode || "",
          city: fullUserData.recipient.city || "",
          address: fullUserData.recipient.address || "",
        };
        setFormData(recipientData);
      }
    }, 100);
    window.location.reload();
    onClose();
  };

  return (
    <div className="overlay">
      <div className="list">
        <h3 className="title">編輯資料</h3>

        {/* 訂購人 --------------------*/}
        {/* 表單欄位 */}
        <h6>收件人</h6>
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
          <label>郵遞區號</label>
          <input
            type="text"
            value={formData.postcode}
            onChange={(e) =>
              setFormData({ ...formData, postcode: e.target.value })
            }
          />
        </div>

        <div className="form-row">
          <label>地區</label>
          <input
            type="text"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
          />
        </div>

        <div className="form-row">
          <label>地址</label>
          <input
            type="text"
            value={formData.address}
            onChange={(e) =>
              setFormData({ ...formData, address: e.target.value })
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
