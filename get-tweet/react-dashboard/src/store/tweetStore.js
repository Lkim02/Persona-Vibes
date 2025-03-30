import { create } from 'zustand';
import { tweetApi } from '../utils/api';
import useAuthStore from './authStore';

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
      syncStatus: {
        isSyncing: false,
        lastSynced: null,
        error: null
      }
    },
    store: (set, get) => ({
      tweets: [],
      replies: [],
      isLoading: false,
      error: null,
      syncStatus: {
        isSyncing: false,
        lastSynced: null,
        error: null
      },
      
      // Set sync status
      setSyncStatus: (status) => set({
        syncStatus: {
          ...get().syncStatus,
          ...status
        }
      }),
      
      // Add a new tweet to the store
      addTweet: (tweetData) => {
        set((state) => ({
          tweets: [tweetData, ...state.tweets],
        }));
        
        // Try to save to server if user is authenticated
        const { token, isAuthenticated } = useAuthStore.getState();
        if (isAuthenticated && token) {
          get().saveTweetToServer(tweetData, token);
        }
      },
      
      // Add a new reply to the store
      addReply: (replyData) => {
        set((state) => ({
          replies: [replyData, ...state.replies],
        }));
        
        // Try to save to server if user is authenticated
        const { token, isAuthenticated } = useAuthStore.getState();
        if (isAuthenticated && token) {
          get().saveTweetToServer(replyData, token);
        }
      },
      
      // Save tweet to server
      saveTweetToServer: async (tweetData, token) => {
        try {
          get().setSyncStatus({ isSyncing: true, error: null });
          
          // Generate a tweetId if not present
          const tweetToSave = {
            ...tweetData,
            tweetId: tweetData.tweetId || `tweet_${Date.now()}`
          };
          
          const result = await tweetApi.saveTweet(tweetToSave, token);
          
          if (!result.success) {
            get().setSyncStatus({ 
              isSyncing: false, 
              error: result.error 
            });
            
            // Display error in extension UI
            chrome.runtime.sendMessage({
              action: 'showError',
              data: {
                message: `Failed to save tweet to server: ${result.error}`
              }
            });
            
            return false;
          }
          
          get().setSyncStatus({ 
            isSyncing: false, 
            lastSynced: new Date().toISOString() 
          });
          
          return true;
        } catch (error) {
          const errorMessage = error.message || 'Failed to save tweet to server';
          
          get().setSyncStatus({ 
            isSyncing: false, 
            error: errorMessage 
          });
          
          // Display error in extension UI
          chrome.runtime.sendMessage({
            action: 'showError',
            data: {
              message: errorMessage
            }
          });
          
          return false;
        }
      },
      
      // Sync all unsaved tweets to server
      syncTweetsToServer: async () => {
        const { token, isAuthenticated } = useAuthStore.getState();
        if (!isAuthenticated || !token) {
          return false;
        }
        
        try {
          get().setSyncStatus({ isSyncing: true, error: null });
          
          const { tweets, replies } = get();
          let syncErrors = [];
          
          // Sync tweets
          for (const tweet of tweets) {
            const result = await tweetApi.saveTweet({
              ...tweet,
              tweetId: tweet.tweetId || `tweet_${Date.now()}`,
              isReply: false
            }, token);
            
            if (!result.success) {
              syncErrors.push(`Failed to sync tweet: ${result.error}`);
            }
          }
          
          // Sync replies
          for (const reply of replies) {
            const result = await tweetApi.saveTweet({
              ...reply,
              tweetId: reply.tweetId || `reply_${Date.now()}`,
              isReply: true
            }, token);
            
            if (!result.success) {
              syncErrors.push(`Failed to sync reply: ${result.error}`);
            }
          }
          
          if (syncErrors.length > 0) {
            const errorMessage = `Sync completed with errors: ${syncErrors.length} items failed`;
            
            get().setSyncStatus({ 
              isSyncing: false, 
              lastSynced: new Date().toISOString(),
              error: errorMessage
            });
            
            // Display error in extension UI
            chrome.runtime.sendMessage({
              action: 'showError',
              data: {
                message: errorMessage
              }
            });
            
            return false;
          }
          
          get().setSyncStatus({ 
            isSyncing: false, 
            lastSynced: new Date().toISOString(),
            error: null
          });
          
          return true;
        } catch (error) {
          const errorMessage = error.message || 'Failed to sync tweets to server';
          
          get().setSyncStatus({ 
            isSyncing: false, 
            error: errorMessage 
          });
          
          // Display error in extension UI
          chrome.runtime.sendMessage({
            action: 'showError',
            data: {
              message: errorMessage
            }
          });
          
          return false;
        }
      },
      
      // Load tweets from server
      loadTweetsFromServer: async () => {
        const { token, isAuthenticated } = useAuthStore.getState();
        if (!isAuthenticated || !token) {
          return false;
        }
        
        set({ isLoading: true, error: null });
        
        try {
          const result = await tweetApi.getUserTweets(token);
          
          if (!result.success) {
            set({
              error: result.error,
              isLoading: false
            });
            
            // Display error in extension UI
            chrome.runtime.sendMessage({
              action: 'showError',
              data: {
                message: `Failed to load tweets from server: ${result.error}`
              }
            });
            
            return false;
          }
          
          // Separate tweets and replies
          const serverTweets = result.data.tweets || [];
          const tweets = serverTweets.filter(t => !t.isReply);
          const replies = serverTweets.filter(t => t.isReply);
          
          set({
            tweets,
            replies,
            isLoading: false,
            error: null,
            syncStatus: {
              ...get().syncStatus,
              lastSynced: new Date().toISOString(),
              error: null
            }
          });
          
          return true;
        } catch (error) {
          const errorMessage = error.message || 'Failed to load tweets from server';
          
          set({
            error: errorMessage,
            isLoading: false
          });
          
          // Display error in extension UI
          chrome.runtime.sendMessage({
            action: 'showError',
            data: {
              message: errorMessage
            }
          });
          
          return false;
        }
      },
      
      // Load tweets from storage (used when initializing)
      loadTweets: async () => {
        set({ isLoading: true, error: null });
        
        try {
          if (chrome?.storage?.local) {
            const data = await new Promise((resolve) => {
              chrome.storage.local.get(['tweets', 'replies', 'syncStatus'], (result) => {
                resolve(result);
              });
            });
            
            // 如果在 chrome.storage.local 中找到数据，则更新状态
            if (data.tweets || data.replies || data.syncStatus) {
              set({
                tweets: data.tweets || [],
                replies: data.replies || [],
                syncStatus: data.syncStatus || {
                  isSyncing: false,
                  lastSynced: null,
                  error: null
                },
                isLoading: false
              });
            }
            
            // Try to load from server if user is authenticated
            const { token, isAuthenticated } = useAuthStore.getState();
            if (isAuthenticated && token) {
              get().loadTweetsFromServer();
            }
          }
        } catch (error) {
          set({
            error: error.message || 'Failed to load tweets',
            isLoading: false
          });
          
          // Display error in extension UI
          chrome.runtime.sendMessage({
            action: 'showError',
            data: {
              message: error.message || 'Failed to load tweets'
            }
          });
        }
      },
      
      // Clear all stored tweets and replies
      clearAll: async () => {
        set({ isLoading: true });
        
        try {
          if (chrome?.storage?.local) {
            await chrome.storage.local.remove(['tweets', 'replies', 'syncStatus']);
          }
          set({
            tweets: [],
            replies: [],
            syncStatus: {
              isSyncing: false,
              lastSynced: null,
              error: null
            },
            isLoading: false
          });
        } catch (error) {
          set({
            error: error.message || 'Failed to clear data',
            isLoading: false
          });
          
          // Display error in extension UI
          chrome.runtime.sendMessage({
            action: 'showError',
            data: {
              message: error.message || 'Failed to clear data'
            }
          });
        }
      },
      
      // Initialize sync status listener
      initSyncStatusListener: () => {
        if (chrome?.runtime?.onMessage) {
          // Listen for sync status updates from background script
          chrome.runtime.onMessage.addListener((message) => {
            if (message.action === 'updateSyncStatus') {
              get().setSyncStatus(message.data);
            }
          });
          
          console.log('Sync status listener initialized');
        } else {
          console.error('Chrome runtime API not available');
        }
      }
    })
  })
);

export default useTweetStore;
