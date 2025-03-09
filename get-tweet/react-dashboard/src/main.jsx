import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// 确保 React 应用能在 Chrome 扩展环境中正确初始化
const initApp = () => {
  const rootElement = document.getElementById('root');
  
  if (rootElement) {
    // 清除加载指示器
    while (rootElement.firstChild) {
      rootElement.removeChild(rootElement.firstChild);
    }
    
    // 渲染 React 应用
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    );
    
    console.log('React application initialized successfully');
  } else {
    console.error('Root element not found');
  }
};

// 等待 DOM 完全加载后初始化应用
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  // 如果 DOM 已经加载完成，直接初始化应用
  initApp();
}
