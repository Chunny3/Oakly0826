'use client'

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useCart } from "@/hooks/use-cart";
import styles from '../user.module.css';
import { FaCartShopping } from "react-icons/fa6";
import { FaHeart, FaRegHeart } from "react-icons/fa6";

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
    const { user, getFavorites, removeFavorite, updateFavoriteQty } = useAuth();
    const [list, setList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pending, setPending] = useState({}); // key => 是否更新中
    const { addToCart, openSuccessModal } = useCart();

    // 相對路徑 → 完整 URL（保險用）
    const toSrc = (p) => {
        if (!p) return "/img/placeholder.jpg";
        if (p.startsWith("http")) return p;
        const clean = p.replace(/^\/+/, "");
        // 後端上傳檔：已含 uploads/
        if (clean.startsWith("uploads/")) return `http://localhost:3005/${clean}`;
        // 只有檔名（DB 只存 *.jpg）：補上 uploads/
        if (!clean.includes("/")) return `http://localhost:3005/uploads/${clean}`;
        // 其他相對路徑：先走前端 public
        if (clean.startsWith("img/")) return `http://localhost:3000/${clean}`;
        return `http://localhost:3000/${clean}`;
    };

    const toCartProduct = (item) => ({
        // 用複合 id 區分不同規格（避免被當成同一品項疊加）
        id: `${item.product_id}-${item.color_id || 0}-${item.size_id || 0}`,
        // 也保留原始 product_id，之後若要打 API 方便
        product_id: item.product_id,
        name: item.name,
        price: Number(item.price) || 0,
        image: item.product_img,       // 你的 use-cart 會存整包物件到 localStorage

        color_id: item.color_id || null,
        color_name: item.color_name || "無顏色",
        size_id: item.size_id || null,
        size_label: item.size_label || "無尺寸",
        // ⬇ 為了相容 cartCard.js 的讀法
        colors: { id: item.color_id ?? 0, color_name: item.color_name || "無顏色" },
        sizes: item.size_label ? [{ id: item.size_id ?? 0, size_label: item.size_label }] : [],
        materials_id: item.materials_id ?? 0,
        materials: { id: item.materials_id ?? 0, material_name: item.material_name || "無類別" },
    });

    useEffect(() => {
        // ✅ 尚未登入就別打收藏 API，並結束 loading
        if (!user) {
            setLoading(false);
            return;
        }
        (async () => {
            try {
                const result = await getFavorites();
                if (result?.success) setList(result.data || []);
            } finally {
                setLoading(false);
            }
        })();
    }, [user?.id, getFavorites]);

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

            {list.map(item => (
                <div key={`${item.product_id}-${item.color_id}-${item.size_id}`} className={styles.favoritesCard}>
                    <img src={toSrc(item.product_img)} alt={item.name} />

                    <div className={styles.favoritesBody}>
                        <div className={styles.productName}>{item.name}</div>
                        <div className={styles.productPrice}>
                            NT$ {Number(item.price).toLocaleString()}
                        </div>
                        {/* Debug: 看收藏資料的真實內容 */}
                        {console.log("收藏 item:", item)}

                        <div className={styles.optionDisplay}>
                            {item.color_name && (
                                <span className={styles.optionPill} aria-label={`顏色：${item.color_name}`}>
                                    <span className={styles.colorDotSm} style={{ background: getColorCode(item.color_name) }} />
                                    {item.color_name}
                                </span>
                            )}
                            {item.size_label && (
                                <span className={styles.optionPill} aria-label={`尺寸：${item.size_label}`}>
                                    {item.size_label}
                                </span>
                            )}
                            {/* ✅ 安全判斷材質 */}
                            
                        </div>
                    </div>

                    {/* ✅ 這一列是數量＋icon：桌機在最右欄；手機會跑到文字下方 */}
                    <div className={styles.actionsRow}>
                        <div className={styles.qtyControl}>
                            <button type="button"
                                onClick={() => dec(item)}
                                disabled={pending[keyOf(item)] || Number(item.quantity) <= 1}
                                className={styles.qtyBtn}>–</button>
                            <span className={styles.qtyBox}>{item.quantity}</span>
                            <button type="button"
                                onClick={() => inc(item)}
                                disabled={pending[keyOf(item)] || Number(item.quantity) >= 99}
                                className={styles.qtyBtn}>+</button>
                        </div>

                        <div className={styles.iconActions}>
                            <div className={styles.heartWrapper}
                                onClick={() => onRemove(item.product_id, item.color_id, item.size_id)}
                                role="button" title="取消收藏">
                                <FaHeart className={styles.heart} />
                                <FaRegHeart className={styles.heartEmpty} />
                            </div>
                            <FaCartShopping
                                className={styles.cart}
                                onClick={() => {
                                    const product = toCartProduct(item);
                                    const qty = Number(item.quantity) || 1;
                                    addToCart(product, qty);
                                    openSuccessModal(product, qty, item.color_name, item.size_label);
                                }}
                                role="button"
                                title="加入購物車"
                            />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}
