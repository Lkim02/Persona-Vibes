// TikTok HTML Extractor - Content Script
// This script runs in the context of TikTok web pages

console.log('TikTok HTML Extractor: Content script loaded');
const videosMap = {};

/**
 * Highlights a video div element with a modern, eye-catching style
 * @param {HTMLElement} videoDiv - The video container element to highlight
 */
function highlightVideo(videoDiv) {
  // Create a wrapper element for the highlight effect
  const highlightWrapper = document.createElement('div');
  highlightWrapper.className = 'persona-vibes-recommendation';
  
  // Apply modern styling to the wrapper
  highlightWrapper.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border: 3px solid #FF5C8D;
    border-radius: 8px;
    box-shadow: 0 0 15px rgba(255, 92, 141, 0.6);
    pointer-events: none;
    z-index: 999;
    animation: pulse-highlight 2s infinite;
  `;
  
  // Create a label element
  const recommendationLabel = document.createElement('div');
  recommendationLabel.className = 'persona-vibes-label';
  recommendationLabel.textContent = 'Recommended for you';
  
  // Style the label
  recommendationLabel.style.cssText = `
    position: absolute;
    top: 10px;
    right: 10px;
    background: linear-gradient(135deg, #FF5C8D, #FF9A5C);
    color: white;
    padding: 5px 10px;
    border-radius: 20px;
    font-weight: bold;
    font-size: 14px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    z-index: 1000;
    pointer-events: none;
  `;
  
  // Add the animation style to the document if it doesn't exist yet
  if (!document.getElementById('persona-vibes-styles')) {
    const styleElement = document.createElement('style');
    styleElement.id = 'persona-vibes-styles';
    styleElement.textContent = `
      @keyframes pulse-highlight {
        0% { box-shadow: 0 0 15px rgba(255, 92, 141, 0.6); }
        50% { box-shadow: 0 0 20px rgba(255, 92, 141, 0.8); }
        100% { box-shadow: 0 0 15px rgba(255, 92, 141, 0.6); }
      }
    `;
    document.head.appendChild(styleElement);
  }
  
  // Add the elements to the video container
  videoDiv.style.position = 'relative';
  videoDiv.appendChild(highlightWrapper);
  videoDiv.appendChild(recommendationLabel);
  
  console.log('TikTok HTML Extractor: Video highlighted as recommended');
}

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
  if (newVideoUrls.length === 0) {
    return;
  }
  chrome.runtime.sendMessage({
    action: 'newTiktokVideos',
    data: {
      url: window.location.href,
      newVideoUrls
    }
  }, (response) => {
    if (response && response.success) {
      console.log('TikTok HTML Extractor: New videos sent to background script');
      const recommendations = response.data.recommendations;
      const recommendationsUrls = recommendations.map(item => item.videoUrl);
      // Tag videos
      for (const url of recommendationsUrls) {
        const videoDiv = videosMap[url];
        if (videoDiv) {
          highlightVideo(videoDiv);
        }
      }
    } else {
      console.error('TikTok HTML Extractor: Failed to send new videos to background script: ' + response.error);
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