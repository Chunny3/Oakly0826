"use client";

import React, { useState, useEffect } from "react";
import "@/styles/products/pid.css";
import "@/styles/products/notify.css";

import SimilarProducts from "@/app/_components/SimilarProducts.js";
import Bestseller from "@/app/_components/bestseller.js";
import RecentViewedProducts from "@/app/_components/RecentViewedProducts.js";
import RandomShowcaseSection from "@/app/_components/RandomShowcaseSection.js";
import CategoryDropdown from "@/app/_components/CategoryDropdown.js";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import Swal from 'sweetalert2';
import BuyNowButton from '@/app/products/_components/BuyNowButton.js';
import Link from "next/link";



const checkStock = async (productId, colorId, sizeId, quantity) => {
  try {
    const response = await fetch(`http://localhost:3005/api/products/${productId}/stock`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        colorId: parseInt(colorId),
        sizeId: parseInt(sizeId),
        quantity: parseInt(quantity)
      })
    });

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('檢查庫存失敗:', error);
    return { availableStock: 0, available: false };
  }
};





// 收藏成功通知組件
const AddToWishlistSuccessModal = ({ product, quantity, selectedColor, selectedSize, isVisible, onClose }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

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
    <div className="wishlist-success-overlay" onClick={onClose}>
      <div className="wishlist-success-modal" onClick={(e) => e.stopPropagation()}>
        <div className="wishlist-success-header">
          <div className="success-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="12" fill="#DBA783" />
              <path d="M16.5 8.5l-8 8-4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h3>成功加入收藏清單！</h3>
          <button className="close-btn" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="wishlist-success-content">
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

        <div className="wishlist-success-actions">
          <button className="continue-shopping" onClick={onClose}>
            繼續瀏覽
          </button>
          <button className="view-wishlist" onClick={() => {
            window.location.href = '/user/favorites';
          }}>
            查看收藏清單
          </button>
        </div>
      </div>
    </div>

  );

};

// 跟隨指針移動的滾動條類別
class CustomThumbnailScrollbar {
  constructor(onImageChange) {
    this.isDragging = false;
    this.startX = 0;
    this.startScrollLeft = 0;
    this.startThumbLeft = 0;
    this.onImageChange = onImageChange;
    this.lastImageIndex = -1;
    this.init();
  }

  init() {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () =>
        this.setupScrollbar()
      );
    } else {
      this.setupScrollbar();
    }
  }

  setupScrollbar() {
    const thumbnailContainer = document.querySelector(".thumbnail-images");
    if (!thumbnailContainer) return;

    const thumbnails = thumbnailContainer.querySelectorAll(".thumbnail");
    if (thumbnails.length <= 1) return;

    this.thumbnails = Array.from(thumbnails);
    this.thumbnailContainer = thumbnailContainer;
    // 智能判斷縮圖佈局 - 使用 !important 強制覆蓋
    const thumbnailCount = this.thumbnails.length;
    if (thumbnailCount <= 5) {
      // 縮圖少時，強制置中
      thumbnailContainer.style.setProperty(
        "justify-content",
        "center",
        "important"
      );
      thumbnailContainer.style.setProperty("display", "flex", "important");
    } else {
      // 縮圖多時，從左開始排列
      thumbnailContainer.style.setProperty(
        "justify-content",
        "flex-start",
        "important"
      );
      thumbnailContainer.style.setProperty("display", "flex", "important");
    }

    const existingScrollbar = document.querySelector(
      ".custom-scrollbar-container"
    );
    if (existingScrollbar) {
      existingScrollbar.remove();
    }

    const scrollbarContainer = this.createScrollbarContainer();
    thumbnailContainer.parentNode.insertBefore(
      scrollbarContainer,
      thumbnailContainer
    );
    thumbnailContainer.style.marginTop = "10px";

    this.setupScrollEvents(thumbnailContainer, scrollbarContainer);
    this.updateScrollbar(thumbnailContainer, scrollbarContainer);
  }

  createScrollbarContainer() {
    const container = document.createElement("div");
    container.className = "custom-scrollbar-container";
    container.style.cssText = `
      position: relative;
      width: 500px
      max-width: 500px
      height: 8px;
      margin-bottom: 4px;
    `;

    const track = document.createElement("div");
    track.className = "custom-scrollbar-track";
    track.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: #f1f1f1;
      border-radius: 2px;
      z-index: 10;
    `;

    const thumb = document.createElement("div");
    thumb.className = "custom-scrollbar-thumb";
    thumb.style.cssText = `
      position: absolute;
      top: 0;
      height: 4px;
      background: #666;
      border-radius: 2px;
      cursor: pointer;
      z-index: 11;
    `;

    container.appendChild(track);
    container.appendChild(thumb);

    return container;
  }
  calculateImageIndex(scrollLeft, scrollWidth, clientWidth) {
    if (!this.thumbnails || this.thumbnails.length === 0) return 0;

    const maxScrollLeft = scrollWidth - clientWidth;
    if (maxScrollLeft <= 0) return 0;

    const scrollPercentage = scrollLeft / maxScrollLeft;
    const imageIndex = Math.round(
      scrollPercentage * (this.thumbnails.length - 1)
    );

    return Math.max(0, Math.min(imageIndex, this.thumbnails.length - 1));
  }

  setupScrollEvents(container, scrollbarContainer) {
    const thumb = scrollbarContainer.querySelector(".custom-scrollbar-thumb");
    const track = scrollbarContainer.querySelector(".custom-scrollbar-track");

    // 只在非拖拽時更新滾動條
    container.addEventListener("scroll", () => {
      if (!this.isDragging) {
        this.updateScrollbar(container, scrollbarContainer);

        const imageIndex = this.calculateImageIndex(
          container.scrollLeft,
          container.scrollWidth,
          container.clientWidth
        );

        if (imageIndex !== this.lastImageIndex && this.onImageChange) {
          this.onImageChange(imageIndex);
          this.lastImageIndex = imageIndex;
        }
      }
    });

    this.setupDragEvents(container, thumb, track);

    track.addEventListener("click", (e) => {
      this.handleTrackClick(e, container, thumb, track);
    });
  }

  updateScrollbar(container, scrollbarContainer) {
    const thumb = scrollbarContainer.querySelector(".custom-scrollbar-thumb");
    const track = scrollbarContainer.querySelector(".custom-scrollbar-track");

    if (!thumb || !track) return;

    scrollbarContainer.style.display = "block";

    const trackWidth = track.offsetWidth;
    const thumbnailCount = this.thumbnails.length;

    // 計算每個縮圖在軌道上的寬度
    const thumbnailWidth = trackWidth / thumbnailCount;

    // 滑塊長度設為多個縮圖寬度
    let thumbWidth;
    if (thumbnailCount <= 1) {
      thumbWidth = trackWidth; // 單張圖片佔滿
    } else if (thumbnailCount <= 3) {
      thumbWidth = thumbnailWidth * 0.8; // 覆蓋2.5個縮圖寬度
    } else if (thumbnailCount <= 5) {
      thumbWidth = thumbnailWidth * 0.6; // 覆蓋2個縮圖寬度
    } else {
      thumbWidth = thumbnailWidth * 0.7; // 覆蓋1.5個縮圖寬度
    }

    const scrollLeft = container.scrollLeft;
    const scrollWidth = container.scrollWidth;
    const clientWidth = container.clientWidth;

    // 少張縮圖時的特殊處理
    if (thumbnailCount <= 5 || scrollWidth <= clientWidth) {
      thumb.style.width = thumbWidth + "px";

      const currentImageIndex =
        this.lastImageIndex >= 0 ? this.lastImageIndex : 0;

      // 滑塊左邊緣對齊到當前縮圖的左邊緣
      const thumbLeft = currentImageIndex * thumbnailWidth;
      const maxLeft = trackWidth - thumbWidth;

      thumb.style.left = Math.max(0, Math.min(thumbLeft, maxLeft)) + "px";
      return;
    }

    // 多張圖片的正常滾動計算
    const maxThumbPosition = trackWidth - thumbWidth;
    const scrollRatio = scrollLeft / (scrollWidth - clientWidth);
    const thumbPosition = scrollRatio * maxThumbPosition;

    thumb.style.width = thumbWidth + "px";
    thumb.style.left =
      Math.max(0, Math.min(thumbPosition, maxThumbPosition)) + "px";
  }

  setupDragEvents(container, thumb, track) {
    let initialOffset = 0;

    const handleMouseDown = (e) => {
      this.isDragging = true;

      // 記錄滑鼠點擊滑塊時的偏移量
      const thumbRect = thumb.getBoundingClientRect();
      initialOffset = e.clientX - thumbRect.left;

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);

      e.preventDefault();
      thumb.classList.add("dragging");
      thumb.style.background = "#333";
      document.body.style.cursor = "grabbing";
      document.body.style.userSelect = "none";
    };

    const handleMouseMove = (e) => {
      if (!this.isDragging) return;

      const trackRect = track.getBoundingClientRect();
      const thumbWidth = thumb.offsetWidth;
      const trackWidth = trackRect.width;
      const mouseX = e.clientX;
      const trackLeft = trackRect.left;
      const newThumbLeft = mouseX - trackLeft - initialOffset;
      const maxThumbLeft = trackWidth - thumbWidth;
      const clampedLeft = Math.max(0, Math.min(newThumbLeft, maxThumbLeft));

      thumb.style.left = clampedLeft + "px";

      const thumbnailCount = this.thumbnails.length;

      // 少張縮圖時直接計算圖片索引
      if (thumbnailCount <= 5) {
        const dragRatio = maxThumbLeft > 0 ? clampedLeft / maxThumbLeft : 0;
        const imageIndex = Math.round(dragRatio * (thumbnailCount - 1));
        const clampedIndex = Math.max(
          0,
          Math.min(imageIndex, thumbnailCount - 1)
        );

        if (clampedIndex !== this.lastImageIndex && this.onImageChange) {
          this.onImageChange(clampedIndex);
          this.lastImageIndex = clampedIndex;
        }
        return;
      }

      // 多張圖片的原有邏輯
      const ratio = maxThumbLeft > 0 ? clampedLeft / maxThumbLeft : 0;
      const maxScroll = container.scrollWidth - container.clientWidth;
      const newScrollLeft = ratio * maxScroll;

      container.scrollLeft = newScrollLeft;

      const imageIndex = this.calculateImageIndex(
        newScrollLeft,
        container.scrollWidth,
        container.clientWidth
      );
      if (imageIndex !== this.lastImageIndex && this.onImageChange) {
        this.onImageChange(imageIndex);
        this.lastImageIndex = imageIndex;
      }
    };

    const handleMouseUp = () => {
      this.isDragging = false;
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      thumb.classList.remove("dragging");
      thumb.style.background = "#666";
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    thumb.addEventListener("mousedown", handleMouseDown);
    thumb.addEventListener("dragstart", (e) => e.preventDefault());

    thumb.addEventListener("mouseenter", () => {
      if (!this.isDragging) {
        thumb.style.background = "#555";
        document.body.style.cursor = "grab";
      }
    });

    thumb.addEventListener("mouseleave", () => {
      if (!this.isDragging) {
        thumb.style.background = "#666";
        document.body.style.cursor = "";
      }
    });
  }

  handleTrackClick(e, container, thumb, track) {
    if (e.target === thumb) return;

    const trackRect = track.getBoundingClientRect();
    const clickX = e.clientX - trackRect.left;
    const trackWidth = track.offsetWidth;
    const thumbnailCount = this.thumbnails.length;

    // 少張縮圖時直接根據點擊位置計算圖片索引
    if (thumbnailCount <= 5) {
      const clickRatio = clickX / trackWidth;
      const targetImageIndex = Math.round(clickRatio * (thumbnailCount - 1));
      const clampedIndex = Math.max(
        0,
        Math.min(targetImageIndex, thumbnailCount - 1)
      );

      if (this.onImageChange) {
        this.onImageChange(clampedIndex);
        this.lastImageIndex = clampedIndex;
      }

      // 更新滑塊位置
      this.updateScrollbar(container, track.parentElement);
      return;
    }

    // 多張圖片的原有邏輯
    const thumbWidth = thumb.offsetWidth;
    const scrollWidth = container.scrollWidth;
    const clientWidth = container.clientWidth;

    const targetThumbCenter = clickX;
    const targetThumbLeft = targetThumbCenter - thumbWidth / 2;
    const maxThumbPosition = trackWidth - thumbWidth;
    const clampedThumbLeft = Math.max(
      0,
      Math.min(targetThumbLeft, maxThumbPosition)
    );

    const clickRatio =
      maxThumbPosition > 0 ? clampedThumbLeft / maxThumbPosition : 0;
    const maxScrollLeft = scrollWidth - clientWidth;
    const targetScrollLeft = clickRatio * maxScrollLeft;

    container.scrollTo({
      left: Math.max(0, Math.min(targetScrollLeft, maxScrollLeft)),
      behavior: "smooth",
    });
  }

  scrollToImage(imageIndex) {
    if (!this.thumbnailContainer || !this.thumbnails) return;

    const scrollWidth = this.thumbnailContainer.scrollWidth;
    const clientWidth = this.thumbnailContainer.clientWidth;
    const maxScrollLeft = scrollWidth - clientWidth;

    const scrollRatio = imageIndex / (this.thumbnails.length - 1);
    const targetScrollLeft = scrollRatio * maxScrollLeft;

    this.thumbnailContainer.scrollTo({
      left: Math.max(0, Math.min(targetScrollLeft, maxScrollLeft)),
      behavior: "smooth",
    });

    this.lastImageIndex = imageIndex;
  }
}

export default function PidPage({ params }) {
  const getColorCode = (colorName) => {
    const colorMap = {
      白色: "#ffffff",
      黑色: "#000000",
      原木色: "#DEB887",
      淺灰: "#D3D3D3",
      深灰: "#555555",
      淺藍: "#ADD8E6",
      深藍: "#62869D",
      淺綠: "#DBE5DE",
      深綠: "#6B826B",
      米黃色: "#F5F5DC",
      // 英文顏色名稱
      white: "#ffffff",
      black: "#000000",
      red: "#ff0000",
      blue: "#0000ff",
      green: "#008000",
      yellow: "#ffff00",
      orange: "#ffa500",
      purple: "#800080",
      pink: "#ffc0cb",
      brown: "#a52a2a",
      gray: "#808080",
      grey: "#808080",
    };

    if (!colorName) return "#cccccc";
    return colorMap[colorName] || "#cccccc";
  };
  const [selectedImage, setSelectedImage] = useState(0);
  const { addToCart, openSuccessModal } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [productData, setProductData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [showWishlistModal, setShowWishlistModal] = useState(false);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [wishlistQuantity, setWishlistQuantity] = useState(1);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [currentWishlistProduct, setCurrentWishlistProduct] = useState(null);
  const [showCartModal, setShowCartModal] = useState(false);
  const [currentCartProduct, setCurrentCartProduct] = useState(null);
  const [cartQuantity, setCartQuantity] = useState(1);
  const [cartLoading, setCartLoading] = useState(false);
  const [isWishlistedStatus, setIsWishlistedStatus] = useState({});
  const [wishlistSuccessModal, setWishlistSuccessModal] = useState({
    isVisible: false,
    product: null,
    quantity: 0,
    selectedColor: null,
    selectedSize: null
  });
  // 載入收藏狀態
  const loadWishlistStatus = async () => {
    const token = localStorage.getItem('reactLoginToken');
    if (!token) return;

    try {
      const response = await fetch('http://localhost:3005/api/users/favorites', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();
      if (result.status === 'success') {
        const wishlistState = {};
        result.data.forEach(favorite => {
          const key = `${favorite.product_id}_${favorite.color_id}_${favorite.size_id}`;
          wishlistState[key] = true;
        });
        setIsWishlistedStatus(wishlistState);
      }
    } catch (error) {
      console.error('載入收藏狀態失敗:', error);
    }
  };

  // 檢查收藏狀態
  const hasAnyWishlist = (productId) => {
    const productKeys = Object.keys(isWishlistedStatus).filter(key =>
      key.startsWith(`${productId}_`) && isWishlistedStatus[key]
    );
    return productKeys.length > 0;
  };

  // 檢查登入狀態
  const checkAuthStatus = async () => {
    const token = localStorage.getItem('reactLoginToken');
    if (!token) return false;

    try {
      const response = await fetch('http://localhost:3005/api/users/status', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.status !== 401;
    } catch {
      return false;
    }
  };
  const addToWishlist = async () => {
    const isLoggedIn = await checkAuthStatus();
    if (!isLoggedIn) {
      Swal.fire({
        title: "請先登入",
        text: "您需要登入才能使用收藏功能",
        icon: "info",
        confirmButtonText: "確定",
        confirmButtonColor: "#DBA783"
      }).then((result) => {
        if (result.isConfirmed) {
          window.location.href = '/auth/login';
        }
      });
      return;
    }

    if (!selectedColor || !selectedSize) {
      Swal.fire({
        title: "請選擇商品規格",
        text: "請選擇顏色和尺寸後再加入收藏",
        icon: "warning",
        confirmButtonText: "我知道了",
        confirmButtonColor: "#DBA783"

      }); return;
    }

    try {
      const wishlistData = {
        productId: currentWishlistProduct.id,
        colorId: selectedColor.id,
        sizeId: selectedSize.id,
        quantity: wishlistQuantity
      };
      console.log('發送的資料:', wishlistData);


      const response = await fetch('http://localhost:3005/api/users/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('reactLoginToken')}`
        },
        body: JSON.stringify(wishlistData)
      });

      const result = await response.json();

      if (result.status === 'success') {
        const key = `${currentWishlistProduct.id}_${selectedColor.id}_${selectedSize.id}`;
        setIsWishlistedStatus(prev => ({
          ...prev,
          [key]: true
        }));
        setShowWishlistModal(false);
        document.body.classList.remove('no-scroll');

        setWishlistSuccessModal({
          isVisible: true,
          product: currentWishlistProduct,
          quantity: wishlistQuantity,
          selectedColor: selectedColor,
          selectedSize: selectedSize
        });
      } else {
        // 先關閉收藏彈窗
        setShowWishlistModal(false);
        document.body.classList.remove('no-scroll');
        // 您的錯誤處理代碼放在這裡
        if (result.message && result.message.includes("已在收藏清單中")) {
          Swal.fire({
            title: "已在收藏清單中",
            text: "此商品的這個顏色和尺寸組合已經在您的收藏清單中了",
            icon: "info",
            confirmButtonText: "確定",
            position: 'center',
            confirmButtonColor: "#DBA783",



          });
        } else {
          Swal.fire({
            title: "加入收藏失敗",
            text: "請稍後再試或聯絡客服",
            icon: "error",
            position: 'center',
            confirmButtonText: "確定",
            confirmButtonColor: "#DBA783"

          });
        }
      }
    } catch (err) {
      console.error('加入收藏失敗:', err);
      Swal.fire({
        title: "發生錯誤",
        text: "加入收藏時發生錯誤，請稍後再試",
        icon: "error",
        confirmButtonText: "確定",
        confirmButtonColor: "#DBA783"

      });
    }
  };
  // 移除收藏
  const removeFromWishlist = async (productId, colorId, sizeId) => {
    try {
      const result = await Swal.fire({
        title: "確定要移除收藏嗎？",
        text: "此商品將從您的收藏清單中移除",
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#DBA783",
        cancelButtonColor: "#d33",
        confirmButtonText: "確定移除",
        cancelButtonText: "取消"
      });

      if (!result.isConfirmed) return;

      const response = await fetch(
        `http://localhost:3005/api/users/favorites/${productId}/${colorId}/${sizeId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('reactLoginToken')}`
          }
        }
      );

      const data = await response.json();
      if (data.status === "success") {
        const key = `${productId}_${colorId}_${sizeId}`;
        setIsWishlistedStatus(prev => ({
          ...prev,
          [key]: false
        }));
      }
    } catch (err) {
      console.error('移除收藏失敗:', err);
    }
  };

  // 收藏點擊處理
  const handleWishlistClick = async (targetProduct = null, event = null) => {
    const product = targetProduct || productData;

    const isLoggedIn = await checkAuthStatus();
    if (!isLoggedIn) {
      Swal.fire({
        title: "請先登入",
        text: "您需要登入才能使用收藏功能",
        icon: "info",
        confirmButtonText: "確定",
        confirmButtonColor: "#DBA783"
      }).then((result) => {
        if (result.isConfirmed) {
          window.location.href = '/auth/login';
        }
      });
      return;
    }

    const hasWishlist = hasAnyWishlist(product.id);

    if (hasWishlist) {
      const wishlistKeys = Object.keys(isWishlistedStatus).filter(key =>
        key.startsWith(`${product.id}_`) && isWishlistedStatus[key]
      );

      if (wishlistKeys.length > 0) {
        const firstKey = wishlistKeys[0];
        const [productId, colorId, sizeId] = firstKey.split('_');
        await removeFromWishlist(productId, colorId, sizeId);
      }
    } else {
      openWishlistModal(product, event);
    }
  };
  // 關閉收藏成功通知
  const closeWishlistSuccessModal = () => {
    setWishlistSuccessModal({
      isVisible: false,
      product: null,
      quantity: 0,
      selectedColor: null,
      selectedSize: null
    });
  };
  // 打開收藏彈窗
  const openWishlistModal = async (product, clickEvent = null) => {
    console.log('商品顏色:', product.colors); // 檢查實際的顏色資料
    console.log('商品尺寸:', product.sizes);   // 檢查實際的尺寸資料
    setCurrentWishlistProduct(product);
    setSelectedColor(product.colors?.[0] || null);
    setSelectedSize(product.sizes?.[0] || null);
    setWishlistQuantity(1);
    setShowWishlistModal(true);
    document.body.classList.add('no-scroll');
  };
  useEffect(() => {
    if (productData) {
      loadWishlistStatus();
    }
  }, [productData]);

  // 簡化的 handleBuyNow 函數（只處理實際購買邏輯）
  const handleBuyNow = async () => {
    const isLoggedIn = await checkAuthStatus();
    if (!isLoggedIn) {
      Swal.fire({
        title: "請先登入",
        text: "您需要登入才能進行購買",
        icon: "info",
        confirmButtonText: "前往登入",
        confirmButtonColor: "#DBA783"
      }).then((result) => {
        if (result.isConfirmed) {
          window.location.href = '/auth/login';
        }
      });
      return;
    }

    const buyNowProduct = {
      id: productData.id,
      name: productData.name,
      price: productData.price,
      images: productData.images,
      selectedColor: selectedColor,
      selectedSize: selectedSize,
      quantity: quantity
    };

    sessionStorage.setItem('buyNowProduct', JSON.stringify(buyNowProduct));
    window.location.href = '/cart/detail';
  };





  const categoryMapping = {
    // 客廳分類
    '邊桌': '客廳',
    '單椅': '客廳',
    '茶几': '客廳',
    '書櫃': '客廳',
    '書桌': '客廳',
    '邊櫃': '客廳',
    // 廚房分類
    '實木餐桌': '廚房',
    '餐椅': '廚房',
    '吧台桌': '廚房',
    '吧台椅': '廚房',
    // 臥室分類
    '床架': '臥室',
    '床邊桌': '臥室',
    '化妝台': '臥室',
    '全身鏡': '臥室',
    '衣櫃': '臥室',
    // 兒童房分類
    '桌椅組': '兒童房',
    '衣櫃': '兒童房',
    '收納櫃': '兒童房',
    // 收納用品分類
    '收納盒': '收納用品',
    '收納箱': '收納用品'
  };

  const handleCategoryClick = (e, categoryName) => {
    e.preventDefault();

    if (categoryMapping[categoryName]) {
      // 子分類
      const mainCategory = categoryMapping[categoryName];

      window.location.href = `/products?category=${encodeURIComponent(mainCategory)}&subcategory=${encodeURIComponent(categoryName)}`;
      console.log('跳轉到:', `/products?category=${mainCategory}&subcategory=${categoryName}`); // 加這行

    } else {
      // 主分類
      window.location.href = `/products?category=${encodeURIComponent(categoryName)}`;
    }
  };



  // 展開狀態管理
  const [expandedSections, setExpandedSections] = useState({
    productInfo: false,
    designer: false,
    materials: false,
    sizes: false,
    stock: false,
  });

  // 從 URL 參數獲取產品 ID
  const resolvedParams = React.use(params);
  const productId = resolvedParams?.id || 1;

  // 獲取產品資料
  useEffect(() => {
    const fetchProductData = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `http://localhost:3005/api/products/${productId}`
        );
        const result = await response.json();

        if (result.status === "success") {
          setProductData(result.data);

          // 獲取評論統計
          try {
            const reviewResponse = await fetch(
              `http://localhost:3005/api/products/${productId}/reviews?limit=1`
            );
            const reviewResult = await reviewResponse.json();

            if (reviewResult.status === "success") {
              // 將評論統計添加到產品資料中
              setProductData(prev => ({
                ...prev,
                averageRating: reviewResult.data.statistics.averageRating,
                totalReviews: reviewResult.data.statistics.totalReviews
              }));
            }
          } catch (reviewErr) {
            console.log('評論API暫不可用');
          }
          // 設置默認選項
          if (result.data.colors && result.data.colors.length > 0) {
            setSelectedColor(result.data.colors[0]);
          }
          if (result.data.sizes && result.data.sizes.length > 0) {
            setSelectedSize(result.data.sizes[0]);
          }
        } else {
          setError(result.message);
        }
      } catch (err) {
        setError("獲取產品資料時發生錯誤");
        console.error("Error fetching product data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProductData();
  }, [productId]);



  // useEffect(() => {
  //   const checkWishlistStatus = async () => {
  //     try {
  //       const userId = localStorage.getItem('userId') || 1;
  //       const response = await fetch(`http://localhost:3005/api/wishlist/check/${userId}/${productId}`, {
  //         headers: {
  //           'Authorization': `Bearer ${localStorage.getItem('token')}`
  //         }
  //       });

  //       // 檢查是否返回 JSON
  //       if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) {
  //         console.warn('Wishlist API not available yet');
  //         return;
  //       }

  //       const result = await response.json();
  //       if (result.status === 'success') {
  //         setIsWishlisted(result.data.isWishlisted);
  //       }
  //     } catch (err) {
  //       console.error('Error checking wishlist status:', err);
  //       // 靜默處理，不影響頁面運行
  //     }
  //   };

  //   if (productId) {
  //     checkWishlistStatus();
  //   }
  // }, [productId]);

  // useEffect(() => {
  //   if (!showWishlistModal) {
  //     document.body.classList.remove('no-scroll');
  //   }
  // }, [showWishlistModal]);

  // // 加入/移除收藏的處理函數
  // const handleWishlistClick = (targetProduct = null, event = null) => {
  //   const product = targetProduct || productData;

  //   if (isProductInWishlist(product.id)) {
  //     removeFromWishlist(product.id);
  //   } else {
  //     openWishlistModal(product, event);
  //   }
  // };

  const handleWishlistToggle = (product, e) => {
    e.stopPropagation();
    handleWishlistClick(product);
  };

  // const openWishlistModal = async (product, clickEvent = null) => {
  //   setCurrentWishlistProduct(product);
  //   setSelectedColor(product.colors?.[0] || null);
  //   setSelectedSize(product.sizes?.[0] || null);
  //   setWishlistQuantity(1);
  //   setShowWishlistModal(true);
  //   document.body.classList.add('no-scroll');

  //   // 如果是其他商品且缺少詳細資料，先獲取完整資料
  //   if (product.id !== parseInt(productId) && (!product.colors || !product.sizes)) {
  //     try {
  //       setWishlistLoading(true);
  //       const response = await fetch(`http://localhost:3005/api/products/${product.id}`);
  //       const result = await response.json();

  //       if (result.status === 'success') {
  //         product = result.data;
  //         setCurrentWishlistProduct(result.data);
  //         setSelectedColor(result.data.colors?.[0] || null);
  //         setSelectedSize(result.data.sizes?.[0] || null);
  //       }
  //     } catch (err) {
  //       console.error('獲取商品詳細資料失敗:', err);
  //       alert('無法載入商品資料，請稍後再試');
  //       return;
  //     } finally {
  //       setWishlistLoading(false);
  //     }
  //   }

  // };

  // useEffect(() => {
  //   if (showWishlistModal) {
  //     document.body.classList.add('body-no-scroll');
  //   } else {
  //     document.body.classList.remove('body-no-scroll');
  //   }
  //   return () => document.body.classList.remove('body-no-scroll');
  // }, [showWishlistModal]);

  useEffect(() => {
    let thumbnailScrollbar;

    const timer = setTimeout(() => {
      thumbnailScrollbar = new CustomThumbnailScrollbar((imageIndex) => {
        setSelectedImage(imageIndex);
      });
    }, 100);

    return () => {
      clearTimeout(timer);
      const customScrollbars = document.querySelectorAll(
        ".custom-scrollbar-container"
      );
      customScrollbars.forEach((el) => el.remove());
    };
  }, [productData]);

  const isProductInWishlist = (targetProductId) => {
    if (targetProductId === parseInt(productId)) {
      return isWishlisted;
    }
    return false; // 需要根據你的全域狀態管理來實現
  };

  // //加入收藏API
  // const addToWishlist = async () => {
  //   if (!selectedColor || !selectedSize) {
  //     alert('請選擇顏色和尺寸');
  //     return;
  //   }

  //   const product = currentWishlistProduct || productData;

  //   try {
  //     setWishlistLoading(true);
  //     const userId = localStorage.getItem('userId') || 1;
  //     const wishlistData = {
  //       userId: userId,
  //       productId: product.id,
  //       colorId: selectedColor.id,
  //       sizeId: selectedSize.id,
  //       quantity: wishlistQuantity
  //     };

  //     const response = await fetch('http://localhost:3005/api/wishlist', {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //         'Authorization': `Bearer ${localStorage.getItem('token')}`
  //       },
  //       body: JSON.stringify(wishlistData)
  //     });

  //     // 檢查響應格式
  //     if (!response.headers.get('content-type')?.includes('application/json')) {
  //       throw new Error('API 端點不存在或未正確設置');
  //     }

  //     const result = await response.json();

  //     if (result.status === 'success') {
  //       if (product.id === parseInt(productId)) {
  //         setIsWishlisted(true);
  //       }
  //       setIsWishlisted(true);
  //       setShowWishlistModal(false);
  //       document.body.classList.remove('no-scroll');
  //       const notification = document.createElement('div');
  //       notification.style.cssText = `
  //         position: fixed;
  //         top: 20px;
  //         right: 20px;
  //         background: #9FA79A;
  //         color: white;
  //         padding: 16px 20px;
  //         border-radius: 8px;
  //         box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  //         z-index: 9999;
  //         font-size: 14px;
  //       `;
  //       notification.textContent = '已加入收藏';
  //       document.body.appendChild(notification);

  //       setTimeout(() => {
  //         if (notification.parentNode) {
  //           notification.parentNode.removeChild(notification);
  //         }
  //       }, 3000);

  //     } else {
  //       alert(result.message || '加入收藏失敗');
  //     }
  //   } catch (err) {
  //     console.error('發生錯誤:', err);
  //     alert('加入收藏時發生錯誤');
  //   } finally {
  //     setWishlistLoading(false);
  //   }
  // };

  // // 移除收藏API
  // const removeFromWishlist = async (targetProductId = null) => {
  //   const productIdToRemove = targetProductId || productId;

  //   try {
  //     setWishlistLoading(true);
  //     const userId = localStorage.getItem('userId') || 1;

  //     const response = await fetch(`http://localhost:3005/api/wishlist/${userId}/${productIdToRemove}`, {
  //       method: 'DELETE',
  //       headers: {
  //         'Authorization': `Bearer ${localStorage.getItem('token')}`
  //       }
  //     });

  //     const result = await response.json();

  //     if (result.status === 'success') {
  //       setIsWishlisted(false);
  //       alert('已從收藏清單移除');
  //     } else {
  //       alert(result.message || '移除收藏失敗');
  //     }
  //   } catch (err) {
  //     console.error('Error removing from wishlist:', err);
  //     alert('移除收藏時發生錯誤');
  //   } finally {
  //     setWishlistLoading(false);
  //   }
  // };

  // 切換展開狀態
  const toggleExpanded = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // 展開圖示組件
  const ExpandIcon = ({ isExpanded }) => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        transform: isExpanded ? "rotate(45deg)" : "rotate(0deg)",
        transition: "transform 0.3s ease",
      }}
    >
      <path
        d="M13 5.5H8.5V1C8.5 0.447812 8.05219 0 7.5 0H6.5C5.94781 0 5.5 0.447812 5.5 1V5.5H1C0.447812 5.5 0 5.94781 0 6.5V7.5C0 8.05219 0.447812 8.5 1 8.5H5.5V13C5.5 13.5522 5.94781 14 6.5 14H7.5C8.05219 14 8.5 13.5522 8.5 13V8.5H13C13.5522 8.5 14 8.05219 14 7.5V6.5C14 5.94781 13.5522 5.5 13 5.5Z"
        fill="#6A6A6A"
      />
    </svg>
  );

  // 展開內容組件
  const ExpandedContent = ({ section, isExpanded, children }) => (
    <div
      className={`expanded-content ${isExpanded ? "expanded" : ""}`}
      style={{
        maxHeight: isExpanded ? "500px" : "0",
        overflow: "hidden",
        transition: "max-height 0.3s ease",
      }}
    >
      <div
        style={{
          paddingBottom: isExpanded ? "8px" : "0 px",
          width: "100%",
        }}
      >
        {children}
      </div>
    </div>
  );
  if (loading) {
    return (
      <div className="detail-product-page">
        <div className="pulse-loading">
          <div className="pulse-circle"></div>
          <p className="loading-text">載入商品詳情中...</p>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="detail-product-page">
        <div style={{ textAlign: "center", padding: "100px 20px" }}>
          <p style={{ color: "#dc2626" }}>錯誤: {error}</p>
        </div>
      </div>
    );
  }

  if (!productData) {
    return (
      <div className="detail-product-page">
        <div style={{ textAlign: "center", padding: "100px 20px" }}>
          <p>找不到產品資料</p>
        </div>
      </div>
    );
  }

  const processImages = (images) => {
    if (!images || images.length === 0) {
      // 沒有圖片時的預設圖片
      return ["https://via.placeholder.com/500x400/f0f0f0/666?text=No+Image"];
    }

    return images.map((img) => {
      // 如果是物件格式 { id: 1, url: "/uploads/pic.jpg" }
      if (typeof img === "object" && img.url) {
        return img.url.startsWith("http")
          ? img.url
          : `http://localhost:3005${img.url}`;
      }

      // 如果是字串格式 "/uploads/pic.jpg"
      if (typeof img === "string") {
        return img.startsWith("http") ? img : `http://localhost:3005${img}`;
      }

      // 如果都不是，返回錯誤圖片
      return "https://via.placeholder.com/500x400/ff0000/ffffff?text=Error";
    });
  };

  // 處理圖片
  const displayImages = processImages(productData.images);
  const getProductImage = (product) => {
    if (product.images && product.images.length > 0) {
      const imageUrl =
        typeof product.images[0] === "string"
          ? product.images[0]
          : product.images[0].url;

      return imageUrl.startsWith("http")
        ? imageUrl
        : `http://localhost:3005${imageUrl}`;
    }
    return `https://via.placeholder.com/300x200/f0f0f0/666?text=${encodeURIComponent(
      product.name
    )}`;
  };

  const handleCartClick = (targetProduct = null, event = null) => {
    const product = targetProduct || productData;
    openCartModal(product, event);
  };

  const openCartModal = async (product, clickEvent = null) => {
    setCurrentCartProduct(product);
    setSelectedColor(product.colors?.[0] || null);
    setSelectedSize(product.sizes?.[0] || null);
    setCartQuantity(1);
    setShowCartModal(true);
    document.body.classList.add('no-scroll');

    if (product.id !== parseInt(productId) && (!product.colors || !product.sizes)) {
      try {
        setCartLoading(true);
        const response = await fetch(`http://localhost:3005/api/products/${product.id}`);
        const result = await response.json();
        if (result.status === 'success') {
          setCurrentCartProduct(result.data);
          setSelectedColor(result.data.colors?.[0] || null);
          setSelectedSize(result.data.sizes?.[0] || null);
        }
      } catch (err) {
        console.error('獲取商品詳細資料失敗:', err);
        alert('無法載入商品資料，請稍後再試');
        return;
      } finally {
        setCartLoading(false);
      }
    }
  };


  const addToCartFromModal = () => {
    if (!selectedColor || !selectedSize) {
      alert('請選擇顏色和尺寸');
      return;
    }

    addToCart(currentCartProduct, cartQuantity, selectedColor, selectedSize);
    openSuccessModal(currentCartProduct, cartQuantity, selectedColor, selectedSize);
    setShowCartModal(false);
    document.body.classList.remove('no-scroll');
  };
  const handleAddToCart = (product, e) => {
    e.stopPropagation();

    const defaultColor = product.colors?.[0] || null;
    const defaultSize = product.sizes?.[0] || null;

    addToCart(product, 1, defaultColor, defaultSize);
  };


  return (
    <div className="detail-product-page">
      {/* 麵包屑導航 */}
      <div className="sub-nav">
        <div className="sub-nav-links">
          <a href="#" className="sub-nav-link"
            onClick={(e) => {
              e.preventDefault();
              window.location.href = '/products?type=latest';
            }}>
            最新商品
          </a>
          <a href="#" className="sub-nav-link"
            onClick={(e) => {
              e.preventDefault();
              window.location.href = '/products?type=hot';
            }}>
            熱賣
          </a>
          <div className="dropdown hover-dropdown">
            <div
              className="sub-nav-link dropdown-toggle"
              aria-expanded="false"
            >
              空間<i className="fas fa-chevron-down fa-sm"></i>
            </div>
            <div className="dropdown-menu dropdown-megamenu">
              <div className="megamenu-column">
                <a href="#" className="dropdown-header" onClick={(e) => handleCategoryClick(e, '客廳')}>
                  客廳
                </a>                    <a className="dropdown-item" href="#" onClick={(e) => handleCategoryClick(e, '邊桌')}>
                  邊桌
                </a>
                <a className="dropdown-item" href="#" onClick={(e) => handleCategoryClick(e, '單椅')}>
                  單椅/單人沙發
                </a>
                <a className="dropdown-item" href="#" onClick={(e) => handleCategoryClick(e, '茶几')}>
                  茶几
                </a>
                <a className="dropdown-item" href="#" onClick={(e) => handleCategoryClick(e, '書櫃')}>
                  書櫃 / 書架
                </a>
                <a className="dropdown-item" href="#" onClick={(e) => handleCategoryClick(e, '書桌')}>
                  書桌 / 書桌椅
                </a>
                <a className="dropdown-item" href="#" onClick={(e) => handleCategoryClick(e, '邊櫃')}>
                  邊櫃 / 收納櫃
                </a>
              </div>
              <div className="megamenu-column">
                <a href="#" className="dropdown-header" onClick={(e) => handleCategoryClick(e, '廚房')}>
                  廚房
                </a>                <a className="dropdown-item" href="#" onClick={(e) => handleCategoryClick(e, '實木餐桌')}>
                  實木餐桌
                </a>
                <a className="dropdown-item" href="#" onClick={(e) => handleCategoryClick(e, '餐椅')}>
                  餐椅 / 椅子
                </a>
                <a className="dropdown-item" href="#" onClick={(e) => handleCategoryClick(e, '吧台桌')}>
                  吧台桌
                </a>
                <a className="dropdown-item" href="#" onClick={(e) => handleCategoryClick(e, '吧台椅')}>
                  吧台椅
                </a>
              </div>
              <div className="megamenu-column">
                <a href="#" className="dropdown-header" onClick={(e) => handleCategoryClick(e, '臥室')}>
                  臥室
                </a>
                <a className="dropdown-item" href="#" onClick={(e) => handleCategoryClick(e, '床架')}>
                  床架
                </a>
                <a className="dropdown-item" href="#" onClick={(e) => handleCategoryClick(e, '床邊桌')}>
                  床邊桌
                </a>
                <a className="dropdown-item" href="#" onClick={(e) => handleCategoryClick(e, '化妝台')}>
                  化妝台
                </a>
                <a className="dropdown-item" href="#" onClick={(e) => handleCategoryClick(e, '全身鏡')}>
                  全身鏡 / 鏡子
                </a>
                <a className="dropdown-item" href="#" onClick={(e) => handleCategoryClick(e, '衣櫃')}>
                  衣櫃 / 衣架
                </a>
              </div>
              <div className="megamenu-column">
                <a href="#" className="dropdown-header" onClick={(e) => handleCategoryClick(e, '兒童房')}>
                  兒童房
                </a>                      <a className="dropdown-item" href="#" onClick={(e) => handleCategoryClick(e, '桌椅組')}>
                  桌椅組
                </a>
                <a className="dropdown-item" href="#" onClick={(e) => handleCategoryClick(e, '衣櫃')}>
                  衣櫃
                </a>
                <a className="dropdown-item" href="#" onClick={(e) => handleCategoryClick(e, '床架')}>
                  床架
                </a>
                <a className="dropdown-item" href="#" onClick={(e) => handleCategoryClick(e, '收納櫃')}>
                  收納櫃
                </a>
              </div>
              <div className="megamenu-column">
                <a href="#" className="dropdown-header" onClick={(e) => handleCategoryClick(e, '收納用品')}>
                  收納用品
                </a>
                <a className="dropdown-item" href="#" onClick={(e) => handleCategoryClick(e, '收納盒')}>
                  收納盒 / 收納箱
                </a>
              </div>
            </div>
          </div>

          <a href="#" className="sub-nav-link">
            It's Oakly
          </a>
        </div>
      </div>
      {/* 子導航欄 */}
      <div className="breadcrumb-nav">
        <div className="sub-nav-content">
          <div className="breadcrumb">
            <a href="/">首頁</a>
            <div className="arrow">&gt;</div>
            商品列表
            <div className="arrow-name">&gt;</div>
            {productData.name}
          </div>
        </div>
      </div>
      {/* 主要內容區域 */}
      <div className="pid-container">
        <div className="product-detail-wrapper">
          {/* 左側商品圖片 */}
          <div className="product-images">
            <div className="main-image">
              <img src={displayImages[selectedImage]} alt={productData.name} />
            </div>
            <div className="thumbnail-images">
              {displayImages.map((image, index) => (
                <div
                  key={index}
                  className={`thumbnail ${selectedImage === index ? "active" : ""
                    }`}
                  onClick={() => setSelectedImage(index)}
                >
                  <img src={image} alt={`${productData.name} ${index + 1}`} />
                </div>
              ))}
            </div>
          </div>

          {/* 右側商品資訊 */}
          <div className="pid-info">
            <div className="pid-name">{productData.name}</div>
            <div className="express">
              {productData.colors?.[0]?.color_name || "白色"},{" "}
              {productData.sizes?.[0]?.size_label || "71x50 公分"}
            </div>
            <div className="product-price">
              NT$ {productData.price?.toLocaleString()}
            </div>

            <div className="rating">
              <div className="rating-icon-container">
                {productData.totalReviews > 0 ? (
                  // 有評論時根據評分顯示星星
                  <>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <div key={star} className="rating-icon">
                        <i className={`fa-${productData.averageRating >= star ? 'solid' : 'regular'} fa-star`}></i>
                      </div>
                    ))}
                    <span className="rating-text">
                      {productData.averageRating} ({productData.totalReviews}則評論)
                    </span>
                  </>
                ) : (
                  // 沒有評論時顯示空星星
                  <>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <div key={star} className="rating-icon">
                        <i className="fa-regular fa-star"></i>
                      </div>
                    ))}
                    <span className="rating-text">0.0</span>
                  </>
                )}
              </div>

              <button
                type="button"
                className="btn view-review"
                onClick={() => {
                  setShowModal(true);
                  document.body.classList.add("modal-open");
                }}
                disabled={!productData.totalReviews || productData.totalReviews === 0}
                style={{
                  opacity: (!productData.totalReviews || productData.totalReviews === 0) ? 0.5 : 1,
                  cursor: (!productData.totalReviews || productData.totalReviews === 0) ? 'not-allowed' : 'pointer'
                }}
              >
                {productData.totalReviews > 0 ? '查看評論' : '暫無評論'}
              </button>
            </div>

            <div className="product-description">
              {productData.description ||
                "為你的生活角落增添一抹實用美感，這款北歐風簡約邊桌，採用實木材質與霧面烤漆，適合擺放於沙發側、床邊或閱讀角落。不僅能放置咖啡杯、書籍或燈具，極簡設計也能輕鬆融入各種空間風格。"}
            </div>

            <div className="product-specs">
              <div className="spec-item">
                <div className="spec-label">顏色：</div>
                <div className="colors">
                  {productData.colors?.map((color) => (
                    <div
                      key={color.id}
                      className={`color ${selectedColor?.id === color.id ? "selected" : ""
                        }`}
                      style={{
                        backgroundColor: getColorCode(color.color_name),
                      }}
                      title={color.color_name}
                      onClick={() => setSelectedColor(color)} // 添加點擊事件
                    ></div>
                  ))}
                </div>
              </div>
            </div>

            <div className="quantity-selector">
              <div className="quantity-controls">
                <button
                  onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                  disabled={quantity <= 1}
                >

                </button>
                <div className="quantity-number">{quantity}</div>
                <button onClick={() => setQuantity((prev) => prev + 1)}>

                </button>
              </div>
              <div className="saved">
                <div
                  className={`saved-icon ${hasAnyWishlist(productData.id) ? "wishlisted" : ""}`}
                  onClick={(e) => handleWishlistClick(null, e)}
                  style={{
                    cursor: "pointer",
                  }}
                >
                  <i className={`fa-${hasAnyWishlist(productData.id) ? "solid" : "regular"} fa-heart`}></i>
                </div>
              </div>
            </div>

            <div className="action-buttons">
              <BuyNowButton
                product={productData}
                selectedColor={selectedColor}
                selectedSize={selectedSize}
                quantity={quantity}
                onBuyNow={handleBuyNow}
              />


              <button
                className="add-to-cart-btn"
                onClick={() => {
                  if (!selectedColor) {
                    toast.error('請選擇顏色');
                    return;
                  }

                  if (!selectedSize) {
                    toast.error('請選擇尺寸');
                    return;
                  }
                  addToCart(productData, quantity, selectedColor, selectedSize);
                  openSuccessModal(productData, quantity, selectedColor, selectedSize);
                }}
              >
                加入購物車
              </button>
            </div>
            {/* <div className="action-buttons">
              <button className="buy-now-btn" onClick={handleBuyNow}>
                立即購買
              </button>

              <AddToCartButton
                product={productData}
                selectedColor={selectedColor}
                selectedSize={selectedSize}
                quantity={quantity}
                onAddToCart={() => {
                  addToCart(productData, quantity, selectedColor, selectedSize);
                  openSuccessModal(productData, quantity, selectedColor, selectedSize);
                }}
              />
            </div> */}

            {/* 更新的資訊展開區塊 */}
            <div className="more-info">
              {/* 產品資訊 */}

              <div
                className="more-info-item-text"
                onClick={() => toggleExpanded("productInfo")}
                style={{ cursor: "pointer" }}
              >
                產品資訊
                <ExpandIcon isExpanded={expandedSections.productInfo} />
              </div>
              <ExpandedContent
                section="productInfo"
                isExpanded={expandedSections.productInfo}
              >
                {productData.description}
                <br></br>
                <strong>產品編號：</strong>
                {productData.id}
              </ExpandedContent>

              {/* 設計師 */}
              <div
                className="more-info-item-text"
                onClick={() => toggleExpanded("designer")}
                style={{ cursor: "pointer" }}
              >
                設計師
                <ExpandIcon isExpanded={expandedSections.designer} />
              </div>
              <ExpandedContent
                section="designer"
                isExpanded={expandedSections.designer}
              >
                <div>{productData.designer_name || "未指定設計師"}</div>
              </ExpandedContent>

              {/* 材質 */}
              <div
                className="more-info-item-text"
                onClick={() => toggleExpanded("materials")}
                style={{ cursor: "pointer" }}
              >
                材質
                <ExpandIcon isExpanded={expandedSections.materials} />
              </div>
              <ExpandedContent
                section="materials"
                isExpanded={expandedSections.materials}
              >
                <div>
                  {productData.materials?.length > 0 ? (
                    <div>
                      {productData.materials.map((material, index) => (
                        <div key={material.id}>{material.material_name}</div>
                      ))}
                    </div>
                  ) : (
                    <div>高級布料、實木材質</div>
                  )}
                </div>
              </ExpandedContent>

              {/* 尺寸 */}
              <div
                className="more-info-item-text"
                onClick={() => toggleExpanded("sizes")}
                style={{ cursor: "pointer" }}
              >
                尺寸
                <ExpandIcon isExpanded={expandedSections.sizes} />
              </div>
              <ExpandedContent
                section="sizes"
                isExpanded={expandedSections.sizes}
              >
                <div>
                  {productData.sizes?.length > 0 ? (
                    <div>
                      {productData.sizes.map((size) => (
                        <div key={size.id}>{size.size_label}</div>
                      ))}
                    </div>
                  ) : (
                    <div>77X44 公分</div>
                  )}
                </div>
              </ExpandedContent>

              {/* 庫存 */}
              <div
                className="more-info-item-text"
                onClick={() => toggleExpanded("stock")}
                style={{ cursor: "pointer" }}
              >
                庫存 ({productData.stock?.total || 0})
                <ExpandIcon isExpanded={expandedSections.stock} />
              </div>
              <ExpandedContent
                section="stock"
                isExpanded={expandedSections.stock}
              >
                <div>
                  {productData.stock?.details?.length > 0 ? (
                    <div>
                      <div style={{ marginBottom: "16px", fontWeight: "bold" }}>
                        總庫存：{productData.stock.total} 件
                      </div>
                      <div style={{ display: "grid", gap: "12px" }}>
                        {productData.stock.details.map((stock, index) => (
                          <div
                            key={index}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              fontSize: "14px",
                            }}
                          >
                            <span>
                              {stock.color_name} - {stock.size_label}
                            </span>
                            <span
                              style={{
                                fontWeight: "bold",
                              }}
                            >
                              {stock.amount} 件
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div style={{ color: "#6A6A6A" }}>目前無庫存資訊</div>
                  )}
                </div>
              </ExpandedContent>
            </div>
          </div>
        </div>

        <SimilarProducts
          currentProductId={parseInt(productId)}
          isProductInWishlist={isProductInWishlist}
          addToCart={addToCart}
          hasAnyWishlist={hasAnyWishlist}
          handleWishlistToggle={handleWishlistToggle}
          handleCartClick={handleCartClick}
        />


        <RandomShowcaseSection />


        <Bestseller
          currentProductId={parseInt(productId)}
          isProductInWishlist={isProductInWishlist}
          addToCart={addToCart}
          hasAnyWishlist={hasAnyWishlist}
          handleWishlistToggle={handleWishlistToggle}
          handleCartClick={handleCartClick}
        />

        <RecentViewedProducts
          className="middle-content"
          currentProductId={productId}
          maxItems={8}
          isProductInWishlist={isProductInWishlist}
          addToCart={addToCart}
          hasAnyWishlist={hasAnyWishlist}
          handleWishlistToggle={handleWishlistToggle}
          handleCartClick={handleCartClick}
        />
      </div>
      {/* 收藏選擇彈窗 */}
      {showWishlistModal && (
        <>
          <div
            className="wishlist-modal-backdrop"
            onClick={() => {
              setShowWishlistModal(false);
              document.body.classList.remove("no-scroll");
            }}
          ></div>

          <div className="wishlist-modal-container">
            <div className="wishlist-modal-content">
              <button
                className="wishlist-modal-close"
                onClick={() => {
                  setShowWishlistModal(false);
                  document.body.classList.remove("no-scroll");
                }}
              >
                ✕
              </button>

              <div className="wishlist-modal-header">
                <h5 className="wishlist-modal-title">加入收藏清單</h5>
              </div>

              <div className="wishlist-modal-body">
                <div className="wishlist-product-image">
                  <img
                    src={
                      currentWishlistProduct
                        ? getProductImage(currentWishlistProduct)
                        : displayImages[selectedImage]
                    }
                    alt={(currentWishlistProduct || productData).name}
                  />
                </div>
                <div className="wishlist-form-content">
                  <h6 className="wishlist-product-name">
                    {(currentWishlistProduct || productData).name}
                  </h6>
                  <p className="wishlist-product-price">
                    NT${" "}
                    {(
                      currentWishlistProduct || productData
                    ).price?.toLocaleString()}
                  </p>

                  {/* 顏色選擇 */}
                  <div className="wishlist-form-group">
                    <label className="wishlist-form-label">選擇顏色</label>
                    <div className="wishlist-options">
                      {Array.isArray(
                        (currentWishlistProduct || productData)?.colors
                      ) &&
                        (currentWishlistProduct || productData).colors.map(
                          (color) => (
                            <div
                              key={color.id}
                              onClick={() => setSelectedColor(color)}
                              className={`wishlist-color-option ${selectedColor?.id === color.id ? "selected" : ""
                                }`}
                            >
                              <div
                                className="wishlist-color-dot"
                                style={{
                                  backgroundColor: getColorCode(
                                    color.color_name
                                  ),
                                }}
                              ></div>
                              <span>{color.color_name}</span>
                            </div>
                          )
                        )}
                    </div>
                  </div>
                  {/* 尺寸選擇 */}
                  <div className="wishlist-form-group">
                    <label className="wishlist-form-label">選擇尺寸</label>
                    <div className="wishlist-options">
                      {Array.isArray(
                        (currentWishlistProduct || productData)?.sizes
                      ) &&
                        (currentWishlistProduct || productData).sizes.map(
                          (size) => (
                            <div
                              key={size.id}
                              onClick={() => setSelectedSize(size)}
                              className={`wishlist-size-option ${selectedSize?.id === size.id ? "selected" : ""
                                }`}
                            >
                              {size.size_label}
                            </div>
                          )
                        )}
                    </div>
                  </div>
                  {/* 數量選擇 */}
                  <div className="wishlist-form-group">
                    <label className="wishlist-form-label">數量</label>
                    <div className="wishlist-quantity-controls">
                      <button
                        onClick={() =>
                          setWishlistQuantity(Math.max(1, wishlistQuantity - 1))
                        }
                        disabled={wishlistQuantity <= 1}
                        className="wishlist-quantity-btn"
                      >
                        -
                      </button>
                      <span className="wishlist-quantity-display">
                        {wishlistQuantity}
                      </span>
                      <button
                        onClick={() =>
                          setWishlistQuantity(wishlistQuantity + 1)
                        }
                        className="wishlist-quantity-btn"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="wishlist-modal-footer">
                    <button
                      onClick={addToWishlist}
                      disabled={!selectedColor || !selectedSize}
                      className="wishlist-submit-btn"
                    >
                      加入收藏
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}


      {/* 購物車選擇彈窗 */}
      {showCartModal && (
        <>
          <div
            className="cart-modal-backdrop"
            onClick={() => {
              setShowCartModal(false);
              document.body.classList.remove('no-scroll');
            }}
          ></div>

          <div className="cart-modal-container">
            <div className="cart-modal-content">
              <button
                className="cart-modal-close"
                onClick={() => {
                  setShowCartModal(false);
                  document.body.classList.remove('no-scroll');
                }}
              >
                ✕
              </button>

              <div className="cart-modal-header">
                <h5 className="cart-modal-title">加入購物車</h5>
              </div>

              <div className="cart-modal-body">
                <div className="cart-product-image">
                  <img
                    src={currentCartProduct ? getProductImage(currentCartProduct) : displayImages[selectedImage]}
                    alt={(currentCartProduct || productData).name}
                  />
                </div>

                <div className="cart-form-content">
                  <h6 className="cart-product-name">{(currentCartProduct || productData).name}</h6>
                  <p className="cart-product-price">NT$ {(currentCartProduct || productData).price?.toLocaleString()}</p>

                  <div className="cart-form-group">
                    <label className="cart-form-label">選擇顏色</label>
                    <div className="cart-options">
                      {Array.isArray((currentCartProduct || productData)?.colors) && (currentCartProduct || productData).colors.map((color) => (
                        <div
                          key={color.id}
                          onClick={() => setSelectedColor(color)}
                          className={`cart-color-option ${selectedColor?.id === color.id ? 'selected' : ''}`}
                        >
                          <div
                            className="cart-color-dot"
                            style={{ backgroundColor: getColorCode(color.color_name) }}
                          ></div>
                          <span>{color.color_name}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="cart-form-group">
                    <label className="cart-form-label">選擇尺寸</label>
                    <div className="cart-options">
                      {Array.isArray((currentCartProduct || productData)?.sizes) && (currentCartProduct || productData).sizes.map((size) => (
                        <div
                          key={size.id}
                          onClick={() => setSelectedSize(size)}
                          className={`cart-size-option ${selectedSize?.id === size.id ? 'selected' : ''}`}
                        >
                          {size.size_label}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="cart-form-group">
                    <label className="cart-form-label">數量</label>
                    <div className="cart-quantity-controls">
                      <button
                        onClick={() => setCartQuantity(Math.max(1, cartQuantity - 1))}
                        disabled={cartQuantity <= 1}
                        className="cart-quantity-btn"
                      >
                        -
                      </button>
                      <span className="cart-quantity-display">{cartQuantity}</span>
                      <button
                        onClick={() => setCartQuantity(cartQuantity + 1)}
                        className="cart-quantity-btn"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="cart-modal-footer">
                    <button
                      onClick={addToCartFromModal}
                      disabled={!selectedColor || !selectedSize}
                      className="cart-submit-btn"
                    >
                      加入購物車
                    </button>

                  </div>
                </div>
              </div>
            </div>

          </div>

        </>
      )}
      <div
        className={`modal fade ${showModal ? "show" : ""}`}
        onWheel={(e) => e.preventDefault()}
        onTouchMove={(e) => e.preventDefault()}
        id="exampleModal"
        tabIndex="-1"
        aria-labelledby="exampleModalLabel"
        aria-hidden={!showModal}
        style={{
          display: showModal ? "block" : "none",
        }}
      >
        <div className="modal-dialog modal-lg modal-dialog-scrollable">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="exampleModalLabel">
                評論內容
              </h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => {
                  setShowModal(false);
                  document.body.classList.remove('modal-open');

                }}
                aria-label="Close"
              ></button>
            </div>
            <div
              className="modal-body"
              style={{ height: "80vh", padding: 0 }}
            >
              <iframe
                src="/review"
                width="100%"
                height="100%"
                frameBorder="0"
                style={{ border: "none" }}
              ></iframe>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div
          className="modal-backdrop fade show"
          onClick={() => {
            setShowModal(false);
            document.body.classList.remove('modal-open');

          }}
        ></div>
      )}
      <div className="end-content">
        <img src="/img/lan/clean.jpg" alt="clean" />
        <div className="end-content-text">
          <div className="end-content-text-title-container">
            <div className="end-content-text-title">讓生活，有序又優雅。</div>
            <div className="end-content-text-title-text">
              專業居家整理師，打造真正適合你的生活動線。
            </div>
          </div>
          <div className="end-content-btn">
            <Link href="/organizer"><button>立即預約</button></Link>
          </div>
        </div>
      </div>
      {/* 收藏成功通知 */}
      <AddToWishlistSuccessModal
        product={wishlistSuccessModal.product}
        quantity={wishlistSuccessModal.quantity}
        selectedColor={wishlistSuccessModal.selectedColor}
        selectedSize={wishlistSuccessModal.selectedSize}
        isVisible={wishlistSuccessModal.isVisible}
        onClose={closeWishlistSuccessModal}
      />
    </div>


  );
}
