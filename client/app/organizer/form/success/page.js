"use client";
// 自訂組件(全域)
import { useState, useEffect, useRef } from "react";
import { useFetch } from "@/hooks/use-fetch";
import { useRouter } from "next/navigation";
import Link from "next/link";
import GreenBorderButton from "@/app/_components/GreenBorderButton";

export default function SuccessPage() {
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [token, setToken] = useState(null);
  const [userStr, setUserStr] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // 安全地解析用戶資料
  const user = userStr ? JSON.parse(userStr) : null;
  const userId = user?.id;

  // 使用者 fetch
  const userResult = useFetch(
    userId ? `http://localhost:3005/api/users/${userId}` : null
  );

  // 處理登入
  useEffect(() => {
    const tokenFromStorage = localStorage.getItem("reactLoginToken");
    const userFromStorage = localStorage.getItem("user");

    setToken(tokenFromStorage);
    setUserStr(userFromStorage);

    //沒登入的跳轉
    if (!tokenFromStorage || !userFromStorage) {
      router.push("/auth/login");
      return;
    }

    setIsLoading(false);
  }, [router]);

  // 當 API 返回用戶資料時設置用戶名
  useEffect(() => {
    if (userResult.data && userResult.data.data) {
      const currentUser = userResult.data.data;
      setUserName(currentUser.name);
    }
  }, [userResult.data]);
  
  //解析token
  if (isLoading || !token || !userStr) {
    return <div>載入中...</div>;
  }


  //使用fetch錯誤處理
  if (userResult.error && !userResult.data) {
    console.error("載入使用者失敗", userResult.error);
  }

  return (
    <>
      <section className="d-flex flex-column gap-xl section align-items-center">
        <h2 className="t-primary01 text-center">我們收到您的諮詢囉！</h2>
        <div className="d-flex flex-column gap-lg">
          <h6 className="t-primary03 text-center">親愛的 {userName} 您好：</h6>
          <p className="t-primary03 text-center" style={{ lineHeight: "32px" }}>
            感謝您填寫諮詢表單，我們已成功收到預約申請
            <br />
            整理師將於 3 個工作天內與您聯繫，討論服務細節與報價內容 <br />
            若有任何問題，歡迎隨時聯繫客服專線： 02-3363-1212 <br />
            我們很樂意為您服務！
          </p>
        </div>
        <Link href="/user/organizer">
          <GreenBorderButton>查看填寫明細</GreenBorderButton>
        </Link>
      </section>
    </>
  );
}
