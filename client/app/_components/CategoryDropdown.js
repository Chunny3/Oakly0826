import React from 'react';
import Link from 'next/link';

const CategoryDropdown = () => {
  const categories = {
    '客廳': {
      categoryLink: '/products?category=客廳', 
      items: [
        { name: '邊桌', searchParam: '邊桌' },
        { name: '單椅/單人沙發', searchParam: '單椅' },
        { name: '茶几', searchParam: '茶几' },
        { name: '書櫃 / 書架', searchParam: '書櫃' },
        { name: '書桌 / 書桌椅', searchParam: '書桌' },
        { name: '邊櫃 / 收納櫃', searchParam: '邊櫃' }
      ]
    },
    '廚房': {
      categoryLink: '/products?category=廚房',
      items: [
        { name: '實木餐桌', searchParam: '餐桌' },
        { name: '餐椅 / 椅子', searchParam: '餐椅' },
        { name: '吧台桌', searchParam: '吧台桌' },
        { name: '吧台椅', searchParam: '吧台椅' }
      ]
    },
    '臥室': {
      categoryLink: '/products?category=臥室',
      items: [
        { name: '床架', searchParam: '床架' },
        { name: '床邊桌', searchParam: '床邊桌' },
        { name: '化妝台', searchParam: '化妝台' },
        { name: '全身鏡 / 鏡子', searchParam: '鏡子' },
        { name: '衣櫃 / 衣架', searchParam: '衣櫃' }
      ]
    },
    '兒童房': {
      categoryLink: '/products?category=兒童房',
      items: [
        { name: '桌椅組', searchParam: '桌椅組' },
        { name: '衣櫃', searchParam: '兒童衣櫃' },
        { name: '床架', searchParam: '兒童床架' },
        { name: '收納櫃', searchParam: '兒童收納櫃' }
      ]
    },
    '收納空間': {
      categoryLink: '/products?category=收納空間',
      items: [
        { name: '收納盒 / 收納箱', searchParam: '收納盒' }
      ]
    }
  };

  return (
    <div className="dropdown hover-dropdown">
      <div className="sub-nav-link dropdown-toggle" aria-expanded="false">
        空間<i className="fas fa-chevron-down fa-sm"></i>
      </div>
      <div className="dropdown-menu dropdown-megamenu">
        {Object.entries(categories).map(([roomType, config]) => (
          <div key={roomType} className="megamenu-column">
            {/* 主分類標題 - 點擊用 category_name 篩選 */}
            <Link href={config.categoryLink} className="dropdown-header">
              {roomType}
            </Link>
            
            {/* 子項目 - 點擊用商品名稱搜尋 */}
            {config.items.map((item) => (
              <Link 
                key={item.searchParam} 
                className="dropdown-item" 
                href={`/products/search?q=${encodeURIComponent(item.searchParam)}`}
              >
                {item.name}
              </Link>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategoryDropdown;

