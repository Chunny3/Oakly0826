import styles from '@/styles/organizer/organizer.module.css'

export default function ServiceCard({ title, content }) {
  return (
    <>
      <div className={`${styles['serviceCard']} d-flex flex-column`}>
        <h5 className="t-primary03">{title}</h5>
        <div
          className={`${styles['serviceCardList']} d-flex align-items-center`}
        >
          <p className="t-primary03">{content}</p>
        </div>
      </div>
    </>
  )
}
