import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import useAuthStore from './store/authStore'
import useTweetStore from './store/tweetStore'
import { initializeErrorListener } from './utils/errorHandler'

// Initialize authentication and tweet stores
const initializeStores = async () => {
  // Initialize error listener
  initializeErrorListener();
  
  // Initialize auth store
  const authStore = useAuthStore.getState();
  await authStore.init();
  
  // Initialize tweet store and sync status listener
  const tweetStore = useTweetStore.getState();
  tweetStore.initSyncStatusListener();
  
  // If user is authenticated, load tweets
  if (authStore.isAuthenticated) {
    tweetStore.loadTweets();
  }
};

// Ensure React app initializes correctly in Chrome extension environment
const initApp = async () => {
  const rootElement = document.getElementById('root');
  
  if (rootElement) {
    // Clear loading indicator
    while (rootElement.firstChild) {
      rootElement.removeChild(rootElement.firstChild);
    }
    
    // Initialize stores before rendering
    await initializeStores();
    
    // Render React application
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

// Wait for DOM to fully load before initializing app
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  // If DOM is already loaded, initialize app immediately
  initApp();
}
