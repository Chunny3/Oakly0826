import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const RandomShowcaseSection = () => {
  const router = useRouter();
  const [selectedItems, setSelectedItems] = useState([]);

  // 所有可用的展示內容
  const allShowcaseItems = [
    {
      id: 1,
      backgroundImage: "/img/lan/living-room-1.jpg",
      title: "1972經典重現，BÄGGBODA 得來不費一番功夫",
      subtitle: "強調歷史制造與設計價值。",
      link: "/collections/classic-1972",
      fallbackImage: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80"
    },
    {
      id: 2,
      backgroundImage: "/img/lan/kitchen-1.jpg", 
      title: "簡潔純練，流露復古時尚",
      subtitle: "簡單一句即可呼應 Bauhaus 與北歐風格。",
      link: "/collections/vintage-style",
      fallbackImage: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80"
    },
    {
      id: 3,
      backgroundImage: "/img/lan/workspace-1.jpg",
      title: "中世紀經典，再造你的生活角落",
      subtitle: "突顯復刻身分與居家情境。",
      link: "/collections/mid-century",
      fallbackImage: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80"
    },
    {
      id: 4,
      backgroundImage: "/img/lan/bedroom-1.jpg",
      title: "北歐簡約，打造寧靜睡眠空間",
      subtitle: "舒適與美感的完美平衡。",
      link: "/collections/bedroom-nordic",
      fallbackImage: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800&q=80"
    },
    {
      id: 5,
      backgroundImage: "/img/lan/dining-1.jpg",
      title: "餐廳系列，享受美好用餐時光",
      subtitle: "凝聚家人情感的溫馨空間。",
      link: "/collections/dining-room",
      fallbackImage: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&q=80"
    },
    {
      id: 6,
      backgroundImage: "/img/lan/storage-1.jpg",
      title: "收納美學，讓生活井然有序",
      subtitle: "實用與美觀並重的收納解決方案。",
      link: "/collections/storage-solutions",
      fallbackImage: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80"
    },
    {
      id: 7,
      backgroundImage: "/img/lan/office-1.jpg",
      title: "居家辦公，提升工作效率",
      subtitle: "創造專業舒適的工作環境。",
      link: "/collections/home-office",
      fallbackImage: "https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?w=800&q=80"
    },
    {
      id: 8,
      backgroundImage: "/img/lan/outdoor-1.jpg",
      title: "戶外系列，延伸生活美學",
      subtitle: "讓室內設計理念延續到戶外空間。",
      link: "/collections/outdoor-furniture",
      fallbackImage: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80"
    },
    {
      id: 9,
      backgroundImage: "/img/lan/kids-1.jpg",
      title: "兒童系列，陪伴快樂成長",
      subtitle: "安全舒適的兒童家具設計。",
      link: "/collections/kids-furniture",
      fallbackImage: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800&q=80"
    },
    {
      id: 10,
      backgroundImage: "/img/lan/lighting-1.jpg",
      title: "燈飾系列，營造完美氛圍",
      subtitle: "用光影創造溫馨居家感受。",
      link: "/collections/lighting",
      fallbackImage: "https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?w=800&q=80"
    },
    {
      id: 11,
      backgroundImage: "/img/lan/minimalist-1.jpg",
      title: "極簡主義，少即是多的生活哲學",
      subtitle: "回歸生活本質的設計美學。",
      link: "/collections/minimalist",
      fallbackImage: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80"
    },
    {
      id: 12,
      backgroundImage: "/img/lan/luxury-1.jpg",
      title: "奢華系列，彰顯品味格調",
      subtitle: "精工細作的高端家具體驗。",
      link: "/collections/luxury",
      fallbackImage: "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800&q=80"
    }
  ];

  // 隨機選擇3個項目
  useEffect(() => {
    const getRandomItems = () => {
      const shuffled = [...allShowcaseItems].sort(() => 0.5 - Math.random());
      return shuffled.slice(0, 3);
    };

    setSelectedItems(getRandomItems());
  }, []); // 每次組件載入時重新隨機選擇

  const handleCardClick = (link) => {
    router.push(link);
  };

  const handleImageError = (e, fallbackUrl) => {
    e.target.src = fallbackUrl;
  };

  // 重新隨機選擇的函數（可選功能）
  const refreshShowcase = () => {
    const shuffled = [...allShowcaseItems].sort(() => 0.5 - Math.random());
    setSelectedItems(shuffled.slice(0, 3));
  };

  if (selectedItems.length === 0) {
    return (
      <section className="content-showcase-section">
        <div className="showcase-container">
          {[1, 2, 3].map((index) => (
            <div key={index} className="showcase-card loading">
              <div className="card-skeleton">
                <div className="skeleton-background"></div>
                <div className="skeleton-content">
                  <div className="skeleton-title"></div>
                  <div className="skeleton-subtitle"></div>
                  <div className="skeleton-button"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="content-showcase-section">
    

      <div className="showcase-container">
        {selectedItems.map((item, index) => (
          <div 
            key={`${item.id}-${index}`}
            className="showcase-card"
            onClick={() => handleCardClick(item.link)}
          >
            <div className="card-background">
              <img
                src={item.backgroundImage}
                alt={item.title}
                className="background-image"
                onError={(e) => handleImageError(e, item.fallbackImage)}
              />
              <div className="card-overlay"></div>
            </div>
            
            <div className="card-content">
              <div className="text-content">
                <h3 className="card-title">{item.title}</h3>
                <p className="card-subtitle">{item.subtitle}</p>
              </div>
              
              <button 
                className="browse-more-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCardClick(item.link);
                }}
              >
                瀏覽更多
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default RandomShowcaseSection;