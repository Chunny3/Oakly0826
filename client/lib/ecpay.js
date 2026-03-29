import crypto from "crypto";

// 測試用的商店代號
const MerchantID = 2000132;
const HashKey = "5294y06JbISpM5x9";
const HashIV = "v77hoKGq4kWxNNIS";

export function generateEcpayParams(order) {
  const params = {
    MerchantID,
    MerchantTradeNo: order.order_number,
    MerchantTradeDate: new Date().toISOString().slice(0, 19).replace("T", " "),
    PaymentType: "aio",
    TotalAmount: order.total_amount,
    TradeDesc: "訂單測試",
    ItemName: order.items.map((i) => `${i.name}x${i.quantity}`).join("#"),
    ReturnURL: "http://localhost:3000/ecpay/api",
    OrderResultURL: "http://localhost:3000/ecpay/callback",
    ChoosePayment: "Credit",
    EncryptType: 1,
  };

  params.checkMacValue = generateCheckMacValue(params);
  return params;
}

function generateCheckMacValue(params) {
  const raw = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b)) //參數排列
    .map(([k, v]) => `${k}=${v}`)
    .join("&");

  const str = `HashKey=${HashKey}&${raw}&HashIV=${HashIV}`;
  return crypto.createHash("sha256").update(str).digest("hex").toUpperCase();
}
