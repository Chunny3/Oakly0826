'use client'

import styles from './headerImg.module.css'

export default function HeaderImg({ title = 'MY ACCOUNT', src = '/img/ting/header.jpg' }) {
    return (
        <div className={styles.headerImg} style={{ backgroundImage: `url(${src})` }}>
            <div className={styles.title}>{title}</div>
        </div>
    )
}