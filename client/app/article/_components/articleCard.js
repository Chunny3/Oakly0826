"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import "@/styles/article/articleIndex.css";

export default function ArticleCard() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 取得文章資料
  const fetchPosts = async () => {
    try {
      const response = await fetch("http://localhost:3005/api/article/all");
      const data = await response.json();
      setPosts(data.data);
    } catch (error) {
      setError("無法載入文章資料");
      console.log(error);
    }
  };

  // 頁面載入時取得資料
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchPosts()]);
    };
    loadData();
  }, []);

  // // 載入中顯示
  // if (loading) {
  //   return (
  //     <div className="flex justify-center items-center min-h-screen">
  //       <div className="text-xl text-gray-600">載入中...</div>
  //     </div>
  //   );
  // }

  // // 錯誤顯示-之後可用掉
  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <>
      {posts.map((post) => (
        <div key={post.id} className="article-row card">
          <Image
            src={post.img || "/img/chunny/gray_pic.png"}
            alt="img"
            width={264}
            height={173}
          />
          <h5>{post.title}</h5>
          <h6 lang="en">{post.published_date}</h6>
          <div className="card-category">
            <h6>{post.category_name}</h6>
          </div>
        </div>
      ))}
      <div className="c-line"></div>
    </>
  );
}
