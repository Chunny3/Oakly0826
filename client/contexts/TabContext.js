"use client";
import { createContext, useContext, useState } from 'react';

// 建立 Context
const TabContext = createContext();

// Provider 組件
export function TabProvider({ children }) {
  const [currentTab, setCurrentTab] = useState(1);

  return (
    <TabContext.Provider value={{ currentTab, setCurrentTab }}>
      {children}
    </TabContext.Provider>
  );
}

// 自訂 Hook 方便使用
export function useTab() {
  const context = useContext(TabContext);
  if (!context) {
    throw new Error('useTab must be used within a TabProvider');
  }
  return context;
}