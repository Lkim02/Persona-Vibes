// Twitter Activity Monitor - Background Script
// This script runs in the background and handles data from content scripts

// Create Tweet API request URL pattern
const TWEET_API_URL_PATTERN = "https://x.com/i/api/graphql/UYy4T67XpYXgWKOafKXB_A/CreateTweet";

// Server API URL
const SERVER_API_URL = "http://localhost:3000/api";

// Monitoring status
let isMonitoringEnabled = true;

function timeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Initialize data storage
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['tweets', 'replies', 'isMonitoringEnabled'], (result) => {
    if (!result.tweets) {
      chrome.storage.local.set({ tweets: [] });
    }
    if (!result.replies) {
      chrome.storage.local.set({ replies: [] });
    }
    // Initialize monitoring status
    if (result.isMonitoringEnabled === undefined) {
      chrome.storage.local.set({ isMonitoringEnabled: true });
    } else {
      isMonitoringEnabled = result.isMonitoringEnabled;
    }
    console.log('Twitter Activity Monitor: Storage initialized');
    
    // If monitoring is enabled, set up network monitoring
    if (isMonitoringEnabled) {
      setupNetworkMonitoring();
    }
  });
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Handle start monitoring message
  if (message.action === 'startMonitoring') {
    console.log('Twitter Activity Monitor: Starting network request monitoring');
    isMonitoringEnabled = true;
    chrome.storage.local.set({ isMonitoringEnabled: true });
    setupNetworkMonitoring();
    sendResponse({ success: true });
  }
  // Handle stop monitoring message
  else if (message.action === 'stopMonitoring') {
    console.log('Twitter Activity Monitor: Stopping network request monitoring');
    isMonitoringEnabled = false;
    chrome.storage.local.set({ isMonitoringEnabled: false });
    removeNetworkMonitoring();
    sendResponse({ success: true });
  }
  // Handle new tweet
  else if (message.action === 'newTweet' && message.data) {
    saveTweet(message.data);
    console.log('Tweet Content:', message.data.content);
    sendResponse({ success: true });
  }
  // Handle new reply
  else if (message.action === 'newReply' && message.data) {
    saveReply(message.data);
    console.log('Reply Content:', message.data.content);
    sendResponse({ success: true });
  }
  // Handle show error message
  else if (message.action === 'showError' && message.data) {
    showErrorNotification(message.data.message);
    sendResponse({ success: true });
  }
  // Handle manual sync request
  else if (message.action === 'syncToServer') {
    syncAllToServer()
      .then(result => {
        sendResponse({ success: true, result });
      })
      .catch(error => {
        console.error('Error during manual sync:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep the message channel open for async response
  }
  
  // Return true for async response
  return true;
});

// Show error notification
function showErrorNotification(errorMessage) {
  // Show notification if permissions allow
  if (chrome.notifications) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'Twitter Activity Monitor Error',
      message: errorMessage,
      priority: 2
    });
  }
  
  // Also send error to popup if it's open
  chrome.runtime.sendMessage({
    action: 'displayError',
    data: {
      message: errorMessage
    }
  });
  
  console.error('Twitter Activity Monitor Error:', errorMessage);
}

// Network request listener
let networkRequestListener = null;

// Set up network request monitoring
function setupNetworkMonitoring() {
  // Remove existing listener if present
  removeNetworkMonitoring();
  
  // Create new listener function
  networkRequestListener = function(details) {
    // Skip processing if monitoring is disabled
    if (!isMonitoringEnabled) return;
    
    // Only process POST requests
    if (details.method !== "POST") return;
    
    // Check if request URL matches Tweet API
    if (details.url.includes("CreateTweet")) {
      try {
        // Get request body data
        const requestBody = details.requestBody;
        if (!requestBody || !requestBody.raw) return;
        
        // Parse request body
        const decoder = new TextDecoder("utf-8");
        const rawData = requestBody.raw[0].bytes;
        const jsonString = decoder.decode(rawData);
        const requestData = JSON.parse(jsonString);
        
        // Extract tweet content
        if (requestData && requestData.variables && requestData.variables.tweet_text) {
          const tweetText = requestData.variables.tweet_text;
          
          // Correctly get reply ID
          const inReplyToTweetId = requestData.variables.reply?.in_reply_to_tweet_id || null;
          
          // Create tweet data object
          const tweetData = {
            content: tweetText,
            timestamp: new Date().toISOString(),
            url: details.initiator || details.documentUrl,
            replyToTweetId: inReplyToTweetId,
            tweetId: `tweet_${Date.now()}`
          };
          
          // Save data based on whether it's a reply
          if (inReplyToTweetId) {
            saveReply(tweetData);
            console.log('Twitter Activity Monitor: Reply captured via network request');
            console.log('Reply Content:', tweetText);
            console.log('Reply To Tweet ID:', inReplyToTweetId);
          } else {
            saveTweet(tweetData);
            console.log('Twitter Activity Monitor: Tweet captured via network request');
            console.log('Tweet Content:', tweetText);
          }
          
          // Notify content script that tweet was captured
          notifyContentScript(tweetData, inReplyToTweetId ? 'reply' : 'tweet');
          
          // Save to server if user is authenticated
          saveToServer(tweetData, inReplyToTweetId ? true : false);
        }
      } catch (error) {
        console.error('Twitter Activity Monitor: Error processing request data', error);
        showErrorNotification('Error processing tweet data: ' + error.message);
      }
    }
  };
  
  // Add listener
  chrome.webRequest.onBeforeRequest.addListener(
    networkRequestListener,
    { urls: ["*://x.com/i/api/graphql/*", "*://twitter.com/i/api/graphql/*"] },
    ["requestBody"]
  );
  
  console.log('Twitter Activity Monitor: Network request monitoring set up');
}

// Remove network request monitoring
function removeNetworkMonitoring() {
  if (networkRequestListener) {
    chrome.webRequest.onBeforeRequest.removeListener(networkRequestListener);
    networkRequestListener = null;
    console.log('Twitter Activity Monitor: Network request monitoring removed');
  }
}

// Notify content script that tweet was captured
function notifyContentScript(tweetData, type) {
  // Send message to all content scripts
  chrome.tabs.query({ url: ["*://twitter.com/*", "*://x.com/*"] }, (tabs) => {
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, {
        action: 'tweetCaptured',
        data: tweetData,
        type: type
      });
    });
  });
}

// Save new tweet
function saveTweet(tweetData) {
  // Don't save data if monitoring is disabled
  if (!isMonitoringEnabled) return;
  
  chrome.storage.local.get(['tweets'], (result) => {
    const tweets = result.tweets || [];
    tweets.unshift(tweetData); // Add to beginning of array
    
    chrome.storage.local.set({ tweets }, () => {
      console.log('Twitter Activity Monitor: New tweet saved');
    });
  });
}

// Save new reply
function saveReply(replyData) {
  // Don't save data if monitoring is disabled
  if (!isMonitoringEnabled) return;
  
  chrome.storage.local.get(['replies'], (result) => {
    const replies = result.replies || [];
    replies.unshift(replyData); // Add to beginning of array
    
    chrome.storage.local.set({ replies }, () => {
      console.log('Twitter Activity Monitor: New reply saved');
    });
  });
}

// Save tweet or reply to server
async function saveToServer(tweetData, isReply) {
  try {
    // Check if user is authenticated
    const authData = await new Promise((resolve) => {
      chrome.storage.local.get(['auth'], (result) => {
        resolve(result.auth || {});
      });
    });
    
    // If no token, don't try to save to server
    if (!authData.token) {
      console.log('Twitter Activity Monitor: Not saving to server - user not authenticated');
      return;
    }
    
    // Prepare request data
    const requestData = {
      tweetId: tweetData.tweetId,
      content: tweetData.content,
      isReply: isReply || false
    };
    
    // Make API request
    const response = await fetch(`${SERVER_API_URL}/tweets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authData.token}`
      },
      body: JSON.stringify(requestData)
    });
    
    // Check response
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error saving to server');
    }
    
    const responseData = await response.json();
    console.log('Twitter Activity Monitor: Successfully saved to server', responseData);
    
    // Update sync status
    updateSyncStatus({
      lastSynced: new Date().toISOString(),
      error: null
    });
    
    return responseData;
  } catch (error) {
    console.error('Twitter Activity Monitor: Error saving to server', error);
    
    // Update sync status with error
    updateSyncStatus({
      error: error.message
    });
    
    // Show error notification
    showErrorNotification(`Error saving to server: ${error.message}`);
    
    throw error;
  }
}

// Sync all local tweets and replies to server
async function syncAllToServer() {
  try {
    // Update sync status to indicate syncing
    updateSyncStatus({
      isSyncing: true,
      error: null
    });
    
    // Check if user is authenticated
    const authData = await new Promise((resolve) => {
      chrome.storage.local.get(['auth'], (result) => {
        resolve(result.auth || {});
      });
    });
    
    // If no token, don't try to sync
    if (!authData.token) {
      throw new Error('User not authenticated');
    }
    
    // Get all tweets and replies
    const storage = await new Promise((resolve) => {
      chrome.storage.local.get(['tweets', 'replies'], (result) => {
        resolve({
          tweets: result.tweets || [],
          replies: result.replies || []
        });
      });
    });
    
    // Combine tweets and replies for syncing
    const allTweets = [
      ...storage.tweets.map(tweet => ({ ...tweet, isReply: false })),
      ...storage.replies.map(reply => ({ ...reply, isReply: true }))
    ];
    
    // Skip if no tweets to sync
    if (allTweets.length === 0) {
      console.log('Twitter Activity Monitor: No tweets to sync');
      updateSyncStatus({
        isSyncing: false,
        lastSynced: new Date().toISOString(),
        error: null
      });
      return { synced: 0, total: 0 };
    }
    
    console.log(`Twitter Activity Monitor: Syncing ${allTweets.length} tweets/replies to server`);
    
    // Sync each tweet/reply
    let syncedCount = 0;
    let errors = [];
    
    for (const tweet of allTweets) {
      try {
        // Prepare request data
        const requestData = {
          tweetId: tweet.tweetId,
          content: tweet.content,
          isReply: tweet.isReply || false
        };
        
        // Make API request
        const response = await fetch(`${SERVER_API_URL}/tweets`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authData.token}`
          },
          body: JSON.stringify(requestData)
        });
        
        // Check response
        if (!response.ok) {
          const errorData = await response.json();
          // If tweet already exists, that's okay
          if (errorData.message && errorData.message.includes('already exists')) {
            syncedCount++;
            continue;
          }
          throw new Error(errorData.message || 'Error saving to server');
        }
        
        syncedCount++;
      } catch (error) {
        console.error(`Error syncing tweet ${tweet.tweetId}:`, error);
        errors.push(`${tweet.tweetId}: ${error.message}`);
      }
    }
    
    // Update sync status
    updateSyncStatus({
      isSyncing: false,
      lastSynced: new Date().toISOString(),
      error: errors.length > 0 ? `Failed to sync ${errors.length} tweets` : null
    });
    
    console.log(`Twitter Activity Monitor: Synced ${syncedCount}/${allTweets.length} tweets/replies`);
    
    return {
      synced: syncedCount,
      total: allTweets.length,
      errors: errors.length > 0 ? errors : null
    };
  } catch (error) {
    console.error('Twitter Activity Monitor: Error during sync', error);
    
    // Update sync status with error
    updateSyncStatus({
      isSyncing: false,
      error: error.message
    });
    
    // Show error notification
    showErrorNotification(`Error syncing with server: ${error.message}`);
    
    throw error;
  }
}

// Update sync status in storage
function updateSyncStatus(statusUpdate) {
  chrome.storage.local.get(['syncStatus'], (result) => {
    const currentStatus = result.syncStatus || {};
    const newStatus = { ...currentStatus, ...statusUpdate };
    
    chrome.storage.local.set({ syncStatus: newStatus }, () => {
      console.log('Twitter Activity Monitor: Sync status updated', newStatus);
      
      // Notify popup about status update
      chrome.runtime.sendMessage({
        action: 'syncStatusUpdated',
        data: newStatus
      });
    });
  });
}

// Log that background script has loaded
console.log('Twitter Activity Monitor: Background script loaded');


/* ----------------- Tiktok --------------------- */
// Handle TikTok HTML content
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  // Handle TikTok HTML extraction
  if (message.action === 'newTiktokVideos' && message.data) {
    await timeout(5000);
    // Send success response
    sendResponse({
      success: true,
      data: message.data
    });
  }
  
  // Return true for async response
  return true;
});


