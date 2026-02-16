"use client";

import "@/styles/article/phoneMoreArticle.css"

export default function PhoneMoreArticle() {
  return (
    <>
      <div className="more-article-title">
        <p>更多文章</p>
      </div>
      <div className="more-article">
        <div className="more-article card">
          <div className="card-category-phone">
            <p>家居設計</p>
          </div>
          <h6>如何挑選一張理想的沙發？設計、材質與舒適度全面解析</h6>
        </div>
        <img src="/img/living-room.jpg" alt="name" />
      </div>
    </>
  );
}
