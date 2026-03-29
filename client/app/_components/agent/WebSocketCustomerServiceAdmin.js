'use client'

import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

// import '@/styles/products/chat.css';


const AgentDashboard = ({ user, onLogout }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  // const [user, setAgentInfo] = useState({
  //   id: 1,
  //   name: '客服小美',
  //   email: 'agent1@oakly.com'
  // });

  const [waitingCustomers, setWaitingCustomers] = useState([]);
  const [activeChats, setActiveChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [agentStatus, setAgentStatus] = useState('available'); // available, busy, offline
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const processedTransfers = useRef(new Set()); 

  const messagesEndRef = useRef(null);
  const handleLogout = () => setShowLogoutConfirm(true);
  const confirmLogout = async () => {
    if (socket) {
      socket.emit('agent_logout', { agentId: user.id });
      socket.disconnect();
    }
    setShowLogoutConfirm(false);
    await onLogout();
  };
  const cancelLogout = () => setShowLogoutConfirm(false);
  useEffect(() => {
    // 建立 WebSocket 連接
    const newSocket = io('http://localhost:3005', {
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('Agent connected to chat server');
      setIsConnected(true);

      // 以客服身份加入
      newSocket.emit('join_as_agent', {
        agentId: user.id,
        agentName: user.name
      });
    });

    newSocket.on('agent_connected', (data) => {
      console.log('客服連接成功:', data);
      processedTransfers.current.clear();

      // 請求載入進行中的對話
      newSocket.emit('get_active_chats', { agentId: user.id });
    });



    newSocket.on('disconnect', () => {
      console.log('Agent disconnected from chat server');
      setIsConnected(false);
    });


    // 新增：接收進行中的對話
    newSocket.on('active_chats_loaded', (chats) => {
      console.log('載入進行中的對話:', chats);
      setActiveChats(chats);
    });

    // 等待中的客戶列表
    newSocket.on('waiting_customers', (customers) => {
      setWaitingCustomers(customers);
    });

    // 新客戶等待
    newSocket.on('new_customer_waiting', (customer) => {
      setWaitingCustomers(prev => [customer, ...prev]);

      // 播放通知音效（可選）
      playNotificationSound();
    });

    newSocket.on('chat_accepted', (data) => {
      console.log('聊天被接受:', data);
      
      const chatInfo = {
        roomId: data.roomId,
        agentId: data.agentId,
        customerName: data.customerName || '客戶',
        status: 'active'
      };
    
      setActiveChats(prev => {
        const newList = prev.filter(chat => chat.roomId !== data.roomId);
        return [...newList, chatInfo];
      });
    
      setSelectedChat(chatInfo);
      
      // 🔥 過濾機器人訊息，只保留客戶和客服的訊息
      const filteredMessages = (data.messages || []).filter(msg => 
        msg.sender_type === 'customer' || msg.sender_type === 'agent'
      );
      
      setMessages(filteredMessages);
      setAgentStatus('busy');
    
      // 從等待列表移除
      setWaitingCustomers(prev =>
        prev.filter(customer => {
          const customerId = String(customer.id);
          const roomIdStr = String(data.roomId);
          return customerId !== `human_${roomIdStr}` && customerId !== roomIdStr;
        })
      );
    });

    newSocket.on('new_transfer_request', (transferData) => {
      if (processedTransfers.current.has(transferData.roomId)) {
        console.log('轉接請求已處理過，跳過:', transferData.roomId);
        return;
      }
      
      processedTransfers.current.add(transferData.roomId);
      
      alert('收到轉接請求！');
      
      const transferCustomer = {
        id: transferData.roomId,
        customer_name: transferData.customer.userName,
        is_authenticated: transferData.customer.isAuthenticated,
        initial_message: '從機器人轉接：' + transferData.transferReason,
        created_at: new Date().toISOString(),
        chat_history: transferData.chatHistory
      };
    
      setWaitingCustomers(prev => [transferCustomer, ...prev]);
      playNotificationSound();
    });

    // 聊天被其他客服接受
    newSocket.on('chat_taken', (data) => {
      setWaitingCustomers(prev =>
        prev.filter(customer => customer.id !== data.roomId)
      );
    });

    // 新消息
    newSocket.on('new_message', (message) => {
      console.log('前端收到 new_message:', message);

      setMessages(prev => {
        const updated = [...prev, message];
        console.log('更新後的訊息:', updated);

        // 強制重新渲染
        setTimeout(() => {
          setMessages([...updated]);
        }, 10);

        return updated;
      });

      if (message.sender_type === 'customer') {
        playNotificationSound();
      }
    });
    // 監聽轉接被其他客服接受
    newSocket.on('transfer_accepted_by_other', (data) => {
      setWaitingCustomers(prev =>
        prev.filter(customer => customer.id !== data.roomId)
      );
    });
    // 聊天結束
    newSocket.on('chat_ended', (data) => {
      console.log('聊天已結束:', data);
      
      // 從進行中的對話列表移除
      setActiveChats(prev =>
        prev.filter(chat => chat.roomId != data.roomId)
      );
    
      // 🔥 關鍵修正：如果當前選中的是被結束的聊天，立即清空右側畫面
      if (selectedChat && selectedChat.roomId == data.roomId) {
        setSelectedChat(null);
        setMessages([]);
      }
    
      // 更新客服狀態為可用
      setAgentStatus('available');
    });
    newSocket.on('error', (error) => {
      console.log('收到錯誤事件:', error);
      
      // 檢查錯誤是否有實際內容
      if (error && typeof error === 'object' && error.message && error.message.trim()) {
        console.error('Agent chat error:', error);
        alert(error.message);
      } else {
        console.log('收到空的或無效的錯誤物件，忽略:', error);
      }
    });
    setSocket(newSocket);

    return () => {
      processedTransfers.current.clear(); 

      newSocket.close();
    };
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const playNotificationSound = () => {
    // 簡單的通知音效
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.2);
  };

  const acceptChat = (customer) => {
    if (!socket) return;

    if (customer.chat_history) {
      socket.emit('accept_transfer', {
        roomId: customer.id,
        agentId: user.id,
        agentName: user.name
      });
    } else {
      socket.emit('accept_chat', {
        roomId: customer.id,
        agentId: user.id
      });
    }
  };
  const selectChat = async (chat) => {
    setSelectedChat(chat);
  
    // 載入該聊天室的歷史消息並過濾
    if (socket) {
      try {
        const response = await fetch(`http://localhost:3005/api/chat/messages/${chat.roomId}`);
        const result = await response.json();
        
        if (result.status === 'success') {
          // 🔥 強化過濾邏輯 - 多重條件檢查
          const filteredMessages = result.data.filter(msg => {
            // 排除機器人訊息的多種判斷方式
            if (msg.sender_type === 'bot') return false;
            if (msg.sender_id === 'bot') return false;
            if (msg.message && msg.message.includes('Oakly 智能助手')) return false;
            if (msg.message && msg.message.includes('智能助手')) return false;
            if (msg.message && msg.message.includes('我可以幫您了解產品資訊')) return false;
            
            // 只保留客戶和客服訊息
            return msg.sender_type === 'customer' || msg.sender_type === 'agent';
          });
          
          setMessages(filteredMessages);
        }
      } catch (error) {
        console.error('載入歷史消息失敗:', error);
      }
    }
  };
  const sendMessage = () => {
    if (!currentMessage.trim() || !socket || !selectedChat) return;

    // 立即顯示在 UI 上（避免延遲）
    const tempMessage = {
      id: `temp_${Date.now()}`,
      room_id: selectedChat.roomId,
      sender_id: user.id,
      sender_name: user.name,
      sender_type: 'agent',
      message: currentMessage.trim(),
      message_type: 'text',
      created_at: new Date().toISOString()
    };

    // setMessages(prev => [...prev, tempMessage]);

    // console.log('發送訊息:', {
    //   roomId: selectedChat.roomId,
    //   message: currentMessage,
    //   selectedChat: selectedChat
    // });

    // 確保客服在聊天室中，然後發送訊息
    socket.emit('join_room_and_send', {
      roomId: selectedChat.roomId,
      message: currentMessage,
      messageType: 'text'
    });

    setCurrentMessage('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const endChat = () => {
    if (!socket || !selectedChat) return;
  
    if (confirm('確定要結束此對話嗎？')) {
      socket.emit('end_chat', { roomId: selectedChat.roomId });
      
      // 立即清理本地狀態
      setActiveChats(prev =>
        prev.filter(chat => chat.roomId !== selectedChat.roomId)
      );
      setSelectedChat(null);
      setMessages([]);
      setAgentStatus('available');
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-TW', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const quickReply = (text) => {
    setCurrentMessage(text);
  };

  const quickReplies = [
    '感謝您的諮詢，請問有什麼可以為您服務的嗎？',
    '我來為您查詢相關資訊，請稍等一下。',
    '關於這個問題，我建議您可以考慮...',
    '如果還有其他問題，歡迎隨時詢問。',
    '感謝您選擇 Oakly,祝您有愉快的一天!'
  ];
  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || !selectedChat) return;

    setIsUploading(true);

    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch('http://localhost:3005/api/chat/upload-image', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        socket.emit('join_room_and_send', {
          roomId: selectedChat.roomId,
          message: result.imageUrl,
          messageType: 'image'
        });
      }
    } catch (error) {
      console.error('上传失败:', error);
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };
  return (
    <div className="agent-dashboard">
      <div className="dashboard-header">
        {showLogoutConfirm && (
          <div className="logout-overlay">
            <div className="logout-dialog">
              <div className="logout-icon">🚪</div>
              <h3>確認登出</h3>
              <p>確定要登出客服系統嗎？</p>
              <p className="logout-warning">未完成的對話將會轉移給其他客服人員。</p>
              <div className="logout-actions">
                <button className="cancel-btn" onClick={cancelLogout}>取消</button>
                <button className="confirm-btn" onClick={confirmLogout}>確認登出</button>
              </div>
            </div>
          </div>
        )}
        <div className="header-left">
          <h1>Oakly 客服後台</h1>
          <div className="agent-info">
            <div className="agent-avatar">
              {user.name.charAt(0)}
            </div>
            <div className="agent-details">
              <div className="agent-name">{user.name}</div>
              <div className="agent-email">{user.email}</div>
            </div>
          </div>
        </div>

        <div className="header-right">
          <div className="connection-status">
            <div className={`status-indicator ${isConnected ? 'online' : 'offline'}`}></div>
            <span>{isConnected ? '已連線' : '連線中斷'}</span>
          </div>

          <div className="agent-status-control">
            <label>狀態：</label>
            <select
              value={agentStatus}
              onChange={(e) => setAgentStatus(e.target.value)}
              className="status-select"
            >
              <option value="available">可服務</option>
              <option value="busy">忙碌中</option>
              <option value="offline">離線</option>
            </select>
          </div>
          <button onClick={handleLogout} className="out">
            登出
          </button>
        </div>
      </div>

      <div className="dashboard-content">
        {/* 左側邊欄 */}
        <div className="sidebar">
          {/* 等待中的客戶 */}
          <div className="waiting-customers">
            <h3>
              等待中的客戶
              {waitingCustomers.length > 0 && (
                <span className="count-badge">{waitingCustomers.length}</span>
              )}
            </h3>

            {waitingCustomers.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">😌</div>
                <p>目前沒有等待中的客戶</p>
              </div>
            ) : (
              <div className="customer-list">
                {waitingCustomers.map((customer) => (
                  <div key={customer.id} className="customer-item">
                    <div className="customer-info">
                      <div className="customer-name">
                        {customer.customer_name || '訪客'}
                        {customer.is_authenticated ? (
                          <span className="auth-badge">會員</span>
                        ) : (
                          <span className="guest-badge">訪客</span>
                        )}
                      </div>
                      <div className="customer-message">
                        {customer.initial_message || '客戶正在等待服務...'}
                      </div>
                      <div className="waiting-time">
                        等待時間：{formatTime(customer.created_at)}
                      </div>
                    </div>
                    <button
                      className="accept-btn"
                      onClick={() => acceptChat(customer)}
                      disabled={agentStatus !== 'available'}
                    >
                      接受
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 進行中的對話 */}
          <div className="active-chats">
            <h3>
              進行中的對話
              {activeChats.length > 0 && (
                <span className="count-badge">{activeChats.length}</span>
              )}
            </h3>

            {activeChats.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">💬</div>
                <p>目前沒有進行中的對話</p>
              </div>
            ) : (
              <div className="chat-list">
                {activeChats.map((chat) => (
                  <div
                    key={chat.roomId}
                    className={`chat-item ${selectedChat?.roomId === chat.roomId ? 'active' : ''}`}
                    onClick={() => selectChat(chat)}
                  >
                    <div className="chat-info">
                      <div className="customer-name">
                        {chat.customerName}
                      </div>
                      <div className="chat-status">
                        進行中

                      </div>
                    </div>
                    <div className="chat-indicator">
                      <div className="online-dot"></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 主聊天區域 */}
        <div className="chat-area">
        {selectedChat && activeChats.some(chat => chat.roomId === selectedChat.roomId) ? (
            <>
              <div className="chat-header">
                <div className="chat-title">
                  與 {selectedChat.customerName} 的對話
                </div>
                <div className="chat-actions">
                  <button className="end-chat-btn" onClick={endChat}>
                    結束對話
                  </button>
                </div>
              </div>



              <div className="messages-container">

                {messages.map((message, index) => {
                  console.log('渲染訊息:', message.id || index, message.message); // 加這行除錯
                  return (
                    <div
                    key={`agent_msg_${message.id || index}_${message.created_at}`}
                                        className={`message ${message.sender_type === 'agent' ? 'sent' : 'received'}`}
                    >
                      <div className="message-content">
                        <div className="sender-info">
                          {message.sender_type === 'customer' ? selectedChat.customerName : '我'}
                        </div>
                        <div className="message-bubble">
                          <div className="message-bubble">
                            {message.message_type === 'image' ? (
                              <img
                                src={message.message}
                                alt="聊天图片"
                                style={{
                                  maxWidth: '200px',
                                  height: 'auto',
                                  borderRadius: '8px',
                                  display: 'block'
                                }}
                              />
                            ) : (
                              message.message
                            )}
                          </div>                        </div>
                        <div className="message-time">
                          {formatTime(message.created_at)}
                        </div>
                      </div>      </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>









              <div className="quick-replies">
                <div className="quick-reply-label">快速回覆：</div>
                <div className="quick-reply-buttons">
                  {quickReplies.map((reply, index) => (
                    <button
                      key={index}
                      className="quick-reply-btn"
                      onClick={() => quickReply(reply)}
                    >
                      {reply.substring(0, 20)}...
                    </button>
                  ))}
                </div>
              </div>

              <div className="message-input-area">
                <div className="input-container">
                  <textarea
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="輸入回覆訊息..."
                    className="message-input"
                    rows="3"
                  />
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading || !selectedChat}
                    className="upload-btn"
                    style={{ background: 'transparent', border: 'none' }}

                  >
                    <i className="fa-solid fa-images fa-2x" style={{ color: '#cccccc' }}></i>
                  </button>
                  <button
                    onClick={sendMessage}
                    disabled={!currentMessage.trim()}
                    className="send-button"
                  >
                    發送
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="no-chat-selected">
              <div className="no-chat-icon">💬</div>
              <h3>選擇一個對話開始</h3>
              <p>從左側選擇等待中的客戶或進行中的對話</p>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .agent-dashboard {
          height: 100vh;
          display: flex;
          flex-direction: column;
          background: #f5f7fa;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .dashboard-header {
          background: white;
          padding: 20px 24px;
          border-bottom: 1px solid #e0e6ed;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .header-left {
          display: flex;
          align-items: center;
          gap: 24px;
        }
        
        .dashboard-header h1 {
          margin: 0;
          color: #2d3748;
          font-size: 24px;
          font-weight: 600;
        }
        
        .agent-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .agent-avatar {
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #DBA783 0%, #B8956A 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 600;
          font-size: 16px;
        }
        
        .agent-details {
          display: flex;
          flex-direction: column;
        }
        
        .agent-name {
          font-weight: 500;
          color: #2d3748;
        }
        
        .agent-email {
          font-size: 12px;
          color: #718096;
        }
        
        .header-right {
          display: flex;
          align-items: center;
          gap: 24px;
        }
        
        .connection-status {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: #4a5568;
        }
        
        .status-indicator {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #e53e3e;
        }
        
        .status-indicator.online {
          background: #38a169;
        }
        
        .agent-status-control {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: #4a5568;
        }
        
        .status-select {
          padding: 6px 12px;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          font-size: 14px;
          background: white;
        }
        
        .dashboard-content {
          flex: 1;
          display: flex;
          overflow: hidden;
        }
        .auth-badge {
  background: #38a169;
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 10px;
  margin-left: 8px;
}

.guest-badge {
  background: #718096;
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 10px;
  margin-left: 8px;
}
        .sidebar {
          width: 350px;
          background: white;
          border-right: 1px solid #e0e6ed;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
        }
        
        .waiting-customers,
        .active-chats {
          padding: 20px;
        }
        
        .waiting-customers h3,
        .active-chats h3 {
          margin: 0 0 16px 0;
          font-size: 16px;
          font-weight: 600;
          color: #2d3748;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .count-badge {
          background: #e53e3e;
          color: white;
          font-size: 12px;
          padding: 2px 8px;
          border-radius: 12px;
          font-weight: 500;
        }
        
        .empty-state {
          text-align: center;
          padding: 40px 20px;
        }
        
        .empty-icon {
          font-size: 48px;
          margin-bottom: 12px;
        }
        
        .empty-state p {
          margin: 0;
          color: #718096;
          font-size: 14px;
        }
        
        .customer-list,
        .chat-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .customer-item,
        .chat-item {
          padding: 16px;
          background: #f7fafc;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .customer-item:hover,
        .chat-item:hover {
          background: #edf2f7;
          border-color: #cbd5e0;
        }
        
        .chat-item.active {
          background: #e6fffa;
          border-color: #38b2ac;
        }
        
        .customer-item {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        
        .customer-info {
          flex: 1;
        }
        
        .customer-name {
          font-weight: 500;
          color: #2d3748;
          margin-bottom: 4px;
        }
        
        .customer-message {
          font-size: 13px;
          color: #4a5568;
          margin-bottom: 8px;
          line-height: 1.4;
        }
        
        .waiting-time {
          font-size: 12px;
          color: #718096;
        }
        
        .accept-btn {
          background: linear-gradient(135deg, #DBA783 0%, #B8956A 100%);
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 12px;
          cursor: pointer;
          transition: opacity 0.2s;
        }
        
        .accept-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .chat-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .chat-info {
          flex: 1;
        }
        
        .chat-status {
          font-size: 12px;
          color: #38a169;
        }
        
        .chat-indicator {
          display: flex;
          align-items: center;
        }
        
        .online-dot {
          width: 8px;
          height: 8px;
          background: #38a169;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }
        
        .chat-area {
          flex: 1;
          display: flex;
          flex-direction: column;
          background: white;
        }
        
        .chat-header {
          padding: 20px 24px;
          border-bottom: 1px solid #e0e6ed;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #f7fafc;
        }
        
        .chat-title {
          font-size: 18px;
          font-weight: 600;
          color: #2d3748;
        }
        
        .end-chat-btn {
          background: #e53e3e;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 14px;
          cursor: pointer;
          transition: background 0.2s;
        }
        
        .end-chat-btn:hover {
          background: #c53030;
        }
        
        .messages-container {
          flex: 1;
          padding: 20px 24px;
          overflow-y: auto;
          background: #f7fafc;
        }
        
        .message {
          margin-bottom: 20px;
        }
        
        .message.sent {
          display: flex;
          justify-content: flex-end;
        }
        
        .message.received {
          display: flex;
          justify-content: flex-start;
        }
        
        .message-content {
          max-width: 60%;
        }
        
        .sender-info {
          font-size: 12px;
          color: #718096;
          margin-bottom: 4px;
        }
        
        .sent .sender-info {
          text-align: right;
        }
        
        .message-bubble {
          padding: 12px 16px;
          border-radius: 12px;
          word-wrap: break-word;
          font-size: 14px;
          line-height: 1.5;
        }
        
        .sent .message-bubble {
          background: linear-gradient(135deg, #DBA783 0%, #B8956A 100%);
          color: white;
        }
        
        .received .message-bubble {
          background: white;
          color: #2d3748;
          border: 1px solid #e2e8f0;
        }
        
        .message-time {
          font-size: 11px;
          color: #a0aec0;
          margin-top: 4px;
        }
        
        .sent .message-time {
          text-align: right;
        }
        
        .quick-replies {
          padding: 12px 24px;
          background: #edf2f7;
          border-top: 1px solid #e2e8f0;
        }
        
        .quick-reply-label {
          font-size: 12px;
          color: #718096;
          margin-bottom: 8px;
        }
        
        .quick-reply-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        
        .quick-reply-btn {
          background: white;
          border: 1px solid #cbd5e0;
          color: #4a5568;
          padding: 6px 12px;
          border-radius: 16px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .quick-reply-btn:hover {
          background: #DBA783;
          color: white;
          border-color: #DBA783;
        }
        
        .message-input-area {
          padding: 20px 24px;
          background: white;
          border-top: 1px solid #e2e8f0;
        }
        
        .input-container {
          display: flex;
          gap: 12px;
          align-items: flex-end;
        }
        
        .message-input {
          flex: 1;
          padding: 12px 16px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 14px;
          resize: none;
          outline: none;
          font-family: inherit;
          transition: border-color 0.2s;
        }
        
        .message-input:focus {
          border-color: #DBA783;
          box-shadow: 0 0 0 3px rgba(219, 167, 131, 0.1);
        }
        
        .send-button {
          background: linear-gradient(135deg, #DBA783 0%, #B8956A 100%);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: opacity 0.2s;
          white-space: nowrap;
        }
        
        .send-button:hover:not(:disabled) {
          opacity: 0.9;
        }
        
        .send-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .no-chat-selected {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
          color: #718096;
        }
        
        .no-chat-icon {
          font-size: 64px;
          margin-bottom: 20px;
          opacity: 0.5;
        }
        
        .no-chat-selected h3 {
          margin: 0 0 8px 0;
          color: #4a5568;
          font-size: 20px;
        }
        
        .no-chat-selected p {
          margin: 0;
          font-size: 14px;
        }
        
        @keyframes pulse {
          0%, 70%, 100% { 
            transform: scale(1);
            opacity: 1;
          }
          35% { 
            transform: scale(1.1);
            opacity: 0.8;
          }
        }
        
        /* 響應式設計 */
        @media (max-width: 1024px) {
          .sidebar {
            width: 300px;
          }
          
          .dashboard-header {
            padding: 16px 20px;
          }
          
          .header-left {
            gap: 16px;
          }
          
          .dashboard-header h1 {
            font-size: 20px;
          }
        }
        
        @media (max-width: 768px) {
          .dashboard-header {
            flex-direction: column;
            gap: 16px;
            align-items: flex-start;
          }
          
          .header-right {
            gap: 16px;
          }
          
          .sidebar {
            width: 280px;
          }
          
          .agent-info {
            gap: 8px;
          }
          
          .agent-avatar {
            width: 32px;
            height: 32px;
            font-size: 14px;
          }
        }
        .logout-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.5); display: flex; justify-content: center; align-items: center; z-index: 1000; }
.logout-dialog { background: white; border-radius: 12px; padding: 32px; text-align: center; max-width: 400px; margin: 20px; }
.logout-icon { font-size: 48px; margin-bottom: 16px; }
.logout-dialog h3 { margin: 0 0 12px 0; color: #2d3748; font-size: 20px; font-weight: 600; }
.logout-dialog p { margin: 0 0 8px 0; color: #4a5568; font-size: 14px; }
.logout-warning { color: #e53e3e !important; font-size: 13px !important; margin-bottom: 24px !important; }
.logout-actions { display: flex; gap: 12px; justify-content: center; }
.cancel-btn { background: #f7fafc; border: 1px solid #e2e8f0; color: #4a5568; padding: 8px 20px; border-radius: 6px; font-size: 14px; cursor: pointer; }
.confirm-btn { background: #e53e3e; color: white; padding: 8px 20px; border-radius: 6px; font-size: 14px; cursor: pointer; border: none; }
        .out{
            background:#e53e3e
;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius:8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s 
ease;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);}



/* 自定義滾動條 */
        .sidebar::-webkit-scrollbar,
        .messages-container::-webkit-scrollbar {
          width: 6px;
        }
        
        .sidebar::-webkit-scrollbar-track,
        .messages-container::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .sidebar::-webkit-scrollbar-thumb,
        .messages-container::-webkit-scrollbar-thumb {
          background: #cbd5e0;
          border-radius: 3px;
        }
        
        .sidebar::-webkit-scrollbar-thumb:hover,
        .messages-container::-webkit-scrollbar-thumb:hover {
          background: #a0aec0;
        }
        
        /* 通知動畫 */
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        
        .customer-item.new-customer {
          animation: shake 0.5s ease-in-out;
          border-color: #DBA783;
          background: #fef5e7;
        }
        
        /* 載入動畫 */
        .loading-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid #e2e8f0;
          border-top: 2px solid #DBA783;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AgentDashboard;