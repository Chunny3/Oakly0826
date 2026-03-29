'use client'

import { useState } from 'react'
import Sidebar from '../_components/sidebar'
import HeaderImg from '../_components/HeaderImg'
import styles from '../user.module.css'

const items = [
    {
        id: 1,
        title: '不用大改裝！從家具搭配開始：配色、材質、家具怎麼選？',
        date: '2025-07-01',
        img: '/img/ting/header.jpg',
        summary: '想要改變居家空間，但又不想大興土木？從家具的色調與材質下手，自然打造舒服又有風格的居家空間...想要改變居家空間，但又不想大興土木？從家具的色調與材質下手，自然打造舒服又有風格的居家空間想要改變居家空間，但又不想大興土木？從家具的色調與材質下手，自然打造舒服又有風格的居家空間想要改變居家空間，但又不想大興土木？從家具的色調與材質下手，自然打造舒服又有風格的居家空間想要改變居家空間，但又不想大興土木？從家具的色調與材質下手，自然打造舒服又有風格的居家空間'
    },
    {
        id: 2,
        title: '不用大改裝！從家具搭配開始：配色、材質、家具怎麼選？',
        date: '2025-07-01',
        img: '/img/ting/header.jpg',
        summary: '想要改變居家空間，但又不想大興土木？從家具的色調與材質下手，自然打造舒服又有風格的居家空間...'
    },
    {
        id: 3,
        title: '不用大改裝！從家具搭配開始：配色、材質、家具怎麼選？',
        date: '2025-07-01',
        img: '/img/ting/header.jpg',
        summary: '想要改變居家空間，但又不想大興土木？從家具的色調與材質下手，自然打造舒服又有風格的居家空間...'
    }
]

export default function BookmarksPage() {
    // 管理清單
    const [list, setList] = useState(items)

    // 點擊時「真的移除」：把 id 不等於的留下
    const removeBookmark = (id) => {
        setList(prev => prev.filter(a => a.id !== id))
    }
    return (
        <div>
            {/* <HeaderImg title="BOOKMARKS" />
            <div className={`container-fluid ${styles.userContainer}`}>
                <div className={styles.layout}>
                    <div className={styles.sidebarWrapper}>
                    <Sidebar />
                    </div> */}
            {/* 右右右 */}
            {/* <div className={styles.content}> */}
            {list.map(a => (
                <div key={a.id} className={styles.bookmarkRow}>
                    {/* <i className={`bi bi-bookmark-fill ${styles.bookmarkIcon}`} /> */}

                    {/* 書籤圖示，點了就刪掉 */}
                    <img
                        src="/img/ting/icon-bookmark-fill.svg"
                        alt="bookmarkicon"
                        className={styles.bookmarkIcon}
                        onClick={() => removeBookmark(a.id)}
                        role="button"
                        title="取消收藏"
                    />
                    {/* 文章縮圖 */}
                    <img src={a.img} alt="" width={140} height={120} style={{ objectFit: 'cover' }} />

                    {/* 右側文字：直向 flex，footer 用 margin-top:auto 吸底 */}
                    <div className={styles.bookmarkBody}>
                        <div className={styles.bookmarkTitle} >{a.title}</div>
                        <div className={styles.bookmarkText}>{a.summary}</div>
                        {/* 置下 */}
                        <div className={styles.bookmarkFooter}>
                            <span>{a.date}</span>
                            <a className={styles.bookmarkLink} href="#">閱讀更多 <img src="/img/ting/icon-bm-more.svg" alt="moreicon" /></a>
                        </div>
                    </div>
                </div>
            ))}
            {/* 當清單空的時候顯示提示 */}
            {list.length === 0 && <p>目前沒有收藏文章</p>}
        </div>
        // </div>
        //     </div>
        // </div>
    )
}
