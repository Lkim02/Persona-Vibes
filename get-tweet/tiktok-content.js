// TikTok HTML Extractor - Content Script
// This script runs in the context of TikTok web pages

console.log('TikTok HTML Extractor: Content script loaded');
const videosMap = {};
// Function to extract HTML content
function extractHtml() {
  // Get the entire HTML content
  const htmlContent = document.documentElement.outerHTML;
  const videos = document.querySelectorAll('div[data-e2e="explore-item-list"] div[data-e2e="explore-item"]');
  const newVideoUrls = [];
  for (const video of videos) {
    const videoUrl = video.querySelector('a').href;
    if (videosMap[videoUrl]) {
        continue;
    }
    videosMap[videoUrl] = video;
    newVideoUrls.push(videoUrl);
  }
  chrome.runtime.sendMessage({
    action: 'newTiktokVideos',
    data: {
      url: window.location.href,
      newVideoUrls
    }
  }, (response) => {
    if (response && response.success) {
      console.log('TikTok HTML Extractor: New videos sent to background script', response.data);
    } else {
      console.error('TikTok HTML Extractor: Failed to send new videos to background script');
    }
  });
}

// Extract HTML when page is fully loaded
window.addEventListener('load', () => {
  console.log('TikTok HTML Extractor: Page loaded, extracting HTML');
  
  // Add a slight delay to ensure dynamic content is loaded
  setTimeout(extractHtml, 3000);
});

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Handle manual extraction request
  if (message.action === 'extractTiktokHtml') {
    console.log('TikTok HTML Extractor: Manual extraction requested');
    extractHtml();
    sendResponse({ success: true });
  }
  
  // Return true for async response
  return true;
});

// Also extract HTML when content significantly changes
// This helps capture dynamic content changes
const observer = new MutationObserver((mutations) => {
  // Only extract if significant changes (more than 5 mutations)
  if (mutations.length > 5) {
    console.log('TikTok HTML Extractor: Significant page changes detected, extracting HTML');
    extractHtml();
  }
});

// Start observing after a delay to let initial page load
setTimeout(() => {
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: false,
    characterData: false
  });
  console.log('TikTok HTML Extractor: Started monitoring for page changes');
}, 5000);