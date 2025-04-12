console.log('Spotify HTML Extractor: Content script loaded');


const musicMap = {};


/**
 * Highlights a music div element with a modern, eye-catching style
 * @param {HTMLElement} musicDiv - The music container element to highlight
 */
function highlightMusic(musicDiv) {
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
      right: 100px;
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

    // Add the elements to the music container
    musicDiv.style.position = 'relative';
    musicDiv.appendChild(highlightWrapper);
    musicDiv.appendChild(recommendationLabel);

    console.log('Spotify HTML Extractor: music highlighted as recommended');
}

let musicDivMap = {};

function extractSpotifyMusic() {
    let musicDivs = [];

    if (window.location.href.includes('playlist')) {
        musicDivs = document.querySelectorAll('div[data-testid="playlist-tracklist"] div[role="row"]');
    } else {
        musicDivs = document.querySelectorAll('div[data-testid="track-list"] div[role="row"]');
    }
    
    console.log('Spotify HTML Extractor: Found', musicDivs.length, 'music divs');
    
    const musicList = [];
    for (const musicDiv of musicDivs) {
        const titleDiv = musicDiv.querySelector('div[data-encore-id="text"]');
        const authorA = musicDiv.querySelector('span[data-encore-id="text"] a');
        
        if (!titleDiv) {
            console.log('Title not found');
            continue;
        }

        const authorH1 = document.querySelector('h1[data-encore-id="text"]');
        if (!authorA && !authorH1) {    
            console.log('Author not found');
            continue;
        }

        const title = titleDiv.textContent;
        const author = authorA ? authorA.textContent : authorH1.textContent;
        musicList.push({ title, author });
        musicDivMap[title] = musicDiv;
    }

    if (musicList.length === 0) {
        return;
    }

    chrome.runtime.sendMessage({
        action: 'newMusicList',
        data: {
            url: window.location.href,
            musicList
        }
    }, response => {
        if (response && response.success) {
            console.log('Spotify HTML Extractor: New music list sent to background script');
        } else {
            console.error('Spotify HTML Extractor: Failed to send new music list to background script: ' + response.error);
        }
    })
}

window.addEventListener('load', () => {
    console.log('Spotify HTML Extractor: Page loaded, extracting HTML');
    setTimeout(extractSpotifyMusic, 3000);
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'musicRecommendations') {
        console.log('Spotify HTML Extractor: Received music recommendations:', message.data);
        const recommendations = message.data;
        for (const recommendation of recommendations) {
            try {
                const musicDiv = musicDivMap[recommendation.title];
                if (musicDiv) {
                    highlightMusic(musicDiv);
                    delete musicDivMap[recommendation.title];
                }
            } catch (error) {
                console.error('Spotify HTML Extractor: Failed to highlight music:', error);
            }
        }
    }
});


// Also extract HTML when content significantly changes
// This helps capture dynamic content changes
const observer = new MutationObserver((mutations) => {
    // Only extract if significant changes (more than 5 mutations)
    if (mutations.length > 5) {
      console.log('Spotify HTML Extractor: Significant page changes detected, extracting HTML');
      extractSpotifyMusic();
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
    console.log('Spotify HTML Extractor: Started monitoring for page changes');
  }, 5000);