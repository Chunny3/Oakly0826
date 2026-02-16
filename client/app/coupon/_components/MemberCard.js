'use client'
import Image from 'next/image'
import styles from '@/styles/coupon/coupon.module.css'

export default function MemberCard({
  variant,
  icon,
  hoverIcon,
  lv,
  text1,
  text2,
  text3,
  text4,
  condition,
}) {
  return (
    <>
      <div
        className={`d-flex ${styles.memberCard} ${styles[`memberCard${variant}`]} flex-column align-items-center`}
      >
        <div
          className={`gap-xs d-flex flex-column align-items-center ${styles.memberHead}`}
        >
          <Image
            src={icon}
            alt={lv}
            width={105}
            height={105}
            className={styles.memberCardIcon}
          />
          
          <h5 >{lv}</h5>
        </div>
        <div className="gap-sm d-flex flex-column align-items-center">
          <p className="t-primary03">{text1}</p>
          <p className="t-primary03">{text2}</p>
          <p className="t-primary03">{text3}</p>
          <p className="t-primary03">{text4}</p>
        </div>
        <div
          className={`${styles.memberBottom} d-flex justify-content-center align-items-center`}
        >
          <p className="text-white text-center">{condition}</p>
        </div>
      </div>
    </>
  )
}
