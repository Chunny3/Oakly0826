"use client";

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import "@/styles/products/BackToTop.css";

const BackToTop = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isSolid, setIsSolid] = useState(false);
  const pathname = usePathname();

  // 如果在 review 頁面，直接不渲染
  if (pathname === '/review') {
    return null;
  }

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      setIsVisible(scrollTop > 1200);
      
      // 接近底部時變成實心（距離底部 100px 以內）
      const isNearBottom = scrollTop + windowHeight >= documentHeight - 100;
      setIsSolid(isNearBottom);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <div className={`back-to-top ${isVisible ? 'show' : ''} ${isSolid ? 'solid' : ''}`}>
      <button
        type="button"
        className="back-to-top-button"
        onClick={scrollToTop}
        aria-label="回到頂部"
      >
        <span className="arrow">▲</span>
      </button>
    </div>
  );
};

export default BackToTop;