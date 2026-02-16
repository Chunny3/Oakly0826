import React, { useState, useEffect, useRef } from 'react';
import { useCart } from '@/app/contexts/CartContext';


const bestseller = ({ currentProductId,
  handleWishlistToggle,
  isProductInWishlist,
  hasAnyWishlist,
  addToCart,
  handleCartClick
}) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [failedImages, setFailedImages] = useState(new Set());
  const carouselRef = useRef(null);
  // const { addToCart } = useCart();



  // 處理加入購物車
  const handleAddToCart = (product, event) => {
    event.stopPropagation();
    addToCart(product, 1);
  };

  const handleImageError = (e, productId) => {
    e.target.src = "/img/lan/nana.webp";
    setFailedImages(prev => new Set([...prev, productId]));
  };

  // 每次顯示的產品數量（響應式）
  const [itemsToShow, setItemsToShow] = useState(4);

  // 響應式設定
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setItemsToShow(1); // 手機版顯示 1 個
      } else if (width < 1024) {
        setItemsToShow(2); // 平板顯示 2 個
      } else if (width < 1440) {
        setItemsToShow(3); // 小桌面顯示 3 個
      } else {
        setItemsToShow(4); // 大桌面顯示 4 個
      }
    };

    handleResize(); // 初始設定
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 獲取隨機產品
  useEffect(() => {
    const fetchSimilarProducts = async () => {
      try {
        setLoading(true);

        // 先獲取所有產品
        const response = await fetch('http://localhost:3005/api/products');
        const allProducts = await response.json();

        if (Array.isArray(allProducts)) {
          // 過濾掉當前產品，然後隨機選擇 5個產品
          const filteredProducts = allProducts.filter(product => product.id !== currentProductId);
          const shuffled = filteredProducts.sort(() => 0.5 - Math.random());
          const randomProducts = shuffled.slice(0, Math.min(5, shuffled.length));

          setProducts(randomProducts);
        }
      } catch (error) {
        console.error('獲取相似產品失敗:', error);
        // 設定一些模擬產品作為備用
        setProducts(getMockProducts());
      } finally {
        setLoading(false);
      }
    };

    fetchSimilarProducts();
  }, [currentProductId]);



  // 計算可以滑動的最大索引
  const maxIndex = Math.max(0, products.length - itemsToShow);

  // 左滑
  const slideLeft = () => {
    setCurrentIndex(prevIndex => Math.max(0, prevIndex - 1));
  };

  // 右滑
  const slideRight = () => {
    setCurrentIndex(prevIndex => Math.min(maxIndex, prevIndex + 1));
  };

  // 滑動到特定產品
  const handleProductClick = (productId) => {
    // 這裡可以導航到產品詳細頁面
    window.location.href = `/products/${productId}`;
  };

  if (loading) {
    return (
      <div className="similar-products-loading">
        <span>推薦商品</span>
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

  if (products.length === 0) {
    return null;
  }

  return (
    <div className="similar-products">
      <div className="section-header">
        <span className="section-title">推薦商品</span>
        <div className="carousel-controls">
          <button
            className={`nav-btn prev-btn ${currentIndex === 0 ? 'disabled' : ''}`}
            onClick={slideLeft}
            disabled={currentIndex === 0}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            className={`nav-btn next-btn ${currentIndex >= maxIndex ? 'disabled' : ''}`}
            onClick={slideRight}
            disabled={currentIndex >= maxIndex}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      <div className="products-carousel" ref={carouselRef}>
        <div
          className="products-track"
          style={{
            transform: `translateX(-${currentIndex * (100 / itemsToShow)}%)`,
            width: `${(products.length / itemsToShow) * 100}%`
          }}
        >
          {products.map((product) => (
            <div
              key={product.id}
              className="product-card"
              onClick={() => handleProductClick(product.id)}
              style={{ width: `${100 / products.length}%` }}
            >
              <button
                className={`wishlist-heart-btn ${hasAnyWishlist(product.id) ? 'active' : ''}`}
                onClick={async (e) => {
                  e.stopPropagation();
                  e.preventDefault();

                  // 如果未收藏，先獲取完整商品資料
                  if (!hasAnyWishlist(product.id)) {
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
                  } else {
                    handleWishlistToggle(product, e);
                  }
                }}
              >
                <i className={hasAnyWishlist(product.id) ? 'fas fa-heart' : 'far fa-heart'}></i>
              </button>
              <div className="product-image">
                <img
                  src={getProductImage(product)}
                  alt={product.name}
                  onError={(e) => handleImageError(e, product.id)}
                />
                <div className="product-actions">
                  <button
                    className="action-btn add-to-cart-action"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCartClick && handleCartClick(product, e);
                    }}
                  >
                    加入購物車
                  </button>
                </div>
              </div>
              <div className="product-info">
                <div className="product-info">
                  <h3 className="product-name">
                    {failedImages.has(product.id) ? "nana椅" : (product.name || "商品名稱載入中...")}
                  </h3>
                  <p className="product-price">
                    NT$ {failedImages.has(product.id) ? "2500" : (product.price?.toLocaleString() || "價格確認中")}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 指示點 */}
      <div className="carousel-dots">
        {[...Array(maxIndex + 1)].map((_, index) => (
          <button
            key={index}
            className={`dot ${currentIndex === index ? 'active' : ''}`}
            onClick={() => setCurrentIndex(index)}
          />
        ))}
      </div>
    </div>
  );
};

// 獲取產品圖片的輔助函數
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

export default bestseller;