"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import "@/styles/header.css";
import UserSidebarPage from "../user/_components/sidebar";
import styles from "../user/_components/sidebar.module.css";

export default function Header() {
  const { user, logout, isLoading } = useAuth();
  const pathname = usePathname();
  // const { cartCount } = useCart();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isInputFocused, setIsInputFocused] = useState(false);

  // if (isLoading) return null; // 或 loading skeleton
  const router = useRouter();

  // const handleLogout = async () => {
  //   const result = await logout();
  //   if (result?.success) {
  //     router.push("/");
  //     router.refresh();
  //   } else {
  //     alert(result?.message || "登出失敗");
  //   }
  // };

  const searchInputRef = useRef(null);

  // 點擊外部關閉搜尋
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target)
      ) {
        setIsSearchOpen(false);
        setIsInputFocused(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 處理搜尋按鈕點擊
  const handleSearchToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsSearchOpen((prev) => !prev);
  };

  // 處理輸入框焦點
  const handleInputFocus = () => {
    setIsInputFocused(true);
  };

  const handleInputBlur = () => {
    setIsInputFocused(false);
  };

  // 處理 Enter 鍵搜尋
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      window.location.href = `/products/search?q=${encodeURIComponent(
        searchQuery
      )}`;
      setIsSearchOpen(false);
      setIsInputFocused(false);
    }
  };

  // 登入/註冊頁，不顯示 header
  // if (
  //   pathname.startsWith("/auth/login") ||
  //   pathname.startsWith("/auth/register")
  // ) {
  //   return null;
  // }

  return (
    <div className="container-fluid header">
      <div className="frame">
        <Link href="/">
          <img src="/img/Oakly-green.svg" alt="Oakly首頁" />
        </Link>

        <div className="menu">
          <Link className="nav-items" href="/products">
            <h6>商品列表</h6>
          </Link>
          <Link className="nav-items" href="/organizer">
            <h6>預約整理師</h6>
          </Link>
          {/* <Link className="nav-items" href="/article">
            <h6>精選文章</h6>
          </Link> */}
          {/* <Link className="nav-items" href="/faq">
            <h6>常見問題</h6>
          </Link> */}
        </div>
      </div>

      <div className="icon-group">
        <Link href="/" alt="">
          <img
            className="phone-leftLogo"
            src="/img/Oakly-green.svg"
            alt="Oakly首頁"
          />
        </Link>
        <div className="side-right">
          <div className="search-container">
            <button onClick={handleSearchToggle} className="search-btn">
              <i className="fa-solid fa-magnifying-glass"></i>
            </button>

            {isSearchOpen && (
              <div className="search-input-container">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                  placeholder="搜尋產品..."
                  className="search-input"
                />
              </div>
            )}
          </div>

          <a href="/cart" className="cart-link">
            <i className="fa-solid fa-cart-shopping"></i>
            {/* {cartCount > 0 && (
                <span className="cart-badge">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )} */}
          </a>
          {user ? (
            <div className="user-log">
              <button>
                <Link href="/user/edit">
                  <i className="fa-solid fa-circle-user"></i>
                </Link>
              </button>
              <button onClick={logout}>
                <h6>登出</h6>
              </button>
            </div>
          ) : (
            <div className="user-log">
              <a href="/auth/register">
                <h6>註冊</h6>
              </a>
              <a href="/auth/login">
                <h6>登入</h6>
              </a>
            </div>
          )}
          <button
            className="menu-toggle"
            type="button"
            data-bs-toggle="offcanvas"
            data-bs-target="#offcanvasScrolling"
            aria-controls="offcanvasScrolling"
          >
            <i className="fa-solid fa-bars"></i>
          </button>

          {/* 手機 ------------------------------ */}
          <div
            className="offcanvas offcanvas-end sidebar"
            tabIndex="-1"
            id="offcanvasScrolling"
            aria-labelledby="offcanvasScrollingLabel"
          >
            <div className="offcanvas-header">
              <div className="offcanvas-title" id="offcanvasScrollingLabel">
                <a href="/">
                  <img
                    className="phoneLogo"
                    src="/img/Oakly-green.svg"
                    alt="Oakly首頁"
                  />
                </a>
              </div>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="offcanvas"
                aria-label="Close"
              ></button>
            </div>

            <div className="offcanvas-body">
              <div className="user-menu">
                {user ? (
                  <div className="auth-user">
                    <div className="user-info">
                      <img
                        src={user.avatar || "/img/default-avatar.png"}
                        alt="頭像"
                        className="avatar"
                      />
                      <h5>{user.name}</h5>
                    </div>
                    <div className={styles.sidebar}>
                      <Link
                        href="/user/edit"
                        className={`${styles.user} ${
                          pathname === "/user/edit" ? styles.active : ""
                        }`}
                      >
                        <i className="fas fa-user"></i>
                        我的資料
                      </Link>

                      <Link
                        href="/user/order"
                        className={`${styles.order} ${
                          pathname === "/user/order" ? styles.active : ""
                        }`}
                      >
                        <i className="fas fa-list-alt"></i>
                        訂單查詢
                      </Link>

                      <Link
                        href="/user/coupon"
                        className={`${styles.coupon} ${
                          pathname === "/user/coupon" ? styles.active : ""
                        }`}
                      >
                        <i className="fas fa-ticket-alt"></i>
                        我的優惠券
                      </Link>

                      <Link
                        href="/user/favorites"
                        className={`${styles.heart} ${
                          pathname === "/user/favorites" ? styles.active : ""
                        }`}
                      >
                        <i className="fas fa-heart"></i>
                        願望清單
                      </Link>

                      <Link
                        href="/user/bookmarks"
                        className={`${styles.bookmark} ${
                          pathname === "/user/bookmarks" ? styles.active : ""
                        }`}
                      >
                        <i className="fas fa-bookmark"></i>
                        收藏文章
                      </Link>
                      <Link
                        href="/user/organizer"
                        className={`${styles.reservation} ${
                          pathname.startsWith("/user/organizer")
                            ? styles.active
                            : ""
                        }`}
                      >
                        <i className="fas fa-calendar-alt"></i>
                        預約紀錄
                      </Link>
                      <button onClick={logout} className="menu-item">
                        <i className="fa-solid fa-right-from-bracket"></i>
                        <p>登出</p>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="auth-menu">
                    <a href="/auth/register" className="menu-item">
                      <i className="fa-solid fa-user-pen"></i>
                      <p>註冊</p>
                    </a>
                    <a href="/auth/login" className="menu-item">
                      <i className="fa-solid fa-circle-user"></i>
                      <p>登入</p>
                    </a>
                  </div>
                )}
                <div className="line"></div>
                <div className="menu-item">
                  <a href="/products">
                    <i className="fa-solid fa-couch"></i>
                    <p>商品列表</p>
                  </a>
                </div>
                <div className="menu-item">
                  <a href="/organizer">
                    <i className="fa-solid fa-pen-to-square"></i>
                    <p>預約整理師</p>
                  </a>
                </div>

                {/* <div className="menu-item">
                  <a href="/article">
                    <span>精選文章</span>
                  </a>
                </div> */}
                {/* <div className="menu-item">
                  <a href="/">
                    <span>常見問題</span>
                  </a>
                </div> */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
