"use client";

import { createContext, useContext, useState, useEffect, useRef } from "react";
import AddToCartSuccessModal from "@/app/products/_components/addToCartSuccessModal";

// #region 1. 建立 CartContext
const CartContext = createContext(null);
// 設定呈現的名稱 (displayName)
// 這是要搭配瀏覽器上的 react 開發擴充使用，方便除錯，不給的話會都用 "Context"
CartContext.displayName = "cartContext";
// #endregion

// #region 2. 建立&導出 Provider 元件(狀態在其中管理)
// 建立一個統一管理會員登出入狀態的包裹(有開頭結尾)元件
// 與會員有關的認證授權的狀態，和相關方法都集中在這元件中
export function CartProvider({ children }) {
  // 定義購物車項目
  const [items, setItems] = useState([]);
  const isInitialized = useRef(false);

  // 處理遞增
  const onIncrease = (itemId) => {
    // 1 //2
    const nextItems = items.map((v) => {
      // 如果比對出 id = cartItemId 的成員，進行展開物件並遞增 count 的值
      // v 代表陣列中物件值 例如: {id: 0, name: '小熊餅乾', count: 1}
      if (v.id === itemId) {
        // 如果比對出 id 是 itemId 的話，把 count 屬性值 +1 (用展開運算子(淺拷貝)+屬性值覆蓋)
        return { ...v, quantity: v.quantity + 1 };
      } else {
        return v;
      }
    });
    // 3 設定回狀態
    setItems(nextItems);
  };

  // 處理遞減
  const onDecrease = (itemId) => {
    // 第一層用陣列的 map 來展開每個成員
    const nextItems = items.map((v) => {
      // 如果比對出 id = cartItemId 的成員，進行展開物件並遞減 count 的值
      // v代表陣列中物件值 例如: {id: 0, name: '小熊餅乾', count: 1 }
      if (v.id === itemId) {
        return { ...v, quantity: v.quantity - 1 };
      } else {
        return v;
      }
    });
    // 3 設定回狀態
    setItems(nextItems);
  };

  // 處理新增
  const onAdd = (product,quantity) => {
    // 先判斷此商品是否已經在購物車
    const foundIndex = items.findIndex((v) => v.id === product.id);

    let nextItems;

    // 如果有找到
    if (foundIndex !== -1) {
      // 如果有找到 -> 做遞增
      nextItems = items.map((item, index) => {
        if (index === foundIndex) {
          return { ...item, quantity: item.quantity + quantity };
        }
        return item;
      });
      setItems(nextItems);
    } else {
      // 如果沒找到 -> 做新加入
      // 先寫出要新增的物件值，因為商品(product)和購物車項目(cartItem)間差了一個數量(count)屬性，預設為 1
      const newItem = { ...product, quantity };
      nextItems = [newItem, ...items];
      setItems(nextItems);
    }
  };

  //處理刪除
  const onRemove = (itemId) => {
    const nextItems = items.filter((v) => {
      //v代表陣列中物件值 例如: {id: 0, name: '小熊餅乾', count: 1 }
      return v.id !== itemId;
    });

    // 3 設定回狀態
    setItems(nextItems);
  };

  // 使用陣列的迭代方法 reduce(累加/歸納)
  // 計算總數量 (reduce 是陣列累加/歸納的迭代方式)
  const totalQty = items.reduce((acc, v) => acc + v.quantity, 0);
  const totalAmount = items.reduce((acc, v) => acc + v.quantity * v.price, 0);

  // 儲存 totalAmount 到 localStorage
  useEffect(() => {
    if (totalAmount !== undefined && totalAmount !== null) {
      localStorage.setItem("totalAmount", totalAmount.toString());
    }
  }, [totalAmount]);

  // 統一的 localStorage 同步化處理
  useEffect(() => {
    // 第一次渲染時，從 localStorage 讀取資料
    if (!isInitialized.current) {
      try {
        const storedItems = JSON.parse(localStorage.getItem("cart")) || [];
        setItems(storedItems);
        isInitialized.current = true;
      } catch (error) {
        console.error("讀取購物車資料失敗: ", error);
        // 如果讀取失敗，清空 localStorage 中的購物車資料
        localStorage.removeItem("cart");
        isInitialized.current = true;
      }
    } else {
      // 後續的 items 變更，寫入 localStorage
      try {
        localStorage.setItem("cart", JSON.stringify(items));
      } catch (error) {
        console.error("儲存購物車資料失敗: ", error);
      }
    }
  }, [items]);

  // 成功通知狀態
  const [successModal, setSuccessModal] = useState({
    isVisible: false,
    product: null,
    quantity: 0,
    selectedColor: null,
    selectedSize: null,
  });

  const openSuccessModal = (product, quantity, selectedColor, selectedSize) => {
    setSuccessModal({
      isVisible: true,
      product,
      quantity,
      selectedColor,
      selectedSize,
    });
  };
  // 關閉成功通知
  const closeSuccessModal = () => {
    setSuccessModal({
      isVisible: false,
      product: null,
      quantity: 0,
    });
  };

  return (
    <CartContext.Provider
      // 用 Context 傳遞要共享的資料或方式
      value={{
        items,
        totalAmount,
        totalQty,
        addToCart: onAdd,
        onDecrease,
        onIncrease,
        onRemove,
        openSuccessModal,
        closeSuccessModal,
      }}
    >
      {children}
      <AddToCartSuccessModal
        product={successModal.product}
        quantity={successModal.quantity}
        selectedColor={successModal.selectedColor}
        selectedSize={successModal.selectedSize}
        isVisible={successModal.isVisible}
        onClose={closeSuccessModal}
      />
    </CartContext.Provider>
  );
}
// #endregion

// #region 3. 客製 & 導出 useCart 勾子(包裝 useContext(CartContext))
export const useCart = () => useContext(CartContext);
// #endregion
