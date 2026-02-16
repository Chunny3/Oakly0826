"use client";

import "@/styles/cart/payment.css";
import { useState, useEffect } from "react";

export default function Payment() {
  const [showForm, setShowForm] = useState(false);
  const [showI, setShowI] = useState(false);
  const [showP, setShowP] = useState(false);
  const [selectI, setSelectI] = useState("發票類型"); // 先給預設值
  const [selectP, setSelectP] = useState("付款方式");
  const [mobileCarrier, setMobileCarrier] = useState("");

  const handlePaymentSelect = (value) => {
    setSelectP(value);
    localStorage.setItem("payment", value);
  }

  const handleInvoiceSelect = (value) => {
    setSelectI(value);
    localStorage.setItem("invoice", value)
  }

  // 在瀏覽器端抓 localStorage
  useEffect(() => {
    const savedInvoice = localStorage.getItem("invoice");
    const savedPayment = localStorage.getItem("payment");
    const savedCarrier = localStorage.getItem("invoice");
    if (savedInvoice) setSelectI(savedInvoice);
    if (savedPayment) setSelectP(savedPayment);
    if (savedCarrier) setMobileCarrier(savedCarrier);
  }, []);

  // 同步到 localStorage
  useEffect(() => {
    if (selectP !== "付款方式") localStorage.setItem("payment", selectP);
    if (selectI !== "發票類型") localStorage.setItem("invoice", selectI);
    if (mobileCarrier !== "") { localStorage.setItem("invoice", mobileCarrier) };
  }, [selectP, selectI, mobileCarrier]);

  const options = ["電子發票", "紙本發票"];
  const payments = ["信用卡", "超商付款"];



  return (
    <>
      <div className="payment pc">
        <div className="pay pc">
          <h4>付款方式</h4>
          <div className="form-check pc">
            <input
              className="form-check-input pc"
              type="radio"
              name="payment"
              value="credit"
              id="radioDefault1"
              checked={selectP === "信用卡"}
              onChange={() => setSelectP("信用卡")}
            />
            <label className="form-check-label pc" htmlFor="radioDefault1">
              <h6>信用卡</h6>
            </label>
          </div>
          
          <div className="form-check pc">
            <input
              className="form-check-input pc"
              type="radio"
              name="payment"
              value="store"
              id="radioDefault2"
              checked={selectP === "超商付款"}
              onChange={() => setSelectP("超商付款")}
            />
            <label className="form-check-label pc" htmlFor="radioDefault2">
              <h6>超商付款</h6>
            </label>
          </div>
        </div>
        <div className="p-line pc"></div>
        <div className="invoice pc">
          <h4>發票類型</h4>
          <div className="form-check pc">
            <input
              className="form-check-input pc"
              type="radio"
              name="invoice"
              id="radioDefault1"
              checked={selectI === "電子發票"}
              onChange={() => setSelectI("電子發票")}
            />
            <label className="form-check-label pc" htmlFor="radioDefault1">
              <h6>電子發票</h6>
            </label>
            {/* 額外輸入框 (只有某些選項會出現) */}
            {selectI === "電子發票" && (
              <div className="extra-input">
                <input type="text" placeholder="請輸入手機條碼" />
              </div>
            )}
          </div>
          <div className="form-check pc">
            <input
              className="form-check-input pc"
              type="radio"
              name="invoice"
              id="radioDefault2"
              checked={selectI === "紙本發票"}
              onChange={() => setSelectI("紙本發票")}
            />
            <label className="form-check-label pc" htmlFor="radioDefault2">
              <h6>紙本發票</h6>
            </label>
          </div>
        </div>
      </div >

      {/* 手機------------------------------ */}
      <div className="payment phone" >
        <button
          className={`toggleBtn ${showForm ? "active" : ""} phone`}
          onClick={() => {
            setShowForm(!showForm);
          }}
          id="toggleBtn"
        >
          <h4>付款方式</h4>
        </button>

        {
          showForm && (
            <>
              <div className="invoice-pay phone">
                <div className="dropdown invoice phone">
                  <button
                    className={`toggleBtn2 ${showI ? "active" : ""} phone`}
                    onClick={() => {
                      setShowI(!showI);
                    }}
                    id="toggleBtn"
                  >
                    <h6>{selectI}</h6>
                  </button>

                  {showI && (
                    <ul className="dropdown-menu">
                      {options.map((option) => (
                        <li key={option}>
                          <button
                            className="dropdown-item"
                            onClick={() => {
                              setSelectI(option);
                              setShowI(false);

                              if (option === "電子發票") {
                                // 當選「電子發票」時，暫時不存 localStorage
                                // 等使用者輸入後再存
                              } else {
                                localStorage.setItem("invoice", option)
                              }
                            }}
                          >
                            {option}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  {/* 額外輸入框 (只有某些選項會出現) */}
                  {selectI === "電子發票" && (
                    <div className="extra-input">
                      <input
                        type="text"
                        placeholder="請輸入手機條碼"
                        value={mobileCarrier || ""}
                        onChange={(e) => setMobileCarrier(e.target.value)}
                        onBlur={(e) => {
                          // 使用者輸入完成後存進 localStorage
                          localStorage.setItem("invoice", e.target.value);
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* payment */}
                <div className="dropdown pay phone">
                  <button
                    className={`toggleBtn2 ${showP ? "active" : ""} phone`}
                    onClick={() => {
                      setShowP(!showP);
                    }}
                    id="toggleBtn"
                  >
                    <h6>{selectP}</h6>
                  </button>
                  {showP && (
                    <ul className="dropdown-menu">
                      {payments.map((payment) => (
                        <li key={payment}>
                          <button
                            className="dropdown-item"
                            onClick={() => {
                              setSelectP(payment);
                              localStorage.setItem("payment", payment); // 存 localStorage
                              setShowP(false);
                            }}
                          >
                            {payment}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}

                </div>
              </div>
            </>
          )
        }
      </div >
    </>
  );
}
