"use client";

import { createContext, useContext } from "react";

const ArticleContext = createContext(null);
ArticleContext.displayName = "ArticleContext";

export function ArticleProvider({children}){
    
    
    return(
        <ArticleContext.Provider value={{}}>
            {children}
        </ArticleContext.Provider>
    )
}

export const useArticle =() => useContext(ArticleContext);