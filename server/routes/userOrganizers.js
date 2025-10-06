import express from "express";
import connection from "../connect.js";
import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import jwt from "jsonwebtoken";


// 設定 multer 儲存配置
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/booking_images/");
  },
  filename: (req, file, cb) => {
    const uniqueName = uuidv4() + path.extname(file.originalname);
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 限制 5MB
  },
});

const router = express.Router();
const secretKey = process.env.JWT_SECRET_KEY;

// 後端檢查token
function checkToken(req, res, next) {
  let token = req.get("Authorization");
  if (token && token.includes("Bearer ")) {
    token = token.slice(7);
    jwt.verify(token, secretKey, (error, decoded) => {
      if (error) {
        return res.status(401).json({
          status: "error",
          message: "登入驗證失效，請重新登入",
        });
      }
      req.decoded = decoded;
      next();
    });
  } else {
    res.status(401).json({
      status: "error",
      message: "無登入驗證資訊，請重新登入",
    });
  }
}

//-------------------------------------------------------------------------------------
//GET /api/user/organizers - 取得user的預約諮詢頁列表
router.get("/", checkToken, async (req, res) => {
  try {
    const userId = req.decoded.id; // 從 token 取得

    const sql = `SELECT 
    CONCAT('#', LPAD(b.id, 7, '0')) as booking_id, 
    CASE 
        WHEN b.status IN (1, 4) THEN DATE_FORMAT(b.service_datetime, '%Y/%m/%d')
        ELSE DATE_FORMAT(b.service_datetime, '%Y/%m/%d %H:%i')
    END as service_datetime,
    CONCAT(b.city, b.district, b.address) as full_address,
    DATE_FORMAT(b.created_at, '%Y/%m/%d %H:%i') as created_at,
    b.price,
    b.status,
    o.name as organizer_name
    FROM bookings b
    JOIN organizers o ON b.organizer_id = o.id  
    WHERE b.user_id = ? AND b.is_valid = 1
    ORDER BY b.created_at DESC`;

    const [bookings] = await connection.execute(sql, [userId]);

    res.status(200).json({
      status: "success",
      data: bookings,
      message: "取得使用者的預約資訊列表",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: "error",
      message: error.message ?? "獲取失敗，請洽管理人員",
    });
  }
});

//GET /api/user/organizers/:bookingId - 取得使用者的預約資訊詳細頁
router.get("/:bookingId", checkToken, async (req, res) => {

  try {
    const userId = req.decoded.id; // 從 token 取得真正的 userId
    const { bookingId } = req.params;

    const sql = `
    SELECT 
      CONCAT('#', LPAD(b.id, 7, '0')) as booking_id,
      b.id as raw_booking_id,
      u.name as user_name,
      u.email as user_email, 
      u.phone as user_phone,
      o.name as organizer_name,   
      o.id as organizer_id,   
      b.organizer_id as booking_organizer_id,
      b.city,
      b.district, 
      b.address,
      CASE 
      WHEN b.status IN (1, 4) THEN DATE_FORMAT(b.service_datetime, '%Y/%m/%d')
      ELSE DATE_FORMAT(b.service_datetime, '%Y/%m/%d %H:%i')
      END as service_datetime,
      CONCAT(b.city, b.district, b.address) as full_address,
      DATE_FORMAT(b.created_at, '%Y/%m/%d %H:%i') as created_at,
      b.price,
      b.status,
      b.note,
      CASE b.status
        WHEN 1 THEN '諮詢中'
        WHEN 2 THEN '預約成功'
        WHEN 3 THEN '服務完成'
        WHEN 4 THEN '已取消'
      END as status_text
    FROM bookings b
    JOIN users u ON b.user_id = u.id
    JOIN organizers o ON b.organizer_id = o.id
    WHERE b.user_id = ? AND LPAD(b.id, 7, '0') = ? AND b.is_valid = 1`;

    const [bookings] = await connection.execute(sql, [userId, bookingId]);

    if (bookings.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "找不到該預約資訊",
      });
    }

    const booking = bookings[0];

    // 取得環境照片
    const imageSql = `
    SELECT image_url 
    FROM booking_images 
    WHERE booking_id = ?
    ORDER BY created_at ASC`;

    const [images] = await connection.execute(imageSql, [
      booking.raw_booking_id,
    ]);

    booking.images = images.map((img) => img.image_url);

    res.status(200).json({
      status: "success",
      data: booking,
      message: "取得使用者的預約資訊詳情",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: "error",
      message: error.message ?? "獲取失敗，請洽管理人員",
    });
  }
});

//POST /api/user/organizers/add - (新增) 預約諮詢表單
router.post("/add", checkToken, upload.array("photos", 4), async (req, res) => {
  try {
    const userId = req.decoded.id; // 從 token 取得
    const {
      city,
      district,
      address,
      organizer_id,
      service_datetime,
      note,
    } = req.body;

    const sql = `INSERT INTO bookings 
                 (user_id, city, district, address, organizer_id, service_datetime, note) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`;

    const [bookingResult] = await connection.execute(sql, [
      userId,
      city,
      district,
      address,
      organizer_id,
      service_datetime,
      note,
    ]);

    const bookingId = bookingResult.insertId;

    // 處理圖片
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const imageUrl = `/uploads/booking_images/${file.filename}`;
        const imageSql = `INSERT INTO booking_images (booking_id, image_url) VALUES (?, ?)`;
        await connection.execute(imageSql, [bookingId, imageUrl]);
      }
    }

    res.status(201).json({
      status: "success",
      data: {
        booking_id: bookingId,
        uploaded_images: req.files ? req.files.length : 0,
      },
      message: "提交諮詢表單成功",
    });
  } catch (error) {
    console.log(error);
    const statusCode = error.code ?? 500;
    const statusText = error.status ?? "error";
    const message = error.message ?? "提交失敗，請洽管理人員";
    res.status(statusCode).json({
      status: statusText,
      message,
    });
  }
});

//PUT /api/user/organizers/:bookingId - ( 編輯 ) 預約資訊
router.put(
  "/:bookingId", checkToken,
  upload.array("photos", 4),
  async (req, res) => {
    try {
      const userId = req.decoded.id; // 從 token 取得
      const { bookingId } = req.params;
      const {
        city,
        district,
        address,
        organizer_id,
        service_datetime,
        note,
        remove_images, // 要刪除的圖片 URL 陣列
      } = req.body;

      // 先檢查預約是否存在且屬於該用戶
      const checkSql = `
      SELECT id, status 
      FROM bookings 
      WHERE user_id = ? AND LPAD(id, 7, '0') = ? AND is_valid = 1`;

      const [existingBooking] = await connection.execute(checkSql, [
        userId,
        bookingId,
      ]);

      if (existingBooking.length === 0) {
        return res.status(404).json({
          status: "error",
          message: "找不到該預約資訊或無權限編輯",
        });
      }

      const booking = existingBooking[0];
      const rawBookingId = booking.id;

      // 檢查預約狀態是否可編輯（已完成或已取消不能編輯）
      if (booking.status === 3 || booking.status === 4) {
        return res.status(400).json({
          status: "error",
          message: "此預約狀態無法編輯",
        });
      }

      // 更新預約基本資訊
      const updateSql = `
      UPDATE bookings 
      SET city = ?, district = ?, address = ?, organizer_id = ?, 
          service_datetime = ?, note = ?
      WHERE id = ?`;

      await connection.execute(updateSql, [
        city,
        district,
        address,
        organizer_id,
        service_datetime,
        note,
        rawBookingId,
      ]);

      // 圖片處理：如果有上傳新圖片，就完全替換舊圖片
      if (req.files && req.files.length > 0) {
        // 先取得現有圖片資訊
        const getImagesSql = `SELECT image_url FROM booking_images WHERE booking_id = ?`;
        const [existingImages] = await connection.execute(getImagesSql, [rawBookingId]);

        // 刪除資料庫中的舊圖片記錄
        const deleteImagesSql = `DELETE FROM booking_images WHERE booking_id = ?`;
        await connection.execute(deleteImagesSql, [rawBookingId]);

        // 刪除實體檔案
        for (const imageRecord of existingImages) {
          try {
            // 移除開頭的 / 並加上完整路徑
            const fileName = imageRecord.image_url.replace('/uploads/booking_images/', '');
            const filePath = `uploads/booking_images/${fileName}`;
            fs.unlinkSync(filePath);
            console.log(`已刪除檔案: ${filePath}`);
          } catch (error) {
            console.log(`刪除檔案失敗: ${imageRecord.image_url}`, error.message);
          }
        }

        // 新增新圖片記錄
        for (const file of req.files) {
          const imageUrl = `/uploads/booking_images/${file.filename}`;
          const imageSql = `INSERT INTO booking_images (booking_id, image_url) VALUES (?, ?)`;
          await connection.execute(imageSql, [rawBookingId, imageUrl]);
        }
      }

      res.status(200).json({
        status: "success",
        message: "預約資訊更新成功",
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        status: "error",
        message: error.message ?? "更新失敗，請洽管理人員",
      });
    }
  }
);

//DELETE /api/user/organizers/:bookingId - (取消) 預約資訊
router.delete("/:bookingId",checkToken, async (req, res) => {
  try {
    const userId = req.decoded.id; // 從 token 取得
    const { bookingId } = req.params;

    // 步驟1: 檢查預約是否存在且屬於該用戶
    const checkSql = `
      SELECT id, status 
      FROM bookings 
      WHERE user_id = ? AND LPAD(id, 7, '0') = ? AND is_valid = 1`;

    const [existingBooking] = await connection.execute(checkSql, [
      userId,
      bookingId,
    ]);

    if (existingBooking.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "找不到該預約資訊或無權限取消",
      });
    }

    const booking = existingBooking[0];
    const rawBookingId = booking.id;

    // 步驟2: 檢查預約狀態是否可取消
    if (booking.status === 3 || booking.status === 4) {
      return res.status(400).json({
        status: "error",
        message: "此預約狀態無法取消",
      });
    }

    // 步驟3: 更新狀態為已取消 (4)
    const cancelSql = `
      UPDATE bookings 
      SET status = 4 
      WHERE id = ?`;

    await connection.execute(cancelSql, [rawBookingId]);

    res.status(200).json({
      status: "success",
      message: "預約取消成功",
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: "error",
      message: error.message ?? "取消失敗，請洽管理人員",
    });
  }
});

export default router;
