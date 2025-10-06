'use client'

//import { useAuth } from '@/hooks/use-auth'
//import { useState } from 'react'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import styles from './sidebar.module.css'

export default function UserSidebarPage() {

  const pathname = usePathname()


  return (
    <div className={styles.sidebar}>
      <Link
        href="/user/edit"
        className={`${styles.user} ${pathname === '/user/edit' ? styles.active : ''}`}>
        <i className="fas fa-user"></i>
        我的資料
      </Link>

      <Link href="/user/order" className={`${styles.order} ${pathname === '/user/order' ? styles.active : ''}`}>
        <i className="fas fa-list-alt"></i>
        訂單查詢
      </Link>

      <Link href="/user/coupon" className={`${styles.coupon} ${pathname === '/user/coupon' ? styles.active : ''}`}>
        <i className="fas fa-ticket-alt"></i>
        我的優惠券
      </Link>

      <Link href="/user/favorites" className={`${styles.heart} ${pathname === '/user/favorites' ? styles.active : ''}`}>
        <i className="fas fa-heart"></i>
        願望清單
      </Link>

      {/* <Link href="/user/bookmarks" className={`${styles.bookmark} ${pathname === '/user/bookmarks' ? styles.active : ''}`}>
        <i className="fas fa-bookmark"></i>
        收藏文章
      </Link> */}
      <Link href="/user/organizer" className={`${styles.reservation} ${pathname.startsWith('/user/organizer') ? styles.active : ''}`}>
        <i className="fas fa-calendar-alt"></i>
        預約紀錄
      </Link>
    </div>
  )
}
