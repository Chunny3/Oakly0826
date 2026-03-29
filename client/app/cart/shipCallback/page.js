'use client'

import { useState, useEffect } from 'react';
import { useShip711StoreCallback } from '@/hooks/use-711-store';

export default function ShipCallbackPage() {
    // 呼叫回送到母視窗用的勾子函式
    useShip711StoreCallback();

    const [debugInfo, setDebugInfo] = useState({
        currentUrl: '',
        urlParams: '',
        hasParentWindow: false
    });

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setDebugInfo({
                currentUrl: window.location.href,
                urlParams: window.location.search,
                hasParentWindow: !!window.opener
            });
        }
    }, []);

    const handleCloseWindow = () => {
        console.log('🔄 手動關閉視窗');
        window.close();
    };

    useEffect(() => {
        // 在 shipCallback 頁面也啟動保護
        const loginToken = localStorage.getItem("reactLoginToken");
        const userData = localStorage.getItem("user");

        if (loginToken && loginToken !== 'null') {
            sessionStorage.setItem("callbackProtectToken", loginToken);
            sessionStorage.setItem("callbackProtectUser", userData || "");

            const callbackProtect = setInterval(() => {
                const current = localStorage.getItem("reactLoginToken");
                const backup = sessionStorage.getItem("callbackProtectToken");

                if ((!current || current === 'null') && backup) {
                    localStorage.setItem("reactLoginToken", backup);
                    const userBackup = sessionStorage.getItem("callbackProtectUser");
                    if (userBackup) {
                        localStorage.setItem("user", userBackup);
                    }
                    console.log("shipCallback 頁面恢復登入狀態");
                }
            }, 50);

            // 30 秒後停止
            setTimeout(() => {
                clearInterval(callbackProtect);
                sessionStorage.removeItem("callbackProtectToken");
                sessionStorage.removeItem("callbackProtectUser");
            }, 30000);
        }
    }, []);

    return (
        <>
            {/* Bootstrap CSS */}
            <link
                href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/css/bootstrap.min.css"
                rel="stylesheet"
            />

            <div className="min-vh-100" style={{ backgroundColor: '#f8f9fa' }}>


                {/* Progress Bar */}
                <div className="bg-white border-bottom">
                    <div className="container py-4">
                        <div className="d-flex align-items-center justify-content-center">
                            <div className="d-flex align-items-center">
                                <div
                                    className="rounded-circle d-flex align-items-center justify-content-center text-white fw-medium"
                                    style={{
                                        width: '32px',
                                        height: '32px',
                                        backgroundColor: 'var(--primary-04)',
                                        fontSize: '14px'
                                    }}
                                >
                                    ✓
                                </div>
                                <span className="ms-2 small text-muted">選擇門市</span>
                            </div>

                            <div
                                className="mx-3"
                                style={{
                                    width: '64px',
                                    height: '2px',
                                    backgroundColor: 'var(--primary-04)'
                                }}
                            ></div>

                            <div className="d-flex align-items-center">
                                <div
                                    className="rounded-circle d-flex align-items-center justify-content-center text-white fw-medium"
                                    style={{
                                        width: '32px',
                                        height: '32px',
                                        backgroundColor: 'var(--primary-04)',
                                        fontSize: '14px'
                                    }}
                                >
                                    ✓
                                </div>
                                <span className="ms-2 small text-muted">確認門市資訊</span>
                            </div>

                            <div
                                className="mx-3"
                                style={{
                                    width: '64px',
                                    height: '2px',
                                    backgroundColor: 'var(--primary-04)'
                                }}
                            ></div>

                            <div className="d-flex align-items-center">
                                <div
                                    className="rounded-circle d-flex align-items-center justify-content-center text-white fw-medium"
                                    style={{
                                        width: '32px',
                                        height: '32px',
                                        backgroundColor: 'var(--primary-04)',
                                        fontSize: '14px'
                                    }}
                                >
                                    ✓
                                </div>
                                <span
                                    className="ms-2 small fw-medium"
                                    style={{ color: 'var(--primary-05)' }}
                                >
                                    完成設定
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="container py-5">
                    <div className="row justify-content-center">
                        <div className="col-md-8 col-lg-6">
                            {/* Success Card */}
                            <div className="card shadow-sm mb-4">
                                <div className="card-body p-5 text-center">
                                    <div
                                        className="rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3"
                                        style={{
                                            width: '48px',
                                            height: '48px',
                                            backgroundColor: '#d1fae5'
                                        }}
                                    >
                                        <svg
                                            width="24"
                                            height="24"
                                            fill="none"
                                            stroke="var(--primary-05)"
                                            viewBox="0 0 24 24"
                                            style={{ strokeWidth: '3' }}
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path>
                                        </svg>
                                    </div>

                                    <h2 className="h4 fw-bold text-dark mb-3">選擇門市完成</h2>
                                    <p className="text-muted mb-0">您的門市選擇已成功完成！</p>
                                </div>
                            </div>

                            {/* Debug Info (Development Mode) */}
                            {/* {process.env.NODE_ENV === 'development' && (
                                <div className="card shadow-sm mb-4">
                                    <div className="card-body">
                                        <h3 className="h5 fw-semibold text-dark mb-3">
                                            <span className="d-inline-flex align-items-center">
                                                🐛 除錯資訊
                                                <span className="badge bg-warning text-dark ms-2" style={{ fontSize: '10px' }}>
                                                    開發模式
                                                </span>
                                            </span>
                                        </h3>

                                        <div className="mb-3">
                                            <div className="bg-light rounded p-3">
                                                <div className="small text-muted mb-1">當前 URL</div>
                                                <div className="small font-monospace text-dark text-break">
                                                    {debugInfo.currentUrl || 'loading...'}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mb-3">
                                            <div className="bg-light rounded p-3">
                                                <div className="small text-muted mb-1">URL 參數</div>
                                                <div className="small font-monospace text-dark">
                                                    {debugInfo.urlParams || 'loading...'}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mb-0">
                                            <div className="bg-light rounded p-3">
                                                <div className="small text-muted mb-1">父視窗狀態</div>
                                                <div className="d-flex align-items-center">
                                                    <span className="small font-monospace text-dark">
                                                        {debugInfo.hasParentWindow ? '✅ 有父視窗' : '❌ 無父視窗'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )} */}

                            {/* Action Button */}
                            <div className="text-center">
                                <button
                                    onClick={handleCloseWindow}
                                    className="btn btn-lg px-4"
                                    style={{
                                        backgroundColor: 'var(--primary-05)',
                                        borderColor: 'var(--primary-05)',
                                        color: 'white',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseOver={(e) => {
                                        e.target.style.backgroundColor = '#059669';
                                        e.target.style.borderColor = '#059669';
                                    }}
                                    onMouseOut={(e) => {
                                        e.target.style.backgroundColor = 'var(--primary-05)';
                                        e.target.style.borderColor = 'var(--primary-05)';
                                    }}
                                >
                                    手動關閉視窗
                                </button>
                            </div>
                        </div>
                    </div>
                </div>


            </div>
        </>
    );
}