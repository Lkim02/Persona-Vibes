import { create } from 'zustand';

// 创建一个自定义的持久化中间件，使用 chrome.storage.local
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

// Store for managing authentication state
const useAuthStore = create(
  chromeStoragePersist({
    name: 'auth-storage',
    state: {
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    },
    store: (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      
      // Set the user and authentication status
      setUser: (userData) => set({ 
        user: userData, 
        isAuthenticated: !!userData,
        error: null
      }),
      
      // Start the loading state for authentication actions
      startLoading: () => set({ isLoading: true, error: null }),
      
      // Set an error message
      setError: (errorMessage) => set({ 
        error: errorMessage, 
        isLoading: false 
      }),
      
      // Register a new user
      register: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          // In a real implementation, this would make an API call
          // For now, we'll simulate a successful registration
          const userData = { email };
          
          set({ 
            user: userData, 
            isAuthenticated: true, 
            isLoading: false 
          });
          
          return true;
        } catch (error) {
          set({ 
            error: error.message || 'Registration failed', 
            isLoading: false 
          });
          return false;
        }
      },
      
      // Log in an existing user
      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          // In a real implementation, this would make an API call
          // For now, we'll simulate a successful login
          const userData = { email };
          
          set({ 
            user: userData, 
            isAuthenticated: true, 
            isLoading: false 
          });
          
          return true;
        } catch (error) {
          set({ 
            error: error.message || 'Login failed', 
            isLoading: false 
          });
          return false;
        }
      },
      
      // Log out the current user
      logout: async () => {
        set({ isLoading: true });
        try {
          set({ 
            user: null, 
            isAuthenticated: false, 
            isLoading: false 
          });
          
          return true;
        } catch (error) {
          set({ 
            error: error.message || 'Logout failed', 
            isLoading: false 
          });
          return false;
        }
      }
    })
  })
);

export default useAuthStore;
