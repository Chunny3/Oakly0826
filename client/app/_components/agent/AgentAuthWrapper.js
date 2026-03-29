'use client'
import React from 'react';
import { useAgentAuth } from './useAgentAuth';
import AgentLoginPage from './AgentLoginPage';
import WebSocketCustomerServiceAdmin from './WebSocketCustomerServiceAdmin';


const AgentAuthWrapper = () => {
  const { user, isLoading, agentLogin, agentLogout, isAuthenticated } = useAgentAuth();

  if (isLoading) return <div>載入中...</div>;
  if (!isAuthenticated) return <AgentLoginPage onLogin={agentLogin} />;
  
  return <WebSocketCustomerServiceAdmin user={user} onLogout={agentLogout} />;
};

export default AgentAuthWrapper;