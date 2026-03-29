import Header from '@/app/_components/header';
import styles from './auth.module.css';

export default function AuthLayout({ children }) {
    return (
        <>
            {/* 滑出觸發區：頂端 8px 高，游標靠近才讓 Header 出現 */}
            <div className={styles.revealZone} />

            {/* 會滑出的 Header（桌機才啟用 hover 顯示；手機永遠顯示） */}
            <div className={styles.slideHeader}>
                <Header />
            </div>

            <main className={styles.pageContent}>{children}</main>
        </>
    );
}
