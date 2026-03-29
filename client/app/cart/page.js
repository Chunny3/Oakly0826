"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CartCard from "./_components/cartCard";
import Gradation from "./_components/gradation";
import Total from "./_components/total";
import "@/styles/cart/cartOrder.css";
import { useCart } from "@/hooks/use-cart";
// sweetalert2 對話盒
import Swal from "sweetalert2";
// sweetalert2 整合 react 的函式
import withReactContent from "sweetalert2-react-content";

export default function CartOrderPage() {
  const { items, onDecrease, onIncrease, onRemove, totalQty, totalAmount } = useCart();
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const cartItems = JSON.parse(localStorage.getItem("cart"));
    // 檢查購物車是否為空
    if (!cartItems || cartItems.length === 0) {
      Swal.fire({
        title: "目前購物車中沒有商品",
        text: "請先到商品頁面選購商品",
        icon: "info",
        confirmButtonText: "去選購商品",
      }).then((result) => {
        if (result.isConfirmed) {
          router.push("/products"); // 導向商品頁面，請根據你的路由調整
        }
      });
    }
  }, [router]); // 依賴項包含 items 和 router

  // 處理全選/取消全選
  const handleSelectAll = (checked) => {
    setSelectAll(checked);
    if (checked) {
      const allItemIds = items.map((item) => item.id);
      setSelectedItems(new Set(allItemIds));
    } else {
      setSelectedItems(new Set());
    }
  };

  // 處理單個商品選擇
  const handleItemSelect = (itemId, checked) => {
    const newSelectedItems = new Set(selectedItems);

    if (checked) {
      newSelectedItems.add(itemId);
    } else {
      newSelectedItems.delete(itemId);
    }

    setSelectedItems(newSelectedItems);

    // 檢查是否應該更新全選狀態
    if (newSelectedItems.size === items.length) {
      setSelectAll(true);
    } else {
      setSelectAll(false);
    }
  };

  // 確認並刪除選中的商品
  const confirmAndRemoveSelected = () => {
    const selectedItemsArray = Array.from(selectedItems);
    if (selectedItemsArray.length === 0) {
      Swal.fire({
        title: "沒有選擇商品",
        text: "請先選擇要刪除的商品",
        icon: "info",
        confirmButtonText: "確定",
      });
    } else {
      const selectedItemsData = items.filter((item) =>
        selectedItems.has(item.id)
      );
      const itemNames = selectedItemsData.map((item) => item.name).join(", ");

      Swal.fire({
        title: "確定要刪除嗎?",
        text: "全部商品將會從購物車中被刪除，此操作無法復原",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        cancelButtonText: "取消",
        confirmButtonText: "確認刪除",
      }).then((result) => {
        // 如果使用者按下確認按鈕後執行這裡
        if (result.isConfirmed) {
          try {
            // 從 localStorage 取得現有的購物車資料
            const cartData = JSON.parse(localStorage.getItem("cart") || "[]");

            // 過濾掉被選中的商品，只保留未被選中的商品
            const updatedCartData = cartData.filter(
              (item) => !selectedItems.has(item.id)
            );

            // 將更新後的資料存回 localStorage
            localStorage.setItem("cart", JSON.stringify(updatedCartData));

            // 清空選中狀態
            setSelectedItems(new Set());

            // 跳出刪除成功對話盒
            Swal.fire({
              title: "已成功刪除",
              text: "商品已從購物車中被刪除",
              icon: "success",
            }).then(() => {
              try {
                router.fresh();
              } catch (error) {
                window.location.reload();
              }
            });
          } catch (error) {
            console.error("刪除商品時發生錯誤:", error);
            Swal.fire({
              title: "刪除失敗",
              text: "刪除商品時發生錯誤，請重試",
              icon: "error",
              confirmButtonText: "確定",
            });
          }
        }
      });

      // 這裡可以加入實際的刪除邏輯
      console.log("要刪除的商品:", selectedItemsData);
    }
  };

  // 跳出確認對話盒的函式
  const confirmAndRemove = (item) => {
    // 先包裝給 React 用的物件
    const MySwal = withReactContent(Swal);
    // 官網範例(改用MySwal呼叫)
    Swal.fire({
      title: "確定要刪除嗎?",
      text: `${item.name} 將會從購物車中被刪除，此操作無法復原`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      cancelButtonText: "取消",
      confirmButtonText: "確認刪除",
    }).then((result) => {
      // 如果使用者按下確認按鈕後執行這裡
      if (result.isConfirmed) {
        // 執行刪除
        onRemove(item.id);

        // 跳出刪除成功對話盒
        Swal.fire({
          title: "已成功刪除",
          text: `${item.name} 已從購物車中被刪除`,
          icon: "success",
        });
      }
    });
  };

  const confirmItems = () => {
    const selectedItemsArray = Array.from(selectedItems);
    if (selectedItemsArray.length === 0) {
      Swal.fire({
        title: "購物車中沒有商品",
        text: "請到商品列表選擇商品",
        icon: "info",
        confirmButtonText: "確定",
      });
    }
  }

  // useEffect(() => {
  //   return () => {
  //     localStorage.removeItem("delivery");
  //     localStorage.removeItem("payment");
  //     localStorage.removeItem("invoice");
  //   };
  // }, []);
  // if(!items){
  //   return(

  //   )
  // }
  return (
    <div className="container-fluid">
      <Gradation step="order" />
      <div className="cart">
        <div className="left-side">
          <div className="cart-main-title">
            <div className="choose-all">
              <input
                type="checkbox"
                checked={selectAll}
                onChange={(e) => handleSelectAll(e.target.checked)}
                placeholder="選擇全部"
              />
              <h6>選擇全部</h6>
            </div>
            <button
              onClick={() => {
                if (!items || items.length === 0) {
                  // 如果購物車沒有商品
                  Swal.fire({
                    title: "購物車是空的",
                    text: "沒有商品可以刪除",
                    icon: "info",
                    confirmButtonText: "確定",
                  });
                } else {
                  // // sweetalert2 對話盒
                  // confirmAndRemove(items);
                  confirmAndRemoveSelected(items);
                }
              }}
            >
              <i className="fa-solid fa-trash"></i>刪除
            </button>
          </div>
          <div className="cart-main-first">
            <h4>訂單資訊</h4>
            {/* if(!items){

            } */}
            <CartCard
              type="order"
              selectedItems={selectedItems}
              onItemSelect={handleItemSelect}
            />
          </div>
        </div>
        <div className="orange-side">
          <Total type="order" />
        </div>
      </div>
    </div>
  );
}
