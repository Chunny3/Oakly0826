'use client'

import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { useAuth } from '@/hooks/use-auth';
import "@/styles/products/chat.css";

const CustomerChat = () => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatStatus, setChatStatus] = useState('offline'); // 改為：offline, bot, waiting, active
  const [isBotMode, setIsBotMode] = useState(true);
  const [showTransferButton, setShowTransferButton] = useState(false);
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [roomId, setRoomId] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [agentName, setAgentName] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [botTyping, setBotTyping] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false); 
  const transferRequestSent = useRef(false); // 🔥 添加這行




  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // 模擬用戶資料（實際應用中從認證系統獲取）
  // const userData = {
  //   userId: 1,
  //   userName: 'John Doe'
  // };


  const { user, isLoading } = useAuth();

  // 檢查用戶是否已登入
  const isLoggedIn = !!user;
  const loading = isLoading;

  // 準備用戶資料
  const userData = isLoggedIn ? {
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    isAuthenticated: true
  } : {
    userId: null,
    userName: '訪客',
    userEmail: null,
    isAuthenticated: false
  };


  useEffect(() => {
    if (isLoading) {
      console.log('用戶資料載入中，等待...');
      return;
    }

    if (socket?.connected && socket?.userId === (user?.id || null)) {
      console.log('相同用戶的 Socket 已連接，跳過重複連接');
      return;
    }

    const timer = setTimeout(() => {
      if (isLoading) {
        console.log('延遲檢查時仍在載入，取消連接');
        return;
      }
      if (socket) {
      socket.removeAllListeners();
      socket.disconnect();
      setSocket(null);
    }



      // 取得並驗證 token
      const token = localStorage.getItem('reactLoginToken');

      // 建立 socket 連接選項
      const socketOptions = {
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true, // 強制建立新連接避免快取問題
      };

      // 準備用戶資料（這是關鍵！）
      let finalUserData;
      const hasValidUser = user && user.id && user.name;
      const hasValidToken = token && token.length > 0 && token !== 'null' && token !== 'undefined';

      if (isLoggedIn && hasValidUser && hasValidToken) {
        // 認證用戶模式
        socketOptions.query = {
          token: token,
          // 額外加上用戶 ID 幫助後端識別
          userId: user.id.toString(),
          userName: user.name
        };

        finalUserData = {
          userId: user.id,
          userName: user.name,
          userEmail: user.email,
          isAuthenticated: true
        };

      } else {
        // 訪客模式
        finalUserData = {
          userId: null,
          userName: '訪客',
          userEmail: null,
          isAuthenticated: false
        };

      }


      // 建立連接
      const newSocket = io('http://localhost:3005', socketOptions);

      // 連接成功事件
      newSocket.on('connect', () => {
        setIsConnected(true);

        // 重要：延遲一點再發送用戶資料，確保後端準備好
        setTimeout(() => {
          newSocket.emit('join_as_customer', finalUserData);
        }, 100);
      });

      // 連接錯誤
      newSocket.on('connect_error', (error) => {
        console.error('Socket 連接錯誤:', error);
        setIsConnected(false);
      });
      newSocket.on('force_disconnect', (data) => {
        console.log('收到強制斷線:', data.reason);
        newSocket.disconnect();
        setSocket(null);
        setIsConnected(false);
      });

      // 斷線
      newSocket.on('disconnect', (reason) => {
        console.log('Socket 斷線，原因:', reason);
        setIsConnected(false);
      });

      // 認證成功回應
      newSocket.on('auth_success', (data) => {
        console.log('後端認證成功:', data);
      });

      // 認證失敗回應  
      newSocket.on('auth_failed', (data) => {
        // 認證失敗時重新以訪客身份連接
        setTimeout(() => {
          const guestData = {
            userId: null,
            userName: '訪客',
            userEmail: null,
            isAuthenticated: false
          };
          newSocket.emit('join_as_customer', guestData);
        }, 1000);
      });

      // 成功加入房間
      newSocket.on('room_joined', (data) => {
        // console.log('成功加入聊天房間:', data);
        setRoomId(data.roomId);
        setChatStatus(data.status);
        setMessages(data.messages || []);
        setIsChatOpen(true);
        setAgentName(data.agentName || '客服專員');
      });


      // 房間建立
      newSocket.on('room_created', (data) => {
        // console.log('聊天房間已建立:', data);
        setRoomId(data.roomId);
        setChatStatus('waiting');
      });

      // 聊天被接受
      newSocket.on('chat_accepted', (data) => {
        setChatStatus('active');
        setAgentName(data.agentName || '客服專員');
        setUnreadCount(0);
        setIsTransferring(false);
        transferRequestSent.current = false;
      
        // 🔥 修正並過濾訊息
        const processedMessages = (data.messages || []).map(msg => {
          // 如果訊息內容包含機器人特徵，強制設定為 bot 類型
          if (msg.message && msg.message.includes('Oakly 智能助手')) {
            return {
              ...msg,
              sender_type: 'bot'
            };
          }
          return msg;
        }).filter(msg => 
          // 只保留客戶和真人客服的訊息，排除機器人訊息
          msg.sender_type === 'customer' || msg.sender_type === 'agent'
        );
      
        setMessages(processedMessages);
      

      });
      // 機器人回覆
      newSocket.on('bot_response', (response) => {
        setBotTyping(false);
        setMessages(prev => [...prev, {
          id: Date.now(),
          message: response.message,
          sender_type: 'bot',
          message_type: 'text',
          created_at: new Date().toISOString()
        }]);
        setShowTransferButton(true);
        setTimeout(scrollToBottom, 100);
      });

      // 機器人正在輸入
      newSocket.on('bot_typing', () => {
        setBotTyping(true);
        setTimeout(() => setBotTyping(false), 2000);
      });

      // 轉接成功
      newSocket.on('transfer_success', (data) => {
        setIsBotMode(false);
        setChatStatus('waiting');
        setShowTransferButton(false);
        const transferMessage = {
          id: Date.now(),
          message: "已為您轉接人工客服，請稍候...",
          sender_type: 'system',
          message_type: 'text',
          created_at: new Date().toISOString()
        };
        setMessages(prev => [...prev, transferMessage]);
      });

      // 轉接失敗
      newSocket.on('transfer_failed', (error) => {
        alert('轉接失敗：' + error.message);
      });


      newSocket.on('transfer_initiated', (data) => {
        console.log('收到轉接啟動:', data);
        
        // 🔥 修正：提取正確的數字 roomId
        const newRoomId = data.newRoomId.replace('human_', '');
        
        setRoomId(newRoomId);  // 使用數字 ID
        setChatStatus('waiting');
        setIsBotMode(false);
        setShowTransferButton(false);
        setIsTransferring(false);
        transferRequestSent.current = false;
        
        const waitingMessage = {
          id: Date.now(),
          message: data.message,
          sender_type: 'system',
          message_type: 'text',
          created_at: new Date().toISOString()
        };
        setMessages(prev => [...prev, waitingMessage]);
      });


      // 新訊息
      newSocket.on('new_message', (message) => {
        // console.log('收到新訊息:', message);
        setMessages(prev => [...prev, message]);
        if (!isChatOpen && message.sender_type !== 'customer') {
          setUnreadCount(prev => prev + 1);
        }
        setTimeout(scrollToBottom, 100);
      });

newSocket.on('transfer_completed', (data) => {

  console.log('🔥 客戶端收到轉接完成:', data);
  console.log('🔥 客戶端當前 roomId:', roomId);
  console.log('🔥 客戶端新 roomId:', data.newRoomId);  
  // 客戶加入新房間
  socket.join(`room_${data.newRoomId}`);
  
  // 更新客戶端狀態
  setRoomId(data.newRoomId);
  setChatStatus('active');
  setAgentName(data.agentName);
  setIsBotMode(false);
  setShowTransferButton(false);
  
  // 添加轉接成功訊息
  const successMessage = {
    id: Date.now(),
    message: `已成功轉接給 ${data.agentName}，請問有什麼可以幫助您的？`,
    sender_type: 'system',
    message_type: 'text',
    created_at: new Date().toISOString()
  };
  setMessages(prev => [...prev, successMessage]);
});

      // 聊天結束
      newSocket.on('chat_ended', () => {
        console.log('聊天已結束');
        setChatStatus('offline');
        setAgentName('');
        setMessages([]);
        setRoomId(null);
        setIsBotMode(true);
        setShowTransferButton(false);
        setIsTransferring(false);
        transferRequestSent.current = false;
      });
      // 錯誤處理
      newSocket.on('error', (error) => {
        // console.error('聊天系統錯誤:', error);
        if (error && error.message) {
          alert(error.message);
        }
      });

      // 認證警告
      newSocket.on('auth_warning', (warning) => {
        console.warn('認證警告:', warning);
      });

      // 連接成功確認
      newSocket.on('connection_success', (data) => {
      });

      setSocket(newSocket);
    }, 3000); // 增加延遲到 3 秒，確保所有狀態完全穩定

    return () => {
      clearTimeout(timer);
      transferRequestSent.current = false; 

      if (socket?.connected) {
        console.log('清理並關閉 Socket 連接');
        socket.removeAllListeners(); 

        socket.disconnect();
        setSocket(null);
      }
    };
  }, [isLoading, isLoggedIn, user?.id]);


  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // 验证文件类型和大小
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB限制
      alert('图片大小不能超过5MB');
      return;
    }

    setIsUploading(true);

    const formData = new FormData();
    formData.append('image', file);
    formData.append('roomId', roomId);

    try {
      const response = await fetch('http://localhost:3005/api/chat/upload-image', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        // 发送图片消息
        socket.emit('send_message', {
          roomId,
          message: result.imageUrl,
          messageType: 'image'
        });
      }
    } catch (error) {
      console.error('上传失败:', error);
      alert('图片上传失败');
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };








  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const startChat = () => {
    console.log('Starting chat...');
    if (!socket || !isConnected) {
      console.error('Socket not ready:', { socket: !!socket, isConnected });
      alert('聊天系統未準備就緒，請稍後再試');
      return;
    }

    console.log('📤 Starting bot chat...');

    // 🔥 修改這裡 - 設置機器人模式 🔥
    setIsBotMode(true);
    setChatStatus('bot');
    setAgentName('Oakly 智能助手');
    setIsChatOpen(true);
    setShowTransferButton(false);

    // 發送機器人聊天請求而不是客服請求
    socket.emit('start_bot_chat', {
      ...userData,
    });

    const welcomeMessage = {
      id: Date.now(),
      message: "您好！我是 Oakly 智能助手，很高興為您服務！我可以幫您了解產品資訊、訂單狀態等。請問有什麼可以幫助您的嗎？",
      sender_type: 'bot',
      message_type: 'text',
      created_at: new Date().toISOString()
    };

    setMessages([welcomeMessage]);

    // 延遲顯示轉接按鈕
    setTimeout(() => {
      setShowTransferButton(true);
    }, 2000);
  };

  const sendMessage = () => {
    console.log('Attempting to send message:', {
      currentMessage,
      socket: !!socket,
      roomId,
      chatStatus,
      isBotMode
    });
  
    if (!currentMessage.trim()) {
      console.log('❌ Empty message');
      return;
    }
  
    if (!socket) {
      console.error('❌ No socket connection');
      alert('聊天連接已斷開');
      return;
    }
  
    if (isBotMode && chatStatus === 'bot') {
      // 機器人模式
      console.log('📤 Sending message to bot...');
  
      const userMessage = {
        id: Date.now(),
        message: currentMessage,
        sender_type: 'customer',
        message_type: 'text',
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, userMessage]);
      setBotTyping(true);
  
      socket.emit('send_message_to_bot', {
        roomId: roomId || 'bot_' + Date.now(),
        message: currentMessage,
        messageType: 'text',
        userData
      });
  
    } else if (!isBotMode && roomId) {
      // 🔥 真人客服模式 - 確保 roomId 是數字格式
      const finalRoomId = typeof roomId === 'string' ? roomId.replace('human_', '') : roomId;
      console.log('📤 Sending message to human agent...', { finalRoomId });
      
      socket.emit('send_message', {
        roomId: finalRoomId,  // 使用處理過的 roomId
        message: currentMessage,
        messageType: 'text'
      });
      
    } else {
      console.error('❌ Invalid state for sending message:', { isBotMode, roomId, chatStatus });
      return;
    }
  
    setCurrentMessage('');
  };


  const transferToHuman = () => {
    if (!socket || isTransferring || transferRequestSent.current) {
      console.log('轉接被阻止:', { 
        hasSocket: !!socket, 
        isTransferring, 
        transferRequestSent: transferRequestSent.current 
      });
      return;
    }
  
    console.log('🔄 開始轉接到真人客服...');
    setIsTransferring(true);
    transferRequestSent.current = true; 
  
    // 🔥 使用更簡單的 roomId 生成邏輯
    const transferRoomId = `transfer_${userData.userId || socket.id}_${Date.now()}`;
  
    setIsBotMode(false);
    setChatStatus('waiting');
    setAgentName('');
    setShowTransferButton(false);
    setRoomId(transferRoomId); // 設定新的轉接 roomId
  
    socket.emit('request_human_transfer', { 
      roomId: transferRoomId, // 使用新生成的 roomId
      userData,
      previousMessages: messages,
      transferReason: '客戶主動要求轉接真人客服'
    });
  
    const transferMessage = {
      id: Date.now(),
      message: "正在為您轉接真人客服，請稍候...",
      sender_type: 'system',
      message_type: 'text',
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, transferMessage]);
  };










  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const quickReplies = [
    "產品諮詢",
    "訂單查詢",
    "退換貨服務",
    "配送問題",
    "售後服務",
    "其他問題"
  ];

  const handleQuickReply = (reply) => {
    if (!socket) return;

    if (isBotMode && chatStatus === 'bot') {
      // 直接發送快速回覆訊息
      const userMessage = {
        id: Date.now(),
        message: reply,
        sender_type: 'customer',
        message_type: 'text',
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, userMessage]);
      setBotTyping(true);

      socket.emit('send_message_to_bot', {
        roomId: roomId || 'bot_' + Date.now(),
        message: reply,
        messageType: 'text',
        userData
      });
    } else if (!isBotMode && roomId) {
      // 真人客服模式
      socket.emit('send_message', {
        roomId,
        message: reply,
        messageType: 'text'
      });
    }
  };

  const endChat = () => {
    if (!socket || !roomId) return;
  
    // 發送結束聊天事件到後端
    socket.emit('end_chat', { roomId });
    
    // 立即更新本地狀態
    setIsChatOpen(false);
    setChatStatus('offline');
    setMessages([]);
    setRoomId(null);
    setAgentName('');
    setUnreadCount(0);
    setIsBotMode(true);
    setShowTransferButton(false);
    setIsTransferring(false);
    transferRequestSent.current = false;
  };
  const toggleChat = () => {
    if (isChatOpen) {
      setIsChatOpen(false);
    } else {
      setIsChatOpen(true);
      setUnreadCount(0);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-TW', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusText = () => {
    switch (chatStatus) {
      case 'bot':
        return `與 ${agentName} 對話中`;
      case 'waiting':
        return '等待客服中...';
      case 'active':
        return `與 ${agentName} 對話中`;
      case 'offline':
      default:
        return isConnected ? '點擊開始對話' : '連接中...';
    }
  };
  // 如果正在載入認證狀態，顯示載入中
  if (loading) {
    return (
      <div className="oakly-chat-system">
        <div className="customer-chat-widget">
          <button className="chat-toggle-btn" disabled>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"
                stroke="currentColor" strokeWidth="2" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  // 調試用：顯示當前狀態
  const debugInfo = process.env.NODE_ENV === 'development' ? {
    isConnected,
    chatStatus,
    roomId,
    hasSocket: !!socket,
    messagesCount: messages.length
  } : null;

  return (
    <div className="oakly-chat-system">

      <div className="customer-chat-widget">
        {isChatOpen && (
          <div className="chat-window">
            <div className="chat-header">
              <div className="header-left">
                <div className="company-logo">
                  <div className="logo-circle">O</div>
                  <span>Oakly 客服</span>
                </div>
                <div className="status-indicator">
                  <span className={`status-dot ${chatStatus}`}></span>
                  <span className="status-text">{getStatusText()}</span>
                </div>
              </div>
              <button className="close-chat" onClick={toggleChat}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" />
                </svg>
              </button>
            </div>

            <div className="chat-messages">
              {messages.length === 0 && chatStatus === 'offline' && (
                <div className="welcome-message">
                  <div className="welcome-icon">💬</div>
                  <h3>歡迎來到 Oakly 客服</h3>
                  <p>我們專業的客服團隊將協助您解答有關家具的任何問題</p>
                  {isLoggedIn && (
                    <p className="auth-status">已登入會員，享有完整服務記錄</p>
                  )}
                  <button
                    className="start-chat-btn"
                    onClick={startChat}
                    disabled={!isConnected}
                  >
                    {isConnected ? '開始對話' : '連接中...'}
                  </button>
                </div>
              )}

              {chatStatus === 'waiting' && messages.length > 0 && (
                <div className="waiting-message">
                  <div className="typing-indicator">
                    <div className="dot"></div>
                    <div className="dot"></div>
                    <div className="dot"></div>
                  </div>
                  <p>客服專員將盡快為您服務，請稍候...</p>
                </div>
              )}

{messages.map((message, index) => {
  let messageClass = 'received';
  if (message.sender_type === 'customer') {
    messageClass = 'sent';
  } else if (message.sender_type === 'system') {
    messageClass = 'system';
  }

  return (
    <div
      key={`${message.id || 'msg'}_${index}_${message.created_at}`}
      className={`message ${messageClass} ${
        message.sender_type === 'bot' ? 'bot-message' : ''
      }`}
    >
      {(message.sender_type === 'bot' || message.sender_type === 'agent') && (
        <div className="bot-avatar">
          <span className="bot-icon">
            {message.sender_type === 'bot' ? '🤖' : '👤'}
          </span>
        </div>
      )}

      {message.sender_type === 'system' && (
        <div className="system-avatar">
          <span className="system-icon">ℹ️</span>
        </div>
      )}

      <div className="message-content">
        <div className="message-bubble">
          {/* 🔥 添加圖片顯示邏輯 */}
          {message.message_type === 'image' ? (
            <img
              src={message.message}
              alt="上傳的圖片"
              style={{
                maxWidth: '200px',
                height: 'auto',
                borderRadius: '8px',
                display: 'block'
              }}
              onError={(e) => {
                console.error('圖片載入失敗:', message.message);
                e.target.style.display = 'none';
              }}
            />
          ) : (
            message.message
          )}
        </div>
        <div className="message-time">
          {formatTime(message.created_at)}
        </div>
      </div>
    </div>
  );
})}

              {botTyping && (
                <div className="message received bot-message">
                  <div className="bot-avatar">
                    <span className="bot-icon">🤖</span>
                  </div>
                  <div className="message-content">
                    <div className="message-bubble typing-bubble">
                      <div className="typing-indicator">
                        <div className="dot"></div>
                        <div className="dot"></div>
                        <div className="dot"></div>
                      </div>
                      <span className="typing-text">智能助手正在輸入...</span>
                    </div>
                  </div>
                </div>
              )}

              {showTransferButton && isBotMode && chatStatus === 'bot' && (
                <div className="transfer-section">
                  <div className="transfer-prompt">
                    <p>需要更詳細的協助嗎？</p>
                    <button className="transfer-to-human-btn" onClick={transferToHuman}>
                      <span className="transfer-icon">👤</span>
                      轉接真人客服
                    </button>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
            {/* 快速回覆按鈕 */}
            {isBotMode && chatStatus === 'bot' && (
              <div className="quick-replies">
                <div className="quick-reply-buttons">
                  {quickReplies.map((reply, index) => (
                    <button
                      key={index}
                      className="quick-reply-btn"
                      onClick={() => handleQuickReply(reply)}
                    >
                      {reply}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="chat-input">
              <div className="input-container">
                <input
                  ref={inputRef}
                  type="text"
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={
                    !isConnected ? '連接中...' :
                      !roomId ? '請先開始對話' :
                        // chatStatus === 'waiting' ? '請等待客服回應...' : 
                        '輸入訊息...'
                  }
                  disabled={
                    !isConnected || 
                    chatStatus === 'offline' || 
                    (isBotMode && chatStatus !== 'bot') ||
                    (!isBotMode && !roomId)
                  }                   className="message-input"
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
                  disabled={!isConnected || !roomId || isUploading}
                  className="image-upload-btn"
                  style={{ background: 'transparent', border: 'none' }}

                >
                  <i className="fa-solid fa-images fa-2x" style={{ color: '#cccccc' }}></i>
                </button>
                <button
                  onClick={sendMessage}
                  disabled={
                    !currentMessage.trim() || 
                    !isConnected || 
                    chatStatus === 'offline' ||
                    (isBotMode && chatStatus !== 'bot') ||
                    (!isBotMode && !roomId)
                  }                   className="send-button"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 11L11 13"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
              </div>

              {chatStatus === 'active' && (
                <div className="chat-actions">
                  <button className="end-chat-btn" onClick={endChat}>
                    結束對話
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 聊天按鈕 */}
        <button
          className={`chat-toggle-btn ${isChatOpen ? 'open' : ''}`}
          onClick={toggleChat}
        >
          {isChatOpen ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M19 9l-7 7-7-7" stroke="currentColor" strokeWidth="2" />
            </svg>
          ) : (
            <>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"
                  stroke="currentColor" strokeWidth="2" />
              </svg>
              {unreadCount > 0 && (
                <div className="unread-badge">{unreadCount}</div>
              )}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default CustomerChat;