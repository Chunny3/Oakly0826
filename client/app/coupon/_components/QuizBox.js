'use client'

import styles from '@/styles/coupon/coupon.module.css'

export default function QuizBox({ question, answer }) {
  return (
    <>
      <div className={`d-flex flex-column flex-lg-fill ${styles.qaText}`}>
        <h5 className="t-primary03">{question}</h5>
        <p className="t-primary03">{answer}</p>
      </div>
    </>
  )
}
