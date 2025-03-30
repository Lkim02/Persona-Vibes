// Error handling utilities for the Chrome extension

// Global error state for the application
let errorListeners = [];

// Register a listener for error events
export const registerErrorListener = (callback) => {
  errorListeners.push(callback);
  return () => {
    // Return unsubscribe function
    errorListeners = errorListeners.filter(listener => listener !== callback);
  };
};

// Notify all listeners of an error
export const notifyError = (errorMessage) => {
  errorListeners.forEach(listener => listener(errorMessage));
};

// Initialize error message listener from background script
export const initializeErrorListener = () => {
  // Only set up the listener once
  if (chrome?.runtime?.onMessage) {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === 'showError' && message.data) {
        notifyError(message.data.message);
        sendResponse({ success: true });
      }
      return true; // Keep the message channel open for async response
    });
  }
};

// Send error to background script for notification
export const showError = (errorMessage) => {
  if (chrome?.runtime?.sendMessage) {
    chrome.runtime.sendMessage({
      action: 'showError',
      data: {
        message: errorMessage
      }
    });
  }
  
  // Also notify local listeners
  notifyError(errorMessage);
};
