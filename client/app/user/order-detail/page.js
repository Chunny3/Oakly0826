'use client'

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';  // ← 新增這行
import Link from 'next/link';
import '@/styles/order/order-detail.css';
import { useAuth } from '@/hooks/use-auth';  // ← 新增這行

export default function OrderDetailPage() {
  const { user } = useAuth();  // ← 新增這行
  const searchParams = useSearchParams();  // ← 新增這行
  const orderId = searchParams.get('id');  // ← 新增這行，從 URL 獲取訂單 ID

  const [activeTab, setActiveTab] = useState('all');

  // ← 刪除原本的假資料 orders 陣列，改成以下狀態
  const [orderDetail, setOrderDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const tabs = [
    { id: 'all', label: '全部' },
    { id: 'pending-payment', label: '待付款' },
    { id: 'pending-shipment', label: '待出貨' },
    { id: 'pending-receipt', label: '待收貨' },
    { id: 'completed', label: '已完成' },
    { id: 'cancelled', label: '取消' },
    { id: 'return-refund', label: '退貨/退款' }
  ];

  // ← 新增：獲取訂單詳情的函數
  const fetchOrderDetail = async () => {
    if (!orderId || !user || !user.id) {
      setError('訂單ID不存在或請先登入');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`http://localhost:3005/api/order/detail?userId=${user.id}&orderId=${orderId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('reactLoginToken')}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || '獲取訂單詳情失敗');
      }

      if (result.status === 'success') {
        setOrderDetail(processOrderDetail(result.data));
      } else {
        throw new Error(result.message || '獲取訂單詳情失敗');
      }
    } catch (error) {
      console.error('獲取訂單詳情錯誤:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const processOrderDetail = (rawData) => {
    console.log('processOrderDetail 收到的資料:', rawData);

    if (!rawData) {
      console.log('沒有資料');
      return null;
    }

    const orderData = rawData;
    console.log('訂單資料:', orderData);

    return {
      id: orderData.order_number,
      orderId: orderData.order_id,
      status: 'delivery',
      statusText: '配送中',
      createDate: new Date(orderData.create_at).toLocaleDateString('zh-TW'),
      product: {
        name: orderData.items?.[0]?.product_name || '商品名稱',
        specs: `${orderData.items?.[0]?.size || ''} ${orderData.items?.[0]?.color || ''} ${orderData.items?.[0]?.material || ''}`.trim(),
        color: orderData.items?.[0]?.color || '顏色',
        quantity: orderData.items?.reduce((sum, item) => sum + item.quantity, 0) || 1,
        price: orderData.items?.[0]?.price || 0
      },
      couponDiscount: orderData.coupon_discount || 0,
      shippingDiscount: orderData.shipping_discount || 0,
      couponName: orderData.coupon_name || null,
      total: orderData.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || orderData.total_amount,
      recipient: orderData.recipient_name || '收件人',
      phone: orderData.recipient_phone || '聯絡電話',
      address: `${orderData.postal_code || ''} ${(orderData.address || '').replace(/^240\s*/, '')}`.trim() || '配送地址', shippingMethod: '宅配',
      paymentMethod: '信用卡',
      buyerInfo: {
        name: orderData.buyer_name,
        email: orderData.buyer_email,
        phone: orderData.buyer_phone
      },
      items: orderData.items || []
    };
  };

  // ← 新增：useEffect 來載入資料
  useEffect(() => {
    if (user && user.id && orderId) {
      fetchOrderDetail();
    }
  }, [user, orderId]);

  // ← 新增：載入狀態
  if (loading) {
    return (
      <div className="order-detail-page">
        <div className="main-content">
          <main className="order-detail-content">
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>載入訂單詳情中...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // ← 新增：錯誤狀態
  if (error) {
    return (
      <div className="order-detail-page">
        <div className="main-content">
          <main className="order-detail-content">
            <div className="error-state">
              <i className="fas fa-exclamation-triangle"></i>
              <p>載入失敗: {error}</p>
              <Link href="/order">
                <button className="return-btn">返回訂單列表</button>
              </Link>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // ← 新增：沒有資料時
  if (!orderDetail) {
    return (
      <div className="order-detail-page">
        <div className="main-content">
          <main className="order-detail-content">
            <div className="empty-state">
              <p>找不到訂單資料</p>
              <Link href="/user/order">
                <button className="return-btn">返回訂單列表</button>
              </Link>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="order-detail-page">
      <div className="main-content">
        <main className="order-detail-content">
          {/* 訂單狀態標籤頁 */}
          <div className="order-tabs">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
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
              <input type="text" placeholder="搜尋訂單編號 / 商品名稱" />
            </div>
          </div>

          {/* 訂單詳情 - 修改這裡，移除 map，直接顯示單一訂單 */}
          <div className="order-list">
            <div className="order-item">
              <div className="order-header">
                <div className="order-number">
                  <i className="fas fa-leaf"></i>
                  訂單編號 : {orderDetail.id} {/* ← 改用 orderDetail */}
                </div>
                <div className="order-status">
                  <span className={`status-btn ${orderDetail.status}`}>{orderDetail.statusText}</span> {/* ← 改用 orderDetail */}
                </div>
              </div>

              <div className="order-details">
                <div className="product-image">
                  <img
                    src={orderDetail.items[0]?.product_image ? `http://localhost:3005/uploads/${orderDetail.items[0].product_image}` : "https://via.placeholder.com/80x80/f0f0f0/666?text=Table"}
                    alt="商品圖片"
                    onError={(e) => {
                      e.target.src = "https://via.placeholder.com/80x80/f0f0f0/666?text=Table";
                    }}
                  />
                </div>
                <div className="order-info">
                  <div className="product-info">
                    <h4>商品清單：</h4>
                    {orderDetail.items.map((item, index) => (
                      <div key={index} className="product-item" style={{ marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                        <div className="product-name">{item.product_name}</div>
                        <div className="product-specs">
                          <span>{item.size} {item.color} {item.material}</span>
                        </div>
                        <div className="product-quantity-price">
                          數量: {item.quantity} | 單價: NT$ {item.price.toLocaleString()}
                        </div>
                        {item.product_image && (
                          <img
                            src={`http://localhost:3005/uploads/${item.product_image}`}
                            alt={item.product_name}
                            style={{ width: '60px', height: '60px', objectFit: 'cover', marginTop: '5px' }}
                            onError={(e) => { e.target.src = "/img/lan/placeholder.jpeg"; }}
                          />
                        )}
                      </div>
                    ))}

                    <div className="info-tag">付款明細</div>
                    <div className="pricing-details">
                      <div className="details">
                        <span>{orderDetail.couponName ? `${orderDetail.couponName}折扣` : '優惠券折扣'}</span>
                        <span>運費折扣</span>
                      </div>
                      <div className="discount-details">
                        {orderDetail.items.map((item, index) => (
                          <div key={index} className="quantity-price">
                            {item.quantity} x NT$ {item.price} = NT$ {item.quantity * item.price}
                          </div>
                        ))}                        <div className="discount">- NT$ {orderDetail.couponDiscount}</div>
                        <div className="discount">- NT$ {orderDetail.shippingDiscount}</div>
                      </div>
                    </div>
                  </div>

                  <div className="info-tag">運送資訊</div>
                  <div className="delivery-info">
                    <div className="recipient">收件者 : {orderDetail.recipient}</div> {/* ← 改用 orderDetail */}
                    <div className="phone">手機號碼 : {orderDetail.phone}</div> {/* ← 改用 orderDetail */}
                    <div className="address">地址 : {orderDetail.address}</div> {/* ← 改用 orderDetail */}
                    <div className="shipping-method">運送方式 : {orderDetail.shippingMethod}</div> {/* ← 改用 orderDetail */}
                    <div className="payment-method">付款方式 : {orderDetail.paymentMethod}</div> {/* ← 改用 orderDetail */}
                  </div>
                </div>
              </div>

              <div className="order-total">
                訂單金額 : NT$ {orderDetail.total} {/* ← 改用 orderDetail */}
              </div>
            </div>
          </div>

          <div className='return-container'>
            <Link href="/user/order">
              <div className='return'>返回</div>
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}