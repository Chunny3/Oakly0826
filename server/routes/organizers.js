import express from "express";
import connection from "../connect.js";
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// GET /api/organizers - 取得所有整理師
router.get("/", async (req, res) => {
  try {
    const [organizers] = await connection.execute("SELECT * FROM organizers");
    res.status(200).json({
      status: "success",
      data: organizers,
      message: "已獲取所有整理師"
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: "error",
      message: error.message ?? "獲取失敗，請洽管理人員"
    });
  }
});



export default router;
