'use client'

// 針對單一頁面使用css modules技術
import styles from '@/styles/organizer/organizer.module.css'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useFetch } from '@/hooks/use-fetch'
import { useRouter } from 'next/navigation'

// 靜態圖片
import spaceImage from '@/public/img/hui/space/2148857489.jpg'
import reserveImage from '@/public/img/hui/space/11171.jpg'

// 自訂組件(全域)
import GreenBorderButton from '@/app/_components/GreenBorderButton'

//自訂組件 整理師專用
import Hero from './_components/Hero'
import ServiceCard from './_components/ServiceCard'
import OrganizerCard from './_components/OrganizerCard'
import Step from './_components/Step'

export default function CouponPage() {

  const { data, loading, error } = useFetch("http://localhost:3005/api/organizers")
  const organizers = data?.data || []  // 取得 data.data，沒資料就用空陣列
  if (error) return <div>發生錯誤: {error.message}</div>


  const router = useRouter()

  return (
    <>
      <Hero />
      {/* section-01: 整理師 */}

      <section>
        <div className="container-xl">
          <div className="d-flex flex-column gap-xxl section align-items-center">
            <div className="text-center d-flex flex-column gap-md">
              <h2 className="t-primary01">關於空間整理師的那些事</h2>
              <h5 className="t-gray600">
                了解我們怎麼整理的不只是空間，還有你的日常
              </h5>
            </div>
            <div className={styles.responsiveContainer}>
              <div className={`order-1 order-lg-2 ${styles.imageContainer}`}>
                <Image
                  src={spaceImage}
                  alt="關於空間整理師"
                  className={styles.section01Img}
                />
              </div>
              <div
                className={`d-flex flex-column gap-4 order-2 order-lg-1 ${styles.serviceContainer}`}
              >
                <ServiceCard
                  title="✦ 空間規劃與收納設計"
                  content="根據你的生活習慣與房型動線，量身打造最順手的收納方式"
                />
                <ServiceCard
                  title="✦ 實際陪同整理與分類"
                  content="不是丟東西，而是一起釐清什麼值得留下、怎麼放才好用"
                />
                <ServiceCard
                  title="✦ 斷捨離引導"
                  content="過程中我們會一起思考物品的價值，不讓情緒主導決定"
                />
                <ServiceCard
                  title="✦ 整理習慣養成建議"
                  content="教你如何延續整理後的秩序，讓成果不會只是短暫的"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* section-02: 所有整理師 */}
      <section>
        <div className="container-xl">
          <div className="d-flex gap-xxxl flex-column section">
            <h2 className="t-primary01 text-center">
              每一位，都是整理生活的專家
            </h2>
            <div className={`d-flex flex-column ${styles.gap80}`}>
              <div className="d-flex flex-column align-items-center gap-xl">
                <h3 className="t-primary03 text-center">北部區域</h3>
                {loading ?
                  <div className="d-flex justify-content-center align-items-center w-100" style={{ minHeight: '200px' }}>
                    <div className="loaderLine"></div>
                  </div> :
                  <div className={styles.organizerGrid}>
                    {organizers
                      .filter(organizers => organizers.region === 1)
                      .map((organizer) => (
                        <OrganizerCard
                          key={organizer.id}
                          name={organizer.name}
                          area="北部"
                          imageUrl={`http://localhost:3005${organizer.photo}`}
                          contentText={organizer.introduction}
                        />
                      ))
                    }
                  </div>
                }
              </div>
              <div className="d-flex flex-column align-items-center gap-xl">
                <h3 className="t-primary03 text-center">中部區域</h3>
                {loading ?
                  <div className="d-flex justify-content-center align-items-center w-100" style={{ minHeight: '200px' }}>
                    <div className="loaderLine"></div>
                  </div> :
                  <div className={styles.organizerGrid}>
                    {organizers
                      .filter(organizers => organizers.region === 2)
                      .map((organizer) => (
                        <OrganizerCard
                          key={organizer.id}
                          name={organizer.name}
                          area="中部"
                          imageUrl={`http://localhost:3005${organizer.photo}`}
                          contentText={organizer.introduction}
                        />
                      ))
                    }
                  </div>
                }
              </div>
              <div className="d-flex flex-column align-items-center gap-xl">
                <h3 className="t-primary03 text-center">南部區域</h3>
                {loading ?
                  <div className="d-flex justify-content-center align-items-center w-100" style={{ minHeight: '200px' }}>
                    <div className="loaderLine"></div>
                  </div> :
                  <div className={styles.organizerGrid}>
                    {organizers
                      .filter(organizers => organizers.region === 3)
                      .map((organizer) => (
                        <OrganizerCard
                          key={organizer.id}
                          name={organizer.name}
                          area="南部"
                          imageUrl={`http://localhost:3005${organizer.photo}`}
                          contentText={organizer.introduction}
                        />
                      ))
                    }
                  </div>
                }
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* section-03: 預約流程 */}
      <section>
        <div className="d-flex section-fluid flex-column align-items-center gap-xxxl">
          <div className="d-flex flex-column gap-md px-4">
            <h2 className="t-primary01 text-center">預約流程，簡單開始</h2>
            <h5 className="t-gray600 text-center">
              從了解需求到完成整理，我們陪你每一步，讓改變更輕鬆
            </h5>
          </div>
          <div className={styles.steps}>
            <div className="container-xl">
              <div
                className={`d-flex flex-wrap justify-content-center align-items-center justify-content-lg-between ${styles.stepsGap}`}
              >
                <Step
                  title="1.填寫諮詢表單"
                  content="留下您的聯絡方式與需求，選擇服務項目與地區"
                  imageUrl="/img/hui/icon/signature.png"
                />
                <div className={styles.singleArrow}></div>
                <Step
                  title="2.專人聯繫確認"
                  content="整理師將主動聯繫您，了解具體需求並安排時間"
                  imageUrl="/img/hui/icon/contact.png"
                />
                <div className={styles.singleArrow}></div>
                <Step
                  title="3.到府整理服務"
                  content="依約前往指定地點，進行空間評估與整理執行"
                  imageUrl="/img/hui/icon/house.png"
                />
                <div className={styles.singleArrow}></div>
                <Step
                  title="4.後續建議追蹤"
                  content="提供空間維持建議，協助您養成長期的整理習慣"
                  imageUrl="/img/hui/icon/advice.png"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* section-04: 立即預約 */}
      <section>
        <div className="container-xl">
          <div className="d-flex section flex-column align-items-center ">
            <div className={`gap-xxxl ${styles.responsiveContainer04}`}>
              <div className={styles.imageContainer04}>
                <Image
                  src={reserveImage}
                  alt="預約諮詢"
                  className={styles.section04Img}
                />
              </div>
              <div className={styles.contentContainer04}>
                <div className="d-flex flex-column gap-md">
                  <h2 className="t-primary01">從這裡開始，打造你理想中的家</h2>
                  <p className="t-gray600">
                    無論是收納煩惱、動線不順，還是想打造更舒適的生活環境
                    <br />
                    只要留下你的需求，我們將由專業空間整理師親自與你聯繫，了解你的空間困擾，並安排一場專屬於你的整理諮詢
                  </p>
                </div>
                <GreenBorderButton
                  onClick={() => router.push("organizer/form")}
                >立即預約諮詢</GreenBorderButton>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
