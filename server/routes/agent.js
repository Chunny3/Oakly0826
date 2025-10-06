// routes/chat.js - 聊天系統路由
import express from "express";
import { Server } from "socket.io";
import connection from "../connect.js";
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
// const secretKey = process.env.JWT_SECRET_KEY;
//要切換
// const secretKey = "myTestSecretKey123";
const secretKey = process.env.JWT_SECRET_KEY || "myTestSecretKey123";

const router = express.Router();


const uploadDir = 'public/uploads/chat';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 配置 multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB 限制
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('只允许上传图片文件'), false);
    }
  }
});

// 在線用戶管理 (全域變數，在整個應用中共享)
let onlineUsers = new Map();
let customerServiceAgents = new Map();
let sentTransferRequests = new Set(); 
let io = null;

// 初始化 WebSocket
export const initializeChatWebSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: ["http://localhost:3000", "http://localhost:3005", "http://localhost:5173"],
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  // 初始化聊天資料庫表
  const initializeChatTables = async () => {
    try {
      // 建立聊天室表
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS chat_rooms (
          id INT AUTO_INCREMENT PRIMARY KEY,
          customer_id VARCHAR(100) NOT NULL,  
          customer_name VARCHAR(100),
          agent_id INT,
          agent_name VARCHAR(100),
          status ENUM('waiting', 'active', 'closed') DEFAULT 'waiting',
          is_authenticated BOOLEAN DEFAULT FALSE,  
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_customer (customer_id),
          INDEX idx_status (status)
        )
      `);

      // 建立訊息表
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS chat_messages (
          id INT AUTO_INCREMENT PRIMARY KEY,
          room_id INT NOT NULL,
          sender_id VARCHAR(100) NOT NULL,
          sender_name VARCHAR(100),
          sender_type ENUM('customer', 'agent') NOT NULL,
          message TEXT NOT NULL,
          message_type ENUM('text', 'image', 'file') DEFAULT 'text',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (room_id) REFERENCES chat_rooms(id) ON DELETE CASCADE,
          INDEX idx_room (room_id),
          INDEX idx_created (created_at)
        )
      `);

    } catch (error) {
      console.error('聊天資料庫初始化失敗:', error);
    }
  };


  // 改進 JWT 中間件
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;


      if (token) {
        const decoded = jwt.verify(token, secretKey);

        // 修正：確保用戶資料結構正確
        socket.userData = {
          id: decoded.id || decoded.userId || decoded.sub,
          name: decoded.name || decoded.userName || decoded.username,
          email: decoded.email || decoded.userEmail,
          // 保留原始 decoded 資料以備用
          originalPayload: decoded
        };
        socket.isAuthenticated = true;

      } else {
        socket.userData = null;
        socket.isAuthenticated = false;
      }

      next();
    } catch (err) {
      socket.userData = null;
      socket.isAuthenticated = false;
      next(); // 仍然允許連接，但標記為未認證
    }
  });


  // WebSocket 事件處理
  io.on('connection', (socket) => {



    // 客戶加入聊天系統
    socket.on('join_as_customer', async (userData) => {
      try {
        let userId, userName, isAuthenticated;
    
        if (socket.isAuthenticated && socket.userData) {
          userId = socket.userData.id;
          userName = socket.userData.name;
          isAuthenticated = true;
        } else {
          userId = `guest_${socket.id}`;
          userName = userData?.userName || '訪客';
          isAuthenticated = false;
        }
    
        // 檢查是否已有該用戶的連接
        if (isAuthenticated) {
          for (const [existingUserId, userInfo] of onlineUsers.entries()) {
            if (existingUserId === userId && userInfo.socketId !== socket.id) {
              console.log(`🔄 用戶 ${userId} 重複連接，斷開舊連接 ${userInfo.socketId}`);
              const oldSocket = io.sockets.sockets.get(userInfo.socketId);
              if (oldSocket) {
                oldSocket.emit('force_disconnect', { reason: '新連接已建立' });
                oldSocket.disconnect(true);
              }
              onlineUsers.delete(existingUserId);
            }
          }
        }
    
        onlineUsers.set(userId, {
          socketId: socket.id,
          userName: userName,
          isAuthenticated: isAuthenticated
        });
    
        socket.userId = userId;
        socket.userName = userName;
        socket.userType = 'customer';
    
        // 🔥 添加這段完整的歷史聊天檢查邏輯
        if (isAuthenticated) {
          const [existingRooms] = await connection.execute(
            'SELECT * FROM chat_rooms WHERE customer_id = ? AND status IN ("waiting", "active") ORDER BY created_at DESC LIMIT 1',
            [userId]
          );
    
          if (existingRooms.length > 0) {
            const room = existingRooms[0];
            socket.join(`room_${room.id}`);
    
            const [messages] = await connection.execute(
              'SELECT * FROM chat_messages WHERE room_id = ? ORDER BY created_at ASC',
              [room.id]
            );
    
            socket.emit('room_joined', {
              roomId: room.id,
              status: room.status,
              agentName: room.agent_name,
              messages: messages
            });
            return;
          }
        }
    
        // 如果沒有現有房間，發送連接成功訊息
        socket.emit('connection_success', {
          userId: userId,
          userName: userName,
          isAuthenticated: isAuthenticated
        });
    
      } catch (error) {
        console.error('客戶加入失敗:', error);
        socket.emit('error', { message: '連接失敗，請重新整理頁面' });
      }
    });

    socket.on('join_as_agent', async (agentData) => {
      try {
        const { agentId, agentName } = agentData;
        
        // 驗證 agentId 不能為空
        if (!agentId || agentId === undefined || agentId === null) {
          console.error('客服 ID 無效:', agentId);
          socket.emit('error', { message: '客服 ID 不能為空' });
          return;
        }
        
        // 客服加入 agents 房間
        socket.join('agents');
        console.log(`客服 ${agentName} (ID: ${agentId}) 已加入 agents 房間`);
        
        // 註冊客服資訊
        customerServiceAgents.set(agentId, {
          socketId: socket.id,
          agentId: agentId,
          agentName: agentName || `客服${agentId}`,
          status: 'available'
        });
        
        // 🔥 關鍵：設定 socket 屬性
        socket.agentId = agentId;
        socket.agentName = agentName || `客服${agentId}`;
        socket.userType = 'agent';
        
        console.log(`設定 socket.agentId = ${socket.agentId}`);
        
        // 通知客服連接成功
        socket.emit('agent_connected', {
          success: true,
          agentId: agentId,
          agentName: agentName
        });
    
        // 取得當前等待中的客戶列表（傳統客服請求）
        const [waitingRooms] = await connection.execute(
          'SELECT * FROM chat_rooms WHERE status = "waiting" AND customer_id NOT LIKE "guest_%" AND customer_id NOT LIKE "transfer_%" ORDER BY created_at ASC'
        );
    
        socket.emit('waiting_customers', waitingRooms);
    
        // 改進等待轉接的查詢 - 使用更嚴格的去重邏輯
        const [waitingTransfers] = await connection.execute(`
          SELECT 
            MIN(id) as id,
            customer_id,
            customer_name,
            is_authenticated,
            MIN(created_at) as created_at,
            SUBSTRING_INDEX(SUBSTRING_INDEX(customer_id, '_', 2), '_', -1) as user_base_id
          FROM chat_rooms 
          WHERE status = "waiting" AND customer_id LIKE "transfer_%" 
          GROUP BY SUBSTRING_INDEX(SUBSTRING_INDEX(customer_id, '_', 2), '_', -1)
          ORDER BY MIN(created_at) ASC
        `);
    
        console.log(`找到 ${waitingTransfers.length} 個去重後的轉接請求`);
    
        // 發送去重後的轉接請求
        for (const transfer of waitingTransfers) {
          const [chatHistory] = await connection.execute(
            'SELECT * FROM chat_messages WHERE room_id = ? ORDER BY created_at ASC',
            [transfer.id]
          );
    
          socket.emit('new_transfer_request', {
            roomId: `human_${transfer.id}`,
            customer: {
              userName: transfer.customer_name || '轉接客戶',
              isAuthenticated: transfer.is_authenticated
            },
            chatHistory: chatHistory,
            transferReason: '客戶轉接請求（等待中）',
            timestamp: transfer.created_at
          });
        }
        
      } catch (error) {
        console.error('客服加入失敗:', error);
        socket.emit('error', { message: '客服連接失敗' });
      }
    });

    // 客戶請求客服
    socket.on('request_customer_service', async (data) => {
      try {
        const { message } = data;

        let userId, userName, isAuthenticated, userEmail;

        // 修正：使用更靈活的方式取得用戶資料
        if (socket.isAuthenticated && socket.userData) {
          // 認證用戶 - 檢查不同可能的 JWT payload 結構
          userId = socket.userData.id || socket.userData.userId || socket.userData.sub;
          userName = socket.userData.name || socket.userData.userName || socket.userData.username;
          userEmail = socket.userData.email || socket.userData.userEmail;
          isAuthenticated = true;

        } else if (data && data.isAuthenticated && data.userId) {
          // 後備方案：使用前端傳來的資料（但要驗證合理性）
          userId = data.userId;
          userName = data.userName || '會員';
          userEmail = data.userEmail;
          isAuthenticated = true;

        } else {
          // 訪客用戶
          userId = `guest_${socket.id}`;
          userName = data?.userName || '訪客'; // 修正：使用前端傳來的名稱
          userEmail = null;
          isAuthenticated = false;

        }

        // 建立新聊天室
        const [result] = await connection.execute(
          'INSERT INTO chat_rooms (customer_id, customer_name, status, is_authenticated) VALUES (?, ?, "waiting", ?)',
          [userData.userId || `guest_${socket.id}`, userData.userName, userData.isAuthenticated]
        );

        const roomId = result.insertId;
        socket.join(`room_${roomId}`);

        // 儲存初始訊息
        if (message && message.trim()) {
          await connection.execute(
            'INSERT INTO chat_messages (room_id, sender_id, sender_name, sender_type, message) VALUES (?, ?, ?, "customer", ?)',
            [roomId, userId, userName, message]
          );
        }


        // 通知客戶聊天室已建立
        socket.emit('room_created', {
          roomId,
          status: 'waiting',
          message: '正在為您尋找客服...'
        });

        // 通知所有在線客服 - 修正：使用正確的用戶資料
        const roomData = {
          id: roomId,
          customer_id: userId,
          customer_name: userName,
          customer_email: userEmail,
          status: 'waiting',
          is_authenticated: isAuthenticated, // 加上這個欄位
          created_at: new Date().toISOString(),
          initial_message: isAuthenticated ?
            `會員 ${userName} 正在等待服務` :
            (message || '客戶正在等待服務...')
        };


        customerServiceAgents.forEach((agent) => {
          io.to(agent.socketId).emit('new_customer_waiting', roomData);
        });

      } catch (error) {
        console.error('請求客服失敗:', error);
        socket.emit('error', { message: '請求客服失敗，請稍後重試' });
      }
    });


   

    // 客服接受聊天
    socket.on('accept_chat', async (data) => {
      try {
        const { roomId, agentId } = data;

        const currentAgentId = socket.agentId;
        if (!currentAgentId) {
          socket.emit('error', { message: '客服資訊遺失，請重新整理頁面' });
          return;
        }

        let agentInfo = customerServiceAgents.get(currentAgentId);
        if (!agentInfo) {
          agentInfo = {
            socketId: socket.id,
            agentName: socket.agentName || `客服${currentAgentId}`,
            status: 'available'
          };
          customerServiceAgents.set(currentAgentId, agentInfo);
        }

        // 獲取完整的聊天室資訊
        const [roomCheck] = await connection.execute(
          'SELECT * FROM chat_rooms WHERE id = ?', // 改為 SELECT *
          [roomId]
        );

        if (roomCheck.length === 0) {
          socket.emit('error', { message: '聊天室不存在' });
          return;
        }

        if (roomCheck[0].status !== 'waiting') {
          socket.emit('error', { message: '聊天室已被其他客服接受' });
          return;
        }

        // 更新聊天室狀態
        await connection.execute(
          'UPDATE chat_rooms SET agent_id = ?, agent_name = ?, status = "active" WHERE id = ?',
          [currentAgentId, agentInfo.agentName, roomId] // 使用 currentAgentId
        );

        // 更新客服狀態
        agentInfo.status = 'busy';
        customerServiceAgents.set(currentAgentId, agentInfo);

        socket.join(`room_${roomId}`);

        // 載入歷史訊息
        const [messages] = await connection.execute(
          'SELECT * FROM chat_messages WHERE room_id = ? ORDER BY created_at ASC',
          [roomId]
        );


        // 通知聊天室內所有人（包含客戶名稱）
        io.to(`room_${roomId}`).emit('chat_accepted', {
          roomId,
          agentId: currentAgentId,
          agentName: agentInfo.agentName,
          customerName: roomCheck[0].customer_name, // 加入客戶名稱
          messages
        });

        // 通知其他客服此聊天已被接受
        customerServiceAgents.forEach((agent, id) => {
          if (id !== currentAgentId) {
            io.to(agent.socketId).emit('chat_taken', { roomId });
          }
        });

      } catch (error) {
        console.error('接受聊天失敗:', error);
        socket.emit('error', { message: '接受聊天失敗' });
      }
    });
    // 在後端 socket 事件監聽中添加
    socket.on('send_message_to_bot', (data) => {
      const { message, roomId, userData } = data;

      // 根據快速回覆內容生成回應
      let botResponse = '';

      switch (message) {
        case '產品諮詢':
          botResponse = '我們提供各式家具產品，包括沙發、床組、餐桌椅等。您想了解哪類產品呢？可以告訴我您的需求，我會為您推薦合適的商品。';
          break;
        case '訂單查詢':
          botResponse = userData.isAuthenticated ?
            '請提供您的訂單編號，我來幫您查詢訂單狀態。' :
            '請先登入會員帳號，或提供您的訂單編號和聯絡電話。';
          break;
        case '退換貨服務':
          botResponse = '我們提供 7 天鑑賞期，商品如有瑕疵可申請退換貨。請告訴我您遇到的問題，我會協助您處理。';
          break;
        case '配送問題':
          botResponse = '關於配送問題，我可以幫您查詢配送進度或安排配送時間。請告訴我您的具體需求。';
          break;
        case '售後服務':
          botResponse = '我們提供完整的售後服務保障。請描述您遇到的問題，我會為您安排適當的處理方式。';
          break;
        case '其他問題':
          botResponse = '請告訴我您想了解的問題，我會盡力為您解答。如需更詳細的協助，也可以轉接真人客服。';
          break;
        default:
          botResponse = '我收到您的訊息了，請稍等片刻讓我為您查詢相關資訊...';
      }

      // 模擬機器人思考時間
      setTimeout(() => {
        socket.emit('bot_response', {
          message: botResponse,
          timestamp: new Date().toISOString()
        });
      }, 1000 + Math.random() * 2000); // 1-3秒隨機延遲
    });
    // 發送訊息
    socket.on('send_message', async (data) => {
      try {
        const { roomId, message, messageType = 'text' } = data;
        const senderId = socket.userId || socket.agentId;
        const senderName = socket.userName || socket.agentName;
        const senderType = socket.userType;

        if (!message || !message.trim()) {
          return;
        }

        // 確保客服也在聊天室中
        if (senderType === 'agent') {
          socket.join(`room_${roomId}`);
        }

        // 儲存訊息到資料庫
        const [result] = await connection.execute(
          'INSERT INTO chat_messages (room_id, sender_id, sender_name, sender_type, message, message_type) VALUES (?, ?, ?, ?, ?, ?)',
          [roomId, senderId, senderName, senderType, message.trim(), messageType]
        );

        const messageData = {
          id: result.insertId,
          room_id: roomId,
          sender_id: senderId,
          sender_name: senderName,
          sender_type: senderType,
          message: message.trim(),
          message_type: messageType,
          created_at: new Date().toISOString()
        };


        // 廣播訊息給聊天室內所有用戶
        io.to(`room_${roomId}`).emit('new_message', messageData);


      } catch (error) {
        console.error('發送訊息失敗:', error);
        socket.emit('error', { message: '訊息發送失敗' });
      }
    });

    socket.on('request_human_transfer', async (data) => {
      const { roomId, userData, previousMessages, transferReason } = data;
      
      // 🔥 改進去重邏輯 - 使用更唯一的標識
      const transferCustomerId = `transfer_${userData.userId || socket.id}_${Date.now()}`;
      
      try {
        // 🔥 檢查是否已有相同用戶的等待轉接（更嚴格的查詢）
        const [existingTransfer] = await connection.execute(
          'SELECT * FROM chat_rooms WHERE (customer_id LIKE ? OR customer_id LIKE ?) AND status = "waiting"',
          [`transfer_${userData.userId || socket.id}%`, `%${userData.userId || socket.id}%`]
        );
        
        if (existingTransfer.length > 0) {
          console.log(`⚠️ 轉接已存在 - 用戶: ${userData.userId || socket.id}`);
          socket.emit('transfer_initiated', {
            newRoomId: `human_${existingTransfer[0].id}`,
            status: 'waiting',
            message: '您的轉接請求已在處理中，請稍候...'
          });
          return;
        }
    
        // 創建新的轉接房間
        const [result] = await connection.execute(
          'INSERT INTO chat_rooms (customer_id, customer_name, status, is_authenticated) VALUES (?, ?, "waiting", ?)',
          [transferCustomerId, userData.userName, userData.isAuthenticated]
        );
        
        const dbRoomId = result.insertId;
        console.log(`✅ 創建新轉接房間: ${dbRoomId}`);
        
        // 🔥 修正：保存聊天記錄時處理 null 的 userId
        for (const msg of previousMessages) {
          let senderType = msg.sender_type === 'bot' ? 'customer' : msg.sender_type;
          
          // 🔥 關鍵修正：處理非會員用戶的 sender_id
          let senderId;
          if (msg.sender_type === 'customer') {
            senderId = userData.userId || userData.userName || 'guest_user'; // 非會員用戶使用替代ID
          } else {
            senderId = 'bot';
          }
          
          await connection.execute(
            'INSERT INTO chat_messages (room_id, sender_id, sender_name, sender_type, message, message_type) VALUES (?, ?, ?, ?, ?, ?)',
            [dbRoomId, senderId, userData.userName, senderType, msg.message, msg.message_type || 'text']
          );
        }
        
        // 發送轉接請求給所有客服
        io.to('agents').emit('new_transfer_request', {
          roomId: `human_${dbRoomId}`,
          customer: userData,
          chatHistory: previousMessages,
          transferReason: transferReason,
          timestamp: new Date()
        });
        
        socket.emit('transfer_initiated', {
          newRoomId: `human_${dbRoomId}`,
          status: 'waiting',
          message: '您的轉接請求已送出，客服專員將盡快為您服務'
        });
        
      } catch (error) {
        console.error('轉接處理失敗:', error);
        socket.emit('error', { message: '轉接失敗，請稍後重試' });
      }
    });
    socket.on('accept_transfer', async (data) => {
      try {
        const { roomId } = data;
        const dbRoomId = roomId.replace('human_', '');
        const currentAgentId = socket.agentId;
        let agentInfo = customerServiceAgents.get(currentAgentId);
        
        // 獲取聊天室資訊
        const [roomInfo] = await connection.execute(
          'SELECT * FROM chat_rooms WHERE id = ?',
          [dbRoomId]
        );
        
        if (roomInfo.length === 0) {
          socket.emit('error', { message: '聊天室不存在' });
          return;
        }
        
        // 更新聊天室狀態
        await connection.execute(
          'UPDATE chat_rooms SET agent_id = ?, agent_name = ?, status = "active" WHERE id = ?',
          [currentAgentId, agentInfo.agentName, dbRoomId]
        );
        
        socket.join(`room_${dbRoomId}`);
    
        // 讓客戶加入聊天室
        const allSockets = await io.fetchSockets();
        allSockets.forEach(clientSocket => {
          if (clientSocket.userType === 'customer') {
            clientSocket.join(`room_${dbRoomId}`);
          }
        });
    
        // 🔥 載入歷史訊息並過濾機器人訊息
        const [allMessages] = await connection.execute(
          'SELECT * FROM chat_messages WHERE room_id = ? ORDER BY created_at ASC',
          [dbRoomId]
        );
    
        // 🔥 過濾掉機器人訊息
        const filteredMessages = allMessages.filter(msg => {
          if (msg.sender_type === 'bot') return false;
          if (msg.sender_id === 'bot') return false;
          if (msg.message && msg.message.includes('Oakly 智能助手')) return false;
          if (msg.message && msg.message.includes('智能助手')) return false;
          return msg.sender_type === 'customer' || msg.sender_type === 'agent';
        });
    
        // 添加客服歡迎訊息
        const welcomeMessage = `您好！我是客服 ${agentInfo.agentName}，已接手為您服務。請問有什麼可以幫助您的？`;
        
        const [welcomeResult] = await connection.execute(
          'INSERT INTO chat_messages (room_id, sender_id, sender_name, sender_type, message, message_type) VALUES (?, ?, ?, ?, ?, ?)',
          [dbRoomId, currentAgentId, agentInfo.agentName, 'agent', welcomeMessage, 'text']
        );
    
        const welcomeMessageData = {
          id: welcomeResult.insertId,
          room_id: dbRoomId,
          sender_id: currentAgentId,
          sender_name: agentInfo.agentName,
          sender_type: 'agent',
          message: welcomeMessage,
          message_type: 'text',
          created_at: new Date().toISOString()
        };
    
        // 🔥 通知聊天室，使用過濾後的訊息
        io.to(`room_${dbRoomId}`).emit('chat_accepted', {
          roomId: parseInt(dbRoomId),
          agentId: currentAgentId,
          agentName: agentInfo.agentName,
          customerName: roomInfo[0].customer_name || '客戶',
          messages: [...filteredMessages, welcomeMessageData] // 使用過濾後的訊息
        });
    
        // 通知其他客服此轉接已被接受
        socket.to('agents').emit('transfer_accepted_by_other', {
          roomId: roomId
        });
    
        agentInfo.status = 'busy';
        customerServiceAgents.set(currentAgentId, agentInfo);
    
      } catch (error) {
        console.error('接受轉接失敗:', error);
        socket.emit('error', { message: '接受轉接失敗' });
      }
    });

    // 取得客服的進行中對話
    socket.on('get_active_chats', async (data) => {
      try {
        const { agentId } = data;

        // 查詢該客服的進行中對話
        const [activeRooms] = await connection.execute(
          'SELECT * FROM chat_rooms WHERE agent_id = ? AND status = "active"',
          [agentId]
        );

        const chats = activeRooms.map(room => ({
          roomId: room.id,
          agentId: room.agent_id,
          customerName: room.customer_name,
          status: room.status
        }));

        socket.emit('active_chats_loaded', chats);

        // 讓客服重新加入這些聊天室
        activeRooms.forEach(room => {
          socket.join(`room_${room.id}`);
        });

      } catch (error) {
      }
    });// 確保加入聊天室並發送訊息
    socket.on('join_room_and_send', async (data) => {
      try {
        const { roomId, message, messageType = 'text' } = data;

        // 確保客服在聊天室中
        socket.join(`room_${roomId}`);

        // 驗證客服確實在聊天室中
        const socketsInRoom = await io.in(`room_${roomId}`).fetchSockets();

        // 發送訊息
        const senderId = socket.agentId;
        const senderName = socket.agentName;
        const senderType = 'agent';

        if (!message || !message.trim()) {
          return;
        }

        // 儲存到資料庫
        const [result] = await connection.execute(
          'INSERT INTO chat_messages (room_id, sender_id, sender_name, sender_type, message, message_type) VALUES (?, ?, ?, ?, ?, ?)',
          [roomId, senderId, senderName, senderType, message.trim(), messageType]
        );

        const messageData = {
          id: result.insertId,
          room_id: roomId,
          sender_id: senderId,
          sender_name: senderName,
          sender_type: senderType,
          message: message.trim(),
          message_type: messageType,
          created_at: new Date().toISOString()
        };


        // 廣播給所有聊天室成員
        io.to(`room_${roomId}`).emit('new_message', messageData);


      } catch (error) {
        console.error('加入聊天室並發送訊息失敗:', error);
        socket.emit('error', { message: '訊息發送失敗' });
      }
    });
    socket.on('end_chat', async (data) => {
      try {
        const { roomId } = data;
    
        // 更新聊天室狀態為已關閉
        await connection.execute(
          'UPDATE chat_rooms SET status = "closed" WHERE id = ?',
          [roomId]
        );
    
        // 取得聊天室資訊
        const [rooms] = await connection.execute(
          'SELECT * FROM chat_rooms WHERE id = ?',
          [roomId]
        );
    
        if (rooms.length > 0 && rooms[0].agent_id) {
          // 更新客服狀態為可用
          const agent = customerServiceAgents.get(rooms[0].agent_id);
          if (agent) {
            agent.status = 'available';
            customerServiceAgents.set(rooms[0].agent_id, agent);
          }
        }
    
        // 重要：廣播給聊天室內所有用戶（包括客服和客戶）
        io.to(`room_${roomId}`).emit('chat_ended', { roomId });
    
        // 讓所有用戶離開聊天室
        const socketsInRoom = await io.in(`room_${roomId}`).fetchSockets();
        socketsInRoom.forEach(s => s.leave(`room_${roomId}`));
    
      } catch (error) {
        console.error('結束聊天失敗:', error);
        socket.emit('error', { message: '結束聊天失敗' });
      }
    });

    // 斷線處理
    socket.on('disconnect', async () => {
      try {

        if (socket.userType === 'customer' && socket.userId) {
          onlineUsers.delete(socket.userId);

        } else if (socket.userType === 'agent' && socket.agentId) {

          customerServiceAgents.delete(socket.agentId);

          // 通知其他客服此客服已離線
          customerServiceAgents.forEach((agent) => {
            io.to(agent.socketId).emit('agent_offline', {
              agentId: socket.agentId,
              agentName: socket.agentName
            });
          });
        }
      } catch (error) {
        console.error('斷線處理失敗:', error);
      }
    });
  });

  // 初始化資料庫表
  initializeChatTables();

  return io;
};

// REST API 路由

// 取得用戶聊天記錄
router.get("/rooms/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      const err = new Error("請提供用戶 ID");
      err.code = 400;
      err.status = "fail";
      throw err;
    }

    const [rooms] = await connection.execute(
      'SELECT * FROM chat_rooms WHERE customer_id = ? ORDER BY created_at DESC LIMIT 50',
      [userId]
    );

    res.status(200).json({
      status: 'success',
      data: rooms,
      message: "聊天記錄獲取成功"
    });
  } catch (error) {
    const statusCode = error.code ?? 500;
    const statusText = error.status ?? "error";
    const message = error.message ?? "取得聊天記錄失敗，請洽管理人員";
    res.status(statusCode).json({
      status: statusText,
      message,
    });
  }
});

// 取得聊天室訊息
router.get("/messages/:roomId", async (req, res) => {
  try {
    const { roomId } = req.params;

    if (!roomId) {
      const err = new Error("請提供聊天室 ID");
      err.code = 400;
      err.status = "fail";
      throw err;
    }

    const [messages] = await connection.execute(
      'SELECT * FROM chat_messages WHERE room_id = ? ORDER BY created_at ASC',
      [roomId]
    );
  // 🔥 在後端就過濾掉機器人訊息
  const filteredMessages = messages.filter(msg => 
    msg.sender_type === 'customer' || msg.sender_type === 'agent'
  );

    res.status(200).json({
      status: 'success',
      data: filteredMessages,
      message: "訊息獲取成功"
    });
  } catch (error) {
    const statusCode = error.code ?? 500;
    const statusText = error.status ?? "error";
    const message = error.message ?? "取得訊息失敗，請洽管理人員";
    res.status(statusCode).json({
      status: statusText,
      message,
    });
  }
});

// 取得系統狀態
router.get("/status", (req, res) => {
  try {
    res.status(200).json({
      status: 'success',
      data: {
        onlineUsers: onlineUsers.size,
        onlineAgents: customerServiceAgents.size,
        activeAgents: Array.from(customerServiceAgents.values()).filter(agent => agent.status === 'available').length
      },
      message: "系統狀態獲取成功"
    });
  } catch (error) {
    const statusCode = error.code ?? 500;
    const statusText = error.status ?? "error";
    const message = error.message ?? "取得系統狀態失敗";
    res.status(statusCode).json({
      status: statusText,
      message,
    });
  }
});

// 取得等待中的客戶 (給客服使用)
router.get("/waiting", async (req, res) => {
  try {
    const [waitingRooms] = await connection.execute(
      'SELECT * FROM chat_rooms WHERE status = "waiting" ORDER BY created_at ASC'
    );

    res.status(200).json({
      status: 'success',
      data: waitingRooms,
      message: "等待中客戶列表獲取成功"
    });
  } catch (error) {
    const statusCode = error.code ?? 500;
    const statusText = error.status ?? "error";
    const message = error.message ?? "取得等待中客戶失敗";
    res.status(statusCode).json({
      status: statusText,
      message,
    });
  }
});

// 取得聊天室統計
router.get("/stats", async (req, res) => {
  try {
    const [totalRooms] = await connection.execute(
      'SELECT COUNT(*) as total FROM chat_rooms'
    );

    const [activeRooms] = await connection.execute(
      'SELECT COUNT(*) as active FROM chat_rooms WHERE status = "active"'
    );

    const [waitingRooms] = await connection.execute(
      'SELECT COUNT(*) as waiting FROM chat_rooms WHERE status = "waiting"'
    );

    const [totalMessages] = await connection.execute(
      'SELECT COUNT(*) as total FROM chat_messages'
    );

    res.status(200).json({
      status: 'success',
      data: {
        totalRooms: totalRooms[0].total,
        activeRooms: activeRooms[0].active,
        waitingRooms: waitingRooms[0].waiting,
        totalMessages: totalMessages[0].total,
        onlineUsers: onlineUsers.size,
        onlineAgents: customerServiceAgents.size
      },
      message: "聊天統計獲取成功"
    });
  } catch (error) {
    const statusCode = error.code ?? 500;
    const statusText = error.status ?? "error";
    const message = error.message ?? "取得聊天統計失敗";
    res.status(statusCode).json({
      status: statusText,
      message,
    });
  }
});

router.post('/upload-image', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '没有上傳文件'
      });
    }

    const imageUrl = `/uploads/chat/${req.file.filename}`;

    res.json({
      success: true,
      imageUrl: `http://localhost:3005${imageUrl}`,
      filename: req.file.filename
    });
  } catch (error) {
    console.error('圖片上傳失敗:', error);
    res.status(500).json({
      success: false,
      message: '圖片上传失败'
    });
  }
});



export default router;