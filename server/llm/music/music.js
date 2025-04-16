const {processWithByteDance} = require('../llm');

/**
 * Music recommendation prompt
 * Recommends the most suitable music based on user profile, emotional state, and music information
 */
const prompt = `You are a professional personalized music recommendation expert, and now you need to recommend the most suitable music content for the user based on the user's profile analysis, emotional state, and a series of music lyrics, tags, and descriptions.

You will receive the following input data in JSON format:
{
  "userProfile": "User profile analysis text, including demographic characteristics, interests, values, etc.",
  "userEmotion": "User emotion analysis text, including emotional baseline, fluctuations, and triggering factors, etc.",
  "musicList": [
    {
      "lyrics": "Song lyrics content",
      "tags": ["Tag1", "Tag2", "..."],
      "description": "Song description information"
    },
    ...
  ]
}

Based on this information, analyze the content characteristics, style, and emotional expression of each piece of music, then recommend the most suitable music for the user, and provide reasons for the recommendation.

Scoring criteria (1-10 points):
- Style match: The degree of match between the music style and the user's music taste
- Emotional fit: The degree of compatibility between the music emotion and the user's current emotional state
- Lyrical resonance: The degree of resonance between the lyrics content and the user's values and life experiences
- Exploration value: The value of providing new music experiences to the user

You must output the recommendation results in JSON format as follows:
[
  {
    "index": 0,
    "rank": 1,
    "scores": {
      "styleMatch": 8,
      "emotionalFit": 9,
      "lyricalResonance": 7,
      "explorationValue": 8
    },
    "totalScore": 8.0,
    "recommendation": "Detailed explanation of recommendation reason"
  },
  ...
]

Note:
- You must output strictly according to the above JSON format, do not add any additional text explanations
- The output must be a valid JSON array, sorted from highest to lowest recommendation
- Consider the user's current emotional state and recommend music that can improve or maintain positive emotions
- Avoid content that may aggravate negative emotions, unless the user needs emotional catharsis
- Prioritize content that highly matches the user's music taste
- The emotional expression and theme of the lyrics content are important reference factors
- Music tags and descriptions provide additional style and emotional clues`;

/**
 * Recommend the most suitable music based on user profile, emotional state, and music information
 * @param {string} userProfile - User profile analysis result
 * @param {string} userEmotion - User emotion analysis result
 * @param {Array<{lyrics: string, tags: string[], description: string}>} musicList - Music array, each containing lyrics, tags, and description
 * @param {Object} options - Option parameters
 * @returns {Promise<Array>} - Music recommendation result array
 */
async function recommendMusicByLLM(userProfile, userEmotion, musicList, options = {}) {
  try {
    // Build input data
    const userInput = JSON.stringify({
      userProfile,
      userEmotion,
      musicList
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
      const filteredRecommendations = recommendations.filter(item => item.totalScore >= 7.5);
      return filteredRecommendations.map(item => {
        item.title = musicList[item.index].title;   
        return item;
      });
    } catch (parseError) {
      console.error('Error parsing music recommendation response as JSON:', parseError);
      // If parsing fails, return an empty array
      return [];
    }
  } catch (error) {
    console.error('Error generating music recommendations:', error);
    throw error;
  }
}

module.exports = {
  recommendMusicByLLM
};