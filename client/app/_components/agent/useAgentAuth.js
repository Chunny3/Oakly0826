'use client'

import { useState, useEffect } from 'react';

export const useAgentAuth = () => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const agentLogin = async (email, password) => {
    const response = await fetch('http://localhost:3005/api/agents/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const result = await response.json();
    
    if (result.status === 'success') {
      const authData = {
        user: result.data.user,
        token: result.data.token
      };
      localStorage.setItem('agentAuth', JSON.stringify(authData));
      setUser(authData.user);
      return authData;
    } else {
      throw new Error(result.message);
    }
  };

  const agentLogout = async () => {
    try {
      const authData = localStorage.getItem('agentAuth');
      if (authData) {
        const { token } = JSON.parse(authData);
        await fetch('http://localhost:3005/api/agents/logout', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }
    } catch (error) {
      console.error('登出錯誤:', error);
    }
    localStorage.removeItem('agentAuth');
    setUser(null);
  };

  useEffect(() => {
    const checkAgentAuth = async () => {
      const authData = localStorage.getItem('agentAuth');
      if (authData) {
        try {
          const { user, token } = JSON.parse(authData);
          
          const response = await fetch('http://localhost:3005/api/agents/status', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (response.ok) {
            setUser(user);
          } else {
            localStorage.removeItem('agentAuth');
          }
        } catch (error) {
          localStorage.removeItem('agentAuth');
        }
      }
      setIsLoading(false);
    };

    checkAgentAuth();
  }, []);

  return { user, isLoading, agentLogin, agentLogout, isAuthenticated: !!user };
};
