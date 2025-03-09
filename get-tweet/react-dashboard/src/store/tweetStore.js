import { create } from 'zustand';

// 复用之前创建的自定义持久化中间件
const chromeStoragePersist = (config) => (set, get, api) => {
  // 初始化状态
  const initialState = config.state || {};
  
  // 从 chrome.storage.local 加载状态
  const loadState = async () => {
    if (chrome?.storage?.local) {
      try {
        const result = await chrome.storage.local.get(config.name);
        const storedState = result[config.name];
        
        if (storedState) {
          set(storedState);
        }
      } catch (error) {
        console.error('Failed to load state from chrome.storage.local:', error);
      }
    }
  };
  
  // 保存状态到 chrome.storage.local
  const persistState = async (state) => {
    if (chrome?.storage?.local) {
      try {
        await chrome.storage.local.set({ [config.name]: state });
      } catch (error) {
        console.error('Failed to persist state to chrome.storage.local:', error);
      }
    }
  };
  
  // 加载初始状态
  loadState();
  
  // 包装 set 函数，在状态更新后保存到 chrome.storage.local
  const persistSet = (...args) => {
    set(...args);
    persistState(get());
  };
  
  // 返回包装后的 store
  return config.store(persistSet, get, api);
};

// Store for managing tweet data
const useTweetStore = create(
  chromeStoragePersist({
    name: 'tweet-storage',
    state: {
      tweets: [],
      replies: [],
      isLoading: false,
      error: null,
    },
    store: (set, get) => ({
      tweets: [],
      replies: [],
      isLoading: false,
      error: null,
      
      // Add a new tweet to the store
      addTweet: (tweetData) => {
        set((state) => ({
          tweets: [tweetData, ...state.tweets],
        }));
      },
      
      // Add a new reply to the store
      addReply: (replyData) => {
        set((state) => ({
          replies: [replyData, ...state.replies],
        }));
      },
      
      // Load tweets from storage (used when initializing)
      loadTweets: async () => {
        set({ isLoading: true, error: null });
        
        try {
          if (chrome?.storage?.local) {
            const data = await new Promise((resolve) => {
              chrome.storage.local.get(['tweets', 'replies'], (result) => {
                resolve(result);
              });
            });
            
            // 如果在 chrome.storage.local 中找到数据，则更新状态
            if (data.tweets || data.replies) {
              set({
                tweets: data.tweets || [],
                replies: data.replies || [],
                isLoading: false
              });
            }
          }
        } catch (error) {
          set({
            error: error.message || 'Failed to load tweets',
            isLoading: false
          });
        }
      },
      
      // Clear all stored tweets and replies
      clearAll: async () => {
        set({ isLoading: true });
        
        try {
          if (chrome?.storage?.local) {
            await chrome.storage.local.remove(['tweets', 'replies']);
          }
          set({
            tweets: [],
            replies: [],
            isLoading: false
          });
        } catch (error) {
          set({
            error: error.message || 'Failed to clear data',
            isLoading: false
          });
        }
      }
    })
  })
);

export default useTweetStore;
