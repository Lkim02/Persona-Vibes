const request = require('supertest');
const express = require('express');
const tweetsRoutes = require('../../routes/tweets');
const tweetController = require('../../controllers/tweetController');
const auth = require('../../middlewares/auth');
const Tweet = require('../../models/Tweet');
const User = require('../../models/User');

// Mock dependencies
jest.mock('../../controllers/tweetController');
jest.mock('../../middlewares/auth');
jest.mock('../../models/Tweet');
jest.mock('../../models/User');
jest.mock('../../llm/analysis');

// Create a test app
const app = express();
app.use(express.json());
app.use('/api/tweets', tweetsRoutes);

describe('Tweets Routes', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Default auth middleware mock to simulate authenticated user
    auth.mockImplementation((req, res, next) => {
      req.user = { _id: 'user123', email: 'test@example.com' };
      next();
    });
  });

  /**
   * Test for creating a tweet endpoint
   * Should use auth middleware and call createTweet controller
   */
  describe('POST /api/tweets', () => {
    it('should create a new tweet successfully for authenticated user', async () => {
      // Mock controller
      tweetController.createTweet.mockImplementation((req, res) => {
        const newTweet = {
          _id: 'tweet123',
          tweetId: 'external123',
          content: 'Test tweet content',
          userId: req.user._id,
          createdAt: new Date()
        };
        
        return res.status(201).json({
          message: 'Tweet saved successfully',
          tweet: newTweet
        });
      });

      // Test the endpoint
      const response = await request(app)
        .post('/api/tweets')
        .set('Authorization', 'Bearer valid_token')
        .send({
          tweetId: 'external123',
          content: 'Test tweet content'
        });

      // Assertions
      expect(response.status).toBe(201);
      expect(auth).toHaveBeenCalled();
      expect(tweetController.createTweet).toHaveBeenCalled();
      expect(response.body.message).toBe('Tweet saved successfully');
      expect(response.body.tweet).toBeDefined();
      expect(response.body.tweet.tweetId).toBe('external123');
    });

    it('should return 400 if tweet already exists', async () => {
      // Mock controller for duplicate tweet
      tweetController.createTweet.mockImplementation((req, res) => {
        return res.status(400).json({ message: 'Tweet already exists' });
      });

      // Test the endpoint
      const response = await request(app)
        .post('/api/tweets')
        .set('Authorization', 'Bearer valid_token')
        .send({
          tweetId: 'existing123',
          content: 'Duplicate tweet content'
        });

      // Assertions
      expect(response.status).toBe(400);
      expect(auth).toHaveBeenCalled();
      expect(tweetController.createTweet).toHaveBeenCalled();
      expect(response.body.message).toBe('Tweet already exists');
    });

    it('should return 401 if user is not authenticated', async () => {
      // Override auth middleware to simulate unauthenticated user
      auth.mockImplementation((req, res, next) => {
        return res.status(401).json({ message: 'Authentication required' });
      });

      // Test the endpoint
      const response = await request(app)
        .post('/api/tweets')
        .send({
          tweetId: 'external123',
          content: 'Test tweet content'
        });

      // Assertions
      expect(response.status).toBe(401);
      expect(auth).toHaveBeenCalled();
      expect(tweetController.createTweet).not.toHaveBeenCalled();
    });
  });

  /**
   * Test for getting user tweets endpoint
   * Should use auth middleware and call getUserTweets controller
   */
  describe('GET /api/tweets', () => {
    it('should get all tweets for authenticated user', async () => {
      // Mock tweets data
      const mockTweets = [
        {
          _id: 'tweet1',
          tweetId: 'external1',
          content: 'First test tweet',
          userId: 'user123',
          createdAt: new Date()
        },
        {
          _id: 'tweet2',
          tweetId: 'external2',
          content: 'Second test tweet',
          userId: 'user123',
          createdAt: new Date()
        }
      ];
      
      // Mock controller
      tweetController.getUserTweets.mockImplementation((req, res) => {
        return res.status(200).json({
          count: mockTweets.length,
          tweets: mockTweets
        });
      });

      // Test the endpoint
      const response = await request(app)
        .get('/api/tweets')
        .set('Authorization', 'Bearer valid_token');

      // Assertions
      expect(response.status).toBe(200);
      expect(auth).toHaveBeenCalled();
      expect(tweetController.getUserTweets).toHaveBeenCalled();
      expect(response.body.count).toBe(2);
      expect(response.body.tweets).toHaveLength(2);
      expect(response.body.tweets[0].tweetId).toBe('external1');
    });

    it('should return 401 if user is not authenticated', async () => {
      // Override auth middleware to simulate unauthenticated user
      auth.mockImplementation((req, res, next) => {
        return res.status(401).json({ message: 'Authentication required' });
      });

      // Test the endpoint
      const response = await request(app)
        .get('/api/tweets');

      // Assertions
      expect(response.status).toBe(401);
      expect(auth).toHaveBeenCalled();
      expect(tweetController.getUserTweets).not.toHaveBeenCalled();
    });

    it('should return empty array if user has no tweets', async () => {
      // Mock controller for empty tweets
      tweetController.getUserTweets.mockImplementation((req, res) => {
        return res.status(200).json({
          count: 0,
          tweets: []
        });
      });

      // Test the endpoint
      const response = await request(app)
        .get('/api/tweets')
        .set('Authorization', 'Bearer valid_token');

      // Assertions
      expect(response.status).toBe(200);
      expect(auth).toHaveBeenCalled();
      expect(tweetController.getUserTweets).toHaveBeenCalled();
      expect(response.body.count).toBe(0);
      expect(response.body.tweets).toHaveLength(0);
    });
  });
}); 