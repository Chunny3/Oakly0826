import crypto from "crypto";

// 產生一次性 token（回傳明碼 token；hash 用來存 DB）
export function createResetToken() {
  const token = crypto.randomBytes(32).toString("hex"); // 64字元
  const hash = crypto.createHash("sha256").update(token).digest("hex"); // 64字元
  return { token, hash };
}

// 回傳 N 分鐘後的 Date
export function expiresAfterMinutes(min = 15) {
  return new Date(Date.now() + min * 60 * 1000);
}
