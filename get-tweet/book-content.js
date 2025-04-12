console.log('OpenLibrary HTML Extractor: Content script loaded');

// 存储书籍div元素的映射，用于后续高亮推荐
let bookDivMap = {};

/**
 * 高亮显示推荐的书籍
 * @param {HTMLElement} bookDiv - 要高亮的书籍容器元素
 */
function highlightBook(bookDiv) {
    // 创建高亮效果的包装元素
    const highlightWrapper = document.createElement('div');
    highlightWrapper.className = 'persona-vibes-recommendation';

    // 应用现代样式
    highlightWrapper.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      border: 3px solid #4CAF50;
      border-radius: 8px;
      box-shadow: 0 0 15px rgba(76, 175, 80, 0.6);
      pointer-events: none;
      z-index: 999;
      animation: pulse-highlight 2s infinite;
      transform: scale(1.25);
      transform-origin: center;
    `;

    // 创建标签元素
    const recommendationLabel = document.createElement('div');
    recommendationLabel.className = 'persona-vibes-label';
    recommendationLabel.textContent = 'Recommended for you';

    // 样式标签
    recommendationLabel.style.cssText = `
      position: absolute;
      top: 10px;
      right: 10px;
      background: linear-gradient(135deg, #4CAF50, #8BC34A);
      color: white;
      padding: 5px 10px;
      border-radius: 20px;
      font-weight: bold;
      font-size: 14px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      z-index: 1000;
      pointer-events: none;
    `;

    // 如果尚不存在，则添加动画样式
    if (!document.getElementById('persona-vibes-styles')) {
        const styleElement = document.createElement('style');
        styleElement.id = 'persona-vibes-styles';
        styleElement.textContent = `
        @keyframes pulse-highlight {
          0% { box-shadow: 0 0 15px rgba(76, 175, 80, 0.6); }
          50% { box-shadow: 0 0 20px rgba(76, 175, 80, 0.8); }
          100% { box-shadow: 0 0 15px rgba(76, 175, 80, 0.6); }
        }
      `;
        document.head.appendChild(styleElement);
    }

    // 将元素添加到书籍容器
    bookDiv.style.position = 'relative';
    bookDiv.appendChild(highlightWrapper);
    bookDiv.appendChild(recommendationLabel);

    console.log('OpenLibrary HTML Extractor: book highlighted as recommended');
}

/**
 * 提取OpenLibrary网站上的书籍信息
 */
function extractOpenLibraryBooks() {
    // 清空之前的映射
    bookDivMap = {};
    
    // 查找所有书籍元素
    // OpenLibrary中的书籍通常在carousel或book列表中
    const bookElements = document.querySelectorAll('.book, .carousel__item');
    
    console.log('OpenLibrary HTML Extractor: Found', bookElements.length, 'book elements');
    
    if (bookElements.length === 0) {
        return;
    }
    
    const bookList = [];
    
    for (const bookElement of bookElements) {
        try {
            // 尝试提取标题和作者
            const a_title = bookElement.querySelector("img.bookcover")
            if (!a_title) {
                continue;
            }
            const alt = a_title.getAttribute('alt');
            if (!alt) {
                continue;
            }
            const alt_split = alt.split("by");
            const title = alt_split[0].trim();
            const author = alt_split[1].trim();
            
            if (!title || !author) {
                continue;
            }
            
            // 将书籍信息添加到列表
            bookList.push({ title, author });
            
            // 存储书籍div元素，以便后续高亮推荐
            bookDivMap[title] = bookElement;
        } catch (error) {
            console.error('OpenLibrary HTML Extractor: Error extracting book info:', error);
        }
    }
    
    // 如果找到了书籍，分批发送给background脚本
    if (bookList.length > 0) {
        sendBookBatches(bookList);
    }
}
const checkedBooks = new Set();
/**
 * 将书籍列表分批发送给background脚本
 * @param {Array} bookList - 书籍列表
 */
function sendBookBatches(bookList) {


    const noCheckBooks = bookList.filter(book => !checkedBooks.has(book.title));

    chrome.runtime.sendMessage({
        action: 'newBookList',
        data: {
            url: window.location.href,
            bookList: noCheckBooks
        }
    }, response => {
        checkedBooks.add(...noCheckBooks.map(book => book.title));
        if (response && response.success) {
            console.log('OpenLibrary HTML Extractor: Book batch sent to background script');
        } else {
            console.error('OpenLibrary HTML Extractor: Failed to send book batch:', response ? response.error : 'Unknown error');
        }
    });
}

// 页面加载完成后提取书籍信息
window.addEventListener('load', () => {
    console.log('OpenLibrary HTML Extractor: Page loaded, extracting books');
    // 延迟执行，确保页面完全加载
    setTimeout(extractOpenLibraryBooks, 3000);
});

// 监听来自background的推荐消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'bookRecommendations') {
        console.log('OpenLibrary HTML Extractor: Received book recommendations:', message.data);
        const recommendations = message.data;
        
        for (const recommendation of recommendations) {
            try {
                const bookDiv = bookDivMap[recommendation.title];
                if (bookDiv) {
                    highlightBook(bookDiv);
                    // 高亮后从映射中删除，避免重复高亮
                    delete bookDivMap[recommendation.title];
                }
            } catch (error) {
                console.error('OpenLibrary HTML Extractor: Failed to highlight book:', error);
            }
        }
    }
});

// 监视页面变化，特别是carousel和动态加载的内容
const observer = new MutationObserver((mutations) => {
    // 只有在发生重大变化时才重新提取
    if (mutations.length > 5) {
        console.log('OpenLibrary HTML Extractor: Significant page changes detected, extracting books');
        extractOpenLibraryBooks();
    }
});

// 延迟启动观察器，让初始页面加载完成
setTimeout(() => {
    observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: false,
        characterData: false
    });
    console.log('OpenLibrary HTML Extractor: Started monitoring for page changes');
}, 5000);
