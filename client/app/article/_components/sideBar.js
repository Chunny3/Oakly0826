"use client"

// import { useArticle } from "@/hooks/use-article";
import { useState } from "react";
import "@/styles/article/sideBar.css";

export default function SideBar() {
    // 搜尋文章處理事件
    const [searchQuery, setSearchQuery] = useState("");

    const handleSearch =()=>{
        if(searchQuery.trim() === ""){
            alert("請輸入搜尋關鍵字");
            return;
        }
        console.log("搜尋關鍵字: ", searchQuery);
        
    }



    return (


        <aside className="sidebar">
            <h5 className="mb-3">搜尋文章</h5>
            <div className="input-group mb-3">
                <input type="text" name="text" className="form-control" placeholder="搜尋" ></input>
                <button className="btn" type="button"> <i className="fa-solid fa-magnifying-glass"></i></button>
            </div>
            <div className="line"></div>

            <h5 className="mb-3">分類</h5>
            <nav className="user-menu">
                <div className="menu-item">
                    <span>推薦風格</span>
                </div>
                <div className="menu-item">
                    <span>有趣小知識</span>
                </div>
                <div className="menu-item">
                    <span>家具保養與使用技巧</span>
                </div>
                <div className="menu-item">
                    <span>家具選購指南</span>
                </div>
                <div className="menu-item">
                    <span>美感生活誌</span>
                </div>
                <div className="line"></div>
                <h5 className="mb-3">日期搜尋</h5>
                <div className="date-button">
                    <button className="btn btn-outline-secondary d-flex align-items-center justify-content-start ps-5">
                        <i className="fa-regular fa-calendar"></i>
                        <span className="ms-5">今天</span>
                    </button>
                </div>
                <div className="line"></div>
                 <div className="menu-item">
                    <span>熱門文章</span>
                </div>
                <div className="menu-item">
                    <span>收藏最多</span>
                </div>
                <div className="menu-item">
                    <span>被分享最多</span>
                </div>
            </nav>
        </aside>
    )
}


