"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import "@/styles/products/search.css";
import { useCart } from '@/hooks/use-cart';


export default function SearchResultsPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q');
  const page = parseInt(searchParams.get('page') || '1');

  //產品頁面的狀態
  const [selectedFilters, setSelectedFilters] = useState({
    colors: [],
    materials: [],
    series: []
  });
  const [sortBy, setSortBy] = useState("default");
  const [viewMode, setViewMode] = useState("grid");
  const [products, setProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(page);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [filterPriceRange, setFilterPriceRange] = useState({ min: 0, max: 50000 });
  const [tempFilters, setTempFilters] = useState({
    colors: [],
    materials: [],
    series: []
  });
  const [tempPriceRange, setTempPriceRange] = useState({ min: 0, max: 50000 });
  const [loading, setLoading] = useState(true);
  const [totalResults, setTotalResults] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState({});
  const [showWishlistModal, setShowWishlistModal] = useState(false);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [wishlistQuantity, setWishlistQuantity] = useState(1);
  const [currentWishlistProduct, setCurrentWishlistProduct] = useState(null);
  const { addToCart, openSuccessModal } = useCart();
  const [showCartModal, setShowCartModal] = useState(false);
  const [currentCartProduct, setCurrentCartProduct] = useState(null);
  const [cartQuantity, setCartQuantity] = useState(1);

  // 手機版相關狀態
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [showMobileSortDropdown, setShowMobileSortDropdown] = useState(false);

  // 手機版功能函數
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showMobileSortDropdown && !event.target.closest('.sort')) {
        setShowMobileSortDropdown(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showMobileSortDropdown]);

  const toggleMobileFilter = () => {
    setIsMobileFilterOpen(!isMobileFilterOpen);
    if (!isMobileFilterOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
  };

  const closeMobileFilter = () => {
    setIsMobileFilterOpen(false);
    document.body.classList.remove('modal-open');
  };

  const handleMobileFilterApply = () => {
    applyFilters();
    closeMobileFilter();
  };

  const handleMobileFilterReset = () => {
    clearFilters();
    closeMobileFilter();
  };

  // 原有功能保持不變
  const handleWishlistToggle = async (product, e) => {
    e.stopPropagation();
    e.preventDefault();

    if (isWishlisted[product.id]) {
      await removeFromWishlist(product.id);
    } else {
      openWishlistModal(product);
    }
  };

  const openWishlistModal = async (product) => {
    setCurrentWishlistProduct(product);
    setSelectedColor(product.colors?.[0] || null);
    setSelectedSize(product.sizes?.[0] || null);
    setWishlistQuantity(1);
    setShowWishlistModal(true);
    document.body.classList.add('no-scroll');

    if (!product.colors || !product.sizes) {
      try {
        const response = await fetch(`http://localhost:3005/api/products/${product.id}`);
        const result = await response.json();
        if (result.status === 'success') {
          setCurrentWishlistProduct(result.data);
          setSelectedColor(result.data.colors?.[0] || null);
          setSelectedSize(result.data.sizes?.[0] || null);
        }
      } catch (err) {
        console.error('獲取商品詳細資料失敗:', err);
      }
    }
  };

  const removeFromWishlist = async (productId) => {
    try {
      const userId = localStorage.getItem('userId') || 1;
      const response = await fetch(`http://localhost:3005/api/wishlist/${userId}/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const result = await response.json();
      if (result.status === 'success') {
        setIsWishlisted(prev => ({
          ...prev,
          [productId]: false
        }));
      }
    } catch (err) {
      console.error('移除收藏失敗:', err);
    }
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
    document.body.classList.add('no-scroll');

    if (!product.colors || !product.sizes) {
      try {
        const response = await fetch(`http://localhost:3005/api/products/${product.id}`);
        const result = await response.json();
        if (result.status === 'success') {
          setCurrentCartProduct(result.data);
          setSelectedColor(result.data.colors?.[0] || null);
          setSelectedSize(result.data.sizes?.[0] || null);
        }
      } catch (err) {
        console.error('獲取商品詳細資料失敗:', err);
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

  const addToWishlist = async () => {
    if (!selectedColor || !selectedSize) {
      alert('請選擇顏色和尺寸');
      return;
    }

    try {
      const userId = localStorage.getItem('userId') || 1;
      const wishlistData = {
        userId: userId,
        productId: currentWishlistProduct.id,
        colorId: selectedColor.id,
        sizeId: selectedSize.id,
        quantity: wishlistQuantity
      };

      const response = await fetch('http://localhost:3005/api/wishlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(wishlistData)
      });

      const result = await response.json();
      if (result.status === 'success') {
        setIsWishlisted(prev => ({
          ...prev,
          [currentWishlistProduct.id]: true
        }));
        setShowWishlistModal(false);
        document.body.classList.remove('no-scroll');

        const notification = document.createElement('div');
        notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #9FA79A;
        color: white;
        padding: 16px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 9999;
        font-size: 14px;
      `;
        notification.textContent = '已加入收藏';
        document.body.appendChild(notification);

        setTimeout(() => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
        }, 3000);
      }
    } catch (err) {
      console.error('加入收藏失敗:', err);
      alert('加入收藏時發生錯誤');
    }
  };

  const getImageUrl = (product) => {
    if (!product || !product.images || product.images.length === 0) {
      return '/img/lan/placeholder.jpg';
    }

    const firstImage = product.images[0];
    if (typeof firstImage === 'string') {
      return `http://localhost:3005${firstImage}`;
    } else if (firstImage && firstImage.url) {
      return `http://localhost:3005${firstImage.url}`;
    }

    return '/img/lan/placeholder.jpeg';
  };

  const getColorCode = (colorName) => {
    const colorMap = {
      '白色': '#ffffff',
      '黑色': '#000000',
      '原木色': '#deb887',
      '淺灰': '#d3d3d3',
      '深灰': '#555555',
      '淺藍': '#add8e6',
      '深藍': '#000080',
      '淺綠': '#90ee90',
      '深綠': '#006400',
      '米黃色': '#f5f5dc'
    };
    return colorMap[colorName] || '#cccccc';
  };

  // 複用產品頁面的選項
  const colorMapping = {
    1: "白色", 2: "黑色", 3: "原木色", 4: "淺灰", 5: "深灰",
    6: "淺藍", 7: "深藍", 8: "淺綠", 9: "深綠", 10: "米黃色"
  };

  const colorOptions = [
    { name: '白色', value: '白色', color: '#FFFFFF' },
    { name: '黑色', value: '黑色', color: '#000000' },
    { name: '原木色', value: '原木色', color: '#DEB887' },
    { name: '淺灰', value: '淺灰', color: '#D3D3D3' },
    { name: '深灰', value: '深灰', color: '#555555' },
    { name: '淺藍', value: '淺藍', color: '#ADD8E6' },
    { name: '深藍', value: '深藍', color: '#62869D' },
    { name: '淺綠', value: '淺綠', color: '#DBE5DE' },
    { name: '深綠', value: '深綠', color: '#6B826B' },
    { name: '米黃色', value: '米黃色', color: '#F5F5DC' }
  ];

  const materialMapping = {
    1: "木質", 2: "金屬", 3: "塑膠", 4: "皮革", 5: "布料",
    6: "玻璃", 7: "大理石", 8: "藤", 9: "亞克力", 10: "竹"
  };

  const materialOptions = [
    "木質", "金屬", "塑膠", "皮革", "布料", "玻璃", "大理石", "藤", "亞克力", "竹"
  ];

  const seriesOptions = [
    "北歐簡約風", "現代極簡風", "工業復古風", "美式鄉村風", "輕奢設計風", "無印自然風"
  ];

  const sortProducts = (products, sortBy) => {
    const sortedProducts = [...products];
    switch (sortBy) {
      case 'price_asc':
        return sortedProducts.sort((a, b) => (a.price || 0) - (b.price || 0));
      case 'price_desc':
        return sortedProducts.sort((a, b) => (b.price || 0) - (a.price || 0));
      case 'created_asc':
        return sortedProducts.sort((a, b) => new Date(a.create_at || 0) - new Date(b.create_at || 0));
      case 'created_desc':
        return sortedProducts.sort((a, b) => new Date(b.create_at || 0) - new Date(a.create_at || 0));
      default:
        return sortedProducts;
    }
  };

  const handleFilterChange = (filterType, value, isChecked) => {
    setTempFilters(prev => {
      const newFilters = { ...prev };
      if (isChecked) {
        if (!newFilters[filterType].includes(value)) {
          newFilters[filterType] = [...newFilters[filterType], value];
        }
      } else {
        newFilters[filterType] = newFilters[filterType].filter(item => item !== value);
      }
      return newFilters;
    });
  };

  const handleColorFilter = (colorValue) => {
    const isSelected = tempFilters.colors.includes(colorValue);
    handleFilterChange('colors', colorValue, !isSelected);
  };

  const applyFilters = () => {
    setSelectedFilters(tempFilters);
    setFilterPriceRange(tempPriceRange);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    const defaultFilters = { colors: [], materials: [], series: [] };
    const defaultPriceRange = { min: 0, max: 50000 };
    setTempFilters(defaultFilters);
    setTempPriceRange(defaultPriceRange);
    setSelectedFilters(defaultFilters);
    setFilterPriceRange(defaultPriceRange);
    setSortBy("default");
    setCurrentPage(1);
  };

  const handleSortChange = (newSortBy) => {
    setSortBy(newSortBy);
    setCurrentPage(1);
  };

  const handleProductClick = (productId) => {
    window.location.href = `/products/${productId}`;
  };

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(parseInt(e.target.value));
    setCurrentPage(1);
  };

  const getFilteredProducts = () => {
    const filtered = products.filter(product => {
      const price = product.price || 0;
      const priceMatch = price >= filterPriceRange.min && price <= filterPriceRange.max;

      const productColor = colorMapping[product.colors];
      const colorMatch = !selectedFilters.colors?.length ||
        selectedFilters.colors.includes(productColor);

      const productMaterial = materialMapping[product.materials_id];
      const materialMatch = !selectedFilters.materials?.length ||
        selectedFilters.materials.includes(productMaterial);

      const seriesMatch = !selectedFilters.series?.length ||
        selectedFilters.series.includes(product.style);

      return priceMatch && colorMatch && materialMatch && seriesMatch;
    });
    return filtered;
  };

  const getCurrentPageProducts = () => {
    const filteredProducts = getFilteredProducts();
    const sortedProducts = sortProducts(filteredProducts, sortBy);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedProducts.slice(startIndex, endIndex);
  };

  const filteredProducts = getFilteredProducts();
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.history.pushState({}, '', `/products/search?q=${encodeURIComponent(query)}&page=${page}`);
      document.querySelector('.products-grid')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  const renderPaginationButtons = () => {
    const buttons = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    buttons.push(
      <button
        key="prev"
        className={`page-btn prev ${currentPage === 1 ? 'disabled' : ''}`}
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <i className="fas fa-chevron-left"></i>
      </button>
    );

    if (startPage > 1) {
      buttons.push(
        <button key={1} className="page-btn" onClick={() => handlePageChange(1)}>1</button>
      );
      if (startPage > 2) {
        buttons.push(<span key="ellipsis1" className="pagination-ellipsis">...</span>);
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          className={`page-btn ${currentPage === i ? 'active' : ''}`}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </button>
      );
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        buttons.push(<span key="ellipsis2" className="pagination-ellipsis">...</span>);
      }
      buttons.push(
        <button key={totalPages} className="page-btn" onClick={() => handlePageChange(totalPages)}>
          {totalPages}
        </button>
      );
    }

    buttons.push(
      <button
        key="next"
        className={`page-btn next ${currentPage === totalPages ? 'disabled' : ''}`}
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        <i className="fas fa-chevron-right"></i>
      </button>
    );

    return buttons;
  };

  // 搜尋API調用
  useEffect(() => {
    if (query) {
      setLoading(true);
      fetch(`http://localhost:3005/api/products/search?q=${encodeURIComponent(query)}&limit=1000`)
        .then((res) => res.json())
        .then((data) => {
          if (data.status === 'success') {
            const productsWithImages = data.data;
            setProducts(productsWithImages);
            setTotalResults(data.pagination?.total || productsWithImages.length);
          } else {
            setProducts([]);
            setTotalResults(0);
          }
        })
        .catch((err) => {
          console.error("搜尋 API 請求錯誤：", err);
          setProducts([]);
          setTotalResults(0);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [query]);

  const currentProducts = getCurrentPageProducts();

  if (loading) {
    return (
      <div className="main-product-page">
        <div className="loading-container" style={{ textAlign: 'center', padding: '100px 0' }}>
          <div>搜尋中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="main-product-page">
      {/* 子導航欄 */}
      <div className="breadcrumb-nav-top">
        <div className="sub-nav-content">
          <div className="breadcrumb">
            <Link href="/">首頁</Link>
            <div className="arrow">&gt;</div>
            <Link href="/products">商品列表</Link>
            <div className="arrow">&gt;</div>
            搜尋結果
          </div>
        </div>
      </div>

      <div className="alls">
        <div className="all-0">搜尋結果 "{query}"</div>
        <div className="all-1">找到 {totalResults} 個相關產品</div>
        <div className="all-2">
          為您精選符合「{query}」的優質家具，每一件都經過精心挑選，
          只為帶來溫潤木質與極簡設計的完美結合。
        </div>
      </div>

      {/* Hero 區域 */}
      {/* <section className="hero">
        <img src="/img/lan/header.png" alt="hero" style={{ filter: 'brightness(0.7)' }} />
        <div className="hero-content">
          <h1 className="hero-title">搜尋結果</h1>
        </div>
      </section> */}

      <div className="sub-nav">
        <div className="sub-nav-links">
          <Link href="/products?type=latest" className="sub-nav-link">最新商品</Link>
          <Link href="/products?type=hot" className="sub-nav-link">熱賣</Link>
          <div className="dropdown hover-dropdown">
            <div className="sub-nav-link dropdown-toggle" aria-expanded="false">
              空間<i className="fas fa-chevron-down fa-sm"></i>
            </div>
            <div className="dropdown-menu dropdown-megamenu">
              <div className="megamenu-column">
                <Link href="/products?category=客廳" className="dropdown-header">客廳</Link>
                <Link className="dropdown-item" href="/products?subcategory=邊桌">邊桌</Link>
                <Link className="dropdown-item" href="/products?subcategory=單椅">單椅/單人沙發</Link>
                <Link className="dropdown-item" href="/products?subcategory=茶几">茶几</Link>
                <Link className="dropdown-item" href="/products?subcategory=書櫃">書櫃 / 書架</Link>
                <Link className="dropdown-item" href="/products?subcategory=書桌">書桌 / 書桌椅</Link>
                <Link className="dropdown-item" href="/products?subcategory=邊櫃">邊櫃 / 收納櫃</Link>
              </div>
              <div className="megamenu-column">
                <Link href="/products?category=廚房" className="dropdown-header">廚房</Link>
                <Link className="dropdown-item" href="/products?subcategory=實木餐桌">實木餐桌</Link>
                <Link className="dropdown-item" href="/products?subcategory=餐椅">餐椅 / 椅子</Link>
                <Link className="dropdown-item" href="/products?subcategory=吧台桌">吧台桌</Link>
                <Link className="dropdown-item" href="/products?subcategory=吧台椅">吧台椅</Link>
              </div>
              <div className="megamenu-column">
                <Link href="/products?category=臥室" className="dropdown-header">臥室</Link>
                <Link className="dropdown-item" href="/products?subcategory=床架">床架</Link>
                <Link className="dropdown-item" href="/products?subcategory=床邊桌">床邊桌</Link>
                <Link className="dropdown-item" href="/products?subcategory=化妝台">化妝台</Link>
                <Link className="dropdown-item" href="/products?subcategory=全身鏡">全身鏡 / 鏡子</Link>
                <Link className="dropdown-item" href="/products?subcategory=衣櫃">衣櫃 / 衣架</Link>
              </div>
              <div className="megamenu-column">
                <Link href="/products?category=兒童房" className="dropdown-header">兒童房</Link>
                <Link className="dropdown-item" href="/products?subcategory=桌椅組">桌椅組</Link>
                <Link className="dropdown-item" href="/products?subcategory=衣櫃">衣櫃</Link>
                <Link className="dropdown-item" href="/products?subcategory=床架">床架</Link>
                <Link className="dropdown-item" href="/products?subcategory=收納櫃">收納櫃</Link>
              </div>
              <div className="megamenu-column">
                <Link href="/products?category=收納用品" className="dropdown-header">收納用品</Link>
                <Link className="dropdown-item" href="/products?subcategory=收納盒">收納盒 / 收納箱</Link>
              </div>
            </div>
          </div>
          <Link href="#" className="sub-nav-link">It's Oakly</Link>
        </div>
      </div>

      {/* 子導航欄 */}
      <div className="breadcrumb-nav">
        <div className="sub-nav-content">
          <div className="breadcrumb">
            <Link href="/">首頁</Link>
            <div className="arrow">&gt;</div>
            <Link href="/products">商品列表</Link>
            <div className="arrow">&gt;</div>
            搜尋結果
          </div>
        </div>
      </div>

      {/* 主要內容區域 */}
      <div className="content">
        <div className="mid-sec">
          <div className="filter" onClick={toggleMobileFilter}>
            <svg width="11" height="10" viewBox="0 0 11 10" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10.0308 0H0.969295C0.552928 0 0.34283 0.505195 0.637849 0.800215L4.25 4.41291V8.4375C4.25 8.59045 4.32463 8.73379 4.44994 8.82152L6.01244 9.91488C6.3207 10.1307 6.75 9.91197 6.75 9.53086V4.41291L10.3622 0.800215C10.6567 0.505781 10.448 0 10.0308 0Z" fill="#8B8B8B" />
            </svg>
            篩選
          </div>
          <div className="sort" onClick={() => setShowMobileSortDropdown(!showMobileSortDropdown)}>
            排列方式
            <svg width="7" height="4" viewBox="0 0 7 4" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ transform: showMobileSortDropdown ? 'rotate(180deg)' : 'rotate(0deg)' }}>
              <path d="M3.77203 3.89391L6.88731 0.960529C7.03756 0.819055 7.03756 0.58969 6.88731 0.448232L6.52397 0.106102C6.37398 -0.0351305 6.13088 -0.0354021 5.98054 0.105498L3.49999 2.43025L1.01946 0.105498C0.869116 -0.0354021 0.626024 -0.0351305 0.476033 0.106102L0.112686 0.448232C-0.0375618 0.589705 -0.0375618 0.81907 0.112686 0.960529L3.22797 3.89389C3.3782 4.03537 3.62179 4.03537 3.77203 3.89391Z" fill="#8B8B8B" />
            </svg>

            {/* 手機版排序下拉菜單 */}
            {showMobileSortDropdown && (
              <div className="mobile-sort-dropdown">
                <div className="mobile-sort-option" onClick={(e) => { e.stopPropagation(); setSortBy('default'); setShowMobileSortDropdown(false); }}>
                  預設排序
                </div>
                <div className="mobile-sort-option" onClick={(e) => { e.stopPropagation(); setSortBy('price_asc'); setShowMobileSortDropdown(false); }}>
                  售價 (由低到高)
                </div>
                <div className="mobile-sort-option" onClick={(e) => { e.stopPropagation(); setSortBy('price_desc'); setShowMobileSortDropdown(false); }}>
                  售價 (由高到低)
                </div>
                <div className="mobile-sort-option" onClick={(e) => { e.stopPropagation(); setSortBy('created_asc'); setShowMobileSortDropdown(false); }}>
                  上架時間 (由低到高)
                </div>
                <div className="mobile-sort-option" onClick={(e) => { e.stopPropagation(); setSortBy('created_desc'); setShowMobileSortDropdown(false); }}>
                  上架時間 (由高到低)
                </div>
              </div>
            )}
          </div>
          <div className="per-page-select">
            <select className="per-page-selection" value={itemsPerPage} onChange={handleItemsPerPageChange}>
              <option value={12}>每頁顯示 12 個</option>
              <option value={24}>每頁顯示 24 個</option>
              <option value={48}>每頁顯示 48 個</option>
            </select>
          </div>
        </div>

        <div className="products-container">
          <div className="wrapper">
            {/* 左側邊欄 - 完全複用產品頁面 */}
            <aside className="sidebar">
              <div className="filter-sections">
                <div className="filter-section">
                  <h3 className="filter-title">篩選</h3>
                  <div className="filter-options">
                    <div className={`filter-option ${sortBy === 'price_asc' ? 'active' : ''}`} onClick={() => handleSortChange('price_asc')}>
                      售價 (由低到高)
                    </div>
                    <div className={`filter-option ${sortBy === 'price_desc' ? 'active' : ''}`} onClick={() => handleSortChange('price_desc')}>
                      售價 (由高到低)
                    </div>
                    <div className={`filter-option ${sortBy === 'created_asc' ? 'active' : ''}`} onClick={() => handleSortChange('created_asc')}>
                      上架時間 (由低到高)
                    </div>
                    <div className={`filter-option ${sortBy === 'created_desc' ? 'active' : ''}`} onClick={() => handleSortChange('created_desc')}>
                      上架時間 (由高到低)
                    </div>
                  </div>
                </div>

                <div className="filter-section">
                  <h3 className="filter-title">價格</h3>
                  <div className="price-range">
                    <div className="price-slider">
                      <input
                        type="range"
                        min="0"
                        max="50000"
                        step="1000"
                        value={tempPriceRange.max}
                        onChange={(e) => {
                          const newMax = parseInt(e.target.value);
                          setTempPriceRange({ min: 0, max: newMax });
                        }}
                      />
                    </div>
                    <span>NT$ 0 - NT$ {tempPriceRange.max.toLocaleString()}</span>
                  </div>
                </div>

                <div className="filter-section">
                  <h3 className="filter-title">顏色</h3>
                  <div className="color-options">
                    {colorOptions.map((color) => (
                      <div
                        key={color.value}
                        className={`color-option ${tempFilters?.colors?.includes(color.value) ? 'selected' : ''}`}
                        style={{ backgroundColor: color.color }}
                        onClick={() => handleColorFilter(color.value)}
                        title={color.name}
                      ></div>
                    ))}
                  </div>
                </div>

                <div className="filter-section">
                  <h3 className="filter-title">材質</h3>
                  <div className="filter-options">
                    {materialOptions.map((material) => (
                      <div key={material} className="option">
                        <input
                          type="checkbox"
                          checked={tempFilters?.materials?.includes(material) || false}
                          onChange={(e) => handleFilterChange('materials', material, e.target.checked)}
                        />
                        <span>{material}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="filter-section">
                  <h3 className="filter-title">系列</h3>
                  <div className="filter-options">
                    {seriesOptions.map((series) => (
                      <div key={series} className="option">
                        <input
                          type="checkbox"
                          checked={tempFilters?.series?.includes(series) || false}
                          onChange={(e) => handleFilterChange('series', series, e.target.checked)}
                        />
                        <span>{series}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="filter-buttons">
                <button className="filter-btn" onClick={applyFilters}>
                  <img src="../img/lan/filter2.svg" alt="filter" />套用篩選
                </button>
                <button className="reset-btn" onClick={clearFilters}>清除</button>
              </div>
            </aside>

            {/* 右側商品區域 - 完全複用產品頁面 */}
            <main className="products-section">
              <div className="per-page-select">
                <select className="per-page-selection" value={itemsPerPage} onChange={handleItemsPerPageChange}>
                  <option value={12}>每頁顯示 12 個</option>
                  <option value={24}>每頁顯示 24 個</option>
                  <option value={48}>每頁顯示 48 個</option>
                </select>
              </div>

              <div className="view-toggle-container">
                <div className="view-toggle-title">"{query}"搜尋結果
           </div>
              
                <div className="view-toggle">
                  <button className={`view-btn ${viewMode === "grid" ? "active" : ""}`} onClick={() => setViewMode("grid")}>
                    <img src="../img/lan/menu.png" alt="grid" />
                  </button>
                  <button className={`view-btn ${viewMode === "list" ? "active" : ""}`} onClick={() => setViewMode("list")}>
                    <img src="../img/lan/lines.png" alt="list" />
                  </button>
                </div>
              </div>
              <div className="find">找到 {totalResults} 個相關產品</div>

              {/* 商品網格 - 完全複用產品頁面 */}
              {currentProducts.length > 0 ? (
                <div className={`products-grid ${viewMode}`} key={viewMode}>
                  {currentProducts.map((product, index) => (
                    <div key={product.id}
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
                              console.log('圖片載入失敗:', e.target.src);
                              e.target.src = '/img/lan/placeholder.jpeg';
                            }}
                          />
                        ) : (
                          <div className="no-image-placeholder">
                            <span>暫無圖片</span>
                          </div>
                        )}
                      </div>
                      <div className="info">
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
                        className={`wishlist-heart-btn ${isWishlisted[product.id] ? 'active' : ''}`}
                        onClick={(e) => {
                          handleWishlistToggle(product, e);
                        }}
                      >
                        <i className={`fa-${isWishlisted[product.id] ? 'solid' : 'regular'} fa-heart`}></i>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="nosearchfit">
                  <h3>抱歉，搜尋不到「{query}」的商品</h3>
                  <p>請嘗試調整篩選條件或搜尋其他關鍵字</p>
                  <Link href="/products" style={{ color: '#DBA783', textDecoration: 'none', fontSize: '14px' }}>
                    瀏覽所有產品
                  </Link>
                </div>
              )}

              <div className="page-info">
                顯示 {Math.min((currentPage - 1) * itemsPerPage + 1, filteredProducts.length)} - {Math.min(currentPage * itemsPerPage, filteredProducts.length)} 項，共 {filteredProducts.length} 項
              </div>

              {/* 分頁 - 完全複用產品頁面 */}
              {totalPages > 1 && (
                <div className="pagination">
                  {renderPaginationButtons()}
                </div>
              )}

              {/* 收藏選擇彈窗 */}
              {showWishlistModal && (
                <>
                  <div
                    className="wishlist-modal-backdrop"
                    onClick={() => {
                      setShowWishlistModal(false);
                      document.body.classList.remove('no-scroll');
                    }}
                  ></div>

                  <div className="wishlist-modal-container">
                    <div className="wishlist-modal-content">
                      <button
                        className="wishlist-modal-close"
                        onClick={() => {
                          setShowWishlistModal(false);
                          document.body.classList.remove('no-scroll');
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
                            alt={currentWishlistProduct?.name || ''}
                            onError={(e) => {
                              console.log('彈窗圖片載入失敗:', e.target.src);
                              e.target.src = '/img/lan/placeholder.jpeg';
                            }}
                          />
                        </div>
                        <div className="wishlist-form-content">
                          <h6 className="wishlist-product-name">{currentWishlistProduct?.name}</h6>
                          <p className="wishlist-product-price">NT$ {currentWishlistProduct?.price?.toLocaleString()}</p>

                          {/* 顏色選擇 */}
                          <div className="wishlist-form-group">
                            <label className="wishlist-form-label">選擇顏色</label>
                            <div className="wishlist-options">
                              {Array.isArray(currentWishlistProduct?.colors) && currentWishlistProduct.colors.map((color) => (
                                <div
                                  key={color.id}
                                  onClick={() => setSelectedColor(color)}
                                  className={`wishlist-color-option ${selectedColor?.id === color.id ? 'selected' : ''}`}
                                >
                                  <div
                                    className="wishlist-color-dot"
                                    style={{ backgroundColor: getColorCode(color.color_name) }}
                                  ></div>
                                  <span>{color.color_name}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* 尺寸選擇 */}
                          <div className="wishlist-form-group">
                            <label className="wishlist-form-label">選擇尺寸</label>
                            <div className="wishlist-options">
                              {Array.isArray(currentWishlistProduct?.sizes) && currentWishlistProduct.sizes.map((size) => (
                                <div
                                  key={size.id}
                                  onClick={() => setSelectedSize(size)}
                                  className={`wishlist-size-option ${selectedSize?.id === size.id ? 'selected' : ''}`}
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
                                onClick={() => setWishlistQuantity(Math.max(1, wishlistQuantity - 1))}
                                disabled={wishlistQuantity <= 1}
                                className="wishlist-quantity-btn"
                              >
                                -
                              </button>
                              <span className="wishlist-quantity-display">{wishlistQuantity}</span>
                              <button
                                onClick={() => setWishlistQuantity(wishlistQuantity + 1)}
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
                            src={getImageUrl(currentCartProduct)}
                            alt={currentCartProduct?.name || ''}
                            onError={(e) => {
                              console.log('彈窗圖片載入失敗:', e.target.src);
                              e.target.src = '/img/lan/placeholder.jpeg';
                            }}
                          />
                        </div>
                        <div className="cart-form-content">
                          <h6 className="cart-product-name">{currentCartProduct?.name}</h6>
                          <p className="cart-product-price">NT$ {currentCartProduct?.price?.toLocaleString()}</p>

                          {/* 顏色選擇 */}
                          <div className="cart-form-group">
                            <label className="cart-form-label">選擇顏色</label>
                            <div className="cart-options">
                              {Array.isArray(currentCartProduct?.colors) && currentCartProduct.colors.map((color) => (
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

                          {/* 尺寸選擇 */}
                          <div className="cart-form-group">
                            <label className="cart-form-label">選擇尺寸</label>
                            <div className="cart-options">
                              {Array.isArray(currentCartProduct?.sizes) && currentCartProduct.sizes.map((size) => (
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

                          {/* 數量選擇 */}
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
            </main>
          </div>
        </div>
      </div>

      {/* 手機版 Bootstrap Modal 篩選 */}
      <div className={`modal fade ${isMobileFilterOpen ? 'show' : ''}`}
        style={{ display: isMobileFilterOpen ? 'block' : 'none' }}
        tabIndex="-1"
        aria-labelledby="mobileFilterModalLabel"
        aria-hidden={!isMobileFilterOpen}>

        <div className="modal-dialog modal-dialog-end mobile-filter-modal">
          <div className="modal-content h-100">

            {/* Modal 頭部 */}
            <div className="modal-header">
              <h5 className="modal-title" id="mobileFilterModalLabel">篩選</h5>
              <button
                type="button"
                className="btn-close"
                aria-label="Close"
                onClick={closeMobileFilter}
              ></button>
            </div>

            {/* Modal 內容 */}
            <div className="modal-body flex-grow-1 overflow-auto p-0">

              {/* 價格 */}
              <div className="filter-section">
                <h6 className="filter-title">價格</h6>
                <div className="px-3 py-2">
                  <input
                    type="range"
                    className="form-range"
                    min="0"
                    max="50000"
                    step="1000"
                    value={tempPriceRange.max}
                    onChange={(e) => setTempPriceRange({ min: 0, max: parseInt(e.target.value) })}
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
                      className={`color-option ${tempFilters?.colors?.includes(color.value) ? 'selected' : ''}`}
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
                        checked={tempFilters?.materials?.includes(material) || false}
                        onChange={(e) => handleFilterChange('materials', material, e.target.checked)}
                      />
                      <label className="form-check-label" htmlFor={`material-${material}`}>
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
                        onChange={(e) => handleFilterChange('series', series, e.target.checked)}
                      />
                      <label className="form-check-label" htmlFor={`series-${series}`}>
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
                className="btn btn-outline-secondary"
                onClick={handleMobileFilterReset}
              >
                清除
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleMobileFilterApply}
                style={{ backgroundColor: '#719A8B', borderColor: '#719A8B' }}
              >
                套用篩選
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal 背景遮罩 */}
      {isMobileFilterOpen && <div className="modal-backdrop fade show"></div>}
    </div>
  );
};