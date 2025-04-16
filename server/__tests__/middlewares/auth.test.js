const jwt = require('jsonwebtoken');
const auth = require('../../middlewares/auth');
const User = require('../../models/User');
const { mockRequest, mockResponse } = require('../utils/testUtils');

// Mock dependencies
jest.mock('jsonwebtoken');
jest.mock('../../models/User');
jest.mock('dotenv', () => ({
  config: jest.fn()
}));

describe('Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    
    // Setup request, response and next function
    req = mockRequest();
    res = mockResponse();
    next = jest.fn();
  });

  /**
   * Test authentication with valid JWT token
   * Should find the user and call next()
   */
  it('should authenticate valid token and set user in request', async () => {
    // Mock a valid token
    const token = 'valid.jwt.token';
    req.header = jest.fn().mockReturnValue(`Bearer ${token}`);
    
    // Mock JWT verification
    const mockDecodedToken = { userId: 'user123' };
    jwt.verify.mockReturnValue(mockDecodedToken);
    
    // Mock finding the user
    const mockUser = { 
      _id: 'user123', 
      email: 'test@example.com',
      isConfirmed: true 
    };
    User.findById.mockResolvedValue(mockUser);
    
    // Call the middleware
    await auth(req, res, next);
    
    // Assertions
    expect(jwt.verify).toHaveBeenCalledWith(token, process.env.JWT_SECRET);
    expect(User.findById).toHaveBeenCalledWith(mockDecodedToken.userId);
    expect(req.user).toEqual(mockUser);
    expect(req.token).toBe(token);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  /**
   * Test authentication with missing token
   * Should return 401 with error message
   */
  it('should return 401 when token is missing', async () => {
    // Mock missing token
    req.header = jest.fn().mockReturnValue(null);
    
    // Call the middleware
    await auth(req, res, next);
    
    // Assertions
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Authentication required' });
    expect(next).not.toHaveBeenCalled();
  });

  /**
   * Test authentication with invalid token
   * Should return 401 with error message
   */
  it('should return 401 when token is invalid', async () => {
    // Mock an invalid token
    const token = 'invalid.jwt.token';
    req.header = jest.fn().mockReturnValue(`Bearer ${token}`);
    
    // Mock JWT verification failure
    jwt.verify.mockImplementation(() => {
      throw new Error('Invalid token');
    });
    
    // Call the middleware
    await auth(req, res, next);
    
    // Assertions
    expect(jwt.verify).toHaveBeenCalledWith(token, process.env.JWT_SECRET);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid token' });
    expect(next).not.toHaveBeenCalled();
  });

  /**
   * Test authentication with non-existent user
   * Should return 401 with error message
   */
  it('should return 401 when user does not exist', async () => {
    // Mock a valid token but non-existent user
    const token = 'valid.jwt.token';
    req.header = jest.fn().mockReturnValue(`Bearer ${token}`);
    
    // Mock JWT verification
    const mockDecodedToken = { userId: 'nonexistent123' };
    jwt.verify.mockReturnValue(mockDecodedToken);
    
    // Mock user not found
    User.findById.mockResolvedValue(null);
    
    // Call the middleware
    await auth(req, res, next);
    
    // Assertions
    expect(jwt.verify).toHaveBeenCalledWith(token, process.env.JWT_SECRET);
    expect(User.findById).toHaveBeenCalledWith(mockDecodedToken.userId);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
    expect(next).not.toHaveBeenCalled();
  });

  /**
   * Test authentication with unconfirmed user
   * Should return 401 with error message
   */
  it('should return 401 when user email is not confirmed', async () => {
    // Mock a valid token but unconfirmed user
    const token = 'valid.jwt.token';
    req.header = jest.fn().mockReturnValue(`Bearer ${token}`);
    
    // Mock JWT verification
    const mockDecodedToken = { userId: 'user123' };
    jwt.verify.mockReturnValue(mockDecodedToken);
    
    // Mock finding the user with unconfirmed email
    const mockUser = { 
      _id: 'user123', 
      email: 'test@example.com',
      isConfirmed: false 
    };
    User.findById.mockResolvedValue(mockUser);
    
    // Call the middleware
    await auth(req, res, next);
    
    // Assertions
    expect(jwt.verify).toHaveBeenCalledWith(token, process.env.JWT_SECRET);
    expect(User.findById).toHaveBeenCalledWith(mockDecodedToken.userId);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Email not confirmed' });
    expect(next).not.toHaveBeenCalled();
  });
}); 