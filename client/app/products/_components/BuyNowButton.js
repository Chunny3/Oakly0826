"use client";
import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

export default function BuyNowButton({ 
  product, 
  selectedColor, 
  selectedSize, 
  quantity = 1,
  onBuyNow,
  className = "buy-now-btn"
}) {
  const [currentStock, setCurrentStock] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedColor && selectedSize && product) {
      checkStock();
    }
  }, [selectedColor, selectedSize, product, quantity]);

  const checkStock = async () => {
    try {
      console.log('檢查庫存參數:', {
        productId: product.id,
        colorId: selectedColor.id,
        sizeId: selectedSize.id,
        quantity: quantity
      });

      const response = await fetch(`http://localhost:3005/api/products/${product.id}/stock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          colorId: selectedColor.id,
          sizeId: selectedSize.id,
          quantity: quantity
        })
      });
      
      const result = await response.json();
      console.log('庫存檢查回應:', result);

      if (result.status === 'success') {
        console.log('設定庫存數量:', result.data.availableStock);
        setCurrentStock(result.data.availableStock);
      }
    } catch (error) {
      console.error('檢查庫存失敗:', error);
      setCurrentStock(0);
    }
  };

  const handleClick = async () => {
    if (!selectedColor || !selectedSize) {
      Swal.fire({
        title: "請選擇商品規格",
        text: "請選擇顏色和尺寸",
        icon: "warning",
        confirmButtonColor: "#DBA783"
      });
      return;
    }

    if (currentStock === null) {
      Swal.fire({
        title: "庫存檢查中",
        text: "請稍候再試",
        icon: "info",
        confirmButtonColor: "#DBA783"
      });
      return;
    }

    if (currentStock > 0 && currentStock >= quantity) {
      // 庫存充足，執行購買
      onBuyNow();
    } else if (currentStock > 0 && currentStock < quantity) {
      // 庫存不足
      Swal.fire({
        title: "庫存不足",
        text: `目前庫存：${currentStock} 件，您選擇的數量：${quantity} 件`,
        icon: "warning",
        confirmButtonText: "我知道了",
        confirmButtonColor: "#DBA783"
      });
    } else {
      // 庫存為0，顯示到貨通知
      handleNotifyRequest();
    }
  };

  const handleNotifyRequest = async () => {
    const result = await Swal.fire({
      title: '商品到貨通知',
      text: '此商品目前缺貨，是否要設定到貨通知？',
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: '設定通知',
      cancelButtonText: '取消',
      confirmButtonColor: '#DBA783'
    });

    if (result.isConfirmed) {
      const { value: email } = await Swal.fire({
        title: '請輸入Email',
        input: 'email',
        inputPlaceholder: '請輸入您的Email地址',
        showCancelButton: true,
        confirmButtonText: '設定通知',
        cancelButtonText: '取消',
        confirmButtonColor: '#DBA783',
        inputValidator: (value) => {
          if (!value) {
            return '請輸入Email地址';
          }
        }
      });

      if (email) {
        setLoading(true);
        try {
          const userData = JSON.parse(localStorage.getItem('user') || '{}');
          
          const response = await fetch('http://localhost:3005/api/notify/stock', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              productId: product.id,
              colorId: selectedColor.id,
              sizeId: selectedSize.id,
              email: email,
              userId: userData.id,
              // 直接傳送用戶選擇的名稱
              productName: product.name,
              colorName: selectedColor.color_name,
              sizeName: selectedSize.size_label
            })
          });

          const result = await response.json();
          if (result.status === 'success') {
            Swal.fire({
              title: '設定成功！',
              text: '商品到貨時會Email通知您',
              icon: 'success',
              confirmButtonColor: '#DBA783'
            });
          } else {
            throw new Error(result.message);
          }
        } catch (error) {
          Swal.fire({
            title: '設定失敗',
            text: error.message || '請稍後再試',
            icon: 'error',
            confirmButtonColor: '#DBA783'
          });
        } finally {
          setLoading(false);
        }
      }
    }
  };

  const getButtonText = () => {
    if (currentStock === null) return "立即購買";
    return currentStock > 0 ? "立即購買" : "到貨通知";
  };

  const getButtonClass = () => {
    if (currentStock === null) return className;
    return currentStock > 0 ? className : `${className} notify-btn`;
  };

  return (
    <button
      onClick={handleClick}
      disabled={!selectedColor || !selectedSize || loading}
      className={getButtonClass()}
        style={{ 
    opacity: loading ? 0.6 : 1,
    cursor: loading ? 'not-allowed' : 'pointer'
  }}
    >
      {loading ? '處理中...' : getButtonText()}
    </button>
  );
}