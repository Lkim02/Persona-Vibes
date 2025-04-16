const jwt = require('jsonwebtoken');
require('dotenv').config();

/**
 * Generate a valid JWT token for testing purposes
 * @param {string} userId - User ID to encode in the token
 * @returns {string} JWT token
 */
const generateTestToken = (userId = 'testuser123') => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'test-secret-key', { expiresIn: '1h' });
};

/**
 * Create a mock request object for testing middleware
 * @param {Object} options - Request options
 * @returns {Object} Mock request object
 */
const mockRequest = (options = {}) => {
  const {
    body = {},
    params = {},
    query = {},
    headers = {},
    user = null,
    token = null
  } = options;

  return {
    body,
    params,
    query,
    headers,
    user,
    token,
    header: jest.fn().mockImplementation(key => {
      if (key === 'Authorization' && headers.Authorization) {
        return headers.Authorization;
      }
      return headers[key];
    })
  };
};

/**
 * Create a mock response object for testing middleware and controllers
 * @returns {Object} Mock response object with jest functions
 */
const mockResponse = () => {
  const res = {};
  
  // Add status, json, and send methods with chaining
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  
  return res;
};

module.exports = {
  generateTestToken,
  mockRequest,
  mockResponse
}; 