"use client";

import "@/styles/cart/cartCard.css";
import React, { useState } from "react";
import { useCart } from "@/hooks/use-cart";
// sweetalert2 對話盒
import Swal from "sweetalert2";
// sweetalert2 整合 react 的函式
import withReactContent from "sweetalert2-react-content";

export default function CartCard({ type, selectedItems, onItemSelect }) {
  const [showForm, setShowForm] = useState(false);
  const { items, onDecrease, onIncrease, onRemove, totalQty, totalAmount } =
    useCart();
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
      confirmButtonText: "確認刪除!",
    }).then((result) => {
      // 如果使用者按下確認按鈕後執行這裡
      if (result.isConfirmed) {
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

  if (items) {
    if (type === "order") {
      return (
        <>
          <div className="cart-card">
            {items.map((item, index) => (
              <div key={index} className="cardAll">
                <div className="cart-main">
                  <div className="card-left">
                    <input
                      type="checkbox"
                      checked={selectedItems.has(item.id)}
                      onChange={(e) => onItemSelect(item.id, e.target.checked)}
                    />
                    <img
                      src={`http://localhost:3005/uploads/${item.img}`}
                      alt={item.name}
                      width={150}
                      height={150}
                    />
                    <div className="card-title">
                      <h6>{item.name}</h6>
                      <p>顏色: {item.color || "無顏色"}</p>
                      <p>size: {item.sizes[0].size_label || "無尺寸"}</p>
                      <p>材質: {item.materials.find(m => m.id === item.materials_id)?.material_name || '無材質'}</p>
                    </div>
                  </div>
                  <div className="card-right">
                    <button
                      onClick={() => {
                        // sweetalert2 對話盒
                        confirmAndRemove(item);
                      }}
                      className="buttonX"
                    >
                      <i className="fa-solid fa-xmark"></i>
                    </button>
                    <div className="price-num">
                      <h5>${item.price}</h5>
                      <div className="quantity">
                        <button
                          onClick={() => onDecrease(item.id)}
                          disabled={item.quantity <= 1}
                          className="minus"
                        >
                          <i className="fa-solid fa-minus"></i>
                        </button>
                        <div className="num">{item.quantity}</div>
                        <button
                          onClick={() => onIncrease(item.id)}
                          className="plus"
                        >
                          <i className="fa-solid fa-plus"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="cart-line"></div>
              </div>
            ))}
          </div>

          {/* 手機-------------------------- */}
          <div className="cart-line phone"></div>
          <div className="cart-card phone">
            {items.map((item, index) => (
              <div key={index} className="cardAll">
                <div className="cart-main phone">
                  <div className="card-left">
                    <input type="checkbox" />
                    <img
                      src={`http://localhost:3005/uploads/${item.img}`}
                      alt={item.name}
                      width={100}
                      height={95}
                    />
                    <div className="card-title">
                      <h6>{item.name}</h6>
                      <p>顏色: {item.color || "無顏色"}</p>
                      <p>size: {item.sizes[0].size_label || "無尺寸"}</p>
                      <p>材質: {item.materials.find(m => m.id === item.materials_id)?.material_name || '無材質'}</p>
                      <div className="price-one">
                        <h6>${item.price}</h6>
                        <div className="quantity">
                          <button
                            onClick={() => onDecrease(item.id)}
                            className="minus"
                          >
                            <i className="fa-solid fa-minus"></i>
                          </button>
                          <div className="num">{item.quantity}</div>
                          <button
                            onClick={() => onIncrease(item.id)}
                            className="plus"
                          >
                            <i className="fa-solid fa-plus"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="card-right">
                    <button
                      onClick={() => {
                        // sweetalert2 對話盒
                        confirmAndRemove(item);
                      }}
                      className="buttonX"
                    >
                      <i className="fa-solid fa-trash"></i>
                    </button>
                    <div className="price-num">
                      <h4>${item.price * item.quantity}</h4>
                    </div>
                  </div>
                </div>
                <div className="cart-line phone"></div>
              </div>
            ))}
          </div>
        </>
      );
    } else {
      return (
        <>
          <div className="cart-card pc">
            {items.map((item, index) => (
              <div key={index} className="cart-main">
                <div className="card-left">
                  <img
                    src={`http://localhost:3005/uploads/${item.img}`}
                    alt={item.name}
                    width={150}
                    height={150}
                  />
                  <div className="card-title">
                    <h5>{item.name}</h5>
                    <p>顏色: {item.color || "無顏色"}</p>
                    <p>size: {item.sizes[0].size_label || "無尺寸"}</p>
                    <p>材質: {item.materials.find(m => m.id === item.materials_id)?.material_name || '無材質'}</p>
                  </div>
                </div>
                <div className="card-right">
                  <h6>${item.price * item.quantity}</h6>
                  <p>數量: {item.quantity}</p>
                </div>
              </div>
            ))}
          </div>

          {/* 手機-------------------------- */}
          <div className="cart-line phone"></div>
          <div className="cart-card phone">
            {showForm && (
              <>
                <div
                  className={`toggle-content ${showForm ? "open" : ""} phone`}
                >
                  {items.map((item) => (
                    <div key={item.id} className="cart-main phone">
                      <div className="card-left">
                        <img
                          src={`http://localhost:3005/uploads/${item.img}`}
                          alt={item.name}
                          width={150}
                          height={150}
                        />
                        <div className="card-title detail">
                          <h6>{item.name}</h6>
                          <div>
                            <p>
                              顏色:{" "}
                              {item.colors.find((c) => c.id === item.colors_id)
                                ?.color_name || "無顏色"}
                            </p>
                            <p>
                              size:{" "}
                              {item.sizes.find((s) => s.id === item.sizes_id)
                                ?.size_label || "無尺寸"}
                            </p>
                            {/* <p>材質: {item.materials.find(m => m.id === item.materials_id)?.material_name || '無材質'}</p> */}
                            <p>數量: {item.quantity}</p>
                          </div>
                          <div className="totalPrice">
                            <h6>小計</h6>
                            <h3>${item.price * item.quantity}</h3>
                          </div>
                        </div>
                      </div>
                      <div className="cart-line phone"></div>
                    </div>
                  ))}
                </div>
              </>
            )}
            <div className="totalNumPrice phone">
              <h6>訂單金額({totalQty})</h6>
              <div className="total-price phone">
                <h6>合計</h6>
                <h4>{totalAmount}</h4>
              </div>
            </div>
          </div>
          <button
            className="toggleBtn1 card phone"
            onClick={() => {
              setShowForm(!showForm);
            }}
            id="toggleBtn"
          >
            {showForm ? "收合清單" : "展開清單"}
          </button>
        </>
      );
    }
  } else {
    return (
      <div className="noProduct">
        <h6>目前沒有商品</h6>
      </div>
    );
  }
}