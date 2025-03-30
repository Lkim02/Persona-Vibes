// API utility functions for server communication
export const API_BASE_URL = 'http://localhost:3000/api'; // Update this with your actual server URL

// Helper function to handle API errors
const handleApiError = (error) => {
  console.error('API Error:', error);
  let errorMessage = 'An unexpected error occurred';
  
  if (error.response) {
    // Server responded with an error status
    errorMessage = error.response.data.message || `Error: ${error.response.status}`;
  } else if (error.request) {
    // Request was made but no response received
    errorMessage = 'No response from server. Please check your connection.';
  } else {
    // Something else caused the error
    errorMessage = error.message;
  }
  
  return { success: false, error: errorMessage };
};

// Authentication API calls
export const authApi = {
  // Register a new user
  register: async (email, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        return { 
          success: false, 
          error: data.message || 'Registration failed',
          errorType: data.errorType || 'unknown_error'
        };
      }
      
      return { success: true, data };
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  // Login user
  login: async (email, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        return { 
          success: false, 
          error: data.message || 'Login failed',
          errorType: data.errorType || 'unknown_error'
        };
      }
      
      return { success: true, data };
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  // Confirm email registration
  confirmEmail: async (token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/confirm/${token}`, {
        method: 'GET',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        return { success: false, error: data.message || 'Email confirmation failed' };
      }
      
      return { success: true, data };
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  // Validate token
  validateToken: async (token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/validate`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        return { success: false };
      }
      
      return { success: true };
    } catch (error) {
      console.error('Token validation error:', error);
      return { success: false };
    }
  }
};

// Tweet API calls
export const tweetApi = {
  // Save a tweet to the server
  saveTweet: async (tweetData, token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/tweets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          tweetId: tweetData.tweetId || Date.now().toString(), // Use timestamp as fallback ID
          content: tweetData.content,
          isReply: !!tweetData.replyToTweetId, // Convert to boolean
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        // If the tweet already exists, consider it a success
        if (data.message && data.message.includes('already exists')) {
          return { success: true, data: { message: 'Tweet already exists' } };
        }
        return { success: false, error: data.message || 'Failed to save tweet' };
      }
      
      return { success: true, data };
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  // Get all tweets for the authenticated user
  getUserTweets: async (token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/tweets`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        return { success: false, error: data.message || 'Failed to fetch tweets' };
      }
      
      return { success: true, data };
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  // Sync all tweets to the server
  syncTweets: async (tweets, token) => {
    try {
      // Track success and failures
      const results = {
        success: true,
        total: tweets.length,
        synced: 0,
        failed: 0,
        errors: []
      };
      
      // Process each tweet
      for (const tweet of tweets) {
        try {
          const response = await fetch(`${API_BASE_URL}/tweets`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              tweetId: tweet.tweetId,
              content: tweet.content,
              isReply: tweet.isReply || false,
            }),
          });
          
          const data = await response.json();
          
          if (!response.ok) {
            // If the tweet already exists, that's okay
            if (data.message && data.message.includes('already exists')) {
              results.synced++;
              continue;
            }
            
            results.failed++;
            results.errors.push(`Tweet ${tweet.tweetId}: ${data.message}`);
          } else {
            results.synced++;
          }
        } catch (error) {
          results.failed++;
          results.errors.push(`Tweet ${tweet.tweetId}: ${error.message}`);
        }
      }
      
      // Set overall success based on failures
      results.success = results.failed === 0;
      
      return results;
    } catch (error) {
      return {
        success: false,
        error: error.message,
        total: tweets.length,
        synced: 0,
        failed: tweets.length
      };
    }
  }
};
