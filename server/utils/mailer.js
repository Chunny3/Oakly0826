import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

/** 通用寄信 */
export async function sendHtmlMail({ to, subject, html }) {
    const from = process.env.SMTP_FROM || "no-reply@example.com";
    return transporter.sendMail({ from, to, subject, html });
}

/** 專門用於忘記密碼的寄信 */
export async function sendResetEmail(to, resetLink, ttlMin = 15) {
    const subject = "Okaly 重設密碼連結";
    const html = `
    <p>您提出了重設密碼的請求。</p>
    <p>請在 <b>${ttlMin} 分鐘</b> 內點擊以下連結重設密碼：</p>
    <p><a href="${resetLink}">${resetLink}</a></p>
    <p>如果您沒有操作，請忽略此信。</p>
  `;
    return sendHtmlMail({ to, subject, html });
}