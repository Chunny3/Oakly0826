"use client";

import { use, useEffect, useState } from "react";
import Link from 'next/link'  // Next.js
// 針對單一頁面使用css modules技術
import styles from "@/styles/coupon/coupon.module.css";

// 自訂組件(全域)
import GreenBorderButton from "@/app/_components/GreenBorderButton";
// 自訂組件(專屬)
import QuizBox from "./_components/QuizBox";
import CouponCard from "./_components/CouponCard";
import MemberCard from "./_components/MemberCard";
import { useRouter } from "next/navigation";

// toast
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";


export default function CouponPage() {
  const router = useRouter();
  const [coupons, setCoupons] = useState([]);

  const handleClaimCoupon = async (couponId) => {
    // 領取時的登入檢查
    const token = localStorage.getItem("reactLoginToken");

    //沒登入的跳轉
    if (!token) {
      alert("請先登入");
      router.push("/auth/login");
      return;
    }

    try {
      const result = await fetch(`http://localhost:3005/api/user/coupons/${couponId}`, {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await result.json();
      if (data.status === "success") {
        toast.success("領取成功");
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      console.log("優惠券領取失敗", err);
    }
  };

  //顯示優惠券
  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const res = await fetch("http://localhost:3005/api/coupons");
        const data = await res.json();
        console.log("解析的JSON", data);
        setCoupons(data.data);
      } catch (err) {
        console.log("優惠券顯示錯誤:", err);
      }
    };
    fetchCoupons();
  }, []);

  const faqDatas = [
    {
      id: 1,
      question: "Q1. 如何領取優惠券？",
      answer: "A：只要點擊卡片上的「立即領取」按鈕，登入後就能將優惠加入帳戶，隨時使用不漏接。"
    },
    {
      id: 2,
      question: "Q2. 優惠券怎麼使用？",
      answer: "A：結帳時系統會自動為你套用符合條件的優惠券，也可以在購物車中自行挑選要使用的券。"
    },
    {
      id: 3,
      question: "Q3. 優惠券有使用期限嗎？",
      answer: "A：有的，每張券的有效期限會標示在券上，我們會適時提醒你使用，以免錯過折扣喔。"
    },
    {
      id: 4,
      question: "Q4. 還沒註冊會員可以領券嗎？",
      answer: "A：部分優惠券為會員限定，我們建議您免費註冊，即可享有完整的領券與回饋權益。"
    },
    {
      id: 5,
      question: "Q5. 已領的優惠券去哪裡看？",
      answer: "A：登入帳戶後，進入「我的帳戶」中的「我的優惠券」，即可查看所有已領取與可使用的優惠券。"
    },
  ]
  return (
    <>
      <section
        className={`${styles.couponHeader} d-flex flex-column justify-content-center gap-lg`}
      >
        <h1 className="text-lg-start text-center text-white">
          找一張專屬你空間的優惠
        </h1>
        <h3
          className={`text-lg-start text-center text-white ${styles.borderLeft}`}
        >
          本月限定空間選物禮券，讓你的生活整理多一點餘裕。
        </h3>
      </section>
      {/* section-01: 領優惠券 */}
      <section>
        <div className="d-flex flex-column gap-xxxl align-items-center section-fluid">
          <div className="text-center d-flex flex-column gap-md mx-4">
            <h2 className="t-primary01">剛剛好的回饋，給剛好出現的你</h2>
            <h5 className="t-gray600">
              為不同生活場景設計的專屬優惠，限時領取中
            </h5>
          </div>
          <div className={styles.couponBg}>
            <div
              className={`d-flex justify-content-center align-items-center ${styles.couponContent}`}
            >
{(coupons || []).map((coupon) => (
                <CouponCard
                  key={coupon.id}
                  tag={`適用${coupon.category_ids
                    ? coupon.category_ids.split(",").length === 6
                      ? "全站商品"
                      : `${coupon.category_names}類`
                    : "未分類"
                    }`}
                  date={`領取後 ${coupon.valid_days} 天有效`}
                  discountNumber={
                    coupon.discount_type === 2
                      ? Math.round(coupon.discount * 100)
                      : Math.round(coupon.discount)
                  }
                  discountType={coupon.discount_type}
                  smallSpend={
                    coupon.min_discount === 0
                      ? "不限金額"
                      : `最低消費$${coupon.min_discount}`
                  }
                  couponId={coupon.id}
                  onClaim={handleClaimCoupon}
                />
              ))}
            </div>
          </div>
        </div>
      </section>
      {/* section-02: 會員專屬回饋介紹 */}
      <section>
        <div className="container-xl">
          <div className="d-flex flex-column gap-xxxl align-items-center section-fluid">
            <div className="text-center d-flex flex-column gap-md mx-4">
              <h2 className="t-primary01">會員專屬回饋</h2>
              <h5 className="t-gray600">我們想為常來的你，留下一點專屬心意</h5>
            </div>

            <div className={`${styles.memberArea} d-flex align-items-center`}>
              <MemberCard
                variant="1"
                icon="/img/hui/icon/sprout.jpg"
                lv="木芽會員"
                text1="新木芽會員 9 折禮"
                text2="每月 1 張專屬優惠券"
                text3="生日回饋 $100 折抵券"
                text4="&nbsp;"
                condition="註冊即享"
              />
              <MemberCard
                variant="2"
                icon="/img/hui/icon/autumn-tree.jpg"
                lv="原木會員"
                text1="每月 3 張專屬優惠券"
                text2="生日回饋 $300 折抵券"
                text3="單筆滿 $6,000 免運"
                text4="&nbsp;"
                condition={
                  <>
                    過去 12 個月內
                    <br />
                    累積消費滿 $10,000
                  </>
                }
              />
              <MemberCard
                variant="3"
                icon="/img/hui/icon/forest.jpg"
                lv="森林會員"
                text1="每月 5 張專屬優惠券"
                text2="生日回饋 $500 折抵券"
                text3="全年不限次免運"
                text4="限量預購優先邀請"
                condition={
                  <>
                    過去 12 個月內
                    <br />
                    累積消費滿 $20,000
                  </>
                }
              />
            </div>
            <Link href="/user/edit">
              <GreenBorderButton>加入會員，展開旅程</GreenBorderButton>
            </Link>
          </div>
        </div>
      </section>
      {/* section-03: 使用提醒 */}
      <section>
        <div className="container xl">
          <div className="d-flex flex-column gap-xxxl align-items-center section">
            <h2 className="text-center t-primary01">
              我們為你整理了使用上的小提醒
            </h2>
            <div className="d-flex gap-lg flex-column w-100">
              {faqDatas.map((faqData) => (
                <QuizBox
                  key={faqData.id}
                  question={faqData.question}
                  answer={faqData.answer}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 吐司 */}
      <ToastContainer
        position="top-center"
        autoClose={2000}
        hideProgressBar={true}
        closeOnClick
      />
    </>
  );
}
