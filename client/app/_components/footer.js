"use client"
import { usePathname } from 'next/navigation';
import React from 'react';
import '@/styles/footer/footer.css';

const Footer = () => {
  const pathname = usePathname();

  // 登入/註冊頁，不顯示 footer
  if (pathname.startsWith('/auth/login') || pathname.startsWith('/auth/register')) {
    return null;
  }

  return (
    <footer className="footer">
     
        <div className="footer-top">
          <div className="footer-logo">
            <h2>Oak!y</h2>
          </div>
          <p className="newsletter-text">訂閱我們的電子報，獲得最新優惠資訊</p>
          <form className="newsletter-form">
            <input type="email" name="email" className="newsletter-input" placeholder="輸入您的信箱" />
            <button type="submit" className="newsletter-btn">訂閱我們</button>
          </form>
        </div>
        
        <div className="footer-middle">
          <div className="footer-column">
            <h4>關於我們</h4>
            <ul>
              <li><a href="#">品牌故事</a></li>
              <li><a href="#">品質標準</a></li>
              <li><a href="#">企業責任</a></li>
            </ul>
          </div>
          <div className="footer-column">
            <h4>客服中心</h4>
            <ul>
              <li><a href="#">聯絡我們</a></li>
              <li><a href="#">常見問題</a></li>
              <li><a href="#">退換貨政策</a></li>
            </ul>
          </div>
          <div className="footer-column">
            <h4>顧客權益</h4>
            <ul>
              <li><a href="#">隱私權政策</a></li>
              <li><a href="#">服務條款</a></li>
              <li><a href="#">購物須知</a></li>
            </ul>
          </div>
        </div>
          <div className="payment-methods">
              <img src="/img/lan/visa.svg" alt="VISA" />
              <img src="/img/lan/jcb.svg" alt="JCB" />
            </div>
        <div className="footer-bottom">
          <div className="footer-left">
            <div className="social-section">
              <div className="follow-us">FOLLOW US</div>
              <div className="social-icons">
                <a href="#" className="social-icon"><i className="fab fa-facebook-f"></i></a>
                <a href="#" className="social-icon"><i className="fab fa-instagram"></i></a>
                <a href="#" className="social-icon"><i className="fab fa-youtube"></i></a>
              </div>
            </div>
          
          </div>
          <div className="copyright">
            ©2025 OAKLY ALL RIGHTS RESERVED
          </div>
        </div>
   
    </footer>
  );
};

export default Footer; 