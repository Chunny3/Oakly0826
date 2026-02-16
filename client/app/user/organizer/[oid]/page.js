"use client";
import ListDetails from "./_components/ListDetails";
//CSS
import styles from "@/styles/userOrganizer/userOrganizer.module.css";
// 自訂組件(全域)
// 自訂組件 (專用)
import ItemTab from "../_components/ItemTab";
import { useFetch } from "@/hooks/use-fetch";
import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { useTab } from "@/contexts/TabContext";
import { useRouter } from "next/navigation";

export default function UserOrganizerDetailPage() {
  const router = useRouter();
  const [token, setToken] = useState(null);
  const [isReady, setIsReady] = useState(false);

  const params = useParams();
  const bookingId = params.oid;

  const { currentTab, setCurrentTab } = useTab(); // ← 使用 Context



  // 抓取使用者的預約列表
  const userOrganizerDetailsResult = useFetch(
    isReady && token ? `http://localhost:3005/api/user/organizers/${bookingId}` : null,
    {
      headers: { 'Authorization': `Bearer ${token}` },
      // 加上 key 來穩定請求
      key: isReady && token ? 'user-organizer-details' : null
    }
  );

  const booking = userOrganizerDetailsResult.data?.data; // 修正：確保有資料才渲染


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



  // 修正：加上載入狀態和錯誤處理
  if (userOrganizerDetailsResult.loading) {
    return <div className="loaderLine"></div>;
  }

  if (userOrganizerDetailsResult.error) {
    return console.log("找不到預約資料");
    ;
  }

  // 修正：檢查 booking 而不是 userOrganizerDetailsResult
  if (!booking) {
    return  console.log("找不到預約資料");
  }

  return (
    <>
      <section>
        <div className="container-xl">
          <div className="d-flex flex-column gap-lg pt-2">
            <h2 className="t-primary01 text-center">預約記錄</h2>
            <ItemTab
              currentTab={currentTab}
              onTabChange={(newTab) => {
                setCurrentTab(newTab);
                router.push("/user/organizer");
              }}
            />
                <ListDetails
                  status={booking.status}
                  organizerName={booking.organizer_name}
                  serviceDate={booking.service_datetime}
                  serviceAddress={booking.full_address}
                  bookingId={booking.booking_id}
                  createdAt={booking.created_at}
                  userName={booking.user_name}
                  userPhone={booking.user_phone}
                  userEmail={booking.user_email}
                  images={booking.images}
                  note={booking.note}
                  price={booking.price}
                />
          </div>
        </div>
      </section>
    </>
  );
}
