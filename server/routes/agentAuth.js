import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import connection from "../connect.js";

const router = express.Router();
const JWT_SECRET = "oakly-agent-secret-2024";
const JWT_EXPIRES_IN = "8h";

// 初始化客服資料表
const initAgentTable = async () => {
  try {
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS agents (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        status ENUM('available', 'busy', 'offline') DEFAULT 'offline',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // 檢查是否已有測試帳號
    const [existing] = await connection.execute('SELECT COUNT(*) as count FROM agents');
    
    if (existing[0].count === 0) {
      const hashedPassword = await bcrypt.hash('password123', 10);
      await connection.execute(`
        INSERT INTO agents (name, email, password) VALUES
        ('客服小美', 'agent1@oakly.com', ?),
        ('客服小華', 'agent2@oakly.com', ?),
        ('客服小明', 'agent3@oakly.com', ?)
      `, [hashedPassword, hashedPassword, hashedPassword]);
      console.log('客服測試帳號建立完成');
    }
  } catch (error) {
    console.error('初始化客服表失敗:', error);
  }
};

// 認證中間件
export const authenticateAgent = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: '請提供認證 Token'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    const [agents] = await connection.execute(
      'SELECT id, name, email, status FROM agents WHERE id = ?',
      [decoded.id]
    );

    if (agents.length === 0) {
      return res.status(401).json({
        status: 'error',
        message: '客服帳號不存在'
      });
    }

    req.agent = agents[0];
    next();

  } catch (error) {
    return res.status(401).json({
      status: 'error',
      message: 'Token 無效或已過期'
    });
  }
};

// 客服登入
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: 'fail',
        message: '請提供電子信箱和密碼'
      });
    }

    // 查詢客服帳號
    const [agents] = await connection.execute(
      'SELECT * FROM agents WHERE email = ?',
      [email]
    );

    if (agents.length === 0) {
      return res.status(401).json({
        status: 'fail',
        message: '電子信箱或密碼錯誤'
      });
    }

    const agent = agents[0];

    // 驗證密碼
    const isPasswordValid = await bcrypt.compare(password, agent.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        status: 'fail',
        message: '電子信箱或密碼錯誤'
      });
    }

    // 生成 JWT Token
    const token = jwt.sign(
      { 
        id: agent.id,
        email: agent.email,
        name: agent.name
      }, 
      JWT_SECRET, 
      { expiresIn: JWT_EXPIRES_IN }
    );

    // 更新狀態為上線
    await connection.execute(
      'UPDATE agents SET status = "available" WHERE id = ?',
      [agent.id]
    );

    // 準備回傳資料
    const agentData = {
      id: agent.id,
      name: agent.name,
      email: agent.email,
      status: 'available'
    };

    res.status(200).json({
      status: 'success',
      message: '登入成功',
      data: {
        user: agentData,
        token: token
      }
    });

  } catch (error) {
    console.error('登入錯誤:', error);
    res.status(500).json({
      status: 'error',
      message: '登入失敗，請稍後再試'
    });
  }
});

// 客服登出
router.post('/logout', authenticateAgent, async (req, res) => {
  try {
    const agentId = req.agent.id;

    // 更新狀態為離線
    await connection.execute(
      'UPDATE agents SET status = "offline" WHERE id = ?',
      [agentId]
    );

    res.status(200).json({
      status: 'success',
      message: '登出成功'
    });

  } catch (error) {
    console.error('登出錯誤:', error);
    res.status(500).json({
      status: 'error',
      message: '登出失敗'
    });
  }
});

// 驗證 Token (檢查登入狀態)
router.post('/status', authenticateAgent, async (req, res) => {
  try {
    res.status(200).json({
      status: 'success',
      message: 'Token 有效',
      data: {
        user: req.agent,
        token: req.headers.authorization.split(' ')[1]
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: '驗證失敗'
    });
  }
});

// 初始化
initAgentTable();

export default router;
