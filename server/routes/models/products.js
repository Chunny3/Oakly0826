import pool from "../../connect.js"; 

export async function getProductsFromDB() {
  const [rows] = await pool.query(`
    SELECT p.*, pi.img
    FROM products p
    LEFT JOIN product_img pi ON p.id = pi.product_id
    WHERE p.is_valid = 1
  `);
  return rows;}