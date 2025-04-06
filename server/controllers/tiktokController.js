const Tweet = require('../models/Tweet');
const recommendVideo = async (req, res) => {
    try {
        const userId = req.user._id;
        const allTweets = await Tweet.find({ userId }).sort({ createdAt: -1 });
        // Use llm分析
    } catch (error) {
        
    }
}