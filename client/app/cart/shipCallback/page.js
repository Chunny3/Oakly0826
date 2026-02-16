'use client'

import { useShip711StoreCallback } from '@/hooks/use-711-store';

export default function ShipCallbackPage() {
    // 呼叫回送到母視窗用的勾子函式
    useShip711StoreCallback();

    return (
        <>
            <div style={{ padding: '20px', textAlign: 'center', fontFamily: 'Arial' }}>
                <h2>7-11 門市選擇處理中...</h2>
                <p>正在將選擇的門市資料回傳到主頁面</p>

                {/* 如果是開發模式，顯示除錯資訊 */}
                {process.env.NODE_ENV === 'development' && (
                    <div style={{
                        marginTop: '20px',
                        padding: '15px',
                        background: '#f8f9fa',
                        borderRadius: '5px',
                        fontSize: '12px',
                        textAlign: 'left'
                    }}>
                        <h4>除錯資訊：</h4>
                        <p>當前 URL: {typeof window !== 'undefined' ? window.location.href : 'loading...'}</p>
                        <p>URL 參數: {typeof window !== 'undefined' ? window.location.search : 'loading...'}</p>
                        <p>有父視窗: {typeof window !== 'undefined' && window.opener ? '✅' : '❌'}</p>
                    </div>
                )}

                <div style={{ marginTop: '30px' }}>
                    <button
                        onClick={() => {
                            console.log('🔄 手動關閉視窗')
                            window.close()
                        }}
                        style={{
                            padding: '10px 20px',
                            fontSize: '16px',
                            backgroundColor: 'var(--primary-01)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        關閉視窗
                    </button>
                </div>
            </div>
        </>
    )
}