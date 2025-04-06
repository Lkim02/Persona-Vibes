const Tweet = require('../models/Tweet');
const User = require('../models/User');
const { analyzeUserProfile, analyzeUserEmotion } = require('../llm/analysis');

const analysisUser = async (userId) => {
  try {
    const tweets = await Tweet.find({ userId }).sort({ createdAt: -1 });
    const todayTweets = tweets.filter(tweet => new Date(tweet.createdAt).toDateString() === new Date().toDateString());
    
    // 确保有足够的推文进行分析
    if (tweets.length === 0) {
      console.log('No tweets found for user analysis');
      return;
    }
    
    // 分析用户画像
    const userProfile = await analyzeUserProfile(tweets);
    
    // 只有当天有推文时才分析情绪
    let userEmotion = null;
    if (todayTweets.length > 0) {
      userEmotion = await analyzeUserEmotion(todayTweets);
    }

    // 更新用户模型
    await User.findByIdAndUpdate(userId, { 
      profile: userProfile,
      ...(userEmotion && { todayEmotion: userEmotion })
    });

    console.log('User analysis completed and saved');
  } catch(error) {
    console.error('Error analyzing user:', error);
  }
};

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

    analysisUser(req.user._id);
    
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
