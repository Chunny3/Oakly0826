'use client'

import Link from 'next/link'
import Image from 'next/image'
import styles from '@/styles/index/index.module.css'
import LinkArrow from '@/app/_components/LinkArrow'

export default function ArticleCard({ tag, img, title, content, date }) {
  return (
    <>
      <div className={`${styles.articleCard} d-flex flex-column gap-xs`}>
        <h6 className="t-primary04">{tag}</h6>
        <div className={`${styles.articleMiddle} gap-sm`}>
          <Link href="#">
            <Image
              src={img}
              alt={title}
              width={240}
              height={160}
              className={styles.articleImg}
            />
          </Link>
          <h5 className={`t-primary03 ${styles.articleTitle}`}>{title}</h5>
          <p className={`t-primary03 ${styles.articleContent}`}>{content}</p>
        </div>
        <div
          className={`d-flex align-items-center justify-content-between ${styles.mt16}`}
        >
          <p className="t-primary03">{date}</p>
          <LinkArrow>閱讀更多</LinkArrow>
        </div>
      </div>
    </>
  )
}
