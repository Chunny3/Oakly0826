"use client";
import { useState, useEffect, useRef } from "react";
import { useFetch } from "@/hooks/use-fetch";
import { useRouter } from "next/navigation";
//CSS
import styles from "@/styles/userCoupon/userCoupon.module.css";
// 自訂組件(全域)
import TabItem from "@/app/_components/TabItem";
// 自訂組件 (專用)
import "@/styles/btnReset/btnReset.css";
import CanUseCoupon from "./_components/CanUseCoupon";
import UsedCoupon from "./_components/UsedCoupon";
import Link from "next/link";
import clsx from "clsx";

export default function UserCouponPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("canUse");
  const [token, setToken] = useState(null);
  const [isReady, setIsReady] = useState(false);

  // 修正 useFetch 的依賴問題
  const userCouponsResult = useFetch(
    isReady && token ? `http://localhost:3005/api/user/coupons` : null,
    {
      headers: { Authorization: `Bearer ${token}` },
      // 加上 key 來穩定請求
      key: isReady && token ? "user-coupons" : null,
    }
  );

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

  // 使用者優惠券資料
  const userCoupons = userCouponsResult.data?.data || [];
  console.log("使用者的優惠券資料", userCoupons);

  return (
    <>
      <section>
        <div className="d-flex flex-column gap-lg pt-2">
          <h2 className="t-primary01 text-center">我的優惠券</h2>
          <div className="d-flex justify-content-between">
            <div className="d-flex gap-lg">
              <TabItem
                className={clsx({ active: activeTab === "canUse" })}
                onClick={() => {
                  setActiveTab("canUse");
                }}
              >
                可使用
              </TabItem>
              <TabItem
                className={clsx({ active: activeTab === "used" })}
                onClick={() => {
                  setActiveTab("used");
                }}
              >
                已使用
              </TabItem>
            </div>
            <Link href="/coupon" className={`btn ${styles.brownBtn}`}>
              查看限定優惠券
            </Link>
          </div>

          <div className="d-flex flex-wrap gap-lg align-items-xl-start align-items-center">
            {!isReady ? (
              <div
                className="d-flex justify-content-center align-items-center w-100"
                style={{ minHeight: "200px" }}
              >
                <div className="loaderLine"></div>
              </div>
            ) : (
              <>
                {activeTab === "canUse" &&
                  (userCoupons.filter((coupon) => coupon.status === 0).length >
                  0 ? (
                    userCoupons
                      .filter((coupon) => coupon.status === 0)
                      .map((coupon) => (
                        <CanUseCoupon
                          key={coupon.id}
                          tag={
                            coupon.category_names &&
                            coupon.category_names.split(",").length >= 6
                              ? "全館適用"
                              : `${coupon.category_names}適用`
                          }
                          name={coupon.name}
                          smallCost={`滿 $${coupon.min_discount} 使用`}
                          date={`${coupon.get_at.split("T")[0]} – ${
                            coupon.expire_at.split("T")[0]
                          }`}
                          costCate1={coupon.discount_type === 1 ? "$ " : ""}
                          cost={
                            coupon.discount_type === 1
                              ? parseInt(coupon.discount)
                              : parseInt(coupon.discount * 100)
                          }
                          costCate2={coupon.discount_type === 1 ? "" : " 折"}
                        />
                      ))
                  ) : (
                    <div className="text-center w-100 p-4">
                      沒有可使用的優惠券
                    </div>
                  ))}
                {activeTab === "used" &&
                  (userCoupons.filter((coupon) => coupon.status === 1).length >
                  0 ? (
                    userCoupons
                      .filter((coupon) => coupon.status === 1)
                      .map((coupon) => (
                        <UsedCoupon
                          key={coupon.id}
                          tag={
                            coupon.category_names &&
                            coupon.category_names.split(",").length >= 6
                              ? "全館適用"
                              : `${coupon.category_names}適用`
                          }
                          name={coupon.name}
                          smallCost={`滿 $${coupon.min_discount} 使用`}
                          usedDate={
                            coupon.used_at
                              ? `${coupon.used_at.split("T")[0]} 使用完畢`
                              : "使用完畢"
                          }
                          costCate1={coupon.discount_type === 1 ? "$ " : ""}
                          cost={
                            coupon.discount_type === 1
                              ? parseInt(coupon.discount)
                              : parseInt(coupon.discount * 100)
                          }
                          costCate2={coupon.discount_type === 1 ? "" : " 折"}
                        />
                      ))
                  ) : (
                    <div className="text-center w-100 p-4">
                      沒有已使用的優惠券
                    </div>
                  ))}
              </>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
