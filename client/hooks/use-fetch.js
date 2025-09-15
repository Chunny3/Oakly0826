import { useState, useEffect, useMemo } from 'react'

export function useFetch(url, options) {
  // 記錄與伺服器fet後得到的資料
  // url:我要連接的網址(要發出請求的url)
  // options:用來設定 HTTP 請求的詳細配置，包括請求方法、標頭、請求體等
  
  const [data, setData] = useState(null)
  // 載入指示狀態(布林)，true代表載入中
  const [loading, setLoading] = useState(true)
  // 記錄錯誤/例外物件
  const [error, setError] = useState(null)

    // 9/12新增 穩定化 options 的引用
  const stableOptions = useMemo(() => options, [
    options?.method,
    JSON.stringify(options?.headers),
    options?.body
  ])


  useEffect(() => {
    // 9/12新增
        if (!url) {
      setLoading(false)
      return
    }

    // 與伺服器進行fetch的異步函式
    async function fetchData() {
      try {
        const res = await fetch(url, options)
        const json = await res.json()
        setData(json)
        setLoading(false) // 停止載入
      } catch (err) {
        setError(err)
        setLoading(false)
      }
    }
    // fetch函式呼叫執行
    fetchData()
  }, [url, stableOptions])

  return { data, loading, error }
}
