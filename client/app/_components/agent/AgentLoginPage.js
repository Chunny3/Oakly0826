'use client'

import React, { useState } from 'react';

const AgentLoginPage = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await onLogin(email, password);
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fillTestAccount = (testEmail) => {
    setEmail(testEmail);
    setPassword('password123');
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="logo">
            <div className="logo-icon">🌳</div>
            <h1>Oakly</h1>
          </div>
          <p>客服系統登入</p>
        </div>

        {error && (
          <div className="error-message">
            <span>⚠️</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>電子信箱</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="請輸入您的電子信箱"
              required
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label>密碼</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="請輸入密碼"
              required
              disabled={isLoading}
            />
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="login-btn"
          >
            {isLoading ? '登入中...' : '登入'}
          </button>
        </form>
        {/* <div className="test-accounts">
          <div className="test-account-buttons">
            {[
              { email: 'agent1@oakly.com', name: '客服小美' },
              { email: 'agent2@oakly.com', name: '客服小華' },
              { email: 'agent3@oakly.com', name: '客服小明' }
            ].map((account) => (
              <button
                key={account.email}
                type="button"
                onClick={() => fillTestAccount(account.email)}
                disabled={isLoading}
                className="test-account-btn"
              >
                {account.name}
              </button>
            ))}
          </div>
        </div> */}
      </div>
      

      <style jsx>{`
        .login-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(136deg,rgb(217, 217, 217) 0%,rgb(27, 89, 67) 100%);
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .login-card {
          background: white;
          border-radius: 16px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          padding: 40px;
          width: 100%;
          max-width: 400px;
          animation: slideUp 0.5s ease-out;
        }

        .login-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .logo {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-bottom: 8px;
        }

        .logo-icon {
          font-size: 32px;
        }

        .logo h1 {
          margin: 0;
          color: #1f2937;
          font-size: 30px;
          font-weight: 700;
        }

        .login-header p {
          margin: 0;
          color: #6b7280;
          font-size: 16px;
        }

        .error-message {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #b91c1c;
          padding: 16px;
          border-radius: 8px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .form-group label {
          display: block;
          font-size: 14px;
          font-weight: 500;
          color: #374151;
          margin-bottom: 6px;
        }

        .form-group input {
          width: 100%;
          padding: 12px 16px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 14px;
          transition: all 0.2s;
          box-sizing: border-box;
        }

        .form-group input:focus {
          outline: none;
          ring: 2px;
          ring-color: #D9A778;
          border-color: #D9A778;
          box-shadow: 0 0 0 3px rgba(251, 191, 36, 0.1);
        }

        .form-group input:disabled {
          background-color: #f9fafb;
          cursor: not-allowed;
        }

        .login-btn {
          width: 100%;
background: linear-gradient(90deg, #E7B091 0%, #C8906C 100%);
          color: white;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .login-btn:hover:not(:disabled) {
  background: linear-gradient(90deg, #D6A679 0%,rgb(198, 125, 80) 100%);
          transform: translateY(-1px);
box-shadow: 0 4px 12px rgba(201, 104, 52, 0.3);
        }

        .login-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        .test-accounts {
          margin-top: 32px;
          padding-top: 24px;
          border-top: 1px solid #e5e7eb;
          text-align: center;
        }

        .test-label {
          color: #6b7280;
          font-size: 14px;
          margin: 0 0 12px 0;
        }

        .test-account-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          justify-content: center;
        }

        .test-account-btn {
          background: #f3f4f6;
          border: 1px solid #d1d5db;
          color: #374151;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .test-account-btn:hover:not(:disabled) {
          background: #e5e7eb;
        }

        .test-account-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 480px) {
          .login-card {
            padding: 24px;
            margin: 16px;
          }
          
          .logo h1 {
            font-size: 24px;
          }
        }
      `}</style>
    </div>
  );
};

export default AgentLoginPage;