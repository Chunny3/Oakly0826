import styles from '@/styles/organizer/organizer.module.css'
import Image from 'next/image'


export default function OrganizerCard({ name, area, imageUrl, contentText }) {
  return (
    <>
      <div
        className={`d-flex flex-column align-center card-shadow ${styles.organizerCard}`}
      >
        <div className={`d-flex flex-column ${styles.gap10}`}>
          {/* 圓形圖片區域 */}
          <div className={`align-self-center ${styles.circleImage}`}>
            {/* 之後從資料庫來的圖片 */}
            <img
              src={imageUrl}
              alt={name}
              width={120}
              height={120}
              className={styles.circleImg}
            />
          </div>
          <div className="d-flex justify-content-between align-items-baseline">
            <h4 className="t-primary03">{name}</h4>
            <h5 className="t-secondary01">{area}</h5>
          </div>
          <p className="t-primary03">{contentText}</p>
        </div>
      </div>
    </>
  )
}
