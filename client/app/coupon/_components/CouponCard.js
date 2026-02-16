'use client'

import styles from '@/styles/coupon/coupon.module.css'

export default function CouponCard({ tag, date, discountNumber, discountType, smallSpend, couponId, onClaim }) {
  return (
    <>
      <div
        className={`${styles.coupon} justify-content-between d-flex flex-column`}
      >
        <div className="gap-xs d-flex flex-column align-items-center">
          <div className="d-flex flex-column align-items-center gap-xs">
            <h6 className={`text-white ${styles.couponTag}`}>{tag}</h6>
            <p className="t-primary03">{date}</p>
          </div>
          <div className="gap-xs d-flex flex-column align-items-center">
            <h4 className={`t-secondary01 ${styles.discountNumber}`}>
              {discountNumber}
              <span className={styles.discountText}>
                {discountType === 2 ? ' 折' : ' 元'}
              </span>
            </h4>
            <h6 className="t-primary03">{smallSpend}</h6>
          </div>
        </div>
        <button onClick={()=>{onClaim(couponId)}} className={`btn t-primary01 ${styles.btnGet}`}>點擊領取</button>
      </div>
    </>
  )
}
