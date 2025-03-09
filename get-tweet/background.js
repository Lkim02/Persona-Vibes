// Twitter Activity Monitor - Background Script
// This script runs in the background and handles data from content scripts

// Create Tweet API request URL pattern
const TWEET_API_URL_PATTERN = "https://x.com/i/api/graphql/UYy4T67XpYXgWKOafKXB_A/CreateTweet";

// Monitoring status
let isMonitoringEnabled = true;

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
  
  // Return true for async response
  return true;
});

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
            replyToTweetId: inReplyToTweetId
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
        }
      } catch (error) {
        console.error('Twitter Activity Monitor: Error processing request data', error);
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

// Log that background script has loaded
console.log('Twitter Activity Monitor: Background script loaded');
