import UsedLeft from './UsedLeft'
import styles from '@/styles/userCoupon/userCoupon.module.css'

export default function UsedCoupon({ tag, name, smallCost, usedDate, costCate1,  costCate2, cost }) {
  return (
    <>
      <div
        className={`d-flex align-items-center justify-content-between ${styles.couponCardUsed}`}
      >
        <div className="d-flex gap-md flex-column">
          <div className="d-flex flex-column gap-sm">
            <h6 className="t-gray500">{tag}</h6>
            <div className="d-flex flex-column gap-xxs">
              <h5 className="t-gray600">{name}</h5>
              <p className="t-gray500">{smallCost}</p>
            </div>
          </div>
          <p className="t-gray500">{usedDate}</p>
        </div>
        <h3 className="t-gray600">
          {costCate1}
          <span className={styles.cost}>{cost}</span>
          {costCate2}
        </h3>
        <UsedLeft />
      </div>
    </>
  )
}
