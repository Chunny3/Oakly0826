'use client'

import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import "@/styles/products/chat.css";


const CustomerChat = () => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatStatus, setChatStatus] = useState('offline'); // offline, waiting, active
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [roomId, setRoomId] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [agentName, setAgentName] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  
  // 模擬用戶資料（實際應用中從認證系統獲取）
  const userData = {
    userId: 1,
    userName: 'John Doe'
  };
  
  useEffect(() => {
    // 建立 WebSocket 連接 - 修正：連接到正確的端口 3005
    const newSocket = io('http://localhost:3005', {
      transports: ['websocket', 'polling']
    });
    
    newSocket.on('connect', () => {
      console.log('✅ Connected to chat server:', newSocket.id);
      setIsConnected(true);
      
      // 以客戶身份加入
      console.log('📤 Sending join_as_customer:', userData);
      newSocket.emit('join_as_customer', userData);
    });
    
    newSocket.on('disconnect', () => {
      console.log('❌ Disconnected from chat server');
      setIsConnected(false);
    });
    
    newSocket.on('connect_error', (error) => {
      console.error('🚫 WebSocket connection error:', error);
    });
    
    // 房間已加入（恢復之前的聊天）
    newSocket.on('room_joined', (data) => {
      console.log('🏠 Room joined:', data);
      setRoomId(data.roomId);
      setChatStatus(data.status);
      setMessages(data.messages || []);
      setIsChatOpen(true);
      setAgentName(data.agentName || '客服專員');
    });
    
    // 房間已創建
    newSocket.on('room_created', (data) => {
      console.log('🆕 Room created:', data);
      setRoomId(data.roomId);
      setChatStatus('waiting');
    });
    
    // 聊天被接受
    newSocket.on('chat_accepted', (data) => {
      console.log('✅ Chat accepted:', data);
      setChatStatus('active');
      setMessages(data.messages || []);
      setAgentName(data.agentName || '客服專員');
      setUnreadCount(0);
    });
    
    // 新消息
    newSocket.on('new_message', (message) => {
      console.log('💬 New message:', message);
      setMessages(prev => [...prev, message]);
      if (!isChatOpen) {
        setUnreadCount(prev => prev + 1);
      }
      setTimeout(scrollToBottom, 100);
    });
    
    // 聊天結束
    newSocket.on('chat_ended', () => {
      console.log('🏁 Chat ended');
      setChatStatus('offline');
      setAgentName('');
      setMessages([]);
      setRoomId(null);
    });
    
    // 錯誤處理
    newSocket.on('error', (error) => {
      console.error('❌ Chat error:', error);
      alert(error.message);
    });
    
    setSocket(newSocket);
    
    return () => {
      console.log('🔌 Cleaning up socket connection');
      newSocket.close();
    };
  }, []);
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  const startChat = () => {
    console.log('🚀 Starting chat...');
    if (!socket || !isConnected) {
      console.error('❌ Socket not ready:', { socket: !!socket, isConnected });
      alert('聊天系統未準備就緒，請稍後再試');
      return;
    }
    
    const initialMessage = '您好，我需要諮詢家具相關問題';
    
    console.log('📤 Requesting customer service...');
    socket.emit('request_customer_service', {
      ...userData,
      message: initialMessage
    });
    
    setIsChatOpen(true);
    setChatStatus('waiting');
    setMessages([{
      id: Date.now(),
      sender_type: 'customer',
      message: initialMessage,
      created_at: new Date()
    }]);
  };
  
  const sendMessage = () => {
    console.log('💬 Attempting to send message:', {
      currentMessage,
      socket: !!socket,
      roomId,
      chatStatus
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
    
    if (!roomId) {
      console.error('❌ No room ID');
      alert('請先開始對話');
      return;
    }
    
    console.log('📤 Sending message...');
    socket.emit('send_message', {
      roomId,
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
    if (!socket || !roomId) return;
    
    socket.emit('end_chat', { roomId });
    setIsChatOpen(false);
    setChatStatus('offline');
    setMessages([]);
    setRoomId(null);
    setAgentName('');
    setUnreadCount(0);
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
      case 'waiting':
        return '等待客服中...';
      case 'active':
        return `與 ${agentName} 對話中`;
      case 'offline':
      default:
        return isConnected ? '點擊開始對話' : '連接中...';
    }
  };
  
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
      {/* 調試資訊（僅開發模式）
      {debugInfo && (
        <div style={{
          position: 'absolute',
          top: '-100px',
          right: '0',
          background: '#000',
          color: '#fff',
          padding: '5px',
          fontSize: '10px',
          borderRadius: '3px'
        }}>
          Connected: {debugInfo.isConnected ? '✅' : '❌'}<br/>
          Status: {debugInfo.chatStatus}<br/>
          Room: {debugInfo.roomId || 'None'}<br/>
          Socket: {debugInfo.hasSocket ? '✅' : '❌'}<br/>
          Messages: {debugInfo.messagesCount}
        </div>
      )} */}

      {/* 聊天窗口 */}
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
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </button>
          </div>
          
          <div className="chat-messages">
            {messages.length === 0 && chatStatus === 'offline' && (
              <div className="welcome-message">
                <div className="welcome-icon">💬</div>
                <h3>歡迎來到 Oakly 客服</h3>
                <p>我們專業的客服團隊將協助您解答有關家具的任何問題</p>
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
            
            {messages.map((message, index) => (
              <div
                key={message.id || index}
                className={`message ${message.sender_type === 'customer' ? 'sent' : 'received'}`}
              >
                <div className="message-content">
                  <div className="message-bubble">
                    {message.message}
                  </div>
                  <div className="message-time">
                    {formatTime(message.created_at)}
                  </div>
                </div>
              </div>
            ))}
            
            <div ref={messagesEndRef} />
          </div>
          
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
                disabled={!isConnected || !roomId}
                className="message-input"
              />
              <button
                onClick={sendMessage}
                disabled={!currentMessage.trim() || !isConnected || !roomId}
                className="send-button"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 11L11 13" 
                        stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
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
            <path d="M19 9l-7 7-7-7" stroke="currentColor" strokeWidth="2"/>
          </svg>
        ) : (
          <>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" 
                    stroke="currentColor" strokeWidth="2"/>
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