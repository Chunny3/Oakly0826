// server/websocket-server.js
import { WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';
import db from './connect.js';  // 確保路徑正確

import dotenv from 'dotenv';
dotenv.config();

const wss = new WebSocketServer({ port: 8080 });

// 存儲連接的客戶端
const clients = new Map();
const agentClients = new Map();
const customerClients = new Map();

// 廣播給特定用戶
const sendToUser = (userId, userType, message) => {
    const clientMap = userType === 'agent' ? agentClients : customerClients;
    const client = clientMap.get(userId);
    if (client && client.readyState === client.OPEN) {
        client.send(JSON.stringify(message));
    }
};

// 廣播給對話中的所有參與者
const broadcastToConversation = async (conversationId, message, excludeUserId = null) => {
    try {
        const [conversation] = await db.execute(
            'SELECT agent_id, customer_id FROM service_conversations WHERE id = ?',
            [conversationId]
        );

        if (conversation.length > 0) {
            const conv = conversation[0];

            // 發送給客服
            if (conv.agent_id && conv.agent_id !== excludeUserId) {
                sendToUser(conv.agent_id, 'agent', message);
            }

            // 發送給客戶
            if (conv.customer_id && conv.customer_id !== excludeUserId) {
                sendToUser(conv.customer_id, 'customer', message);
            }
        }
    } catch (error) {
        console.error('廣播訊息失敗:', error);
    }
};

// 廣播給所有在線客服
const broadcastToAllAgents = (message) => {
    agentClients.forEach((client) => {
        if (client.readyState === client.OPEN) {
            client.send(JSON.stringify(message));
        }
    });
};

wss.on('connection', (ws) => {
    console.log('新的 WebSocket 連接');

    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message);
            console.log('收到訊息:', data);

            switch (data.type) {
                case 'agent_auth':
                    await handleAgentAuth(ws, data);
                    break;

                case 'customer_auth':
                    await handleCustomerAuth(ws, data);
                    break;

                case 'send_message':
                    await handleSendMessage(data);
                    break;

                case 'take_conversation':
                    await handleTakeConversation(data);
                    break;

                case 'end_conversation':
                    await handleEndConversation(data);
                    break;

                default:
                    console.log('未知的訊息類型:', data.type);
            }
        } catch (error) {
            console.error('處理訊息錯誤:', error);
            ws.send(JSON.stringify({
                type: 'error',
                message: '伺服器錯誤'
            }));
        }
    });

    ws.on('close',async () => {
        // 清理連接
    for (const [userId, client] of clients.entries()) {
  if (client === ws) {
    clients.delete(userId);
    agentClients.delete(userId);
    customerClients.delete(userId);
    console.log(`用戶 ${userId} 斷開連接`);

    if (ws.userType === 'agent') {
      await db.execute(
        'UPDATE service_agents SET status = "offline", current_chats = GREATEST(0, current_chats - 1) WHERE id = ?',
        [userId]
      );

      broadcastToAllAgents({
        type: 'agent_status_updated',
        agentId: userId,
        status: 'offline'
      });
    }

    break;
  }
}

        
    });

    ws.send(JSON.stringify({
        type: 'connection_established',
        message: 'WebSocket 連接成功'
    }));
});

// 處理客服認證
const handleAgentAuth = async (ws, data) => {
    try {
        const decoded = jwt.verify(data.token, 'your-secret-key');
        if (decoded.type === 'agent') {
            clients.set(decoded.id, ws);
            agentClients.set(decoded.id, ws);
            ws.userId = decoded.id;
            ws.userType = 'agent';

            await db.execute(
                'UPDATE service_agents SET status = "online" WHERE id = ?',
                [decoded.id]
            );

            ws.send(JSON.stringify({
                type: 'auth_success',
                userType: 'agent',
                userId: decoded.id
            }));

            await sendAgentData(decoded.id);
            console.log(`客服 ${decoded.id} 已連接`);
        }
    } catch (error) {
        ws.send(JSON.stringify({
            type: 'auth_failed',
            message: 'token 無效'
        }));
    }
};

// 處理客戶認證
const handleCustomerAuth = async (ws, data) => {
    try {
        const { userId, conversationId } = data;

        if (userId) {
            clients.set(userId, ws);
            customerClients.set(userId, ws);
            ws.userId = userId;
        } else {
            const tempId = `temp_${Date.now()}`;
            clients.set(tempId, ws);
            customerClients.set(tempId, ws);
            ws.userId = tempId;
        }

        ws.userType = 'customer';
        ws.conversationId = conversationId;

        ws.send(JSON.stringify({
            type: 'auth_success',
            userType: 'customer',
            userId: userId,
            conversationId: conversationId
        }));

        console.log(`客戶 ${userId || 'anonymous'} 已連接到對話 ${conversationId}`);

    } catch (error) {
        ws.send(JSON.stringify({
            type: 'auth_failed',
            message: '認證失敗'
        }));
    }
};

// 處理發送訊息
const handleSendMessage = async (data) => {
    console.log('後端收到訊息:', data); // 加這行

    try {
        const { conversationId, message, senderType, senderId, senderName } = data;

        const [result] = await db.execute(
            'INSERT INTO service_messages (conversation_id, sender_type, sender_id, sender_name, message) VALUES (?, ?, ?, ?, ?)',
            [conversationId, senderType, senderId, senderName, message]
        );

        await db.execute(
            'UPDATE service_conversations SET updated_at = NOW() WHERE id = ?',
            [conversationId]
        );

        const messageData = {
            type: 'new_message',
            messageId: result.insertId,
            conversationId,
            message,
            senderType,
            senderId,
            senderName,
            timestamp: new Date()
        };

        await broadcastToConversation(conversationId, messageData, senderId);
        console.log(`訊息已發送到對話 ${conversationId}`);

        // 檢查是否為等待中的對話，如果是則更新佇列
        const [conversationInfo] = await db.execute(
            'SELECT status FROM service_conversations WHERE id = ?',
            
            [conversationId]
        );
        console.log('對話狀態:', conversationInfo[0]?.status); // 加這行

        if (conversationInfo[0]?.status === 'waiting') {
            console.log('檢測到等待中的對話，準備更新佇列'); // 加這行

            const [waiting] = await db.execute(`
    SELECT 
      c.*,
      TIMESTAMPDIFF(MINUTE, c.started_at, NOW()) as waiting_minutes,
      (SELECT message FROM service_messages WHERE conversation_id = c.id ORDER BY sent_at ASC LIMIT 1) as first_message
    FROM service_conversations c 
    WHERE c.status = 'waiting' AND c.agent_id IS NULL
    ORDER BY c.started_at ASC
  `);
  console.log('broadcastToAllAgents 函數類型:', typeof broadcastToAllAgents); // 加這行

            broadcastToAllAgents({
                type: 'queue_updated',
                queue: waiting
            });

        }
    } catch (error) {
        console.error('發送訊息失敗:', error);
        const [waiting] = await db.execute(`
    SELECT 
      c.*,
      TIMESTAMPDIFF(MINUTE, c.started_at, NOW()) as waiting_minutes,
      (SELECT message FROM service_messages WHERE conversation_id = c.id ORDER BY sent_at ASC LIMIT 1) as first_message
    FROM service_conversations c 
    WHERE c.status = 'waiting' AND c.agent_id IS NULL
    ORDER BY c.started_at ASC
  `);

        broadcastToAllAgents({
            type: 'queue_updated',
            queue: waiting
        });
        console.log('已廣播佇列更新'); // 加這行

    }
};

// 處理接取對話
const handleTakeConversation = async (data) => {
    try {
        const { conversationId, agentId } = data;

        const [agentInfo] = await db.execute(
            'SELECT current_chats, max_chats FROM service_agents WHERE id = ?',
            [agentId]
        );

        if (agentInfo.length === 0) {
            sendToUser(agentId, 'agent', {
                type: 'take_conversation_failed',
                message: '客服不存在'
            });
            return;
        }

        if (agentInfo[0].current_chats >= agentInfo[0].max_chats) {
            sendToUser(agentId, 'agent', {
                type: 'take_conversation_failed',
                message: '已達最大對話數限制'
            });
            return;
        }

        const [result] = await db.execute(
            'UPDATE service_conversations SET agent_id = ?, status = "active", updated_at = NOW() WHERE id = ? AND status = "waiting"',
            [agentId, conversationId]
        );

        if (result.affectedRows === 0) {
            sendToUser(agentId, 'agent', {
                type: 'take_conversation_failed',
                message: '對話不存在或已被處理'
            });

            return;
        }

        await db.execute(
            'UPDATE service_agents SET current_chats = current_chats + 1 WHERE id = ?',
            [agentId]
        );

        await db.execute(
            'INSERT INTO service_messages (conversation_id, sender_type, sender_name, message) VALUES (?, "system", "系統", "客服已為您服務")',
            [conversationId]
        );

        sendToUser(agentId, 'agent', {
            type: 'take_conversation_success',
            conversationId
        });

        await broadcastToConversation(conversationId, {
            type: 'agent_joined',
            conversationId,
            message: '客服已為您服務'
        });

        broadcastToAllAgents({
            type: 'queue_updated'
        });

        console.log(`客服 ${agentId} 接取了對話 ${conversationId}`);
    } catch (error) {
        console.error('接取對話失敗:', error);
    }
};

// 處理結束對話
const handleEndConversation = async (data) => {
    try {
        const { conversationId, agentId } = data;

        await db.execute(
            'UPDATE service_conversations SET status = "ended", ended_at = NOW() WHERE id = ? AND agent_id = ?',
            [conversationId, agentId]
        );

        await db.execute(
            'UPDATE service_agents SET current_chats = GREATEST(0, current_chats - 1) WHERE id = ?',
            [agentId]
        );

        await db.execute(
            'INSERT INTO service_messages (conversation_id, sender_type, sender_name, message) VALUES (?, "system", "系統", "對話已結束，感謝您的使用")',
            [conversationId]
        );

        await broadcastToConversation(conversationId, {
            type: 'conversation_ended',
            conversationId,
            message: '對話已結束'
        });

        console.log(`對話 ${conversationId} 已結束`);
    } catch (error) {
        console.error('結束對話失敗:', error);
    }
};

// 發送客服相關數據
const sendAgentData = async (agentId) => {
    try {
        const [conversations] = await db.execute(`
      SELECT 
        c.*,
        (SELECT message FROM service_messages WHERE conversation_id = c.id ORDER BY sent_at DESC LIMIT 1) as last_message,
        (SELECT sent_at FROM service_messages WHERE conversation_id = c.id ORDER BY sent_at DESC LIMIT 1) as last_message_time
      FROM service_conversations c 
      WHERE c.agent_id = ? AND c.status IN ('active', 'waiting')
      ORDER BY c.updated_at DESC
    `, [agentId]);

        sendToUser(agentId, 'agent', {
            type: 'conversations_updated',
            conversations
        });

        const [waiting] = await db.execute(`
      SELECT 
        c.*,
        TIMESTAMPDIFF(MINUTE, c.started_at, NOW()) as waiting_minutes,
        (SELECT message FROM service_messages WHERE conversation_id = c.id ORDER BY sent_at ASC LIMIT 1) as first_message
      FROM service_conversations c 
      WHERE c.status = 'waiting' AND c.agent_id IS NULL
      ORDER BY c.started_at ASC
    `);

        sendToUser(agentId, 'agent', {
            type: 'queue_updated',
            queue: waiting
        });
    } catch (error) {
        console.error('發送客服數據失敗:', error);
    }
};

const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
    console.log('WebSocket 伺服器運行在 ws://localhost:8080');
  }

export { sendToUser, broadcastToConversation, broadcastToAllAgents };