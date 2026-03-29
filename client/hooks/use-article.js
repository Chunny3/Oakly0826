"use client"

import { createContext, useContext, useState} from "react";

const ArticleFilterContext = createContext();

export default ArticleFilterContext({children}){
    // 原始資料
    const [allArticles, serAllArticles] = useState([]);
    const [filterArticles, setFilterArticles] = useState([]);
    const [loading, setLoading] = useState(false);

    // 篩選條件狀態
    
}