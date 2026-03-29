import express from "express";
import multer from "multer";
import connection from "../connect.js";

const upload = multer();

const router = express.Router();

// 路徑順序，前面的會壓到後面的路徑

// 搜尋 日期範圍的文章
router.get("/searchByDate", async (req, res) => {
  try {
    const { startDate, endDate } = req.query; //從 query string 拿開始和結束日期
    if (!startDate || !endDate) {
      const err = new Error("請提供日期範圍(startDate, endDate");
      err.code = 400;
      err.status = "fail";
      throw err;
    }

    const sqlCheck = `
        SELECT
            a.id,
            a.title,
            DATE(a.published_date),
            MIN(ai.img) AS first_img,
            ac.name AS category_name
        FROM
            articles a
            LEFT JOIN article_img ai ON a.id = ai.article_id
            LEFT JOIN article_category ac ON a.article_category_id = ac.id
        WHERE
            DATE(published_date) BETWEEN ? AND ?
        GROUP BY
            a.id,
            a.title,
            DATE(a.published_date),
            ac.name
        ORDER BY published_date DESC`;
    const params = [startDate, endDate];

    let articles = await connection
      .execute(sqlCheck, params)
      .then(([result]) => {
        return result;
      });
    if (!articles || articles.length === 0) {
      const err = new Error("這個日期範圍沒有文章內容");
      err.code = 404;
      err.status = "fail";
      throw err;
    }
    res.status(200).json({
      status: "success",
      data: articles,
      message: "搜尋成功",
    });
  } catch (error) {
    const statusCode = error.code ?? 500;
    const statusText = error.status ?? "error";
    const message = error.message ?? "文章查詢錯誤，請洽管理人員";
    res.status(statusCode).json({
      status: statusText,
      message,
    });
  }
});

// 獲取單一文章
router.get("/detail", async (req, res) => {
  try {
    const articleId = req.query.id;
    console.log(articleId);

    if (!articleId) {
      const err = new Error("請提供文章 ID");
      err.code = 400;
      err.status = "fail";
      throw err;
    }

    const sqlCheck = `
        SELECT
            a.id,
            a.title,
            a.content,
            a.author,
            DATE(a.published_date),
            ai.img AS all_img,
            ac.name AS category_name
        FROM
            articles a
            LEFT JOIN article_img ai ON a.id = ai.article_id
            LEFT JOIN article_category ac ON a.article_category_id = ac.id
        WHERE
            a.id = ?
        GROUP BY
            a.id,
            a.title,
            a.content,
            a.author,
            DATE(a.published_date)
        `;

    const params = [articleId];
    let article = await connection
      .execute(sqlCheck, params)
      .then(([result]) => {
        return result;
      });
    if (!article || article.length === 0) {
      const err = new Error("找不到此文章");
      err.code = 400;
      err.status = "fail";
      throw err;
    }

    // // 處理圖片資料
    // const articles = result[0];
    // if (article.all_img) {
    //   article.all_img = article.all_img.split(","); // 將字串分割成陣列
    // } else {
    //   article.all_img = []; // 如果沒有圖片，設為空陣列
    // }

    res.status(200).json({
      status: "success",
      data: article,
      message: "文章搜尋成功",
    });
  } catch (error) {
    const statusCode = error.code ?? 500;
    const statusText = error.status ?? "error";
    const message = error.message ?? "文章查詢錯誤，請洽管理人員";
    res.status(statusCode).json({
      status: statusText,
      message,
    });
  }
});

// 獲取特定 keyword 的文章
router.get("/searchKeyword/", async (req, res) => {
  try {
    let keyword = req.query.keyword;
    console.log(keyword);

    keyword = keyword.replace(/[\u200B-\u200D\uFEFF]/g, "").trim();
    if (!keyword) {
      const err = new Error("請輸入要搜尋的內容");
      err.code = 400;
      err.status = "fail";
      throw err;
    }

    const sqlCheck = `
        SELECT
            a.id,
            a.title,
            DATE(a.published_date) AS published_date,
            MIN(ai.img) AS first_img,
            ac.name AS category_name
        FROM
            articles a
            LEFT JOIN article_img ai ON a.id = ai.article_id
            LEFT JOIN article_category ac ON a.article_category_id = ac.id
        WHERE
            a.title LIKE ?
        GROUP BY
            a.id,
            a.title,
            DATE(a.published_date),
            ac.name`;
    const searchTerm = `%${keyword}%`;
    let articles = await connection
      .execute(sqlCheck, [searchTerm])
      .then(([result]) => {
        return result;
      });
    if (!articles || articles.length === 0) {
      const err = new Error("找不到此文章");
      err.code = 404;
      err.status = "fail";
      throw err;
    }

    const formattedArticles = articles.map((article) => ({
      ...article,
      published_date: article.published_date.toISOString().split("T")[0],
    }));

    res.status(200).json({
      status: "success",
      data: formattedArticles,
      message: "搜尋成功",
    });
  } catch (error) {
    const statusCode = error.code ?? 500;
    const statusText = error.status ?? "error";
    const message = error.message ?? "文章查詢錯誤，請洽管理人員";
    res.status(statusCode).json({
      status: statusText,
      message,
    });
  }
});

// 獲取所有文章 只有主圖
router.get("/all", async (req, res) => {
  try {
    const sql = `
        SELECT a.id, a.title, DATE(a.published_date), MIN(ai.img) AS first_img, ac.name AS category_name
        FROM articles a
        LEFT JOIN article_img ai 
        ON a.id = ai.article_id 
        LEFT JOIN article_category ac 
        ON a.article_category_id =  ac.id
        GROUP BY a.id, a.title, DATE(a.published_date), ac.name
        `;
    let [articles] = await connection.execute(sql);
    res.status(200).json({
      status: "success",
      data: articles,
      message: "已獲取所有文章",
    });
  } catch (error) {
    console.log(error);
    const statusCode = error.code ?? 500;
    const statusText = error.status ?? "error";
    const message = error.message ?? "文章查詢錯誤，請洽管理人員";
    res.status(statusCode).json({
      status: statusText,
      message,
    });
  }
});

// 獲取 分類
router.get("/search/:id", async (req, res) => {
  try {
    const categoryId = req.params.id;

    if (!categoryId) {
      const err = new Error("請提供分類 ID");
      err.code = 400;
      err.status = "fail";
      throw err;
    }

    const sqlCheck = `
        SELECT
            a.id,
            a.title,
            DATE(a.published_date),
            MIN(ai.img) AS first_img,
            ac.name AS category_name
        FROM
            articles a
            LEFT JOIN article_img ai ON a.id = ai.article_id
            LEFT JOIN article_category ac ON a.article_category_id = ac.id
        WHERE
            article_category_id = ?
        GROUP BY
            a.id,
            a.title,
            DATE(a.published_date),
            ac.name `;
    const params = [categoryId];
    let articles = await connection
      .execute(sqlCheck, params)
      .then(([result]) => {
        return result;
      });
    if (!articles || articles.length === 0) {
      const err = new Error("找不到此分類的文章");
      err.code = 400;
      err.status = "fail";
      throw err;
    }
    res.status(200).json({
      status: "success",
      data: articles,
      message: "分類搜尋成功",
    });
  } catch (error) {
    const statusCode = error.code ?? 500;
    const statusText = error.status ?? "error";
    const message = error.message ?? "文章查詢錯誤，請洽管理人員";
    res.status(statusCode).json({
      status: statusText,
      message,
    });
  }
});

// 新增前端追蹤
router.post("/:id/track", async (req, res) => {
  try {
    const articleId = req.params.id;
    const { userId, eventType, eventData } = req.body;
    if (!eventType) {
      const err = new Error("找不到資料類型");
      err.code = 400;
      err.status = "fail";
      throw err;
    }

    const sqlCheck = `
        INSERT INTO article_tracking (article_id, user_id, event_type, event_data)
        VALUES(?,?,?,?)
        `;
    await connection.execute(sqlCheck, [
      articleId,
      userId || null,
      eventType,
      eventData ? JSON.stringify(eventData) : null,
    ]);

    res.status(201).json({
      status: "success",
      data: {},
      message: "文章追蹤事件已記錄",
    });
  } catch (error) {
    const statusCode = error.code ?? 500;
    const statusText = error.status ?? "error";
    const message = error.message ?? "文章追蹤失敗";
    res.status(statusCode).json({
      status: statusText,
      message,
    });
  }
});

// 熱門文章
router.get("/stats/popular", async (req, res) => {
  try {
    const sqlCheck = `
        SELECT a.id, a.title, DATE(a.published_date), MIN(ai.img) AS first_img, ac.name AS category_name, COUNT(at.id) AS view_count
        FROM articles a
        LEFT JOIN article_tracking at ON a.id = at.article_id AND at.event_type = 'view'
        LEFT JOIN article_img ai ON a.id = ai.article_id
        LEFT JOIN article_category ac ON a.article_category_id = ac.id
        GROUP BY a.id, a.title, DATE(a.published_date), ac.name
        ORDER BY view_count DESC
        `;

    const [rows] = await connection.execute(sqlCheck);
    res.status(200).json({
      status: "success",
      data: rows,
      message: "最多觀看數的文章",
    });
  } catch (error) {
    const statusCode = error.code ?? 500;
    const statusText = error.status ?? "error";
    const message = error.message ?? "文章追蹤失敗";
    res.status(statusCode).json({
      status: statusText,
      message,
    });
  }
});

// 收藏文章
router.get("/stats/bookmark", async (req, res) => {
  try {
    const sqlCheck = `
            SELECT a.id, a.title, DATE(a.published_date), MIN(ai.img) AS first_img, ac.name AS category_name, COUNT(at.id) AS bookmark_count
            FROM articles a
            LEFT JOIN article_tracking at ON a.id = at.article_id AND at.event_type = 'like'
            LEFT JOIN article_img ai ON a.id = ai.article_id
            LEFT JOIN article_category ac ON a.article_category_id = ac.id
            GROUP BY a.id, a.title, DATE(a.published_date), ac.name
            ORDER BY bookmark_count DESC
        `;

    const [rows] = await connection.execute(sqlCheck);
    res.status(200).json({
      status: "success",
      data: rows,
      message: "最多收藏的文章",
    });
  } catch (error) {
    const statusCode = error.code ?? 500;
    const statusText = error.status ?? "error";
    const message = error.message ?? "文章追蹤失敗";
    res.status(statusCode).json({
      status: statusText,
      message,
    });
  }
});

// 分享最多
router.get("/stats/shared", async (req, res) => {
  try {
    const sqlCheck = `
            SELECT a.id, a.title,  DATE(a.published_date), MIN(ai.img) AS first_img, ac.name AS category_name, COUNT(at.id) AS share_count
            FROM articles a
            LEFT JOIN article_tracking at ON a.id = at.article_id AND at.event_type = 'share'
            LEFT JOIN article_img ai ON a.id = ai.article_id
            LEFT JOIN article_category ac ON a.article_category_id = ac.id
            GROUP BY a.id, a.title, DATE(a.published_date), ac.name
            ORDER BY share_count DESC
        `;
    const [rows] = await connection.execute(sqlCheck);
    res.status(200).json({
      status: "success",
      data: rows,
      message: "最多觀看數的文章",
    });
  } catch (error) {
    const statusCode = error.code ?? 500;
    const statusText = error.status ?? "error";
    const message = error.message ?? "文章追蹤失敗";
    res.status(statusCode).json({
      status: statusText,
      message,
    });
  }
});

export default router;
