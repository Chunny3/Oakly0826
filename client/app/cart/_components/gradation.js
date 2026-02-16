"use client"

import "@/styles/cart/gradation.css";

export default function Gradation({ step }) {
    if (step === "order") {
        return (

            <div className="top">
                <div className="cart-title">
                    <h2>購物車</h2>
                </div>
                <div className="gradation">
                    {/* 有重複------------------------- */}
                    <div className="name">
                        <div className="round1">1</div>
                        <h5>訂單資訊</h5>
                    </div>
                    <div className="top-line2"></div>
                    <div className="name">
                        <div className="round2">2</div>
                        <h5>填寫地址與付款</h5>
                    </div>
                    <div className="top-line2"></div>
                    <div className="name">
                        <div className="round2">3</div>
                        <h5>完成訂單</h5>
                    </div>
                    {/* ------------------------------ */}
                </div>
            </div>
        )
    } else if (step === "detail") {
        return (
            <div className="top">
                <div className="cart-title">
                    <h2>購物車</h2>
                </div>
                <div className="gradation">
                    {/* 有重複------------------------- */}
                    <div className="name">
                        <div className="round1">1</div>
                        <h5>訂單資訊</h5>
                    </div>
                    <div className="top-line1"></div>
                    <div className="name">
                        <div className="round1">2</div>
                        <h5>填寫地址與付款</h5>
                    </div>
                    <div className="top-line2"></div>
                    <div className="name">
                        <div className="round2">3</div>
                        <h5>完成訂單</h5>
                    </div>
                    {/* ------------------------------ */}
                </div>
            </div>
        )
    } else {
        return (
            <div className="top">
                <div className="cart-title">
                    <h2>購物車</h2>
                </div>
                <div className="gradation">
                    {/* 有重複------------------------- */}
                    <div className="name">
                        <div className="round1">1</div>
                        <h5>訂單資訊</h5>
                    </div>
                    <div className="top-line1"></div>
                    <div className="name">
                        <div className="round1">2</div>
                        <h5>填寫地址與付款</h5>
                    </div>
                    <div className="top-line1"></div>
                    <div className="name">
                        <div className="round1">3</div>
                        <h5>完成訂單</h5>
                    </div>
                    {/* ------------------------------ */}
                </div>
            </div>
        )
    }
}