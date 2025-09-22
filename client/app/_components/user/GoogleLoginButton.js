"use client";
import { useState } from "react";
import { signInWithGooglePopup } from "@/lib/firebase";

export default function GoogleLoginButton({ onSuccess }) {
    const [loading, setLoading] = useState(false);

    async function handleClick() {
        try {
            setLoading(true);

            // 確保 Firebase Google 登入成功
            const result = await signInWithGooglePopup();
            
            // 檢查返回的數據結構
            if (!result || !result.idToken) {
                throw new Error("無法從 Google 獲取身份令牌");
            }

            const { idToken, user } = result;
            
            console.log("🔥 Google Auth 成功，準備發送到後端");

            const res = await fetch("/api/auth/google", {
                method: "POST",
                headers: { "Content-Type": "application/json",
                    // 添加必要的標頭
                    "Accept": "application/json"
                 },
                credentials: "include", // 若你用 httpOnly cookie 可保留；若用 localStorage 可拿掉
                body: JSON.stringify({ idToken,
                    // 添加用戶信息作為備份
                    userInfo: {
                        uid: user?.uid,
                        email: user?.email,
                        displayName: user?.displayName,
                        photoURL: user?.photoURL
                    } }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data?.message || "Google 登入失敗");

            // 3) 從後端回傳的資料中取出需要的欄位
            // 預期後端回傳: { status, token, user }
            const { token, user: backendUser } = data;
            // 4) 傳回前端上層 (login.js)
            onSuccess?.({ token, user: backendUser });

        } catch (err) {
            console.error("Google 登入錯誤:", err);
            alert(`登入失敗: ${err.message}`);
        } finally {
            setLoading(false);
        }
    }

    return (
        // ✅ 這裡是整顆按鈕，可以改 className 或 style 調整樣式
        <button
            type="button"
            onClick={handleClick}
            disabled={loading}
            style={{
                display: "flex",              // ⬅️ 讓 icon + 文字在同一列
                alignItems: "center",         // ⬅️ 垂直置中
                justifyContent: "center",     // ⬅️ 水平置中
                gap: "8px",                   // ⬅️ icon 與文字間距
                width: "100%",                // ⬅️ 拉到跟輸入框同寬
                height: "44px",               // ⬅️ 高度（可調整）
                border: "1px solid #dadce0",  // ⬅️ Google 官方灰色邊框
                borderRadius: "4px",          // ⬅️ 圓角
                backgroundColor: "#fff",      // ⬅️ 白底
                fontSize: "14px",             // ⬅️ 字體大小
                color: "#3c4043",             // ⬅️ 文字顏色
                cursor: "pointer",
                fontWeight: 500,
            }}
        >
            {/* ✅ Google Icon，要放在 public/img/google-icon.svg */}
            <img
                src="/img/google-icon.svg"
                alt="Google Logo"
                style={{ width: "18px", height: "18px" }}
            />
            {/* ✅ 按鈕文字，可以改成「使用 Google 帳號登入」之類的 */}
            {loading ? "登入中..." : "使用 Google 登入"}
        </button>
    );
}
