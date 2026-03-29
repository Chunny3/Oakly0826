'use client'

import Link from 'next/link'
import Image from 'next/image'
import styles from '@/styles/index/index.module.css'

export default function ProductCard({ img, name, price, href }) {
  return (
    <>
      <div
        className={`${styles.card1} d-flex flex-column align-items-center gap-xs`}
      >
        <Link href={href}>
          <div className={styles.productImgWrapper}>
            <Image
              src={img}
              alt={name}
              width={160}
              height={216}
              className={styles.productImg}
            />
          </div>
        </Link>
        <div
          className={`${styles.card1Text} d-flex flex-column text-center gap-xs`}
        >
          <h5>{name}</h5>
          <p className={`font-en ${styles.price}`}>
            <span className={styles.currency}>$ </span>
            <span className={styles.amount}>{price}</span>
          </p>
        </div>
      </div>
    </>
  )
}
