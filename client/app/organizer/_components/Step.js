import styles from '@/styles/organizer/organizer.module.css'
import Image from 'next/image'

export default function Step({ title, content, imageUrl }) {
  return (
    <>
      <div
        className={`d-flex gap-md flex-column align-items-center ${styles.stepCardWidth}`}
      >
        {/* 圓形圖片區域 */}
        <div className={styles.stepCircleImage}>
          <Image
            src={imageUrl}
            alt={title}
            width={35}
            height={35}
            className={styles.stepCircleImg}
          />
        </div>
        <div className="d-flex gap-xs flex-column align-center">
          <h5 className="text-white text-center">{title}</h5>
          <p className="text-white text-center">{content}</p>
        </div>
      </div>
    </>
  )
}
