'use client'

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import styles from '../user.module.css';
import { FaShoppingCart } from "react-icons/fa";

const getColorCode = (colorName) => {
    const map = {
        白色: "#ffffff", 黑色: "#000000", 原木色: "#DEB887", 淺灰: "#D3D3D3",
        深灰: "#555555", 淺藍: "#ADD8E6", 深藍: "#62869D", 淺綠: "#DBE5DE",
        深綠: "#6B826B", 米黃色: "#F5F5DC", white: "#ffffff", black: "#000000",
        red: "#ff0000", blue: "#0000ff", green: "#008000", yellow: "#ffff00",
        orange: "#ffa500", purple: "#800080", pink: "#ffc0cb", brown: "#a52a2a",
        gray: "#808080", grey: "#808080",
    };
    return map[colorName] || "#cccccc";
};



export default function FavoritesPage() {
    // 管理清單
    const { getFavorites, removeFavorite, updateFavoriteQty } = useAuth();
    const [list, setList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pending, setPending] = useState({}); // key => 是否更新中
    // 相對路徑 → 完整 URL（保險用）
    const toSrc = (p) => {
        if (!p) return "/img/placeholder.png";
        return p.startsWith("http") ? p : `http://localhost:3005/${p.replace(/^\/+/, "")}`;
    };

    useEffect(() => {
        (async () => {
            const result = await getFavorites();
            if (result.success) setList(result.data || []);
            setLoading(false);
        })();
    }, [getFavorites]);

    const onRemove = async (productId, colorId, sizeId) => {
        const result = await removeFavorite(productId, colorId, sizeId);
        if (result.status === 'success') {
            setList(prev =>
                prev.filter(item => !(
                    Number(item.product_id) === Number(productId) &&
                    Number(item.color_id) === Number(colorId) &&
                    Number(item.size_id) === Number(sizeId)
                ))
            );
        }
    };

    // if (loading) return <div>載入中…</div>;
    if (loading) return <>載入中…</>;

    if (!list.length) return (
        <>
            目前沒有收藏。去逛逛商品，點愛心加入吧！
        </>
    );

    const keyOf = (it) => `${it.product_id}-${it.color_id}-${it.size_id}`;

    const applyLocalQty = (k, next) => {
        setList((prev) =>
            prev.map((it) => (keyOf(it) === k ? { ...it, quantity: next } : it))
        );
    };

    const changeQty = async (item, nextQty) => {
        const k = keyOf(item);
        if (nextQty < 1 || nextQty > 99) return;

        // 樂觀更新
        applyLocalQty(k, nextQty);
        setPending((p) => ({ ...p, [k]: true }));

        const res = await updateFavoriteQty(item.product_id, item.color_id, item.size_id, nextQty);

        setPending((p) => ({ ...p, [k]: false }));
        if (res?.status !== "success") {
            // 還原（失敗）
            applyLocalQty(k, item.quantity);
            alert(res?.message || "更新數量失敗");
        }
    };

    const inc = (item) => changeQty(item, Number(item.quantity) + 1);
    const dec = (item) => changeQty(item, Number(item.quantity) - 1);

    return (
        <div>
            {/* {list.map(item => (
                <div key={item.product_id} className={styles.favoritesRow}>
                    <img
                        src={item.product_img}
                        alt={item.name}
                        width={140}
                        height={120}
                        style={{ objectFit: 'cover' }}
                    />
                    <div className={styles.productName}>{item.name}</div>
                    <div className={styles.productPrice}>${Number(item.price).toLocaleString()}</div>
                    <div className={styles.iconActions}>
                        <i
                            className={`bi bi-heart-fill ${styles.heart}`}
                            onClick={() => onRemove(item.product_id, item.color_id, item.size_id)}
                            role="button"
                            title="取消收藏"
                        />
                        <i
                            className={`bi bi-cart ${styles.cart}`}
                            onClick={() => console.log("加入購物車")}
                            role="button"
                            title="加入購物車"
                        />
                    </div>
                </div>
            ))} */}
            {list.map(item => (
                <div key={`${item.product_id}-${item.color_id}-${item.size_id}`} className={styles.favoritesCard}>
                    <img src={item.product_img} alt={item.name} />


                    <div className={styles.favoritesBody}>
                        <div className={styles.productName}>{item.name}</div>
                        <div className={styles.productPrice}>
                            NT$ {Number(item.price).toLocaleString()}
                        </div>
                        {/* 價格下方：只顯示已選顏色 / 尺寸 */}
                        {/* 顏色 */}
                        <div className={styles.optionDisplay}>
                            {item.color_name && (
                                <span className={styles.optionPill} aria-label={`顏色：${item.color_name}`}>
                                    <span
                                        className={styles.colorDotSm}
                                        style={{ background: getColorCode(item.color_name) }}
                                    />
                                    {item.color_name}
                                </span>
                            )}

                            {/* 尺寸 */}
                            {item.size_label && (
                                <span className={styles.optionPill} aria-label={`尺寸：${item.size_label}`}>
                                    {item.size_label}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className={styles.qtyControl}>
                        <button
                            type="button"
                            onClick={() => dec(item)}
                            disabled={pending[keyOf(item)] || Number(item.quantity) <= 1}
                            className={styles.qtyBtn}
                        >
                            –
                        </button>
                        <span className={styles.qtyBox}>{item.quantity}</span>
                        <button
                            type="button"
                            onClick={() => inc(item)}
                            disabled={pending[keyOf(item)] || Number(item.quantity) >= 99}
                            className={styles.qtyBtn}
                        >
                            +
                        </button>
                    </div>



                    {/* 右側：收藏/購物車（原本就有） */}
                    <div className={styles.iconActions} >
                        <i
                            className={`bi bi-heart-fill ${styles.heart}`}
                            onClick={() => onRemove(item.product_id, item.color_id, item.size_id)}
                            role="button"
                            title="取消收藏"
                        />
                        <i
                            className={`bi bi-cart ${styles.cart}`}
                            onClick={() => console.log("加入購物車")}
                            role="button"
                            title="加入購物車"
                        />
                    </div>
                </div>
            ))
            }
        </div>
    )
}

/** 小小的內聯樣式：你也可以搬到 user.module.css */
// const btnStyle = {
//     width: 28,
//     height: 28,
//     border: "1px solid #ddd",
//     borderRadius: 6,
//     background: "#fff",
//     cursor: "pointer",
//     lineHeight: 1,
//     fontSize: 16,
// };


// const qtyBoxStyle = {
//     width: 28,             // 固定寬度，不要太長
//     height: 28,
//     border: "1px solid #ddd",
//     borderRadius: 6,
//     display: "inline-flex",
//     alignItems: "center",
//     justifyContent: "center",
//     fontSize: 14,
// };