"use client";

import Image from "next/image";
import Link from "next/link";

export default function RecommendArticle() {
  return (
    <>
      <div className="more-articles">
        <div className="more-content">
          <div className="title">更多文章</div>
          <div className="articles">
            <Link href="/" alt="">
              <div className="aCard">
                <Image
                  className="pCardImg"
                  src="/img/living-room.jpg"
                  alt=""
                  width={473}
                  height={421}
                />
                <div className="aCard-detail">
                  <div className="detail-category-phone">居家生活</div>
                  <div className="detail-title">
                    家的靈魂：從家具看見生活的樣子
                  </div>
                  <div className="detail-category">居家生活</div>
                  <h6>2025.07.24</h6>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
