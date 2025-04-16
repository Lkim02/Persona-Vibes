const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const authRoutes = require('../../routes/auth');
const authController = require('../../controllers/authController');
const authMiddleware = require('../../middlewares/auth');
const User = require('../../models/User');

// Mock dependencies
jest.mock('../../controllers/authController');
jest.mock('../../middlewares/auth');
jest.mock('../../models/User');
jest.mock('jsonwebtoken');

// Create a test app
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Auth Routes', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  /**
   * Test for user registration endpoint
   * Should call the register controller and return its response
   */
  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      // Mock successful registration
      authController.register.mockImplementation((req, res) => {
        return res.status(201).json({ message: 'User registered successfully' });
      });

      // Test the endpoint
      const response = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@example.com', password: 'password123' });

      // Assertions
      expect(response.status).toBe(201);
      expect(authController.register).toHaveBeenCalled();
      expect(response.body.message).toBe('User registered successfully');
    });

    it('should return 400 if user already exists', async () => {
      // Mock registration failure due to existing user
      authController.register.mockImplementation((req, res) => {
        return res.status(400).json({ 
          message: 'User already exists', 
          errorType: 'user_exists' 
        });
      });

      // Test the endpoint
      const response = await request(app)
        .post('/api/auth/register')
        .send({ email: 'existing@example.com', password: 'password123' });

      // Assertions
      expect(response.status).toBe(400);
      expect(authController.register).toHaveBeenCalled();
      expect(response.body.errorType).toBe('user_exists');
    });
  });

  /**
   * Test for email confirmation endpoint
   * Should call the confirmRegistration controller and return its response
   */
  describe('GET /api/auth/confirm/:token', () => {
    it('should confirm user registration with valid token', async () => {
      // Mock successful confirmation
      authController.confirmRegistration.mockImplementation((req, res) => {
        return res.status(200).send('Email confirmed successfully');
      });

      // Test the endpoint
      const response = await request(app)
        .get('/api/auth/confirm/validtoken123');

      // Assertions
      expect(response.status).toBe(200);
      expect(authController.confirmRegistration).toHaveBeenCalled();
      expect(authController.confirmRegistration.mock.calls[0][0].params.token).toBe('validtoken123');
    });
  });

  /**
   * Test for login endpoint
   * Should call the login controller and return its response with JWT token
   */
  describe('POST /api/auth/login', () => {
    it('should login user successfully with valid credentials', async () => {
      // Mock successful login
      authController.login.mockImplementation((req, res) => {
        return res.status(200).json({ 
          token: 'jwt_token_123',
          user: { id: '123', email: 'test@example.com' }
        });
      });

      // Test the endpoint
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'password123' });

      // Assertions
      expect(response.status).toBe(200);
      expect(authController.login).toHaveBeenCalled();
      expect(response.body.token).toBeDefined();
      expect(response.body.user).toBeDefined();
    });

    it('should return 401 with invalid credentials', async () => {
      // Mock login failure
      authController.login.mockImplementation((req, res) => {
        return res.status(401).json({ message: 'Invalid credentials' });
      });

      // Test the endpoint
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'wrongpassword' });

      // Assertions
      expect(response.status).toBe(401);
      expect(authController.login).toHaveBeenCalled();
      expect(response.body.message).toBe('Invalid credentials');
    });
  });

  /**
   * Test for validate token endpoint
   * Should use auth middleware and call validateToken controller
   */
  describe('GET /api/auth/validate', () => {
    it('should validate token successfully for authenticated user', async () => {
      // Mock middleware to simulate authenticated user
      authMiddleware.mockImplementation((req, res, next) => {
        req.user = { _id: '123', email: 'test@example.com' };
        req.token = 'valid_token_123';
        next();
      });

      // Mock controller
      authController.validateToken.mockImplementation((req, res) => {
        return res.status(200).json({ 
          valid: true,
          user: req.user 
        });
      });

      // Test the endpoint
      const response = await request(app)
        .get('/api/auth/validate')
        .set('Authorization', 'Bearer valid_token_123');

      // Assertions
      expect(response.status).toBe(200);
      expect(authMiddleware).toHaveBeenCalled();
      expect(authController.validateToken).toHaveBeenCalled();
      expect(response.body.valid).toBe(true);
    });

    it('should return 401 with invalid token', async () => {
      // Mock middleware to simulate authentication failure
      authMiddleware.mockImplementation((req, res, next) => {
        return res.status(401).json({ message: 'Invalid token' });
      });

      // Test the endpoint
      const response = await request(app)
        .get('/api/auth/validate')
        .set('Authorization', 'Bearer invalid_token');

      // Assertions
      expect(response.status).toBe(401);
      expect(authMiddleware).toHaveBeenCalled();
      expect(authController.validateToken).not.toHaveBeenCalled();
    });
  });
}); 