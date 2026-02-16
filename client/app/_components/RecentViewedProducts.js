import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/app/contexts/CartContext';



const RecentViewedProducts = ({ 
  currentProductId, 
  maxItems = 8,
  handleWishlistToggle,
  hasAnyWishlist,
  isProductInWishlist,
  addToCart,
  handleCartClick
}) => {
  const [recentProducts, setRecentProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const router = useRouter();

  

  // 響應式顯示數量
  const [itemsToShow, setItemsToShow] = useState(4);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setItemsToShow(1);
      } else if (width < 1024) {
        setItemsToShow(2);
      } else if (width < 1440) {
        setItemsToShow(3);
      } else {
        setItemsToShow(4);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 從 localStorage 獲取最近瀏覽的產品
  useEffect(() => {
    const getRecentViewedProducts = async () => {
      try {
        setLoading(true);
        
        // 從 localStorage 獲取瀏覽記錄
        const recentViewed = JSON.parse(localStorage.getItem('recentViewedProducts') || '[]');
        
        // 過濾掉當前產品，並限制數量
        const filteredIds = recentViewed
          .filter(id => id !== currentProductId)
          .slice(0, maxItems);

        if (filteredIds.length === 0) {
          setRecentProducts([]);
          setLoading(false);
          return;
        }

        // 獲取這些產品的詳細資料
        const productPromises = filteredIds.map(async (id) => {
          try {
            const response = await fetch(`http://localhost:3005/api/products/${id}`);
            const result = await response.json();
            if (result.status === 'success') {
              return result.data;
            }
          } catch (error) {
            console.error(`獲取產品 ${id} 失敗:`, error);
          }
          return null;
        });

        const products = await Promise.all(productPromises);
        const validProducts = products.filter(product => product !== null);
        
        setRecentProducts(validProducts);

      } catch (error) {
        console.error('獲取最近瀏覽商品失敗:', error);
        setRecentProducts([]);
      } finally {
        setLoading(false);
      }
    };

    getRecentViewedProducts();
  }, [currentProductId, maxItems]);

  // 添加產品到瀏覽記錄
  const addToRecentViewed = (productId) => {
    if (typeof window === 'undefined') return;
    
    try {
      const recentViewed = JSON.parse(localStorage.getItem('recentViewedProducts') || '[]');
      
      // 移除重複的產品ID
      const filteredViewed = recentViewed.filter(id => id !== productId);
      
      // 添加到最前面
      const updatedViewed = [productId, ...filteredViewed].slice(0, 20); // 最多保存20個
      
      localStorage.setItem('recentViewedProducts', JSON.stringify(updatedViewed));
    } catch (error) {
      console.error('保存瀏覽記錄失敗:', error);
    }
  };

  // 當前產品載入時添加到瀏覽記錄
  useEffect(() => {
    if (currentProductId) {
      addToRecentViewed(currentProductId);
    }
  }, [currentProductId]);

  // 產品點擊處理
  const handleProductClick = (productId) => {
    router.push(`/products/${productId}`);
  };

  // 滑動控制
  const maxIndex = Math.max(0, recentProducts.length - itemsToShow);

  const slideLeft = () => {
    setCurrentIndex(prev => Math.max(0, prev - 1));
  };

  const slideRight = () => {
    setCurrentIndex(prev => Math.min(maxIndex, prev + 1));
  };

  // 獲取產品圖片
  const getProductImage = (product) => {
    if (product.images && product.images.length > 0) {
      const imageUrl = typeof product.images[0] === 'string' 
        ? product.images[0] 
        : product.images[0].url;
      
      return imageUrl.startsWith('http') 
        ? imageUrl 
        : `http://localhost:3005${imageUrl}`;
    }
    return `https://via.placeholder.com/300x200/f0f0f0/666?text=${encodeURIComponent(product.name)}`;
  };

  // 如果沒有瀏覽記錄，不顯示組件
  if (!loading && recentProducts.length === 0) {
    return null;
  }

  if (loading) {
    return (
      <div className="recent-viewed-loading">
        <div className="section-header">
          <span className="section-title">最近瀏覽的商品</span>
        </div>
        <div className="loading-placeholder">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="product-skeleton">
              <div className="skeleton-image"></div>
              <div className="skeleton-text"></div>
              <div className="skeleton-price"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  

  return (
    <div className="recent-viewed-products">
      <div className="section-header">
        <span className="section-title">最近瀏覽的商品</span>
        <div className="header-controls">
          <div className="carousel-controls">
            <button 
              className={`nav-btn prev-btn ${currentIndex === 0 ? 'disabled' : ''}`}
              onClick={slideLeft}
              disabled={currentIndex === 0}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button 
              className={`nav-btn next-btn ${currentIndex >= maxIndex ? 'disabled' : ''}`}
              onClick={slideRight}
              disabled={currentIndex >= maxIndex}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="products-carousel">
        <div 
          className="products-track"
          style={{
            transform: `translateX(-${currentIndex * (100 / itemsToShow)}%)`,
            width: `${(recentProducts.length / itemsToShow) * 100}%`
          }}
        >
          {recentProducts.map((product) => (
            <div 
              key={`recent-${product.id}`} 
              className="product-card recent-product-card"
              style={{ width: `${100 / recentProducts.length}%`,zIndex: 0 }}
            >
              <div className="product-image" onClick={() => handleProductClick(product.id)}>
                <img 
                  src={getProductImage(product)} 
                  alt={product.name}
                  onError={(e) => {
                    e.target.src = "https://via.placeholder.com/300x200/f0f0f0/666?text=無圖片";
                  }}
                />
          <button
  className={`wishlist-heart-btn ${hasAnyWishlist(product.id) ? 'active' : ''}`}
  onClick={async (e) => {
    e.stopPropagation();
    e.preventDefault();

    // 總是獲取完整商品資料
    try {
      const response = await fetch(`http://localhost:3005/api/products/${product.id}`);
      const result = await response.json();

      if (result.status === 'success') {
        handleWishlistToggle(result.data, e);
      } else {
        handleWishlistToggle(product, e);
      }
    } catch (error) {
      handleWishlistToggle(product, e);
    }
  }}
>
                <i className={hasAnyWishlist(product.id) ? 'fas fa-heart' : 'far fa-heart'}></i>
              </button>
              </div>
              <div className="product-info" onClick={() => handleProductClick(product.id)}>
                <h3 className="product-name">{product.name}</h3>
                <p className="product-price">NT$ {product.price?.toLocaleString()}</p>
              </div>
              {/* 加入購物車按鈕 */}
              <button 
                className="product-add-to-cart-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCartClick && handleCartClick(product, e);
                }}
              >
                加入購物車
              </button>
            </div>
          ))}
        </div>
      </div>

      {recentProducts.length > itemsToShow && (
        <div className="carousel-dots">
          {[...Array(maxIndex + 1)].map((_, index) => (
            <button
              key={index}
              className={`dot ${currentIndex === index ? 'active' : ''}`}
              onClick={() => setCurrentIndex(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default RecentViewedProducts;