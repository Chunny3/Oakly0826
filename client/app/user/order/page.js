"use client";

import { useState, useEffect } from "react";
import Link from 'next/link';
import "@/styles/order/order-detail.css";
import { useAuth } from '@/hooks/use-auth';  // 引入 useAuth


export default function Order() {
  const { user } = useAuth(); // 直接從 hook 拿 user

  const [activeTab, setActiveTab] = useState("all");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const tabs = [
    { id: "all", label: "全部" },
    { id: "pending-payment", label: "待付款" },
    { id: "pending-shipment", label: "待出貨" },
    { id: "pending-receipt", label: "待收貨" },
    { id: "completed", label: "已完成" },
    { id: "cancelled", label: "取消" },
    { id: "return-refund", label: "退貨/退款" },
  ];

  // 訂單狀態映射
  const statusMapping = {
    "pending": { text: "待付款", class: "pending-payment" },
    "paid": { text: "待出貨", class: "pending-shipment" },
    "shipped": { text: "配送中", class: "delivery" },
    "delivered": { text: "已完成", class: "completed" },
    "cancelled": { text: "取消", class: "cancelled" },
    "refunded": { text: "退貨/退款", class: "return-refund" }
  };

  // 獲取用戶ID（從localStorage或其他認證方式）
  const getUserId = () => {
    // 這裡應該從你的認證系統獲取用戶ID
    const token = localStorage.getItem('reactLoginToken');
    if (!token) return null;

    try {
      // 假設token是JWT，你可以解析它獲取用戶ID
      // 或者從其他地方獲取當前登入用戶的ID
      return localStorage.getItem('userId'); // 簡化處理
    } catch (error) {
      console.error('無法獲取用戶ID:', error);
      return null;
    }
  };

  const fetchOrders = async () => {

  console.log('當前用戶:', user); // 添加這行
  console.log('用戶ID:', user?.id); // 添加這行
    if (!user || !user.id) {
      setError('請先登入');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`http://localhost:3005/api/order?userId=${user.id}`, {
        

        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('reactLoginToken')}`,
        },
      });

      const result = await response.json();
      console.log('API 回應:', result);
console.log('原始訂單資料:', result.data);

console.log('API 回應:', result); // 看看實際獲取到什麼資料
console.log('原始訂單資料:', result.data);


      if (!response.ok) {
        throw new Error(result.message || '獲取訂單失敗');
      }

      if (result.status === 'success') {
        const processedOrders = processOrderData(result.data);
        console.log('處理後的訂單數量:', processedOrders.length);
        console.log('處理後的訂單:', processedOrders);
        setOrders(processedOrders);

      } else {
        throw new Error(result.message || '獲取訂單失敗');
      }
    } catch (error) {
      console.error('獲取訂單錯誤:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };



  // 處理後端返回的訂單資料
 const processOrderData = (rawOrders) => {
  const ordersMap = new Map();

  rawOrders.forEach(item => {
    const orderId = item.order_id;

    if (!ordersMap.has(orderId)) {
      ordersMap.set(orderId, {
        id: item.order_number,
        orderId: orderId,
        status: "delivered",
        statusText: "配送中",
        createDate: new Date(item.create_at).toLocaleDateString(),
        total: item.total_amount, // 先用原本的值
        items: []
      });
    }

    // 添加商品項目
    ordersMap.get(orderId).items.push({
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.price,
      size: item.size,
      color: item.color,
      material: item.material,
      name: item.product_name || `商品 ${item.product_id}`,
      image: item.product_image || "/img/lan/placeholder.jpeg",
      specs: `${item.size || ''} ${item.color || ''} ${item.material || ''}`.trim()
    });
  });

  // 重新計算每個訂單的總金額
  const orders = Array.from(ordersMap.values());
  orders.forEach(order => {
    order.total = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  });

  return orders;
};

  // 搜尋功能
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  // 篩選訂單
  const filteredOrders = orders.filter(order => {
    // 搜尋過濾
    const matchesSearch = !searchQuery ||
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.items.some(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      );

    // 狀態過濾
    const matchesTab = activeTab === "all" || order.status === activeTab;

    return matchesSearch && matchesTab;
  });

  // 組件載入時獲取訂單
  useEffect(() => {
    if (user && user.id) {
      fetchOrders();
    }
  }, [user]);
  return (
    <div className="order-detail-page">
      {/* 主要內容區域 */}
      <div className="main-content">

        {/* 右側訂單詳情內容 */}
        <main className="order-detail-content">
          {/* 訂單狀態標籤頁 */}
          <div className="order-tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`tab-btn ${activeTab === tab.id ? "active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* 搜尋欄 */}
          <div className="search-section">
            <div className="search-bar">
              <i className="fas fa-search"></i>
              <input
                type="text"
                placeholder="搜尋訂單編號 / 商品名稱"
                value={searchQuery}
                onChange={handleSearch}
              />
            </div>
          </div>

          {/* 載入狀態 */}
          {loading && (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>載入訂單中...</p>
            </div>
          )}

          {/* 錯誤狀態 */}
          {error && (
            <div className="error-state">
              <i className="fas fa-exclamation-triangle"></i>
              <p>載入失敗: {error}</p>
              <button onClick={fetchOrders} className="retry-btn">
                重新載入
              </button>
            </div>
          )}

          {/* 訂單列表 */}
          {!loading && !error && (
            <div className="order-list">
              {filteredOrders.length === 0 ? (
                <div className="empty-state">
                  <i className="fas fa-shopping-bag"></i>
                  <p>目前沒有訂單</p>
                </div>
              ) : (
                filteredOrders.map((order) => (
                  <div key={order.orderId} className="order-item">
                    <div className="order-header">
                      <div className="order-number">
                        <i className="fas fa-leaf"></i>
                        訂單編號 : {order.id}
                      </div>
                      <div className="order-status">
                        <span className={`status-btn ${order.status}`}>
                          {order.statusText}
                        </span>
                      </div>
                    </div>

                    <Link href={`/user/order-detail?id=${order.orderId}`}>
                    <div className="order-details">
                        <div className="product-image">
                          <img
                            src={order.items[0]?.image ? `http://localhost:3005/uploads/${order.items[0].image}` : "/img/lan/placeholder.jpeg"}
                            alt="商品圖片"
                            onError={(e) => {
                              e.target.src = "/img/lan/placeholder.jpeg";
                            }}
                          />
                        </div>
                        <div className="order-info">
                          <div className="product-info">
                            {/* 顯示第一個商品的資訊 */}
                            {order.items[0] && (
                              <>
                                <div className="product-name">{order.items[0].name}</div>
                                <div className="product-specs">
                                  <span>{order.items[0].specs}</span>
                                </div>
                              </>
                            )}

                            {/* 如果有多個商品，顯示數量 */}
                            {order.items.length > 1 && (
                              <div className="more-items">
                                總計 {order.items.length - 1} 個商品
                              </div>
                            )}

                            <div className="info-tag">訂單詳情</div>
                            <div className="order-date">
                              訂單日期: {order.createDate}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                    <div className="order-total">
                      訂單金額 : NT$ {order.total?.toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}