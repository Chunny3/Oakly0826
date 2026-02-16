import dotenv from "dotenv";
dotenv.config({ path: "chunny.env" });

import express from "express";
import { createServer } from 'http'; 
import multer from "multer";
import cors from "cors";
import moment from "moment";
import { v4 as uuidv4 } from "uuid";
import usersRouter from "./routes/users2.js";
import productsRouter from "./routes/productss.js";
import organizersRouter from "./routes/organizers.js";
import userOrganizersRouter from "./routes/userOrganizers.js";
import couponRouter from "./routes/coupons.js";
import userCouponRouter from "./routes/userCoupons.js";
import articleRouter from "./routes/article.js";
import orderRouter from "./routes/order.js";
import reviewsRouter from './routes/review.js';
import cartRouter from './routes/cart/ecpay3.js';
import shipRouter from './routes/seCallback.js';

import notifyRoutes from './routes/notify.js';
import chatRouter, { initializeChatWebSocket } from "./routes/agent.js";




import authResetRouter from "./routes/authReset.js";
import authGoogleRouter from "./routes/auth-google.js";

// 設定區
const upload = multer();
let whitelist = [
  "http://localhost:5500",
  "http://localhost:3000",
  "https://exit-mixture-spies-casinos.trycloudflare.com",
  "https://emap.pcsc.com.tw",  // 添加 7-11 官方網域
  "https://emap.presco.com.tw" // 也添加這個（可能會用到）
];
let corsOptions = {
  credentials: true,
  origin(origin, callback) {
    if (!origin) {
      callback(null, true)
      return;
    }


    // 檢查是否在白名單中
    if (whitelist.includes(origin)) {
      console.log('✅ CORS 允許:', origin);
      callback(null, true);
    } else {
      console.log('❌ CORS 拒絕:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  }
}



// 路由區
const app = express();
const server = createServer(app);  

app.use(cors(corsOptions));
// app.use(cors({ origin: ["http://localhost:3000"], credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public')) //後端提供public的靜態檔案
app.use('/uploads', express.static('uploads'));

// 添加調試中間件來檢查所有請求
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  console.log('Content-Type:', req.headers['content-type']);
  console.log('Origin:', req.headers.origin);
  console.log('Body:', req.body);
  next();
});


app.get("/", (req, res) => {
  res.send("首頁");
});

// 登出 API：清掉 cookie，永遠回成功
app.post("/api/users/logout", (req, res) => {
  res.clearCookie("token", { path: "/" }); // 如果你設 cookie 時有 sameSite/secure，這裡也要加
  return res.json({ status: "success" });
});


app.use("/api/users", usersRouter);
app.use('/api', reviewsRouter);
app.use("/api/organizers", organizersRouter);
app.use("/api/user/organizers", userOrganizersRouter);
app.use("/api/products", productsRouter);
app.use("/api/coupons", couponRouter);
app.use("/api/user/coupons", userCouponRouter);
app.use("/api/article", articleRouter);
app.use("/api/cart", cartRouter);
app.use("/api/order", orderRouter);
app.use("/api/ship/711", shipRouter);
app.use('/uploads', express.static('public/uploads'));    // 評論圖片
app.use('/api/notify', notifyRoutes);

app.use("/api/auth", authResetRouter);
app.use("/api/auth", authGoogleRouter); // => POST /api/auth/google
app.use("/api/chat", chatRouter);





// 修改：啟動伺服器的方式
const PORT = 3005;

const startServer = async () => {
  try {
    // 初始化 WebSocket 聊天功能
    const io = initializeChatWebSocket(server);
    console.log('WebSocket 聊天功能已初始化');
    
    // 使用 server.listen 而不是 app.listen
    server.listen(PORT, () => {
      console.log("主機啟動 http://localhost:3005");
      console.log("WebSocket 聊天服務已啟動");
    });
    
  } catch (error) {
    console.error('伺服器啟動失敗:', error);
    process.exit(1);
  }
};

// 優雅關閉處理
const gracefulShutdown = () => {
  console.log('正在關閉伺服器...');
  server.close(() => {
    console.log('伺服器已關閉');
    process.exit(0);
  });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// 啟動伺服器
startServer();



app.listen(3005, () => {
  console.log("主機啟動 http://localhost:3005");
});

