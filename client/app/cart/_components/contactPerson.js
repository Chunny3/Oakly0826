"use client";

import "@/styles/cart/contactPerson.css";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import EditInfoBuyer from "./editInfoBuyer";
import EditInfoRecipient from "./editInfoRecipient";

export default function ContactPerson() {
  const { updateUser } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [isOpenB, setIsOpenB] = useState(false);
  const [isOpenR, setIsOpenR] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false); //添加載入狀態
  const [buyer, setBuyer] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
  });
  const [recipient, setRecipient] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
  });

  // 從 localStorage 讀取用戶資料
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem("user");
      const userList = JSON.parse(savedUser);

      // 只從 user 裡讀取 buyer，不要分別儲存
      const hasBuyerData =
        userList.buyer &&
        (userList.buyer.name || userList.buyer.phone || userList.buyer.email);

      if (hasBuyerData) {
        setBuyer({
          name: userList.buyer.name || "",
          phone: userList.buyer.phone || "",
          email: userList.buyer.email || "",
          address:
            userList.buyer.address ||
            `${userList.buyer.postcode || ""}${userList.buyer.city || ""}${
              userList.buyer.area || ""
            }${userList.buyer.address || ""}`,
        });
      } else {
        // 使用 user 基本資料
        setBuyer({
          name: userList.name || "",
          phone: userList.phone || "",
          email: userList.email || "",
          address: `${userList.postcode || ""}${userList.city || ""}${
            userList.area || ""
          }${userList.address || ""}`,
        });
      }

      // 只從 user 裡讀取 recipient，不要分別儲存
      const hasRecipientData =
        userList.recipient &&
        (userList.recipient.name || userList.recipient.phone);

      // 讀取 recipient 資料
      if (hasRecipientData) {
        setRecipient({
          name: userList.recipient.name || "",
          phone: userList.recipient.phone || "",
          address: `${userList.recipient.postcode || ""}${
            userList.recipient.city || ""
          }${userList.recipient.address || ""}`,
        });
      }
      setIsLoaded(true); // ← 重要：設置載入完成
    } catch (error) {
      console.log("讀取 localStorage 失敗:", error);
      setIsLoaded(true); // ← 重要：設置載入完成
    }
  }, []);

  // 同步 buyer 到 localStorage
  useEffect(() => {
    if (!isLoaded) return; // 重要：防止初始化時覆蓋資料

    if (buyer.name || buyer.phone || buyer.email || buyer.address) {
      localStorage.setItem("buyer", JSON.stringify(buyer));
    }
  }, [buyer, isLoaded]);

  // 同步 recipient 到 localStorage
  useEffect(() => {
    if (!isLoaded) return; // 重要：防止初始化時覆蓋資料

    if (recipient.name || recipient.phone || recipient.address) {
      try {
        // 讀取現有的 user 資料
        const savedUser = localStorage.getItem("user");
        const userList = savedUser ? JSON.parse(savedUser) : {};

        // 更新 user 中的 recipient
        const updatedUser = {
          ...userList,
          recipient: recipient,
        };

        // 存回 localStorage
        localStorage.setItem("user", JSON.stringify(updatedUser));
        localStorage.setItem("recipient", JSON.stringify(recipient));
        console.log("儲存 recipient 到 user:", updatedUser);
      } catch (error) {
        console.log("儲存 recipient 失敗:", error);
      }
    }
  }, [recipient, isLoaded]);

  const handleSamePerson = (e) => {
    if (e.target.checked) {
      setRecipient({
        name: buyer.name || "",
        phone: buyer.phone || "",
        address: `${buyer.postcode || ""}${buyer.city || ""}${
          buyer.area || ""
        }${buyer.address || ""}`,
      });
    } else {
      setRecipient({
        name: "",
        phone: "",
        address: "",
      });
    }
  };

  return (
    <>
      <div className="contact-person pc">
        <h4>聯絡人資訊</h4>
        <div className="contact pc">
          <div className="contact-detail1 pc">
            <div className="details pc">
              <div className="detail-one pc">
                <p>訂購人</p>
                <h6>{buyer.name || ""}</h6>
              </div>
              <div className="detail-one pc">
                <p>手機號碼</p>
                <h6>{buyer.phone || ""}</h6>
              </div>
              <div className="detail-one pc">
                <p>Email (訂單通知、電子發票寄送)</p>
                <h6>{buyer.email || ""}</h6>
              </div>
            </div>
            <button
              className="detail-button pc"
              onClick={() => {
                setIsOpenB(!isOpenB);
              }}
            >
              <p>編輯</p>
            </button>
            {isOpenB && <EditInfoBuyer onClose={() => setIsOpenB(false)} />}
          </div>
          <div className="contact-line pc"></div>
          <div className="contact-detail2 pc">
            <div className="details pc">
              <div className="same-person pc">
                <input type="checkbox" onChange={handleSamePerson} />
                <p>同訂購人</p>
              </div>
              <div className="detail-one pc">
                <p>收件人</p>
                <h6>{recipient.name || ""}</h6>
              </div>
              <div className="detail-one pc">
                <p>手機號碼</p>
                <h6>{recipient.phone || ""}</h6>
              </div>
              <div className="detail-one pc">
                <p>地址</p>
                <h6>{recipient.address || ""}</h6>
              </div>
            </div>
            <button
              className="detail-button pc"
              onClick={() => setIsOpenR(!isOpenR)}
            >
              <p>編輯</p>
            </button>
            {isOpenR && <EditInfoRecipient onClose={() => setIsOpenR(false)} />}
          </div>
        </div>
      </div>
      {/* 手機版 */}
      <div className="contact-person phone">
        <button
          className={`toggleBtn ${showForm ? "active" : ""} phone`}
          onClick={() => {
            setShowForm(!showForm);
          }}
          id="toggleBtn"
        >
          <h4>聯絡人資訊</h4>
        </button>

        {showForm && (
          <div className="contact phone">
            <div className="contact-detail phone">
              <div className="details phone">
                <div className="detail-one phone">
                  <p>訂購人</p>
                  <h6>{buyer.name}</h6>
                </div>
                <div className="detail-one phone">
                  <p>手機號碼</p>
                  <h6>{buyer.phone}</h6>
                </div>
                <div className="detail-one phone">
                  <p>Email (訂單通知、電子發票寄送)</p>
                  <h6>{buyer.email}</h6>
                </div>
                <div className="detail-one phone">
                  <p>地址</p>
                  <h6>{buyer.address}</h6>
                </div>
              </div>
              <button className="detail-button phone">
                <p>編輯</p>
              </button>
            </div>
            <div className="contact-line phone"></div>
            <div className="contact-detail phone">
              <div className="details phone">
                <div className="same-person phone">
                  <input type="checkbox" onChange={handleSamePerson} />
                  <p>同訂購人</p>
                </div>
                <div className="detail-one phone">
                  <p>收件人</p>
                  <h6>{recipient.name}</h6>
                </div>
                <div className="detail-one phone">
                  <p>手機號碼</p>
                  <h6>{recipient.phone}</h6>
                </div>
                <div className="detail-one phone">
                  <p>地址</p>
                  <h6>{recipient.address}</h6>
                </div>
              </div>
              <button className="detail-button phone">
                <p>編輯</p>
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
