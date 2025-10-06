import Link from "next/link";
import CanUseLeft from "./CanUseLeft";
import styles from "@/styles/userCoupon/userCoupon.module.css";

export default function CanUseCoupon({
  tag,
  name,
  smallCost,
  date,
  costCate1,
  costCate2,
  cost,
}) {
  return (
    <>
      <div
        className={`d-flex align-items-center justify-content-between ${styles.couponCard}`}
      >
        <div className="d-flex gap-md flex-column">
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
        <Link href="/products">
          <CanUseLeft />
        </Link>
      </div>
    </>
  );
}
