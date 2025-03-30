const Tweet = require('../models/Tweet');

// Create a new tweet
exports.createTweet = async (req, res) => {
  try {
    const { tweetId, content, isReply } = req.body;
    
    // Check if tweet already exists
    const existingTweet = await Tweet.findOne({ tweetId });
    if (existingTweet) {
      return res.status(400).json({ message: 'Tweet already exists' });
    }
    
    // Create new tweet
    const tweet = new Tweet({
      tweetId,
      content,
      isReply: isReply || false,
      userId: req.user._id
    });
    
    await tweet.save();
    
    res.status(201).json({
      message: 'Tweet saved successfully',
      tweet
    });
  } catch (error) {
    console.error('Create tweet error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all tweets for a user
exports.getUserTweets = async (req, res) => {
  try {
    const tweets = await Tweet.find({ userId: req.user._id }).sort({ createdAt: -1 });
    
    res.status(200).json({
      count: tweets.length,
      tweets
    });
  } catch (error) {
    console.error('Get tweets error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
