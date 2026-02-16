import express from "express";
import multer from "multer";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import mysql from "mysql2/promise";
import pool from "../connect.js";
import fs from "fs/promises";
import path from "path";

const router = express.Router();
const upload = multer();


import dotenv from 'dotenv';
dotenv.config();
const secretKey = process.env.JWT_SECRET_KEY;
// console.log("JWT_SECRET_KEY:", process.env.JWT_SECRET_KEY);

// 預設頭像
const DEFAULT_AVATAR = "http://localhost:3000/img/default-avatar.png";

// 把route(s)(路由規則) 整理在 routers(路由物件器) 裡
// 取得收藏清單-------------------------------------------
router.get("/favorites", checkToken, async (req, res) => {
  try {
    const userId = req.decoded.id;

    const sql = `
      SELECT
        f.id,
        f.product_id,
        f.color_id,
        f.size_id,
        f.quantity,
        p.name,
        p.price,
        c.color_name,
        s.size_label,
        CASE
          WHEN p.product_img LIKE 'http%' THEN p.product_img
          ELSE CONCAT('http://localhost:3005/', TRIM(LEADING '/' FROM p.product_img))
        END AS product_img
      FROM favorites f
      JOIN products p ON f.product_id = p.id
      LEFT JOIN colors c ON f.color_id = c.id
      LEFT JOIN sizes s ON f.size_id = s.id
      WHERE f.user_id = ?;
    `;
    const [rows] = await pool.execute(sql, [userId]);
    res.json({ status: "success", data: rows });
  } catch (err) {
    console.error("GET /favorites error:", err);
    res.status(500).json({ status: "error", message: "無法取得收藏清單" });
  }
});

// 加入收藏
router.post("/favorites", checkToken, async (req, res) => {
  try {
    const userId = req.decoded.id;
    const { productId, colorId, sizeId, colorName, quantity } = req.body;

    if (!productId) {
      return res.status(400).json({ status: "fail", message: "缺少或不合法的 productId" });
    }

    // 先確認商品存在
    const [p] = await pool.execute("SELECT id FROM products WHERE id=?", [productId]);
    if (!p.length) return res.status(404).json({ status: "fail", message: "商品不存在" });

    await pool.execute(
      "INSERT INTO favorites (user_id, product_id, color_id, size_id, color_name, quantity) VALUES (?, ?, ?, ?, ?, ?)",
      [userId, productId, colorId || null, sizeId || null, colorName || null, quantity || 1]
    );

    res.json({ status: "success", message: "已加入收藏" });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ status: "fail", message: "已在收藏清單中" });
    }
    console.error("POST /favorites error:", err);
    res.status(500).json({ status: "error", message: "加入收藏失敗" });
  }
});

// 更新收藏數量
router.patch("/favorites/:productId/:colorId/:sizeId", checkToken, async (req, res) => {
  try {
    const userId = req.decoded.id;
    const { productId, colorId, sizeId } = req.params;
    let { quantity } = req.body;

    quantity = Number(quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
      return res.status(400).json({ status: "error", message: "數量需為 1~99 的整數" });
    }

    const sql = `
      UPDATE favorites
      SET quantity = ?
      WHERE user_id = ? AND product_id = ? AND color_id = ? AND size_id = ?
    `;
    const [result] = await pool.execute(sql, [quantity, userId, productId, colorId, sizeId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ status: "error", message: "找不到這筆收藏" });
    }

    res.json({ status: "success", data: { productId, colorId, sizeId, quantity } });
  } catch (err) {
    console.error("PATCH /favorites error:", err);
    res.status(500).json({ status: "error", message: "更新數量失敗" });
  }
});

// 臨時調試用路由（記得之後要移除）
// router.get("/favorites/debug/:userId", async (req, res) => {
//   try {
//     const userId = req.params.userId;
//     const sql = `
//     SELECT f.product_id, f.color_id, f.color_name, f.size_id, f.quantity,
//            p.name, p.price
//     FROM favorites f
//     JOIN products p ON f.product_id = p.id
//     WHERE f.user_id = ?`;
//     const [rows] = await pool.execute(sql, [userId]);
//     res.json({ status: "success", data: rows });
//   } catch (err) {
//     res.status(500).json({ status: "error", message: err.message });
//   }
// });

// 檢查收藏狀態
router.get("/favorites/:productId/:colorId/:sizeId/check", checkToken, async (req, res) => {
  try {

    const userId = req.decoded.id;
    const { productId, colorId, sizeId } = req.params;

    const [result] = await pool.execute(
      "SELECT COUNT(*) as count FROM favorites WHERE user_id = ? AND product_id = ? AND color_id = ? AND size_id = ?",
      [userId, productId, colorId || null, sizeId || null]
    );

    const isWishlisted = result[0].count > 0;

    res.json({
      status: "success",
      data: { isWishlisted }
    });
  } catch (err) {
    console.error("檢查收藏狀態錯誤:", err);
    res.status(500).json({ status: "error", message: "檢查收藏狀態失敗" });
  }
});
// 移除收藏
router.delete("/favorites/:productId/:colorId/:sizeId", checkToken, async (req, res) => {
  try {
    const userId = req.decoded.id;
    const { productId, colorId, sizeId } = req.params;

    await pool.execute(
      "DELETE FROM favorites WHERE user_id = ? AND product_id = ? AND color_id = ? AND size_id = ?",
      [userId, productId, colorId || null, sizeId || null]
    );
    res.json({ status: "success", message: "已取消收藏" });
  } catch (err) {
    res.status(500).json({ status: "error", message: "取消收藏失敗" });
  }
});


// 註冊（新增一個使用者----------------------------------
router.post("/", upload.none(), async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // 1) 必填欄位檢查（避免 undefined）
    if (!email || !password || !name) {
      const err = new Error("請提供完整的使用者資訊"); // Error 物件只能在小括號中自訂錯誤訊息
      err.code = 400; // 利用物件的自訂屬性把 HTTP 狀態碼帶到 catch
      err.status = "fail"; // 利用物件的自訂屬性把status字串帶到 catch
      throw err;
    }
    // 檢查 email 有沒有使用過
    const sqlCheck1 = "SELECT * FROM `users` WHERE `email` = ?;";
    let user = await pool.execute(sqlCheck1, [email]).then(([result]) => {
      return result[0];
    });
    if (user) {
      const err = new Error("提供的註冊資料已被使用"); // Error 物件只能在小括號中自訂錯誤訊息
      err.code = 400; // 利用物件的自訂屬性把 HTTP 狀態碼帶到 catch
      err.status = "fail"; // 利用物件的自訂屬性把status字串帶到 catch
      throw err;
    }

    // 檢查 XX 有沒有使用過
    // const sqlCheck2 = "SELECT * FROM `users` WHERE `email` = ?;";
    // user = await pool.execute(sqlCheck1, [email]).then(([result])=>{
    //   return result[0];
    // });
    // if(user){
    //   const err = new Error("提供的註冊資料已被使用");
    //   err.code = 400;
    //   err.status = "fail";
    //   throw err;
    // }

    // 3) 產生頭像（可能為 null)(取用下面function Randomuser.me)
    const avatar = DEFAULT_AVATAR;
    // 4) 壓縮密碼
    const hashedPassword = await bcrypt.hash(password, 10);
    // 5) 建立 SQL 語法,寫入資料（undefined 一律轉成 null）
    const sql =
      "INSERT INTO `users` (name, email, password, avatar) VALUES(?, ?, ?, ?);";
    await pool.execute(sql, [name, email, hashedPassword, avatar]);

    res.status(201).json({
      status: "success",
      data: {},
      message: "註冊成功",
    });
  } catch (error) {
    // 捕獲錯誤
    console.log(error);
    const statusCode = error.code ?? 500;
    const statusText = error.status ?? "error";
    const message = error.message ?? "註冊失敗，請洽管理人員";

    res.status(statusCode).json({
      status: statusText,
      message,
    });
  }
});

// 獲取所有使用者------------------------------
router.get("/", async (req, res) => {
  try {
    const sql = "SELECT * FROM `users` ";
    let [users] = await pool.execute(sql);

    res.status(200).json({
      status: "success",
      data: users,
      message: "已 獲取所有使用者",
    });
  } catch (error) {
    // 捕獲錯誤
    console.log(error);
    const statusCode = error.code ?? 401;
    const statusText = error.status ?? "error";
    const message = error.message ?? "身份驗證錯誤，請洽管理人員";

    res.status(statusCode).json({
      status: statusText,
      message,
    });
  }
});

// 搜尋使用者----------------------------------
router.get("/search", (req, res) => {
  // 網址參數 (查詢參數)會被整理到 req 中的 query 裡
  const key = req.query.key;
  res.status(200).json({
    status: "success",
    data: { key },
    message: "搜尋使用者 成功 ",
  });
});

//0913怡卉新增 優惠券要抓的user
router.get("/profile", checkToken, async (req, res) => {
  console.log("=== 進入 /profile 路由 ===");
  try {
    const id = req.decoded.id;
    console.log("從 token 取得的 id:", id);
    console.log("id 的型別:", typeof id);

    const sqlCheck1 = "SELECT * FROM `users` WHERE `id` = ?;";
    console.log("準備執行 SQL:", sqlCheck1);
    console.log("查詢參數:", [id]);

    let user = await pool.execute(sqlCheck1, [id]).then(([result]) => {
      console.log("原始查詢結果:", result);
      console.log("結果數量:", result.length);
      if (result.length > 0) {
        console.log("第一筆資料:", result[0]);
      }
      return result[0];
    });

    console.log("最終 user 變數:", user);

    if (!user) {
      console.log("user 為空，準備拋出錯誤");
      const err = new Error("找不到使用者");
      err.code = 404;
      err.status = "fail";
      throw err;
    }
    // 剩餘參數 （不顯示出來的資料）
    const {
      id: userId,
      password,
      is_valid,
      created_at,
      updated_at,
      ...data
    } = user;

    res.status(200).json({
      status: "success",
      data,
      message: "查詢成功",
    });
  } catch (error) {
    console.log(error);
    const statusCode = error.code ?? 401;
    const statusText = error.status ?? "error";
    const message = error.message ?? "身份驗證錯誤，請洽管理人員";

    res.status(statusCode).json({
      status: statusText,
      message,
    });
  }
});


// 獲取特定 ID的使用者----------------------------------
router.get("/:id", async (req, res) => {
  // 路由參數

  try {
    const id = req.params.id;
    if (!id) {
      const err = new Error("請提供使用者 ID");
      err.code = 400;
      err.status = "fail";
      throw err;
    }
    const sqlCheck1 = "SELECT * FROM `users` WHERE `id` = ?;";
    let user = await pool.execute(sqlCheck1, [id]).then(([result]) => {
      return result[0];
    });
    if (!user) {
      const err = new Error("找不到使用者");
      err.code = 404;
      err.status = "fail";
      throw err;
    }

    // 剩餘參數 （不顯示出來的資料）
    const {
      id: userId,
      password,
      is_valid,
      created_at,
      updated_at,
      ...data
    } = user;

    res.status(200).json({
      status: "success",
      data,
      message: "查詢成功",
    });
  } catch (error) {
    // 捕獲錯誤
    console.log(error);
    const statusCode = error.code ?? 401;
    const statusText = error.status ?? "error";
    const message = error.message ?? "身份驗證錯誤，請洽管理人員";

    res.status(statusCode).json({
      status: statusText,
      message,
    });
  }
});


// 更新(特定 ID 的)使用者-------------------------------
// 1️⃣ 更新一般資料
router.put("/:id/edit", checkToken, upload.none(), async (req, res) => {
  try {
    // 取得表單中的欄位內容
    const id = req.params.id;
    const { name, phone, city, area, address, birthday } = req.body;

    // 檢查至少要有一個欄位有資料
    if (!name && !phone && !city && !area && !address && !birthday) {
      const err = new Error("請提至少提供一個要更新的資料");
      err.code = 400;
      err.status = "fail";
      throw err;
    }
    let updateFields = []; // 用陣列來記錄要更新的欄位
    let values = []; // 用陣列來記錄要更新的欄位的值

    // 如果有 這個欄位 / 欄位部份的 SQL / 問號對應的值
    if (name) {
      updateFields.push("name = ?");
      values.push(name);
    }
    if (phone) {
      updateFields.push("phone = ?");
      values.push(phone);
    }
    if (city) {
      updateFields.push("city = ?");
      values.push(city);
    }
    if (area) {
      updateFields.push("area = ?");
      values.push(area);
    }
    if (address) {
      updateFields.push("address = ?");
      values.push(address);
    }
    if (birthday) {
      updateFields.push("birthday = ?");
      values.push(birthday);
    }

    values.push(id); // SQL 的最後有用 id 來查詢

    // console.log(updateFields);
    // console.log(values);

    const sql = `UPDATE users SET ${updateFields.join(", ")} WHERE id = ?`;
    const [result] = await pool.execute(sql, values);
    // console.log(result);

    if (!result.affectedRows || result.affectedRows === 0) {
      const err = new Error("更新失敗，請洽管理人員");
      err.code = 400;
      err.status = "fail";
      throw err;
    }
    res.status(200).json({
      status: "success",
      message: "使用者資料更新成功",
    });
  } catch (error) {
    // 補獲錯誤
    // console.log(error);
    sendError(res, error);
  }
});

// 2️⃣ 更新密碼
router.put("/:id/password", checkToken, upload.none(), async (req, res) => {
  try {
    const id = req.params.id;
    const { password } = req.body;

    if (!password) {
      const err = new Error("請提供新密碼");
      err.code = 400;
      err.status = "fail";
      throw err;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.execute(
      "UPDATE users SET password = ? WHERE id = ?",
      [hashedPassword, id]
    );

    if (!result.affectedRows) {
      const err = new Error("更新失敗，請洽管理人員");
      err.code = 400;
      err.status = "fail";
      throw err;
    }

    res.status(200).json({ status: "success", message: "密碼更新成功" });
  } catch (error) {
    sendError(res, error);
  }
});

// 3️⃣ 更新頭像
router.put(
  "/:id/avatar",
  checkToken,
  upload.single("avatar"),
  async (req, res) => {
    try {
      const id = req.params.id;
      if (!req.file) {
        const err = new Error("請上傳頭像");
        err.code = 400;
        err.status = "fail";
        throw err;
      }

      // 建立avatar存放資料夾路徑
      const avatarUploadPath = path.resolve("public/uploads/avatars");
      await fs.mkdir(avatarUploadPath, { recursive: true });
      // 取得目前的時間戳(毫秒)，將使用者上傳檔，用來確保每次上傳檔案都能有「唯一性」
      const filename = `${Date.now()}-${req.file.originalname}`;
      // 將 資料夾路徑＋生成檔名合併成完整路徑 並把 avatar存入後端
      const filepath = path.join(avatarUploadPath, filename);
      await fs.writeFile(filepath, req.file.buffer);
      // 給前端用的網址路徑
      const ORIGIN =
        process.env.SERVER_PUBLIC_ORIGIN || "http://localhost:3005";
      const publicPath = `${ORIGIN}/uploads/avatars/${filename}`;
      // 更新頭像
      const [result] = await pool.execute(
        "UPDATE users SET avatar = ? WHERE id = ?",
        [publicPath, id]
      );

      if (!result.affectedRows) {
        const err = new Error("頭像更新失敗，請洽管理人員");
        err.code = 400;
        err.status = "fail";
        throw err;
      }

      return res.status(200).json({
        status: "success",
        message: "頭像更新成功",
        data: { avatar: publicPath },
      });
    } catch (error) {
      return sendError(res, error);
    }
  }
);

// 共用：錯誤回傳
function sendError(res, error) {
  const statusCode = error.code ?? 500;
  const statusText = error.status ?? "error";
  const message = error.message ?? "更新失敗，請洽管理人員";
  return res.status(statusCode).json({
    status: statusText,
    message,
  });
}

// 刪除(特定 ID)的使用者------------------------------------
router.delete("/:id", (req, res) => {
  const id = req.params.id;
  res.status(200).json({
    status: "success",
    data: { id },
    message: "刪除(特定 ID)的使用者 成功 ",
  });
});

// 使用者登入-----------------------------------------------
router.post("/login", upload.none(), async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1) 撈使用者
    const user = await pool
      .execute("SELECT * FROM users WHERE `email`= ?", [email])
      .then(([result]) => {
        // console.log(result);
        return result[0];
      });

    console.log(user);

    if (!user) {
      const err = new Error("帳號或密碼錯誤1"); // Error 物件只能在小括號中自訂錯誤訊息
      err.code = 400; // 利用物件的自訂屬性把 HTTP 狀態碼帶到 catch
      err.status = "error "; // 利用物件的自訂屬性把status字串帶到 catch
      throw err;
    }

    // 2) 比對密碼
    // 測試完要改回來
    const isMatch = await bcrypt.compare(password, user.password);
    // const isMatch = password === user.password;
    if (!isMatch) {
      const err = new Error("帳號或密碼錯誤2");
      err.code = 400;
      err.status = "error ";
      throw err;
    }

    // 3) 簽發 token（30 分鐘）
    const token = jwt.sign(
      {
        id: user.id,
        name: user.name,
        birthday: user.birthday,
        email: user.email,
        phone: user.phone,
        postcode: user.postcode,
        city: user.city,
        area: user.area,
        address: user.address,
        avatar: user.avatar,
      },
      secretKey,
      { expiresIn: "30m" }
    );
    // 4) 回前端用的精簡使用者資料
    const newUser = {
      id: user.id,
      name: user.name,
      birthday: user.birthday,
      email: user.email,
      phone: user.phone,
      postcode: user.postcode,
      city: user.city,
      area: user.area,
      address: user.address,
      avatar: user.avatar,
    };

    res.status(200).json({
      status: "success",
      message: "登入成功",
      data: { token, user: newUser },
    });
  } catch (error) {
    // 捕獲錯誤
    // console.log(error);
    // const statusCode = error.code ?? 400;
    // const statusText = error.status ?? "error";
    // const message = error.message ?? "登入失敗，請洽管理人員";

    // res.status(statusCode).json({
    //   status: statusText,
    //   message
    // });
    console.error("LOGIN_ERROR:", error);
    return res
      .status(500)
      .json({ status: "error", message: "登入失敗，請稍後再試" });
  }
});

// 使用者登出-----------------------------------------------
router.post("/logout", checkToken, async (req, res) => {
  try {
    const { email } = req.decoded;

    const sqlCheck1 = "SELECT * FROM `users` WHERE `email` = ?;";
    let user = await pool.execute(sqlCheck1, [email]).then(([result]) => {
      return result[0];
    });
    if (!user) {
      const err = new Error("登出失敗");
      err.code = 401;
      err.status = "error";
      throw err;
    }

    const token = jwt.sign(
      {
        message: "過期的token",
      },
      secretKey,
      { expiresIn: "-10s" }
    );
    res.status(200).json({
      status: "success",
      message: "登出成功",
      data: token,
    });
  } catch (error) {
    // 捕獲錯誤
    console.log(error);
    const statusCode = error.code ?? 400;
    const statusText = error.status ?? "error";
    const message = error.message ?? "登出失敗，請洽管理人員";

    res.status(statusCode).json({
      status: statusText,
      message,
    });
  }
});

// 檢查登入狀態-------------------------------------------
router.post("/status", checkToken, async (req, res) => {
  try {
    const { email } = req.decoded;

    const sqlCheck1 = "SELECT * FROM `users` WHERE `email` = ?;";
    let user = await pool.execute(sqlCheck1, [email]).then(([result]) => {
      return result[0];
    });

    if (!user) {
      const err = new Error("請登入");
      err.code = 401;
      err.status = "error";
      throw err;
    }

    const token = jwt.sign(
      {
        id: user.id,
        name: user.name,
        birthday: user.birthday,
        email: user.email,
        phone: user.phone,
        postcode: user.postcode,
        city: user.city,
        area: user.area,
        address: user.address,
        avatar: user.avatar,
      },
      secretKey,
      { expiresIn: "30m" }
    );

    const newUser = {
      id: user.id,
      name: user.name,
      birthday: user.birthday,
      email: user.email,
      phone: user.phone,
      postcode: user.postcode,
      city: user.city,
      area: user.area,
      address: user.address,
      avatar: user.avatar,
    };

    res.status(200).json({
      status: "success",
      message: "處於登入狀態",
      data: { token, user: newUser },
    });
  } catch (error) {
    // 捕獲錯誤
    console.log(error);
    const statusCode = error.code ?? 401;
    const statusText = error.status ?? "error";
    const message = error.message ?? "身份驗證錯誤，請洽管理人員";

    res.status(statusCode).json({
      status: statusText,
      message,
    });
  }
});

function checkToken(req, res, next) {
  // console.log("checkToken");

  let token = req.get("Authorization");
  console.log("收到的 header:", token);

  if (token && token.includes("Bearer ")) {
    // 有符合
    token = token.slice(7);
    console.log("解析後的 token:", token);
    jwt.verify(token, secretKey, (error, decoded) => {
      if (error) {
        console.log("JWT 驗證失敗:", error);
        res.status(401).json({
          status: "error",
          message: "登入驗證失效 ,請重新登入",
        });

        return;
      }
      console.log("JWT 驗證成功:", decoded);
      req.decoded = decoded;
      next();
    });
  } else {
    // 沒有符合
    res.status(401).json({
      status: "error",
      message: "無登入驗證資訊,請重新登入",
    });
  }
}

// async function getRandomAvatar() {
//   const API = "https://randomuser.me/api";
//   try {
//     const response = await fetch(API);
//     if (!response.ok)
//       throw new Error(`${response.status}: ${response.statusText}`);
//     const result = await response.json();
//     return result.results[0].picture.large;
//   } catch (error) {
//     console.log("getRandomAvatar", error.message);
//     return null;
//   }
// }

export default router;
