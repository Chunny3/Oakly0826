"use client";
import ListCard from "./_components/ListCard";
import Sidebar from "../_components/sidebar";
//CSS
import styles from "@/styles/userOrganizer/userOrganizer.module.css";
// 自訂組件(全域)
// 自訂組件 (專用)
import ItemTab from "./_components/ItemTab";
import { useFetch } from "@/hooks/use-fetch";
import { useState, useEffect, useRef } from "react";
import { useTab } from "@/contexts/TabContext";
import { useRouter } from "next/navigation";

export default function UserOrganizerPage() {
  const router = useRouter();
  const { currentTab, setCurrentTab } = useTab();  // ← 使用 Context
  const [token, setToken] = useState(null);
  const [isReady, setIsReady] = useState(false);



  // 抓取使用者的預約列表
  const userOrganizersResult = useFetch(
    isReady && token ? `http://localhost:3005/api/user/organizers` : null,
    {
      headers: { 'Authorization': `Bearer ${token}` },
      // 加上 key 來穩定請求
      key: isReady && token ? 'user-organizers' : null
    }
  );

  // 整理師資料
  const userOrganizers = userOrganizersResult?.data?.data || [];
  console.log("使用者的整理師預約資料", userOrganizers);


  // 處理登入
  useEffect(() => {
    const tokenFromStorage = localStorage.getItem("reactLoginToken");

    if (!tokenFromStorage) {
      router.push("/auth/login");
      return;
    }

    setToken(tokenFromStorage);
    setIsReady(true);
  }, [router]);

  // 載入中
  // if (!isReady) {
  //   return <div>載入中...</div>;
  // }


  // tab切換資料
  const filteredOrganizers = userOrganizers.filter((organizer) => {
    return organizer.status === currentTab;
  });
  console.log('l60', filteredOrganizers);

  // 狀態文字對應表
  const statusTexts = {
    1: "我們已收到您的需求，整理師將儘快與您聯繫",
    2: "已為您安排預約時段，請留意簡訊與通知，我們將於約定時間提供服務",
    3: "感謝您的信任與配合，整理服務已順利完成",
    4: "預約已取消。如有其他需求，歡迎隨時重新預約或聯繫我們"
  };


  return (
    <>
      <section>
        <div className="container-xl">
          <div className="d-flex flex-column gap-lg pt-2">
            <h2 className="t-primary01 text-center">預約紀錄</h2>
            <ItemTab currentTab={currentTab} onTabChange={setCurrentTab} />
            {!isReady ?
              <div className="d-flex justify-content-center align-items-center w-100" style={{ minHeight: '200px' }}>
                <div className="loaderLine"></div>
              </div> : filteredOrganizers.length > 0 ? (
                <>
                  {filteredOrganizers.map((organizer) => (
                    <ListCard
                      key={organizer.booking_id}
                      status={organizer.status}
                      organizerName={organizer.organizer_name}
                      serviceDate={organizer.service_datetime}
                      serviceAddress={organizer.full_address}
                      bookingId={organizer.booking_id}
                      createdDate={organizer.created_at}
                      price={organizer.price}
                    />
                  ))}
                </>
              ) : (
                <div className="d-flex justify-content-center align-items-center w-100" style={{ minHeight: '200px' }}>
                  <p className="text-muted t-">尚無預約</p>
                </div>
            )}
            <h6 className="t-gray600 text-center">{statusTexts[currentTab]}</h6>
          </div>
        </div>
      </section>
    </>
  );
}
