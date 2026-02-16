import styles from '@/styles/organizer/organizer.module.css'

export default function Hero() {
  return (
    <>
      <section
        className={`${styles.organizerHeader} d-flex flex-column justify-content-center gap-lg`}
      >
        <h1 className="text-lg-start text-center text-white">空間整理師，陪你照顧家的模樣</h1>
        <h3 className={`text-lg-start text-center text-white ${styles.borderLeft}`}>
          我們不只是整理空間，而是陪你一步步，找回生活的餘裕與節奏。
        </h3>
      </section>
    </>
  )
}
