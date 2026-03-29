"use client";

import React, { useState, useEffect } from "react";
import "@/styles/products/chat.css";
import "@/styles/products/products.css";
import { Link } from "react-router-dom";
// import { useCart } from '@/app/contexts/CartContext';
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import Swal from 'sweetalert2';
import WebSocketCustomerService from "@/app/_components/agent/WebSocketCustomerService";


const MainProduct = () => {
  const { user } = useAuth();
  const [selectedFilters, setSelectedFilters] = useState({
    colors: [],
    materials: [],
    series: [],
  });
  const [sortBy, setSortBy] = useState("default");
  const [viewMode, setViewMode] = useState("grid");
  const [products, setProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [filterPriceRange, setFilterPriceRange] = useState({ min: 0, max: 30000 });
  const [tempFilters, setTempFilters] = useState({
    colors: [],
    materials: [],
    series: [],
  });
  const [tempPriceRange, setTempPriceRange] = useState({ min: 0, max: 30000 });
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubCategory, setSelectedSubCategory] = useState('');
  const [currentTitle, setCurrentTitle] = useState('');
  const [currentHeroImage, setCurrentHeroImage] = useState('');
  const [isWishlisted, setIsWishlisted] = useState({});
  const [showWishlistModal, setShowWishlistModal] = useState(false);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [wishlistQuantity, setWishlistQuantity] = useState(1);
  const [currentWishlistProduct, setCurrentWishlistProduct] = useState(null);
  const { addToCart, openSuccessModal } = useCart();
  const [showCartModal, setShowCartModal] = useState(false);
  const [currentCartProduct, setCurrentCartProduct] = useState(null);
  const [cartQuantity, setCartQuantity] = useState('');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [showMobileSortDropdown, setShowMobileSortDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [wishlistSuccessModal, setWishlistSuccessModal] = useState({
    isVisible: false,
    product: null,
    quantity: 0,
    selectedColor: null,
    selectedSize: null,
  });
  const [expandedCategory, setExpandedCategory] = useState(null);

  // 切換分類展開狀態
  const toggleCategoryExpand = (category) => {
    setExpandedCategory(expandedCategory === category ? null : category);
  };



  // 收藏成功通知組件
  const AddToWishlistSuccessModal = ({
    product,
    quantity,
    selectedColor,
    selectedSize,
    isVisible,
    onClose,
  }) => {
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
        if (typeof image === "object" && image.url) {
          return image.url.startsWith("http")
            ? image.url
            : `http://localhost:3005${image.url}`;
        }
        if (typeof image === "string") {
          return image.startsWith("http")
            ? image
            : `http://localhost:3005${image}`;
        }
      }
      return "/img/lan/nana.webp";
    };

    return (
      <div className="wishlist-success-overlay" onClick={onClose}>
        <div
          className="wishlist-success-modal"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="wishlist-success-header">
            <div className="success-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="12" fill="#DBA783" />
                <path
                  d="M16.5 8.5l-8 8-4-4"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h3>成功加入收藏清單！</h3>
            <button className="close-btn" onClick={onClose}>
              <svg width="24" height="24" viewBox="0 0 24 24">
                <path
                  d="M18 6L6 18M6 6l12 12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
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
              <p className="product-price-p">
                NT$ {product.price?.toLocaleString()}
              </p>
              <div className="product-info-o">
                {selectedColor && (
                  <span className="color-label">
                    顏色: {selectedColor.color_name}
                  </span>
                )}
                {selectedSize && (
                  <span className="size-label">
                    尺寸: {selectedSize.size_label}
                  </span>
                )}
                <span className="quantity-info">數量: {quantity}</span>
              </div>
            </div>
          </div>

          <div className="wishlist-success-actions">
            <button className="continue-shopping" onClick={onClose}>
              繼續瀏覽
            </button>
            <button
              className="view-wishlist"
              onClick={() => {
                window.location.href = "/user/favorites";
              }}
            >
              查看收藏清單
            </button>
          </div>
        </div>
      </div>
    );
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showMobileSortDropdown && !event.target.closest(".sort")) {
        setShowMobileSortDropdown(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [showMobileSortDropdown]);

  // 獲取最新商品
  const fetchLatestProducts = async () => {
    try {
      const response = await fetch(
        "http://localhost:3005/api/products/latest?limit=50"
      );
      const products = await response.json();

      const productsWithNewFlag = products.map((product) => ({
        ...product,
        isNew: true,
      }));

      setProducts(productsWithNewFlag);
      setCurrentPage(1);

      // 設置頁面狀態為最新商品
      setCurrentTitle("最新商品");
      setCurrentHeroImage("/img/lan/new.jpg");
      setSelectedCategory("");
      setSelectedSubCategory("");
      clearFilters();
    } catch (error) {
      console.error('獲取最新商品失敗:', error);
    } finally {
      setIsLoading(false); // ← 加入這行
    }
  };

  // 獲取熱賣商品
  const fetchHotProducts = async () => {
    try {
      const response = await fetch(
        "http://localhost:3005/api/products/hot-products?limit=50"
      );
      const products = await response.json();

      const productsWithHotFlag = products.map((product) => ({
        ...product,
        isHot: true,
      }));

      setProducts(productsWithHotFlag);
      setCurrentPage(1);

      // 設置頁面狀態為熱賣商品
      setCurrentTitle("熱賣商品");
      setCurrentHeroImage("/img/lan/hot.jpg");
      setSelectedCategory("");
      setSelectedSubCategory("");
      clearFilters();
    } catch (error) {
      console.error('獲取熱賣商品失敗:', error);
    } finally {
      setIsLoading(false); // ← 加入這行
    }
  };

  const toggleMobileFilter = () => {
    setIsMobileFilterOpen(!isMobileFilterOpen);
    if (!isMobileFilterOpen) {
      document.body.classList.add("mobile-filter-open");
    } else {
      document.body.classList.remove("mobile-filter-open");
    }
  };

  const closeMobileFilter = () => {
    setIsMobileFilterOpen(false);
    document.body.classList.remove("mobile-filter-open");
  };

  const handleMobileFilterApply = () => {
    applyFilters();
    closeMobileFilter();
  };

  const handleMobileFilterReset = () => {
    clearFilters();
    closeMobileFilter();
  };

  const handleCartClick = (product, e) => {
    e.stopPropagation();
    openCartModal(product);
  };

  const openCartModal = async (product) => {
    setCurrentCartProduct(product);
    setSelectedColor(product.colors?.[0] || null);
    setSelectedSize(product.sizes?.[0] || null);
    setCartQuantity(1);
    setShowCartModal(true);
    document.body.classList.add("no-scroll");

    // 如果需要獲取完整商品資料
    if (!product.colors || !product.sizes) {
      try {
        const response = await fetch(
          `http://localhost:3005/api/products/${product.id}`
        );
        const result = await response.json();
        if (result.status === "success") {
          setCurrentCartProduct(result.data);
          setSelectedColor(result.data.colors?.[0] || null);
          setSelectedSize(result.data.sizes?.[0] || null);
        }
      } catch (err) {
        console.error("獲取商品詳細資料失敗:", err);
      }
    }
  };

  const addToCartFromModal = () => {
    if (!selectedColor || !selectedSize) {
      Swal.fire({
        title: "請選擇商品規格",
        text: "請選擇顏色和尺寸後再加入購物車",
        icon: "warning",
        confirmButtonText: "我知道了",
      });
      return;
    }

    addToCart(currentCartProduct, cartQuantity, selectedColor, selectedSize);
    openSuccessModal(
      currentCartProduct,
      cartQuantity,
      selectedColor,
      selectedSize
    );
    setShowCartModal(false);
    document.body.classList.remove("no-scroll");
  };

  const getImageUrl = (product) => {
    if (!product || !product.images || product.images.length === 0) {
      return "/img/lan/placeholder.jpg";
    }

    const firstImage = product.images[0];
    if (typeof firstImage === "string") {
      return `http://localhost:3005${firstImage}`;
    } else if (firstImage && firstImage.url) {
      return `http://localhost:3005${firstImage.url}`;
    }

    return "/img/lan/placeholder.jpeg";
  };

  // 關閉收藏成功通知
  const closeWishlistSuccessModal = () => {
    setWishlistSuccessModal({
      isVisible: false,
      product: null,
      quantity: 0,
      selectedColor: null,
      selectedSize: null,
    });
  };

  // 新增分類資料映射
  const categoryData = {
    "": {
      title: "全部商品",
      image: "/img/lan/header.png",
    },
    客廳: {
      title: "客廳",
      image: "/img/lan/livingroom.jpg",
    },
    廚房: {
      title: "廚房",
      image: "/img/lan/kitchen.jpg",
    },
    臥室: {
      title: "臥室",
      image: "/img/lan/bedroom.jpg",
    },
    兒童房: {
      title: "兒童房",
      image: "/img/lan/child.jpg",
    },
    收納用品: {
      title: "收納用品",
      image: "/img/lan/storage.jpg",
    },
  };

  const categoryMapping = {
    // 客廳分類
    邊桌: "客廳",
    單椅: "客廳",
    茶几: "客廳",
    書櫃: "客廳",
    書桌: "客廳",
    邊櫃: "客廳",
    // 廚房分類
    實木餐桌: "廚房",
    餐椅: "廚房",
    吧台桌: "廚房",
    吧台椅: "廚房",
    // 臥室分類
    床架: "臥室",
    床邊桌: "臥室",
    化妝台: "臥室",
    全身鏡: "臥室",
    衣櫃: "臥室",
    // 兒童房分類
    桌椅組: "兒童房",
    衣櫃: "兒童房",
    收納櫃: "兒童房",
    // 收納用品分類
    收納盒: "收納用品",
    收納箱: "收納用品",
  };

  const colorMapping = {
    1: "白色",
    2: "黑色",
    3: "原木色",
    4: "淺灰",
    5: "深灰",
    6: "淺藍",
    7: "深藍",
    8: "淺綠",
    9: "深綠",
    10: "米黃色",
  };
  const colorOptions = [
    { name: "白色", value: "白色", color: "#FFFFFF" },
    { name: "黑色", value: "黑色", color: "#000000" },
    { name: "原木色", value: "原木色", color: "#DEB887" },
    { name: "淺灰", value: "淺灰", color: "#D3D3D3" },
    { name: "深灰", value: "深灰", color: "#555555" },
    { name: "淺藍", value: "淺藍", color: "#ADD8E6" },
    { name: "深藍", value: "深藍", color: "#62869D" },
    { name: "淺綠", value: "淺綠", color: "#DBE5DE" },
    { name: "深綠", value: "深綠", color: "#6B826B" },
    { name: "米黃色", value: "米黃色", color: "#F5F5DC" },
  ];
  const materialMapping = {
    1: "木質",
    2: "金屬",
    3: "塑膠",
    4: "皮革",
    5: "布料",
    6: "玻璃",
    7: "大理石",
    8: "藤",
    9: "亞克力",
    10: "竹",
  };

  // 材质选项
  const materialOptions = [
    "木質",
    "金屬",
    "塑膠",
    "皮革",
    "布料",
    "玻璃",
    "大理石",
    "藤",
    "亞克力",
    "竹",
  ];

  // 系列选项
  const seriesOptions = [
    "北歐簡約風",
    "現代極簡風",
    "工業復古風",
    "美式鄉村風",
    "輕奢設計風",
    "無印自然風",
  ];

  const sortProducts = (products, sortBy) => {
    const sortedProducts = [...products];
    switch (sortBy) {
      case "price_asc":
        return sortedProducts.sort((a, b) => (a.price || 0) - (b.price || 0));
      case "price_desc":
        return sortedProducts.sort((a, b) => (b.price || 0) - (a.price || 0));
      case "created_asc":
        return sortedProducts.sort(
          (a, b) => new Date(a.create_at || 0) - new Date(b.create_at || 0)
        );
      case "created_desc":
        return sortedProducts.sort(
          (a, b) => new Date(b.create_at || 0) - new Date(a.create_at || 0)
        );
      default:
        return sortedProducts;
    }
  };

  // 篩選条件
  const handleFilterChange = (filterType, value, isChecked) => {
    setTempFilters((prev) => {
      const newFilters = { ...prev };

      if (isChecked) {
        if (!newFilters[filterType].includes(value)) {
          newFilters[filterType] = [...newFilters[filterType], value];
        }
      } else {
        newFilters[filterType] = newFilters[filterType].filter(
          (item) => item !== value
        );
      }

      return newFilters;
    });
  };
  const handleColorFilter = (colorValue) => {
    const isSelected = tempFilters.colors.includes(colorValue);
    handleFilterChange("colors", colorValue, !isSelected);
  };

  const applyFilters = () => {
    setSelectedFilters(tempFilters); // 將臨時篩選設定為實際篩選
    setFilterPriceRange(tempPriceRange); // 將臨時價格設定為實際價格
    setCurrentPage(1);
  };
  // 清除篩選
  const clearFilters = () => {
    const defaultFilters = {
      colors: [],
      materials: [],
      series: [],
    };
    const defaultPriceRange = { min: 0, max: 30000 };

    setTempFilters(defaultFilters); // 清除臨時篩選
    setTempPriceRange(defaultPriceRange); // 清除臨時價格
    setSelectedFilters(defaultFilters); // 清除實際篩選
    setFilterPriceRange(defaultPriceRange); // 清除實際價格
    setSortBy("default");
    setCurrentPage(1);
  };

  // 修改篩選選項點擊處理
  const handleSortChange = (newSortBy) => {
    setSortBy(newSortBy);
    setCurrentPage(1); // 重置到第一頁
  };

  const handleProductClick = (productId) => {
    window.location.href = `/products/${productId}`;
  };
  // 處理每頁顯示數量變更
  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(parseInt(e.target.value));
    setCurrentPage(1); // 重置到第一頁
  };

  // 計算當前頁面要顯示的商品
  const getCurrentPageProducts = () => {
    const filteredProducts = getFilteredProducts();
    const sortedProducts = sortProducts(filteredProducts, sortBy);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedProducts.slice(startIndex, endIndex);
  };

  const getFilteredProducts = () => {
    // console.log("篩選條件:", selectedFilters);

    const filtered = products.filter(product => {
      // 價格篩選
      const price = product.price || 0;
      const priceMatch = price >= filterPriceRange.min && price <= filterPriceRange.max;

      // 顏色篩選 - 加強調試
      let colorMatch = true;
      if (selectedFilters.colors?.length > 0) {
        // 特別檢查 EKTORP 商品
        if (product.name.includes('EKTORP')) {
          // console.log('=== EKTORP 商品詳細檢查 ===');
          // console.log('product.colors 原始值:', product.colors);
          // console.log('product.colors 類型:', typeof product.colors);
          // console.log('完整商品資料:', product);
        }

        let productColors = [];
        if (Array.isArray(product.colors)) {
          productColors = product.colors.map(color => color.color_name);
        } else if (typeof product.colors === 'number') {
          productColors = [colorMapping[product.colors]];
        }
        colorMatch = productColors.some(color =>
          selectedFilters.colors.includes(color)
        );
        // 特別檢查 EKTORP
        if (product.name.includes('EKTORP')) {
          // console.log('EKTORP 解析後的顏色:', productColors);
          // console.log('篩選條件包含的顏色:', selectedFilters.colors);
          // console.log('顏色匹配結果:', colorMatch);
          // console.log('=== 檢查結束 ===');
        }
      }

      // 材質篩選
      let materialMatch = true;
      if (selectedFilters.materials?.length > 0) {
        let productMaterials = [];

        if (Array.isArray(product.materials) && product.materials.length > 0) {
          productMaterials = product.materials.map(material => material.material_name);
        }

        // console.log('=== 材質篩選調試 ===');
        // console.log('商品:', product.name);
        // console.log('商品材質陣列:', product.materials);
        // console.log('解析後材質名稱:', productMaterials);
        // console.log('篩選條件:', selectedFilters.materials);

        if (productMaterials.length > 0) {
          materialMatch = productMaterials.some(material =>
            selectedFilters.materials.some(filterMaterial =>
              material.includes(filterMaterial) || filterMaterial.includes(material)
            )
          );
        } else {
          materialMatch = false;
        }

        // console.log('匹配結果:', materialMatch);
      }

      let seriesMatch = true;
      if (selectedFilters.series?.length > 0) {
        seriesMatch = product.style ? selectedFilters.series.includes(product.style) : false;
      }

      const finalMatch = priceMatch && colorMatch && materialMatch && seriesMatch;

      return finalMatch;
    });

    // console.log(`篩選結果: 從 ${products.length} 個商品中篩選出 ${filtered.length} 個`);
    return filtered;
  };

  const filteredProducts = getFilteredProducts();
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);

      // 只有換頁時才更新URL中的page參數
      const urlParams = new URLSearchParams(window.location.search);
      urlParams.set("page", page.toString());
      window.history.replaceState(
        {},
        "",
        `${window.location.pathname}?${urlParams.toString()}`
      );

      document.querySelector(".products-grid")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  // 生成分頁按鈕
  const renderPaginationButtons = () => {
    const buttons = [];
    const maxVisiblePages = 5;

    // 計算顯示範圍
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    // 調整起始頁
    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // 前一頁按鈕
    buttons.push(
      <button
        key="prev"
        className={`page-btn prev ${currentPage === 1 ? "disabled" : ""}`}
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <i className="fas fa-chevron-left"></i>
      </button>
    );

    // 第一頁
    if (startPage > 1) {
      buttons.push(
        <button
          key={1}
          className="page-btn"
          onClick={() => handlePageChange(1)}
        >
          1
        </button>
      );
      if (startPage > 2) {
        buttons.push(
          <span key="ellipsis1" className="pagination-ellipsis">
            ...
          </span>
        );
      }
    }

    // 中間頁面
    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          className={`page-btn ${currentPage === i ? "active" : ""}`}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </button>
      );
    }

    // 最後一頁
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        buttons.push(
          <span key="ellipsis2" className="pagination-ellipsis">
            ...
          </span>
        );
      }
      buttons.push(
        <button
          key={totalPages}
          className="page-btn"
          onClick={() => handlePageChange(totalPages)}
        >
          {totalPages}
        </button>
      );
    }

    // 下一頁按鈕
    buttons.push(
      <button
        key="next"
        className={`page-btn next ${
          currentPage === totalPages ? "disabled" : ""
        }`}
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        <i className="fas fa-chevron-right"></i>
      </button>
    );

    return buttons;
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const category = decodeURIComponent(urlParams.get("category") || "");
    const subcategory = decodeURIComponent(urlParams.get("subcategory") || "");
    const type = urlParams.get("type") || "";
    const page = parseInt(urlParams.get("page")) || 1;

    // console.log('URL 參數:', { category, subcategory, type });

    setCurrentPage(page);

    if (type === "latest") {
      fetchLatestProducts();
      return;
    }

    if (type === "hot") {
      fetchHotProducts();
      return;
    }

    if (category) {
      setSelectedCategory(category);
      const categoryInfo = categoryData[category] || categoryData[""];
      setCurrentTitle(categoryInfo.title);
      setCurrentHeroImage(categoryInfo.image);

      if (subcategory) {
        setSelectedSubCategory(subcategory);
      } else {
        setSelectedSubCategory("");
      }

      clearFilters();
    } else {
      setIsLoading(false);
      setCurrentTitle("全部商品");
      setCurrentHeroImage("/img/lan/header.png"); // 沒有參數時才停止載入
    }
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      if (!isLoading && !selectedCategory && !selectedSubCategory) {
        // 只有在不是載入狀態且沒有選擇分類時才載入全部商品
        return;
      }
      try {
        setIsLoading(true); // 開始載入
        let url = "http://localhost:3005/api/products";
        let allProducts = [];

        if (selectedSubCategory) {
          // 如果選擇了子分類，先按大分類獲取商品，再按名稱篩選
          const mainCategory = categoryMapping[selectedSubCategory];
          if (mainCategory) {
            const response = await fetch(
              `${url}?category=${encodeURIComponent(mainCategory)}`
            );
            const categoryProducts = await response.json();

            // 從中篩選包含子分類關鍵字的商品
            allProducts = categoryProducts.filter(
              (product) =>
                product.name
                  .toLowerCase()
                  .includes(selectedSubCategory.toLowerCase()) ||
                product.description
                  ?.toLowerCase()
                  .includes(selectedSubCategory.toLowerCase())
            );
          }
        } else if (selectedCategory) {
          // 只選擇了大分類
          const response = await fetch(
            `${url}?category=${encodeURIComponent(selectedCategory)}`
          );
          allProducts = await response.json();
        } else {
          // 獲取所有商品
          const response = await fetch(url);
          allProducts = await response.json();
        }

        // console.log('獲取的商品:', allProducts);
        setProducts(Array.isArray(allProducts) ? allProducts : []);
      } catch (err) {
        console.error("產品 API 請求錯誤：", err);
        setProducts([]);
      } finally {
        setIsLoading(false); // 結束載入
      }
    };

    fetchProducts();
  }, [selectedCategory, selectedSubCategory]);
  // //產品api
  // useEffect(() => {
  //   fetch("http://localhost:3005/api/products")
  //     .then((res) => res.json())
  //     .then((json) => {
  //       console.log(json);
  //       setProducts(Array.isArray(json) ? json : []);
  //     })
  //     .catch((err) => {
  //       console.error("產品 API 請求錯誤：", err);
  //     });
  // }, []);

  useEffect(() => {
    const loadWishlistStatus = async () => {
      const token = localStorage.getItem("reactLoginToken");
      console.log("Token:", token);

      if (!token) return;
      try {
        // 獲取用戶所有收藏
        const response = await fetch(
          "http://localhost:3005/api/users/favorites",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const result = await response.json();

        if (result.status === "success") {
          const wishlistState = {};
          result.data.forEach((favorite) => {
            const key = `${favorite.product_id}_${favorite.color_id}_${favorite.size_id}`;
            wishlistState[key] = true;
          });
          setIsWishlisted(wishlistState);
        }
      } catch (error) {
        console.error("載入收藏狀態失敗:", error);
      }
    };
    loadWishlistStatus();
  }, []);

  const currentProducts = getCurrentPageProducts();

  const handleCategoryClick = (e, categoryName) => {
    e.preventDefault();

    // 檢查是否為子分類
    if (categoryMapping[categoryName]) {
      // 這是子分類
      const mainCategory = categoryMapping[categoryName];
      setSelectedSubCategory(categoryName);
      setSelectedCategory(categoryMapping[categoryName]);
      setSelectedCategory(mainCategory);

      // 更新標題和背景圖片為主分類
      const categoryInfo = categoryData[mainCategory] || categoryData[""];
      setCurrentTitle(categoryInfo.title);
      setCurrentHeroImage(categoryInfo.image);
    } else {
      // 這是大分類
      setSelectedCategory(categoryName);
      setSelectedSubCategory("");

      // 更新標題和背景圖片
      const categoryInfo = categoryData[categoryName] || categoryData[""];
      setCurrentTitle(categoryInfo.title);
      setCurrentHeroImage(categoryInfo.image);
    }

    // 清除其他篩選條件
    clearFilters();
  };

  const openWishlistModal = async (product) => {
    // console.log('openWishlistModal 被調用', product);
    // console.log('product.images:', product.images);

    setCurrentWishlistProduct(product);
    setSelectedColor(product.colors?.[0] || null);
    setSelectedSize(product.sizes?.[0] || null);
    setWishlistQuantity(1);
    // console.log('準備設置 showWishlistModal 為 true');
    setShowWishlistModal(true);
    document.body.classList.add("no-scroll");

    // 如果商品缺少詳細資料，獲取完整資料
    if (!product.colors || !product.sizes) {
      try {
        const response = await fetch(
          `http://localhost:3005/api/products/${product.id}`
        );
        const result = await response.json();
        if (result.status === 'success') {
          // console.log('獲取到完整商品資料:', result.data);
          // console.log('完整商品的圖片資料:', result.data.images);


          setCurrentWishlistProduct(result.data);
          setSelectedColor(result.data.colors?.[0] || null);
          setSelectedSize(result.data.sizes?.[0] || null);
        }
      } catch (err) {
        console.error("獲取商品詳細資料失敗:", err);
      }
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
        confirmButtonColor: "#DBA783",
      }).then((result) => {
        if (result.isConfirmed) {
          window.location.href = "/auth/login";
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
        confirmButtonColor: "#DBA783",
      });
      return;
    }

    try {
      const wishlistData = {
        productId: currentWishlistProduct.id,
        colorId: selectedColor.id,
        sizeId: selectedSize.id,
        quantity: wishlistQuantity,
      };

      const response = await fetch(
        "http://localhost:3005/api/users/favorites",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("reactLoginToken")}`,
          },
          body: JSON.stringify(wishlistData),
        }
      );

      const result = await response.json();

      if (result.status === "success") {
        const key = `${currentWishlistProduct.id}_${selectedColor.id}_${selectedSize.id}`;
        setIsWishlisted((prev) => ({
          ...prev,
          [key]: true,
        }));
        setShowWishlistModal(false);
        document.body.classList.remove("no-scroll");

        setWishlistSuccessModal({
          isVisible: true,
          product: currentWishlistProduct,
          quantity: wishlistQuantity,
          selectedColor: selectedColor,
          selectedSize: selectedSize,
        });
      } else {
        setShowWishlistModal(false);
        document.body.classList.remove("no-scroll");
        // 您的錯誤處理代碼放在這裡
        if (result.message && result.message.includes("已在收藏清單中")) {
          Swal.fire({
            title: "已在收藏清單中",
            text: "此商品的這個顏色和尺寸組合已經在您的收藏清單中了",
            icon: "info",
            confirmButtonText: "確定",
            position: "center",
            confirmButtonColor: "#DBA783",
          });
        } else {
          Swal.fire({
            title: "加入收藏失敗",
            text: "請稍後再試或聯絡客服",
            icon: "error",
            position: "center",
            confirmButtonText: "確定",
            confirmButtonColor: "#DBA783",
          });
        }
      }
    } catch (err) {
      console.error("加入收藏失敗:", err);
      Swal.fire({
        title: "發生錯誤",
        text: "加入收藏時發生錯誤，請稍後再試",
        icon: "error",
        confirmButtonText: "確定",
        confirmButtonColor: "#DBA783",
      });
    }
  };
  const checkAuthStatus = async () => {
    const token = localStorage.getItem("reactLoginToken");
    if (!token) return false;

    try {
      const response = await fetch("http://localhost:3005/api/users/status", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      return response.status !== 401;
    } catch {
      return false;
    }
  };

  const handleWishlistToggle = async (product, e) => {
    e.stopPropagation();
    e.preventDefault();

    const isLoggedIn = await checkAuthStatus();
    if (!isLoggedIn) {
      Swal.fire({
        title: "請先登入",
        text: "您需要登入才能使用收藏功能",
        icon: "info",
        confirmButtonText: "確定",
        confirmButtonColor: "#DBA783",
      }).then((result) => {
        if (result.isConfirmed) {
          window.location.href = "/auth/login";
        }
      });
      return;
    }

    // 檢查是否有任何收藏組合
    const hasWishlist = hasAnyWishlist(product.id);

    if (hasWishlist) {
      // 如果已收藏，找到第一個收藏的組合並移除
      const wishlistKeys = Object.keys(isWishlisted).filter(
        (key) => key.startsWith(`${product.id}_`) && isWishlisted[key]
      );

      if (wishlistKeys.length > 0) {
        const firstKey = wishlistKeys[0];
        const [productId, colorId, sizeId] = firstKey.split("_");
        await removeFromWishlist(productId, colorId, sizeId);
      }
    } else {
      // 如果未收藏，打開選擇彈窗
      openWishlistModal(product);
    }
  };

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
        cancelButtonText: "取消",
      });

      if (!result.isConfirmed) return;

      const response = await fetch(
        `http://localhost:3005/api/users/favorites/${productId}/${colorId}/${sizeId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("reactLoginToken")}`,
          },
        }
      );

      const data = await response.json();
      if (data.status === "success") {
        const key = `${productId}_${colorId}_${sizeId}`;
        setIsWishlisted((prev) => ({
          ...prev,
          [key]: false,
        }));
        Swal.fire({
          title: "已移除收藏",
          text: "商品已從收藏清單中移除",
          icon: "success",
          confirmButtonText: "確定",
          confirmButtonColor: "#DBA783",
          timer: 2000,
          timerProgressBar: true,
        });
      }
    } catch (err) {
      console.error("移除收藏失敗:", err);
      Swal.fire({
        title: "移除失敗",
        text: "移除收藏時發生錯誤，請稍後再試",
        icon: "error",
        confirmButtonText: "確定",
        confirmButtonColor: "#DBA783",
      });
    }
  };
  const handleAddToCart = (product, e) => {
    e.stopPropagation();

    const defaultColor = product.colors?.[0] || null;
    const defaultSize = product.sizes?.[0] || null;
    addToCart(product, 1, defaultColor, defaultSize);
  };

  const checkWishlistStatus = (productId, colorId, sizeId) => {
    const key = `${productId}_${colorId}_${sizeId}`;
    const result = isWishlisted[key] || false;
    // console.log(`checkWishlistStatus(${productId}, ${colorId}, ${sizeId}) = ${result}`);
    // console.log('完整 isWishlisted:', isWishlisted);
    return result;
  };

  const hasAnyWishlist = (productId) => {
    // console.log('=== hasAnyWishlist 被調用 ===');
    // console.log('檢查商品 ID:', productId);
    // console.log('當前 isWishlisted 狀態:', isWishlisted);

    const productKeys = Object.keys(isWishlisted).filter(
      (key) => key.startsWith(`${productId}_`) && isWishlisted[key]
    );
    // console.log('找到的相關 keys:', productKeys);
    // console.log('最終結果:', productKeys.length > 0);
    return productKeys.length > 0;
  };

  const getColorCode = (colorName) => {
    const colorMap = {
      白色: "#ffffff",
      黑色: "#000000",
      原木色: "#deb887",
      淺灰: "#d3d3d3",
      深灰: "#555555",
      淺藍: "#add8e6",
      深藍: "#000080",
      淺綠: "#90ee90",
      深綠: "#006400",
      米黃色: "#f5f5dc",
    };
    return colorMap[colorName] || "#cccccc";
  };

  const getProductColors = (product) => {
    if (Array.isArray(product.colors)) return product.colors;
    // 如果 colors 是 ID，需要從某處獲取完整數據
    return [];
  };

  const getProductSizes = (product) => {
    if (Array.isArray(product.sizes)) return product.sizes;
    return [];
  };

  return (
    <div className="main-product-page">

      {/* 子導航欄 */}
      <div className="breadcrumb-nav-top">
        <div className="sub-nav-content">
          <div className="breadcrumb">
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                window.location.href = "/";
              }}
            >
              首頁
            </a>{" "}
            <div className="arrow">&gt;</div>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setSelectedCategory("");
                setSelectedSubCategory("");
                setCurrentTitle("全部商品");
                setCurrentHeroImage("/img/lan/header.png");
              }}
            ></a>
            商品列表
          </div>
        </div>
      </div>
      <div className="alls">
        <div className="all-0">{currentTitle}</div>
        <div className="all-1">Oakly 質感家具，打造理想生活空間</div>
        <div className="all-2">
          精選每一件家具，只為帶來溫潤木質與極簡設計的完美結合。從客廳到臥室，Oakly
          讓家的每個角落都充滿溫度與品味。立即探索，找尋屬於你的生活風格。
        </div>
      </div>
      {/* Hero  */}
      {currentHeroImage && (
        <section className="hero">
          <img
            src={currentHeroImage}
            alt="hero"
            style={{ filter: "brightness(0.7)" }}
          />
          <div className="hero-content">
            <h1 className="hero-title">{currentTitle}</h1>
          </div>
        </section>
      )}
      <div className="sub-nav">
        <div className="sub-nav-links">
          <a
            href="#"
            className="sub-nav-link"
            onClick={(e) => {
              e.preventDefault();
              fetchLatestProducts();
            }}
          >
            最新商品
          </a>
          <a
            href="#"
            className="sub-nav-link"
            onClick={(e) => {
              e.preventDefault();
              fetchHotProducts();
            }}
          >
            熱賣
          </a>
          <div className="dropdown hover-dropdown">
            <div className="sub-nav-link dropdown-toggle" aria-expanded="false">
              空間<i className="fas fa-chevron-down fa-sm"></i>
            </div>
            <div className="dropdown-menu dropdown-megamenu">
              <div className="megamenu-column">
                <a
                  href="#"
                  className="dropdown-header"
                  onClick={(e) => handleCategoryClick(e, "客廳")}
                >
                  客廳
                </a>{" "}
                <a
                  className="dropdown-item"
                  href="#"
                  onClick={(e) => handleCategoryClick(e, "邊桌")}
                >
                  邊桌
                </a>
                <a
                  className="dropdown-item"
                  href="#"
                  onClick={(e) => handleCategoryClick(e, "單椅")}
                >
                  單椅/單人沙發
                </a>
                <a
                  className="dropdown-item"
                  href="#"
                  onClick={(e) => handleCategoryClick(e, "茶几")}
                >
                  茶几
                </a>
                <a
                  className="dropdown-item"
                  href="#"
                  onClick={(e) => handleCategoryClick(e, "書櫃")}
                >
                  書櫃 / 書架
                </a>
                <a
                  className="dropdown-item"
                  href="#"
                  onClick={(e) => handleCategoryClick(e, "書桌")}
                >
                  書桌 / 書桌椅
                </a>
                <a
                  className="dropdown-item"
                  href="#"
                  onClick={(e) => handleCategoryClick(e, "邊櫃")}
                >
                  邊櫃 / 收納櫃
                </a>
              </div>
              <div className="megamenu-column">
                <a
                  href="#"
                  className="dropdown-header"
                  onClick={(e) => handleCategoryClick(e, "廚房")}
                >
                  廚房
                </a>{" "}
                <a
                  className="dropdown-item"
                  href="#"
                  onClick={(e) => handleCategoryClick(e, "實木餐桌")}
                >
                  實木餐桌
                </a>
                <a
                  className="dropdown-item"
                  href="#"
                  onClick={(e) => handleCategoryClick(e, "餐椅")}
                >
                  餐椅 / 椅子
                </a>
                <a
                  className="dropdown-item"
                  href="#"
                  onClick={(e) => handleCategoryClick(e, "吧台桌")}
                >
                  吧台桌
                </a>
                <a
                  className="dropdown-item"
                  href="#"
                  onClick={(e) => handleCategoryClick(e, "吧台椅")}
                >
                  吧台椅
                </a>
              </div>
              <div className="megamenu-column">
                <a
                  href="#"
                  className="dropdown-header"
                  onClick={(e) => handleCategoryClick(e, "臥室")}
                >
                  臥室
                </a>
                <a
                  className="dropdown-item"
                  href="#"
                  onClick={(e) => handleCategoryClick(e, "床架")}
                >
                  床架
                </a>
                <a
                  className="dropdown-item"
                  href="#"
                  onClick={(e) => handleCategoryClick(e, "床邊桌")}
                >
                  床邊桌
                </a>
                <a
                  className="dropdown-item"
                  href="#"
                  onClick={(e) => handleCategoryClick(e, "化妝台")}
                >
                  化妝台
                </a>
                <a
                  className="dropdown-item"
                  href="#"
                  onClick={(e) => handleCategoryClick(e, "全身鏡")}
                >
                  全身鏡 / 鏡子
                </a>
                <a
                  className="dropdown-item"
                  href="#"
                  onClick={(e) => handleCategoryClick(e, "衣櫃")}
                >
                  衣櫃 / 衣架
                </a>
              </div>
              <div className="megamenu-column">
                <a
                  href="#"
                  className="dropdown-header"
                  onClick={(e) => handleCategoryClick(e, "兒童房")}
                >
                  兒童房
                </a>{" "}
                <a
                  className="dropdown-item"
                  href="#"
                  onClick={(e) => handleCategoryClick(e, "桌椅組")}
                >
                  桌椅組
                </a>
                <a
                  className="dropdown-item"
                  href="#"
                  onClick={(e) => handleCategoryClick(e, "衣櫃")}
                >
                  衣櫃
                </a>
                <a
                  className="dropdown-item"
                  href="#"
                  onClick={(e) => handleCategoryClick(e, "床架")}
                >
                  床架
                </a>
                <a
                  className="dropdown-item"
                  href="#"
                  onClick={(e) => handleCategoryClick(e, "收納櫃")}
                >
                  收納櫃
                </a>
              </div>
              <div className="megamenu-column">
                <a
                  href="#"
                  className="dropdown-header"
                  onClick={(e) => handleCategoryClick(e, "收納用品")}
                >
                  收納用品
                </a>
                <a
                  className="dropdown-item"
                  href="#"
                  onClick={(e) => handleCategoryClick(e, "收納盒")}
                >
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
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                window.location.href = "/";
              }}
            >
              首頁
            </a>
            <div className="arrow">&gt;</div>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setSelectedCategory("");
                setSelectedSubCategory("");
                setCurrentTitle("全部商品");
                setCurrentHeroImage("/img/lan/header.png");
                fetch("http://localhost:3005/api/products")
                  .then((res) => res.json())
                  .then((json) => setProducts(Array.isArray(json) ? json : []))
                  .catch((err) => console.error(err));
              }}
            >
              商品列表
            </a>
            {selectedCategory && (
              <>
                <div className="arrow">&gt;</div>
                <span>{selectedCategory}</span>
              </>
            )}
            {selectedSubCategory && (
              <>
                <div className="arrow">&gt;</div>
                <span>{selectedSubCategory}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 主要內容區域 */}
      <div className="content">
        <div className="mid-sec">
          <div className="filter" onClick={toggleMobileFilter}>
            <svg
              width="11"
              height="10"
              viewBox="0 0 11 10"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M10.0308 0H0.969295C0.552928 0 0.34283 0.505195 0.637849 0.800215L4.25 4.41291V8.4375C4.25 8.59045 4.32463 8.73379 4.44994 8.82152L6.01244 9.91488C6.3207 10.1307 6.75 9.91197 6.75 9.53086V4.41291L10.3622 0.800215C10.6567 0.505781 10.448 0 10.0308 0Z"
                fill="#8B8B8B"
              />
            </svg>
            篩選
          </div>
          <div
            className="sort"
            onClick={() => setShowMobileSortDropdown(!showMobileSortDropdown)}
          >
            排列方式
            <svg
              width="7"
              height="4"
              viewBox="0 0 7 4"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{
                transform: showMobileSortDropdown
                  ? "rotate(180deg)"
                  : "rotate(0deg)",
              }}
            >
              <path
                d="M3.77203 3.89391L6.88731 0.960529C7.03756 0.819055 7.03756 0.58969 6.88731 0.448232L6.52397 0.106102C6.37398 -0.0351305 6.13088 -0.0354021 5.98054 0.105498L3.49999 2.43025L1.01946 0.105498C0.869116 -0.0354021 0.626024 -0.0351305 0.476033 0.106102L0.112686 0.448232C-0.0375618 0.589705 -0.0375618 0.81907 0.112686 0.960529L3.22797 3.89389C3.3782 4.03537 3.62179 4.03537 3.77203 3.89391Z"
                fill="#8B8B8B"
              />
            </svg>
            {/* 下拉菜單 */}
            {showMobileSortDropdown && (
              <div className="mobile-sort-dropdown">
                <div
                  className="mobile-sort-option"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSortBy("default");
                    setShowMobileSortDropdown(false);
                  }}
                >
                  預設排序
                </div>
                <div
                  className="mobile-sort-option"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSortBy("price_asc");
                    setShowMobileSortDropdown(false);
                  }}
                >
                  售價 (由低到高)
                </div>
                <div
                  className="mobile-sort-option"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSortBy("price_desc");
                    setShowMobileSortDropdown(false);
                  }}
                >
                  售價 (由高到低)
                </div>
                <div
                  className="mobile-sort-option"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSortBy("created_asc");
                    setShowMobileSortDropdown(false);
                  }}
                >
                  上架時間 (由低到高)
                </div>
                <div
                  className="mobile-sort-option"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSortBy("created_desc");
                    setShowMobileSortDropdown(false);
                  }}
                >
                  上架時間 (由高到低)
                </div>
              </div>
            )}
          </div>
          <div className="per-page-select">
            <select
              className="per-page-selection"
              value={itemsPerPage}
              onChange={handleItemsPerPageChange}
            >
              {" "}
              <option value={12}>每頁顯示 12 個</option>
              <option value={24}>每頁顯示 24 個</option>
              <option value={48}>每頁顯示 48 個</option>
            </select>
          </div>
        </div>

        <div className="products-container">
          <div className="wrapper">
            {/* 左側邊欄 */}
            <aside className="sidebar2">
              <div className="filter-sections">
                {/* 分類 */}
                <div className="filter-section">
                  <h3 className="filter-title">篩選</h3>
                  <div className="filter-options">
                    <div
                      className={`filter-option ${
                        sortBy === "price_asc" ? "active" : ""
                      }`}
                      onClick={() => handleSortChange("price_asc")}
                    >
                      售價 (由低到高)
                    </div>
                    <div
                      className={`filter-option ${
                        sortBy === "price_desc" ? "active" : ""
                      }`}
                      onClick={() => handleSortChange("price_desc")}
                    >
                      售價 (由高到低)
                    </div>
                    <div
                      className={`filter-option ${
                        sortBy === "created_asc" ? "active" : ""
                      }`}
                      onClick={() => handleSortChange("created_asc")}
                    >
                      上架時間 (由低到高)
                    </div>
                    <div
                      className={`filter-option ${
                        sortBy === "created_desc" ? "active" : ""
                      }`}
                      onClick={() => handleSortChange("created_desc")}
                    >
                      上架時間 (由高到低)
                    </div>
                  </div>
                </div>

                {/* 價格 */}
                <div className="filter-section">
                  <h3 className="filter-title">價格</h3>
                  <div className="price-range">
                    <div className="price-slider">
                      <input
                        type="range"
                        min="0"
                        max="30000"
                        step="100"
                        value={tempPriceRange.max}
                        onChange={(e) => {
                          const newMax = parseInt(e.target.value);
                          setTempPriceRange({ min: 0, max: newMax });
                        }}
                      />
                    </div>
                    <span>
                      NT$ 0 - NT$ {tempPriceRange.max.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* 顏色 */}
                <div className="filter-section">
                  <h3 className="filter-title">顏色</h3>
                  <div className="color-options">
                    {colorOptions.map((color) => (
                      <div
                        key={color.value}
                        className={`color-option ${
                          tempFilters?.colors?.includes(color.value)
                            ? "selected"
                            : ""
                        }`}
                        style={{
                          backgroundColor: color.color,
                        }}
                        onClick={() => handleColorFilter(color.value)}
                        title={color.name}
                      ></div>
                    ))}
                  </div>
                </div>

                {/* 材質 */}
                <div className="filter-section">
                  <h3 className="filter-title">材質</h3>
                  <div className="filter-options">
                    {materialOptions.map((material) => (
                      <div key={material} className="option">
                        <input
                          type="checkbox"
                          checked={
                            tempFilters?.materials?.includes(material) || false
                          }
                          onChange={(e) =>
                            handleFilterChange(
                              "materials",
                              material,
                              e.target.checked
                            )
                          }
                        />
                        <span>{material}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 系列 */}
                <div className="filter-section">
                  <h3 className="filter-title">系列</h3>
                  <div className="filter-options">
                    {seriesOptions.map((series) => (
                      <div key={series} className="option">
                        <input
                          type="checkbox"
                          checked={
                            tempFilters?.series?.includes(series) || false
                          }
                          onChange={(e) =>
                            handleFilterChange(
                              "series",
                              series,
                              e.target.checked
                            )
                          }
                        />
                        <span>{series}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 篩選按鈕 */}
              <div className="filter-buttons">
                <button className="filter-btn" onClick={applyFilters}>
                  <img src="img/lan/filter2.svg"></img>套用篩選
                </button>
                <button className="reset-btn" onClick={clearFilters}>
                  清除
                </button>
              </div>
            </aside>






            {/* 右側商品區域 */}
            <main className="products-section">
              <div className="per-page-select">
                <select
                  className="per-page-selection"
                  value={itemsPerPage}
                  onChange={handleItemsPerPageChange}
                >
                  {" "}
                  <option value={12}>每頁顯示 12 個</option>
                  <option value={24}>每頁顯示 24 個</option>
                  <option value={48}>每頁顯示 48 個</option>
                </select>
              </div>
              <div className="view-toggle-container">
                <div className="view-toggle-title">家具</div>
                <div className="view-toggle">
                  <button
                    className={`view-btn ${
                      viewMode === "grid" ? "active" : ""
                    }`}
                    onClick={() => setViewMode("grid")}
                  >
                    <img src="img/lan/menu.png" alt="list" />
                  </button>
                  <button
                    className={`view-btn ${
                      viewMode === "list" ? "active" : ""
                    }`}
                    onClick={() => setViewMode("list")}
                  >
                    <img src="img/lan/lines.png" alt="list" />
                  </button>
                </div>
              </div>
              {/* 商品網格 */}

              <div className={`products-grid ${viewMode}`} key={viewMode}>
                {isLoading ? (
                  <div className="pulse-loading">
                    <div className="pulse-circle"></div>
                    <p className="loading-text">載入中</p>
                  </div>
                ) : (
                  currentProducts.map((product, index) => (
                    <div
                      key={product.id}
                      className="productcard fade-in-item"
                      onClick={() => handleProductClick(product.id)}
                      style={{
                        cursor: 'pointer',
                        animationDelay: `${index * 0.1}s`
                      }}>
                      <div className="badges">

                        {product.isNew && <span className="badge-new">新品</span>}
                        {product.isHot && <span className="badge-hot">熱賣</span>}
                      </div>

                      <div className="image">
                        {product.images && product.images.length > 0 ? (
                          <img
                            src={getImageUrl(product)}
                            alt={product.name}
                            style={{ maxWidth: "200px" }}
                            onError={(e) => {
                              console.log("圖片載入失敗:", e.target.src);
                              e.target.src = "/img/lan/placeholder.jpeg";
                            }}
                          />
                        ) : (
                          <div className="no-image-placeholder">
                            <span>暫無圖片</span>
                          </div>
                        )}
                      </div>

                      <div
                        className="info"
                        onClick={() => handleProductClick(product.id)}
                      >
                        <h3 className="name">{product.name}</h3>
                        <p className="price">NT$ {product.price}</p>
                      </div>

                      {/* 操作按鈕區域 */}
                      <div className="product-actions">
                        <button
                          className="action-btn add-to-cart"
                          onClick={(e) => handleCartClick(product, e)}
                        >
                          加入購物車
                        </button>
                      </div>

                      {/* 右上角愛心按鈕 */}
                      <button
                        className={`wishlist-heart-btn ${
                          hasAnyWishlist(product.id) ? "active" : ""
                        }`}
                        onClick={(e) => handleWishlistToggle(product, e)}
                      >
                        <i
                          className={`fa-${
                            hasAnyWishlist(product.id) ? "solid" : "regular"
                          } fa-heart`}
                        ></i>
                      </button>
                    </div>
                  ))
                )}
              </div>
              <div className="page-info">
                顯示{" "}
                {Math.min(
                  (currentPage - 1) * itemsPerPage + 1,
                  filteredProducts.length
                )}{" "}
                -{" "}
                {Math.min(currentPage * itemsPerPage, filteredProducts.length)}{" "}
                項，共 {filteredProducts.length} 項
              </div>

              {/* 分頁 */}
              {totalPages > 1 && (
                <div className="pagination">{renderPaginationButtons()}</div>
              )}
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
                            src={getImageUrl(currentWishlistProduct)}
                            alt={currentWishlistProduct?.name || ""}
                            onError={(e) => {
                              console.log("彈窗圖片載入失敗:", e.target.src);
                              e.target.src = "/img/lan/placeholder.jpeg";
                            }}
                          />
                        </div>
                        <div className="wishlist-form-content">
                          <h6 className="wishlist-product-name">
                            {currentWishlistProduct?.name}
                          </h6>
                          <p className="wishlist-product-price">
                            NT${" "}
                            {currentWishlistProduct?.price?.toLocaleString()}
                          </p>

                          {/* 顏色選擇 */}
                          <div className="wishlist-form-group">
                            <label className="wishlist-form-label">
                              選擇顏色
                            </label>
                            <div className="wishlist-options">
                              {Array.isArray(currentWishlistProduct?.colors) &&
                                currentWishlistProduct.colors.map((color) => (
                                  <div
                                    key={color.id}
                                    onClick={() => setSelectedColor(color)}
                                    className={`wishlist-color-option ${
                                      selectedColor?.id === color.id
                                        ? "selected"
                                        : ""
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
                                ))}
                            </div>
                          </div>

                          {/* 尺寸選擇 */}
                          <div className="wishlist-form-group">
                            <label className="wishlist-form-label">
                              選擇尺寸
                            </label>
                            <div className="wishlist-options">
                              {Array.isArray(currentWishlistProduct?.sizes) &&
                                currentWishlistProduct.sizes.map((size) => (
                                  <div
                                    key={size.id}
                                    onClick={() => setSelectedSize(size)}
                                    className={`wishlist-size-option ${
                                      selectedSize?.id === size.id
                                        ? "selected"
                                        : ""
                                    }`}
                                  >
                                    {size.size_label}
                                  </div>
                                ))}
                            </div>
                          </div>
                          {/* 數量選擇 */}
                          <div className="wishlist-form-group">
                            <label className="wishlist-form-label">數量</label>
                            <div className="wishlist-quantity-controls">
                              <button
                                onClick={() =>
                                  setWishlistQuantity(
                                    Math.max(1, wishlistQuantity - 1)
                                  )
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
                      document.body.classList.remove("no-scroll");
                    }}
                  ></div>

                  <div className="cart-modal-container">
                    <div className="cart-modal-content">
                      <button
                        className="cart-modal-close"
                        onClick={() => {
                          setShowCartModal(false);
                          document.body.classList.remove("no-scroll");
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
                            src={getImageUrl(currentCartProduct)}
                            alt={currentCartProduct?.name || ""}
                            onError={(e) => {
                              console.log("彈窗圖片載入失敗:", e.target.src);
                              e.target.src = "/img/lan/placeholder.jpeg";
                            }}
                          />
                        </div>
                        <div className="cart-form-content">
                          <h6 className="cart-product-name">
                            {currentCartProduct?.name}
                          </h6>
                          <p className="cart-product-price">
                            NT$ {currentCartProduct?.price?.toLocaleString()}
                          </p>

                          {/* 顏色選擇 */}
                          <div className="cart-form-group">
                            <label className="cart-form-label">選擇顏色</label>
                            <div className="cart-options">
                              {Array.isArray(currentCartProduct?.colors) &&
                                currentCartProduct.colors.map((color) => (
                                  <div
                                    key={color.id}
                                    onClick={() => setSelectedColor(color)}
                                    className={`cart-color-option ${
                                      selectedColor?.id === color.id
                                        ? "selected"
                                        : ""
                                    }`}
                                  >
                                    <div
                                      className="cart-color-dot"
                                      style={{
                                        backgroundColor: getColorCode(
                                          color.color_name
                                        ),
                                      }}
                                    ></div>
                                    <span>{color.color_name}</span>
                                  </div>
                                ))}
                            </div>
                          </div>

                          {/* 尺寸選擇 */}
                          <div className="cart-form-group">
                            <label className="cart-form-label">選擇尺寸</label>
                            <div className="cart-options">
                              {Array.isArray(currentCartProduct?.sizes) &&
                                currentCartProduct.sizes.map((size) => (
                                  <div
                                    key={size.id}
                                    onClick={() => setSelectedSize(size)}
                                    className={`cart-size-option ${
                                      selectedSize?.id === size.id
                                        ? "selected"
                                        : ""
                                    }`}
                                  >
                                    {size.size_label}
                                  </div>
                                ))}
                            </div>
                          </div>

                          {/* 數量選擇 */}
                          <div className="cart-form-group">
                            <label className="cart-form-label">數量</label>
                            <div className="cart-quantity-controls">
                              <button
                                onClick={() => {
                                  const newQuantity = Math.max(
                                    1,
                                    cartQuantity - 1
                                  );
                                  setCartQuantity(newQuantity);
                                }}
                                disabled={cartQuantity <= 1}
                                className="cart-quantity-btn"
                              >
                                -
                              </button>
                              <span className="cart-quantity-display">
                                {cartQuantity}
                              </span>
                              <button
                                onClick={() => {
                                  const newQuantity = (1, cartQuantity + 1);
                                  setCartQuantity(newQuantity);
                                }}
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
            </main>
          </div>
        </div>
      </div>
      <div
        className={`modal fade ${isMobileFilterOpen ? "show" : ""}`}
        style={{ display: isMobileFilterOpen ? "block" : "none" }}
        tabIndex="-1"
        aria-labelledby="mobileFilterModalLabel"
        aria-hidden={!isMobileFilterOpen}
      >
        <div className="modal-dialog modal-dialog-end mobile-filter-modal">
          <div className="modal-content h-100">
            {/* Modal 頭部 */}
            <div className="modal-header">
              <h5 className="modal-title" id="mobileFilterModalLabel">
                篩選
              </h5>
              <button
                type="button"
                className="btn-close"
                aria-label="Close"
                onClick={closeMobileFilter}
              ></button>
            </div>

            {/* Modal 內容 */}
            <div className="modal-body flex-grow-1 overflow-auto p-0">
              {/* 移動版導航選單 */}
              <div className="mobile-sub-nav">
                <div className="mobile-sub-nav-links">
                  <a href="#" className="mobile-sub-nav-link"
                    onClick={(e) => {
                      e.preventDefault();
                      fetchLatestProducts();
                      closeMobileFilter();
                    }}>
                    最新商品
                  </a>

                  <a href="#" className="mobile-sub-nav-link"
                    onClick={(e) => {
                      e.preventDefault();
                      fetchHotProducts();
                      closeMobileFilter();
                    }}>
                    熱賣
                  </a>

                  {/* 客廳分類 */}
                  <div className="mobile-dropdown">
                    <div className="mobile-dropdown-header-wrapper">
                      <a href="#"
                        className="mobile-dropdown-header-link"
                        onClick={(e) => { e.preventDefault(); handleCategoryClick(e, '客廳'); closeMobileFilter(); }}
                      >
                        客廳
                      </a>
                      <i className={`fas fa-chevron-${expandedCategory === '客廳' ? 'up' : 'down'} dropdown-toggle-icon`}
                        onClick={(e) => { e.stopPropagation(); toggleCategoryExpand('客廳'); }}
                      ></i>
                    </div>
                    {expandedCategory === '客廳' && (
                      <div className="mobile-dropdown-items slide-down">
                        <a className="mobile-dropdown-item" href="#" onClick={(e) => { e.preventDefault(); handleCategoryClick(e, '邊桌'); closeMobileFilter(); }}>
                          邊桌
                        </a>
                        <a className="mobile-dropdown-item" href="#" onClick={(e) => { e.preventDefault(); handleCategoryClick(e, '單椅'); closeMobileFilter(); }}>
                          單椅/單人沙發
                        </a>
                        <a className="mobile-dropdown-item" href="#" onClick={(e) => { e.preventDefault(); handleCategoryClick(e, '茶几'); closeMobileFilter(); }}>
                          茶几
                        </a>
                        <a className="mobile-dropdown-item" href="#" onClick={(e) => { e.preventDefault(); handleCategoryClick(e, '書櫃'); closeMobileFilter(); }}>
                          書櫃 / 書架
                        </a>
                        <a className="mobile-dropdown-item" href="#" onClick={(e) => { e.preventDefault(); handleCategoryClick(e, '書桌'); closeMobileFilter(); }}>
                          書桌 / 書桌椅
                        </a>
                        <a className="mobile-dropdown-item" href="#" onClick={(e) => { e.preventDefault(); handleCategoryClick(e, '邊櫃'); closeMobileFilter(); }}>
                          邊櫃 / 收納櫃
                        </a>
                      </div>
                    )}
                  </div>

                  {/* 廚房分類 */}
                  <div className="mobile-dropdown">
                    <div className="mobile-dropdown-header-wrapper">
                      <a href="#"
                        className="mobile-dropdown-header-link"
                        onClick={(e) => { e.preventDefault(); handleCategoryClick(e, '廚房'); closeMobileFilter(); }}
                      >
                        廚房
                      </a>
                      <i className={`fas fa-chevron-${expandedCategory === '廚房' ? 'up' : 'down'} dropdown-toggle-icon`}
                        onClick={(e) => { e.stopPropagation(); toggleCategoryExpand('廚房'); }}
                      ></i>
                    </div>
                    {expandedCategory === '廚房' && (
                      <div className="mobile-dropdown-items slide-down">
                        <a className="mobile-dropdown-item" href="#" onClick={(e) => { e.preventDefault(); handleCategoryClick(e, '實木餐桌'); closeMobileFilter(); }}>
                          實木餐桌
                        </a>
                        <a className="mobile-dropdown-item" href="#" onClick={(e) => { e.preventDefault(); handleCategoryClick(e, '餐椅'); closeMobileFilter(); }}>
                          餐椅 / 椅子
                        </a>
                        <a className="mobile-dropdown-item" href="#" onClick={(e) => { e.preventDefault(); handleCategoryClick(e, '吧台桌'); closeMobileFilter(); }}>
                          吧台桌
                        </a>
                        <a className="mobile-dropdown-item" href="#" onClick={(e) => { e.preventDefault(); handleCategoryClick(e, '吧台椅'); closeMobileFilter(); }}>
                          吧台椅
                        </a>
                      </div>
                    )}
                  </div>

                  {/* 臥室分類 */}
                  <div className="mobile-dropdown">
                    <div className="mobile-dropdown-header-wrapper">
                      <a href="#"
                        className="mobile-dropdown-header-link"
                        onClick={(e) => { e.preventDefault(); handleCategoryClick(e, '臥室'); closeMobileFilter(); }}
                      >
                        臥室
                      </a>
                      <i className={`fas fa-chevron-${expandedCategory === '臥室' ? 'up' : 'down'} dropdown-toggle-icon`}
                        onClick={(e) => { e.stopPropagation(); toggleCategoryExpand('臥室'); }}
                      ></i>
                    </div>
                    {expandedCategory === '臥室' && (
                      <div className="mobile-dropdown-items slide-down">
                        <a className="mobile-dropdown-item" href="#" onClick={(e) => { e.preventDefault(); handleCategoryClick(e, '床架'); closeMobileFilter(); }}>
                          床架
                        </a>
                        <a className="mobile-dropdown-item" href="#" onClick={(e) => { e.preventDefault(); handleCategoryClick(e, '床邊桌'); closeMobileFilter(); }}>
                          床邊桌
                        </a>
                        <a className="mobile-dropdown-item" href="#" onClick={(e) => { e.preventDefault(); handleCategoryClick(e, '化妝台'); closeMobileFilter(); }}>
                          化妝台
                        </a>
                        <a className="mobile-dropdown-item" href="#" onClick={(e) => { e.preventDefault(); handleCategoryClick(e, '全身鏡'); closeMobileFilter(); }}>
                          全身鏡 / 鏡子
                        </a>
                        <a className="mobile-dropdown-item" href="#" onClick={(e) => { e.preventDefault(); handleCategoryClick(e, '衣櫃'); closeMobileFilter(); }}>
                          衣櫃 / 衣架
                        </a>
                      </div>
                    )}
                  </div>

                  {/* 兒童房分類 */}
                  <div className="mobile-dropdown">
                    <div className="mobile-dropdown-header-wrapper">
                      <a href="#"
                        className="mobile-dropdown-header-link"
                        onClick={(e) => { e.preventDefault(); handleCategoryClick(e, '兒童房'); closeMobileFilter(); }}
                      >
                        兒童房
                      </a>
                      <i className={`fas fa-chevron-${expandedCategory === '兒童房' ? 'up' : 'down'} dropdown-toggle-icon`}
                        onClick={(e) => { e.stopPropagation(); toggleCategoryExpand('兒童房'); }}
                      ></i>
                    </div>
                    {expandedCategory === '兒童房' && (
                      <div className="mobile-dropdown-items slide-down">
                        <a className="mobile-dropdown-item" href="#" onClick={(e) => { e.preventDefault(); handleCategoryClick(e, '桌椅組'); closeMobileFilter(); }}>
                          桌椅組
                        </a>
                        <a className="mobile-dropdown-item" href="#" onClick={(e) => { e.preventDefault(); handleCategoryClick(e, '衣櫃'); closeMobileFilter(); }}>
                          衣櫃
                        </a>
                        <a className="mobile-dropdown-item" href="#" onClick={(e) => { e.preventDefault(); handleCategoryClick(e, '收納櫃'); closeMobileFilter(); }}>
                          收納櫃
                        </a>
                      </div>
                    )}
                  </div>

                  {/* 收納用品分類 */}
                  <div className="mobile-dropdown">
                    <div className="mobile-dropdown-header-wrapper">
                      <a href="#"
                        className="mobile-dropdown-header-link"
                        onClick={(e) => { e.preventDefault(); handleCategoryClick(e, '收納用品'); closeMobileFilter(); }}
                      >
                        收納用品
                      </a>
                      <i className={`fas fa-chevron-${expandedCategory === '收納用品' ? 'up' : 'down'} dropdown-toggle-icon`}
                        onClick={(e) => { e.stopPropagation(); toggleCategoryExpand('收納用品'); }}
                      ></i>
                    </div>
                    {expandedCategory === '收納用品' && (
                      <div className="mobile-dropdown-items slide-down">
                        <a className="mobile-dropdown-item" href="#" onClick={(e) => { e.preventDefault(); handleCategoryClick(e, '收納盒'); closeMobileFilter(); }}>
                          收納盒 / 收納箱
                        </a>
                      </div>
                    )}
                  </div>

                  <a href="#" className="mobile-sub-nav-link">
                    It's Oakly
                  </a>
                </div>
              </div>
              {/* 價格 */}
              <div className="filter-section">
                <h6 className="filter-title">價格</h6>
                <div className="px-3 py-2">
                  <input
                    type="range"
                    className="form-range"
                    min="0"
                    max="30000"
                    step="100"
                    value={tempPriceRange.max}
                    onChange={(e) =>
                      setTempPriceRange({
                        min: 0,
                        max: parseInt(e.target.value),
                      })
                    }
                  />
                  <div className="text-center text-muted small">
                    NT$ 0 - NT$ {tempPriceRange.max.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* 顏色 */}
              <div className="filter-section">
                <h6 className="filter-title">顏色</h6>
                <div className="color-grid px-3 py-2">
                  {colorOptions.map((color) => (
                    <div
                      key={color.value}
                      className={`color-option ${
                        tempFilters?.colors?.includes(color.value)
                          ? "selected"
                          : ""
                      }`}
                      style={{ backgroundColor: color.color }}
                      onClick={() => handleColorFilter(color.value)}
                      title={color.name}
                    ></div>
                  ))}
                </div>
              </div>

              {/* 材質 */}
              <div className="filter-section">
                <h6 className="filter-title">材質</h6>
                <div className="px-3 py-2">
                  {materialOptions.map((material) => (
                    <div key={material} className="form-check mb-2">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id={`material-${material}`}
                        checked={
                          tempFilters?.materials?.includes(material) || false
                        }
                        onChange={(e) =>
                          handleFilterChange(
                            "materials",
                            material,
                            e.target.checked
                          )
                        }
                      />
                      <label
                        className="form-check-label"
                        htmlFor={`material-${material}`}
                      >
                        {material}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* 系列 */}
              <div className="filter-section">
                <h6 className="filter-title">系列</h6>
                <div className="px-3 py-2">
                  {seriesOptions.map((series) => (
                    <div key={series} className="form-check mb-2">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id={`series-${series}`}
                        checked={tempFilters?.series?.includes(series) || false}
                        onChange={(e) =>
                          handleFilterChange("series", series, e.target.checked)
                        }
                      />
                      <label
                        className="form-check-label"
                        htmlFor={`series-${series}`}
                      >
                        {series}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal 底部 */}
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleMobileFilterApply}
                style={{ backgroundColor: "#719A8B", borderColor: "#719A8B" }}
              >
                套用篩選
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={handleMobileFilterReset}
              >
                清除
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal 背景遮罩 */}
      {isMobileFilterOpen && <div className="modal-backdrop fade show"></div>}
      {/* 收藏成功通知 */}
      <AddToWishlistSuccessModal
        product={wishlistSuccessModal.product}
        quantity={wishlistSuccessModal.quantity}
        selectedColor={wishlistSuccessModal.selectedColor}
        selectedSize={wishlistSuccessModal.selectedSize}
        isVisible={wishlistSuccessModal.isVisible}
        onClose={closeWishlistSuccessModal}
      />

      <WebSocketCustomerService />


    </div>
  );
};

export default MainProduct;
