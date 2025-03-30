const express = require('express');
const router = express.Router();
const tweetController = require('../controllers/tweetController');
const auth = require('../middlewares/auth');

// Create a new tweet (protected route)
router.post('/', auth, tweetController.createTweet);

// Get all tweets for the authenticated user (protected route)
router.get('/', auth, tweetController.getUserTweets);

module.exports = router;
