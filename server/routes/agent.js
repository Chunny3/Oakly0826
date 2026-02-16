// routes/chat.js - 聊天系統路由
import express from "express";
import { Server } from "socket.io";
import connection from "../connect.js";

const router = express.Router();

// 在線用戶管理 (全域變數，在整個應用中共享)
let onlineUsers = new Map();
let customerServiceAgents = new Map();
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
          customer_id INT NOT NULL,
          customer_name VARCHAR(100),
          agent_id INT,
          agent_name VARCHAR(100),
          status ENUM('waiting', 'active', 'closed') DEFAULT 'waiting',
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
          sender_id INT NOT NULL,
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

      console.log('聊天資料庫表初始化完成');
    } catch (error) {
      console.error('聊天資料庫初始化失敗:', error);
    }
  };

  // WebSocket 事件處理
  io.on('connection', (socket) => {
    console.log(`聊天用戶連接: ${socket.id}`);

    // 客戶加入聊天系統
    socket.on('join_as_customer', async (userData) => {
      try {
        const { userId, userName } = userData;

        onlineUsers.set(userId, {
          socketId: socket.id,
          userName: userName || `客戶${userId}`
        });

        socket.userId = userId;
        socket.userName = userName || `客戶${userId}`;
        socket.userType = 'customer';

        console.log(`客戶加入: ${socket.userName} (ID: ${userId})`);

        // 檢查是否有未完成的聊天室
        const [existingRooms] = await connection.execute(
          'SELECT * FROM chat_rooms WHERE customer_id = ? AND status IN ("waiting", "active") ORDER BY created_at DESC LIMIT 1',
          [userId]
        );

        if (existingRooms.length > 0) {
          const room = existingRooms[0];
          socket.join(`room_${room.id}`);

          // 載入歷史訊息
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
        }

      } catch (error) {
        console.error('客戶加入失敗:', error);
        socket.emit('error', { message: '連接失敗，請重新整理頁面' });
      }
    });

    // 客服加入系統
    socket.on('join_as_agent', async (agentData) => {
      try {
        const { agentId, agentName } = agentData;

        if (!agentId) {
          socket.emit('error', { message: '客服 ID 不能為空' });
          return;
        }

        customerServiceAgents.set(agentId, {
          socketId: socket.id,
          agentId: agentId,
          agentName: agentName || `客服${agentId}`,
          status: 'available'
        });

        socket.agentId = agentId;
        socket.agentName = agentName || `客服${agentId}`;
        socket.userType = 'agent';

        socket.emit('agent_connected', {
          success: true,
          agentId: agentId,
          agentName:agentName
        });
        

        console.log(`客服上線: ${socket.agentName} (ID: ${agentId})`);

        // 取得等待中的客戶列表
        const [waitingRooms] = await connection.execute(
          'SELECT * FROM chat_rooms WHERE status = "waiting" ORDER BY created_at ASC'
        );

        socket.emit('waiting_customers', waitingRooms);

      } catch (error) {
        console.error('客服加入失敗:', error);
        socket.emit('error', { message: '客服連接失敗' });
      }
    });

    // 客戶請求客服
    socket.on('request_customer_service', async (data) => {
      try {
        const { userId, userName, message } = data;
        const customerName = userName || `客戶${userId}`;

        // 建立新聊天室
        const [result] = await connection.execute(
          'INSERT INTO chat_rooms (customer_id, customer_name, status) VALUES (?, ?, "waiting")',
          [userId, customerName]
        );

        const roomId = result.insertId;
        socket.join(`room_${roomId}`);

        // 儲存初始訊息
        if (message && message.trim()) {
          await connection.execute(
            'INSERT INTO chat_messages (room_id, sender_id, sender_name, sender_type, message) VALUES (?, ?, ?, "customer", ?)',
            [roomId, userId, customerName, message]
          );
        }

        console.log(`新聊天室建立: ${roomId} - 客戶: ${customerName}`);

        // 通知客戶聊天室已建立
        socket.emit('room_created', {
          roomId,
          status: 'waiting',
          message: '正在為您尋找客服...'
        });

        // 通知所有在線客服
        const roomData = {
          id: roomId,
          customer_id: userId,
          customer_name: customerName,
          status: 'waiting',
          created_at: new Date().toISOString(),
          initial_message: message
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
    console.log(`客服 ${socket.id} 加入聊天室 room_${roomId}`);

    // 載入歷史訊息
    const [messages] = await connection.execute(
      'SELECT * FROM chat_messages WHERE room_id = ? ORDER BY created_at ASC',
      [roomId]
    );

    console.log(`客服 ${agentInfo.agentName} 接受聊天室 ${roomId}`);

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

    console.log('廣播訊息給聊天室:', `room_${roomId}`, messageData);

    // 廣播訊息給聊天室內所有用戶
    io.to(`room_${roomId}`).emit('new_message', messageData);

    console.log(`訊息發送: ${senderName} -> 聊天室 ${roomId}`);

  } catch (error) {
    console.error('發送訊息失敗:', error);
    socket.emit('error', { message: '訊息發送失敗' });
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
    console.error('載入進行中對話失敗:', error);
  }
});// 確保加入聊天室並發送訊息
socket.on('join_room_and_send', async (data) => {
  try {
    const { roomId, message, messageType = 'text' } = data;
    
    // 確保客服在聊天室中
    socket.join(`room_${roomId}`);
    
    // 驗證客服確實在聊天室中
    const socketsInRoom = await io.in(`room_${roomId}`).fetchSockets();
    console.log(`客服加入聊天室 room_${roomId} 後，房間內用戶數: ${socketsInRoom.length}`);
    
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

    console.log('廣播訊息給聊天室:', `room_${roomId}`, messageData);

    // 廣播給所有聊天室成員
    io.to(`room_${roomId}`).emit('new_message', messageData);

    console.log(`訊息發送完成: ${senderName} -> 聊天室 ${roomId}`);

  } catch (error) {
    console.error('加入聊天室並發送訊息失敗:', error);
    socket.emit('error', { message: '訊息發送失敗' });
  }
});
    // 結束聊天
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

        console.log(`聊天結束: 聊天室 ${roomId}`);

        // 通知聊天室內所有用戶
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
        console.log(`用戶斷線: ${socket.id}`);

        if (socket.userType === 'customer' && socket.userId) {
          onlineUsers.delete(socket.userId);
          console.log(`客戶離線: ${socket.userName}`);

        } else if (socket.userType === 'agent' && socket.agentId) {
       
          customerServiceAgents.delete(socket.agentId);
          console.log(`客服離線: ${socket.agentName}`);

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

    res.status(200).json({
      status: 'success',
      data: messages,
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

export default router;