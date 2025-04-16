const {processWithByteDance} = require('../llm');

/**
 * Video recommendation prompt
 * Recommends the most suitable videos based on user profile, emotional state, and video comments
 */
const prompt = `You are a professional personalized content recommendation expert, and now you need to recommend the most suitable video content for the user based on the user's profile analysis, emotional state, and a series of video comments.

You will receive the following input data in JSON format:
{
  "userProfile": "User profile analysis text, including demographic characteristics, interests, values, etc.",
  "userEmotion": "User emotion analysis text, including emotional baseline, fluctuations, and triggering factors, etc.",
  "videos": [
    {
      "videoUrl": "Video URL",
      "comments": ["Comment1", "Comment2", "..."]
    },
    ...
  ]
}

Based on this information, analyze the content characteristics and target audience of each video, then recommend the most suitable videos for the user, and provide reasons for the recommendation.

Scoring criteria (1-10 points):
- Interest match: The degree of match between the video content and user interests
- Emotional fit: The degree of compatibility between the video content and the user's current emotional state
- Value alignment: The degree of consistency between the video content and the user's values
- Community feedback: Overall feedback based on comments

You must output the recommendation results in JSON format as follows:
[
  {
    "videoUrl": "Video URL",
    "rank": 1,
    "scores": {
      "interestMatch": 8,
      "emotionalFit": 9,
      "valueAlignment": 7,
      "communityFeedback": 8
    },
    "totalScore": 8.0,
    "recommendation": "Detailed explanation of recommendation reason"
  },
  ...
]

Note:
- You must output strictly according to the above JSON format, do not add any additional text explanations
- The output must be a valid JSON array, sorted from highest to lowest recommendation
- Consider the user's current emotional state and recommend content that can improve or maintain positive emotions
- Avoid content that may aggravate negative emotions
- Prioritize content that highly matches the user's interests
- Emotional tendencies and themes in the comments are also important reference factors`;

/**
 * Recommend the most suitable videos based on user profile, emotional state, and video comments
 * @param {string} userProfile - User profile analysis result
 * @param {string} userEmotion - User emotion analysis result
 * @param {Array<{videoUrl: string, comments: string[]}>} videos - Video array, each containing URL and comments
 * @param {Object} options - Option parameters
 * @returns {Promise<Array>} - Video recommendation result array
 */
async function recommendVideos(userProfile, userEmotion, videos, options = {}) {
  try {
    // Build input data
    const userInput = JSON.stringify({
      userProfile,
      userEmotion,
      videos
    });
    // Call ByteDance API
    const response = await processWithByteDance(prompt, userInput, options);
    // Try to parse the returned JSON string
    try {
      const recommendations = JSON.parse(response);
      
      // Ensure the return is an array
      if (!Array.isArray(recommendations)) {
        console.warn('API did not return an array, converting to array format');
        return []; // Return empty array as fallback
      }
      
      return recommendations.filter(item => item.totalScore >= 8.0);
    } catch (parseError) {
      console.error('Error parsing recommendation response as JSON:', parseError);
      // If parsing fails, return an empty array
      return [];
    }
  } catch (error) {
    console.error('Error generating video recommendations:', error);
    throw error;
  }
}

module.exports = {
  recommendVideos
};