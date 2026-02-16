import styles from '@/styles/userCoupon/userCoupon.module.css'

export default function CanUseLeft() {
  return (
    <>
      <div
        className={`d-flex justify-content-center align-items-center ${styles.canUseLeft}`}
      >
        <img src="/img/hui/icon/singleArrow.svg" alt="" />
      </div>
    </>
  )
}
