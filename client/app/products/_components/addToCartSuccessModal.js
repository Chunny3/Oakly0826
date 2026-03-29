"use client"

import { useEffect } from "react";

export default function AddToCartSuccessModal({ product, quantity, selectedColor, selectedSize, isVisible, onClose }) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);
  // 添加动画样式到 head
  useEffect(() => {
    const styleId = 'cart-modal-animations';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        @keyframes slideInFromRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes slideOutToRight {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);


  if (!isVisible || !product) return null;

  const getProductImage = (product) => {
    if (product.images && product.images.length > 0) {
      const image = product.images[0];
      if (typeof image === 'object' && image.url) {
        return image.url.startsWith('http') ? image.url : `http://localhost:3005${image.url}`;
      }
      if (typeof image === 'string') {
        return image.startsWith('http') ? image : `http://localhost:3005${image}`;
      }
    }
    return "/img/lan/nana.webp";
  };

  return (
    <div className="cart-success-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'flex-start',
        zIndex: 1000,
        animation: isVisible ? 'fadeIn 0.3s ease-out' : 'fadeOut 0.3s ease-out'
      }}
      onClick={onClose}>
      <div className="cart-success-modal" onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'white',
          borderRadius: '2px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
          margin: '20px',
          maxWidth: '400px',
          width: '100%',
          transform: isVisible ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          animation: isVisible ? 'slideInFromRight 0.4s cubic-bezier(0.4, 0, 0.2, 1)' : 'slideOutToRight 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
        <div className="cart-success-header">
          <div className="success-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="12" fill="#719A8B" />
              <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h3>成功加入購物車！</h3>
          <button className="close-btn" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="cart-success-content">
          <div className="product-image2">
            <img
              src={getProductImage(product)}
              alt={product.name}
              onError={(e) => {
                e.target.src = "/img/lan/nana.webp";
              }}
            />
          </div>
          <div className="product-details">
            <h4 className="product-name-m">{product.name}</h4>
            <p className="product-price-p">NT$ {product.price?.toLocaleString()}</p>
            <div className="product-info-o">
              {selectedColor && (
                <span className="color-label">顏色: {selectedColor.color_name}</span>
              )}
              {selectedSize && (
                <span className="size-label">尺寸: {selectedSize.size_label}</span>
              )}
              <span className="quantity-info">數量: {quantity}</span>
            </div>

          </div>
        </div>

        <div className="cart-success-actions">
          <button className="continue-shopping" onClick={onClose}>
            繼續購物
          </button>
          <button className="view-cart" onClick={() => {
            window.location.href = '/cart';
          }}>
            查看購物車
          </button>
        </div>
      </div>
    </div>
  );
};
const modalAnimationStyles = `
  @keyframes slideInFromRight {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes slideOutToRight {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes fadeOut {
    from { opacity: 1; }
    to { opacity: 0; }
  }
`;