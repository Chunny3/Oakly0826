// testConnection.js
import pool from './connect.js';

async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ 資料庫連線成功！');
    connection.release();
  } catch (error) {
    console.error('❌ 資料庫連線失敗:', error);
  }
}

testConnection();
