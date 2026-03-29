import styles from '@/styles/userCoupon/userCoupon.module.css'


export default function CartCoupon({ tag, name, smallCost, date, costCate1, costCate2, cost }) {
  return (
    <>
      <div
        className={`d-flex align-items-center ${styles.couponCardCart}`}
      >
        <div className="d-flex gap-md flex-column pe-4 pe-lg-5">
          <div className="d-flex flex-column gap-sm">
            <h6 className="t-gray600">{tag}</h6>
            <div className="d-flex flex-column gap-xxs">
              <h5 className="t-primary01">{name}</h5>
              <p className="t-primary03">{smallCost}</p>
            </div>
          </div>
          <p className="t-primary03">{date}</p>
        </div>
        <h3 className="t-secondary01">
          {costCate1}
          <span className={styles.cost}>{cost}</span>
          {costCate2}
        </h3>
      </div>
    </>
  )
}

    // {activeTab === "canUse" &&
    // userCoupons
    // .filter((coupon) => coupon.status === 0)
    // .map((coupon) => (
    //     <CartCoupon
    //     key={coupon.id}
    //     tag={
    //         coupon.category_names &&
    //         coupon.category_names.split(",").length >= 6
    //         ? "全館適用"
    //         : `${coupon.category_names}適用`
    //     }
    //     name={coupon.name}
    //     smallCost={`滿 $${coupon.min_discount} 使用`}
    //     date={` ${coupon.expire_at.split("T")[0]
    //     }到期`}
    //     costCate1={coupon.discount_type === 1 ? "$ " : ""}
    //     cost={
    //         coupon.discount_type === 1
    //         ? parseInt(coupon.discount)
    //         : parseInt(coupon.discount * 100)
    //     }
    //     costCate2={coupon.discount_type === 1 ? "" : " 折"}
    //     />
    // ))}