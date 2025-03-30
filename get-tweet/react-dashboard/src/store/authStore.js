import { create } from 'zustand';
import { API_BASE_URL } from '../utils/api';
import { showError } from '../utils/errorHandler';

// Create auth store
const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  
  // Initialize auth state from storage
  init: async () => {
    set({ isLoading: true });
    
    try {
      // Get auth data from storage
      const authData = await new Promise((resolve) => {
        chrome.storage.local.get(['auth'], (result) => {
          resolve(result.auth || {});
        });
      });
      
      // If token exists, validate it
      if (authData.token) {
        try {
          // Validate token with server
          const response = await fetch(`${API_BASE_URL}/auth/validate`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${authData.token}`
            }
          });
          
          if (response.ok) {
            // Token is valid
            set({
              user: authData.user,
              token: authData.token,
              isAuthenticated: true,
              isLoading: false,
              error: null
            });
            return true;
          } else {
            // Token is invalid, clear auth data
            chrome.storage.local.remove(['auth']);
            set({
              user: null,
              token: null,
              isAuthenticated: false,
              isLoading: false,
              error: null
            });
            return false;
          }
        } catch (error) {
          console.error('Error validating token:', error);
          // Network error, assume token is valid for now
          set({
            user: authData.user,
            token: authData.token,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });
          return true;
        }
      } else {
        // No token, not authenticated
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          error: null
        });
        return false;
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: error.message
      });
      return false;
    }
  },
  
  // Register a new user
  register: async (email, password) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        // Handle specific error types
        let errorMessage = data.message || 'Registration failed';
        
        // Add more specific error messages based on error type
        if (data.errorType === 'user_exists') {
          errorMessage = 'User already exists';
        } else if (data.errorType === 'email_send_failed') {
          errorMessage = 'Failed to send confirmation email';
        }
        
        throw new Error(errorMessage);
      }
      
      set({
        isLoading: false,
        error: null
      });
      
      return {
        success: true,
        message: data.message || 'Registration successful. Please check your email for confirmation.',
        data: data
      };
    } catch (error) {
      console.error('Registration error:', error);
      
      set({
        isLoading: false,
        error: error.message
      });
      
      showError(`Registration failed: ${error.message}`);
      
      return {
        success: false,
        message: error.message
      };
    }
  },
  
  // Login user
  login: async (email, password) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        // Handle specific error types
        let errorMessage = data.message || 'Login failed';
        
        // Add more specific error messages based on error type
        if (data.errorType === 'user_not_found') {
          errorMessage = 'User does not exist';
        } else if (data.errorType === 'invalid_password') {
          errorMessage = 'Incorrect password';
        } else if (data.errorType === 'email_not_confirmed') {
          errorMessage = 'Please confirm your email before logging in';
        }
        
        throw new Error(errorMessage);
      }
      
      // Save auth data to storage
      const authData = {
        user: {
          email,
          id: data.user.id
        },
        token: data.token,
        isAuthenticated: true
      };
      
      chrome.storage.local.set({ auth: authData });
      
      set({
        user: authData.user,
        token: data.token,
        isAuthenticated: true,
        isLoading: false,
        error: null
      });
      
      return {
        success: true
      };
    } catch (error) {
      console.error('Login error:', error);
      
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: error.message
      });
      
      showError(`Login failed: ${error.message}`);
      
      return {
        success: false,
        message: error.message
      };
    }
  },
  
  // Logout user
  logout: async () => {
    set({ isLoading: true });
    
    try {
      // Remove auth data from storage
      await new Promise((resolve) => {
        chrome.storage.local.remove(['auth'], resolve);
      });
      
      // Reset auth state
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      });
      
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      
      set({
        isLoading: false,
        error: error.message
      });
      
      return false;
    }
  },
  
  // Confirm email
  confirmEmail: async (token) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth/confirm/${token}`, {
        method: 'GET'
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Email confirmation failed');
      }
      
      set({
        isLoading: false,
        error: null
      });
      
      return {
        success: true,
        message: data.message || 'Email confirmed successfully. You can now log in.'
      };
    } catch (error) {
      console.error('Email confirmation error:', error);
      
      set({
        isLoading: false,
        error: error.message
      });
      
      showError(`Email confirmation failed: ${error.message}`);
      
      return {
        success: false,
        message: error.message
      };
    }
  },
  
  // Clear error
  clearError: () => {
    set({ error: null });
  }
}));

export default useAuthStore;
