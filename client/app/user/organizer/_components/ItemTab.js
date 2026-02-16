import styles from "@/styles/userOrganizer/userOrganizer.module.css";

export default function ItemTab({ currentTab, onTabChange }) {
  return (
    <>
      <div className="d-flex justify-content-center align-items-center flex-wrap gap-md">
        <button
          className={`btn ${styles.itemBtn} ${
            currentTab === 1 ? styles.active : ""
          }`}
          onClick={() => onTabChange(1)}
        >
          <span className={styles.bold}>1.諮詢中</span>
          <br />
          待整理師聯繫報價
        </button>
        <div className={styles.dash}></div>
        <button
          className={`btn ${styles.itemBtn} ${
            currentTab === 2 ? styles.active : ""
          }`}
          onClick={() => onTabChange(2)}
        >
          <span className={styles.bold}>2.預約成功</span>
          <br />
          請等待服務當日
        </button>
        <div className={styles.dash}></div>
        <button
          className={`btn ${styles.itemBtn} ${
            currentTab === 3 ? styles.active : ""
          }`}
          onClick={() => onTabChange(3)}
        >
          <span className={styles.bold}>3.服務完成</span>
          <br />
          隨時歡迎再次預約
        </button>
        <div className={styles.dash}></div>
        <button
          className={`btn ${styles.itemBtn} ${
            currentTab === 4 ? styles.active : ""
          }`}
          onClick={() => onTabChange(4)}
        >
          <span className={styles.bold}>已取消</span>
          <br />
          此次諮詢未成立
        </button>
      </div>
    </>
  );
}
