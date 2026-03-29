import LinkArrow from "@/app/_components/LinkArrow";
import styles from "@/styles/userOrganizer/userOrganizer.module.css";

export default function ListCard({
  status,
  organizerName,
  serviceDate,
  serviceAddress,
  bookingId,
  createdDate,
  price,
}) {
  const statusConfig = {
    1: {
      label: "諮詢中",
      description: "我們已收到您的需求，整理師將儘快與您聯繫",
    },
    2: {
      label: "已預約",
      description:
        "已為您安排預約時段，請留意簡訊與通知，我們將於約定時間提供服務",
    },
    3: {
      label: "已完成",
      description: "感謝您的信任與配合，此次整理服務已順利完成！",
    },
    4: {
      label: "已取消",
      description: "此筆預約已取消。如有其他需求，歡迎隨時重新預約或聯繫我們",
    },
  };


  
  // 格式化價格顯示
  const displayPrice = price
    ? `NT$ ${price.toLocaleString()}`
    : "完成諮詢報價後顯示";
  const currentStatus = statusConfig[status];

  return (
    <>
      <div
        className={`d-flex gap-lg flex-column ${styles.listCard} ${
          styles[`listCardStatus${status}`]
        }`}
      >
        <div className="d-flex flex-column gap-md">
          <h6 className={`text-white ${styles[`listStatus${status}`]}`}>
            {currentStatus.label}
          </h6>
          <div className={`d-flex flex-column flex-md-row ${styles.gap}`}>
            <div className="d-flex flex-column gap-sm flex-md-fill">
              <p className="t-primary03">服務整理師：{organizerName}</p>
              <p className="t-primary03">{status === 1||4 ? "希望" : ""}服務日期：{serviceDate}</p>
              <p className="t-primary03">服務地址：{serviceAddress}</p>
            </div>
            <div
              className={`d-flex flex-column gap-sm ${styles.minWidth} flex-md-fill`}
            >
              <p className="t-primary03">預約編號：{bookingId}</p>
              <p className="t-primary03">建立時間：{createdDate}</p>
            </div>
          </div>
        </div>
        <div className={`d-flex justify-content-between ${styles.cardBottom}`}>
          <h5 className="t-primary03">{displayPrice}</h5>
          <LinkArrow href={`/user/organizer/${bookingId?.replace('#', '')}`}>查看詳情</LinkArrow>
        </div>
      </div>
      
    </>
  );
}
