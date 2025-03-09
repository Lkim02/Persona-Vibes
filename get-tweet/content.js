// Twitter Activity Monitor - Content Script
// This script runs in the context of Twitter/X web pages

console.log('Twitter Activity Monitor: Content script loaded');

// Notify background script to start monitoring when page loads
function notifyBackgroundToStartMonitoring() {
  chrome.runtime.sendMessage({ action: 'startMonitoring' }, (response) => {
    if (response && response.success) {
      console.log('Twitter Activity Monitor: Background script notified to start monitoring');
    } else {
      console.error('Twitter Activity Monitor: Failed to notify background script');
    }
  });
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Handle captured tweet messages
  if (message.action === 'tweetCaptured') {
    const tweetData = message.data;
    const tweetType = message.type;
    
    // Print content to console
    if (tweetType === 'reply') {
      console.log('Content Script - Reply Captured:');
      console.log('Content:', tweetData.content);
      console.log('In Reply To:', tweetData.replyToTweetId);
    } else {
      console.log('Content Script - Tweet Captured:');
      console.log('Content:', tweetData.content);
    }
    
    console.log(`Twitter Activity Monitor: ${tweetType === 'reply' ? 'Reply' : 'Tweet'} captured`, tweetData);
    
    // Show notification (optional)
    showNotification(tweetType, tweetData);
    
    sendResponse({ success: true });
  }
});

// Show notification
function showNotification(type, data) {
  // Check if we have permission to show notifications
  chrome.storage.local.get(['isMonitoringEnabled'], (result) => {
    // Don't show notification if monitoring is disabled
    if (result.isMonitoringEnabled === false) return;
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'twitter-monitor-notification';
    notification.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background-color: rgba(29, 161, 242, 0.9);
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 14px;
      z-index: 9999;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      max-width: 300px;
      transition: opacity 0.3s ease-in-out;
    `;
    
    // Set notification content
    notification.textContent = type === 'reply' 
      ? 'Your reply has been captured' 
      : 'Your tweet has been captured';
    
    // Add to page
    document.body.appendChild(notification);
    
    // Print content to console again with notification
    console.log(`Notification shown for ${type}:`, data.content);
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  });
}

// Start monitoring when page is fully loaded
window.addEventListener('load', () => {
  // Delay notification to background script to ensure page is fully loaded
  setTimeout(notifyBackgroundToStartMonitoring, 1000);
});
