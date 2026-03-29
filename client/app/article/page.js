"use client";

import Image from "next/image";
import "@/styles/article/articleIndex.css";
import Link from "next/link";
import SideBar from "./_components/sideBar";
import ArticleCard from "./_components/articleCard";
import Pagination from "./_components/pagination";
import PhoneMoreArticle from "./_components/phoneMoreArticle";

export default function ArticlePage() {
  return (
    <div className="container-fluid">
      <div className="page">
        <div className="begin">
          <div className="background"></div>
          <div className="hot-article">
            <div className="hot1">
              <h5>居家生活</h5>
              <h2>從設計到情感：家具如何塑造我們的生活空間與內在世界</h2>
              <p>
                在現代人快節奏的生活裡，家具往往被視為一種「功能性配件」——我們用它來吃飯、睡覺、工作、休息。然而，真正了解家具的人都知道，它不只是生活的工具，更是空間的靈魂，是情感的投射，也是文化與品味的延伸。
              </p>
              <button className="readMoreButton">Read more</button>
            </div>
            <div className="hot2">
              <h4>從設計到情感：家具如何塑造我們的生活空間與內在世界</h4>
              <div className="readMoreArrow">
                <Link className="readMore" href="" alt="">
                  Read more
                </Link>
                <i className="fa-solid fa-circle-arrow-right"></i>
              </div>
            </div>
            <div className="hot3">
              <h4>從設計到情感：家具如何塑造我們的生活空間與內在世界</h4>
              <div className="readMoreArrow">
                <Link className="readMore" href="" alt="">
                  Read more
                </Link>
                <i className="fa-solid fa-circle-arrow-right"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="main">
          <div className="main-list">
            {/* sidebar---------- */}
            <SideBar />

            <div className="main-article">
              <div className="phone-title">
                <h4>文章列表</h4>
                <button
                  className="menu-toggle searchArticle"
                  type="button"
                  data-bs-toggle="offcanvas"
                  data-bs-target="#offcanvasScrolling"
                  aria-controls="offcanvasScrolling"
                >
                  <p>搜尋文章</p>
                  <i className="fa-solid fa-magnifying-glass"></i>
                </button>
                <div
                  className="offcanvas offcanvas-end"
                  data-bs-scroll="true"
                  tabIndex="-1"
                  id="offcanvasScrolling"
                  aria-labelledby="offcanvasScrollingLabel"
                >
                  <div className="offcanvas-header">
                    <h5 className="offcanvas-title" id="offcanvasScrollingLabel">
                      搜尋文章
                    </h5>
                    <button
                      type="button"
                      className="btn-close"
                      data-bs-dismiss="offcanvas"
                      aria-label="Close"
                    ></button>
                  </div>
                  <div className="offcanvas-body">
                   <SideBar/>
                  </div>
                </div>
              </div>
              <div className="main-article-title">
                <p>最新文章</p>
              </div>
              <div className="main-article-list">
                {/* 卡片區------- */}
                <ArticleCard />
              </div>
              <div className="phone">
                <PhoneMoreArticle />
              </div>
              {/* 分頁區------- */}
              <Pagination />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
