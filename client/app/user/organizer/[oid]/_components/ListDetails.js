import LinkArrow from '@/app/_components/LinkArrow'
import styles from '@/styles/userOrganizerDetails/userOrganizerDetails.module.css'
import Image from 'next/image'

export default function ListDetails({
  status,
  organizerName,
  serviceDate,
  serviceAddress,
  bookingId,
  createdAt,
  userName,
  userPhone,
  userEmail,
  images,
  note,
  price}) {
  const statusConfig = {
    1: {
      label: '諮詢中',
      description: '我們已收到您的需求，整理師將儘快與您聯繫',
      bottomText: '',
      action: '編輯諮詢',
      actionLink: `/user/organizer/${bookingId?.replace('#', '')}/edit`, 
    },
    2: {
      label: '已預約',
      description:
        '已為您安排預約時段，請留意簡訊與通知，我們將於約定時間提供服務',
      bottomText: '無法取消',
      action: '',
    },
    3: {
      label: '已完成',
      description: '感謝您的信任與配合，此次整理服務已順利完成！',
      bottomText: '服務已完成',
      action: '',
    },
    4: {
      label: '已取消',
      description: '此筆預約已取消。如有其他需求，歡迎隨時重新預約或聯繫我們',
      bottomText: '',
      action: '重新預約',
      actionLink: "http://localhost:3000/organizer/form", 
    },
  }

 const currentStatus = statusConfig[status] || statusConfig[1] // 如果找不到就用預設值
  // console.log('收到的 status:', status);
  return (
    <>
      <div
        className={`d-flex gap-lg flex-column ${styles.listCard} ${styles[`listCardStatus${status}`]}`}
      >
        <div className="d-flex flex-column gap-md">
          <h6 className={`text-white ${styles[`listStatus${status}`]}`}>
            {currentStatus.label}
          </h6>
          {/* info */}
          <div className={`d-flex flex-column flex-md-row ${styles.infoGap}`}>
            <div className="d-flex flex-column gap-sm flex-md-fill">
              <p className="t-primary03">服務整理師：{organizerName}</p>
              <p className="t-primary03">{status === 1 || 4 ? "希望" : ""}服務日期：{serviceDate}</p>
              <p className="t-primary03">
                服務地址：{serviceAddress}
              </p>
            </div>
            <div
              className={`d-flex flex-column gap-sm ${styles.minWidth} flex-md-fill`}
            >
              <p className="t-primary03">預約編號：{bookingId}</p>
              <p className="t-primary03">建立時間：{createdAt}</p>
            </div>
          </div>
          <div className={`d-flex flex-column gap-md ${styles.ptMd}`}>
            {/* userInfo */}
            <div className="d-flex flex-column gap-sm flex-md-fill">
              <p className="t-primary03">預約人資訊：</p>
              <p className="t-primary03">姓名：{userName}</p>
              <p className="t-primary03">電話：{userPhone}</p>
              <p className="t-primary03">Email：{userEmail}</p>
            </div>
            {/* img */}
          {images && images.length > 0 && (
              <div className="d-flex flex-column gap-xs flex-md-fill">
                <p className="t-primary03">環境照片：</p>
                <div
                  className={`d-flex align-items-center flex-wrap ${styles.imgGap}`}
                >
                  {images.map((imageUrl, index) => (
                    <Image
                      key={index}
                      src={`http://localhost:3005${imageUrl}`}
                      width={150}
                      height={150}
                      alt={`使用者環境照片 ${index + 1}`}
                      className={styles.userHouseImage}
                    />
                  ))}
                </div>
              </div>
            )}
            {/* note */}
            <div className="d-flex flex-column gap-xs">
              <p className="t-primary03">備註：</p>
              <p className="t-primary03">
                {note ?? "無"}
              </p>
            </div>
          </div>
        </div>
        <div className={`d-flex justify-content-between ${styles.cardBottom}`}>
          <h5 className="t-primary03">{price ? `NT$ ${price}` : "完成諮詢報價後顯示"}</h5>
          {currentStatus.bottomText && (
            <h6 className="t-primary02">{currentStatus.bottomText}</h6>
          )}
          {currentStatus.action && (
            <LinkArrow href={currentStatus.actionLink}>{currentStatus.action}</LinkArrow>
          )}
        </div>
      </div>
      <h6 className="t-gray600 text-center">{currentStatus.description}</h6>
    </>
  )
}
