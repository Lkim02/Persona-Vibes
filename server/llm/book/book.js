const {processWithByteDance} = require('../llm');

/**
 * Book recommendation prompt
 * Recommends the most suitable books based on user profile, emotional state, and book information
 */
const prompt = `You are a professional personalized book recommendation expert, and now you need to recommend the most suitable book content for the user based on the user's profile analysis, emotional state, and a series of book descriptions, types, and reviews.

You will receive the following input data in JSON format:
{
  "userProfile": "User profile analysis text, including demographic characteristics, interests, values, etc.",
  "userEmotion": "User emotion analysis text, including emotional baseline, fluctuations, and triggering factors, etc.",
  "bookList": [
    {
      "title": "Book title",
      "author": "Author name",
      "description": "Book description content",
      "genres": ["Genre1", "Genre2", "..."],
      "reviews": ["Review1", "Review2", "..."]
    },
    ...
  ]
}

Based on this information, analyze the content characteristics, style, and theme of each book, then recommend the most suitable books for the user, and provide reasons for the recommendation.

Scoring criteria (1-10 points):
- Theme match: The degree of match between the book theme and user interests
- Emotional fit: The degree of compatibility between the book's emotional tone and the user's current emotional state
- Content resonance: The degree of resonance between the book content and the user's values and life experiences
- Exploration value: The value of providing new perspectives or knowledge to the user

You must output the recommendation results in JSON format as follows:
[
  {
    "index": 0,
    "rank": 1,
    "scores": {
      "themeMatch": 8,
      "emotionalFit": 9,
      "contentResonance": 7,
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
- Consider the user's current emotional state and recommend books that can improve or maintain positive emotions
- Avoid content that may aggravate negative emotions, unless the user needs emotional catharsis
- Prioritize content that highly matches the user's reading interests
- The type and reviews of the book provide additional style and emotional clues`;

/**
 * Recommend the most suitable books based on user profile, emotional state, and book information
 * @param {string} userProfile - User profile analysis result
 * @param {string} userEmotion - User emotion analysis result
 * @param {Array<{title: string, author: string, description: string, genres: string[], reviews: string[]}>} bookList - Book array
 * @param {Object} options - Option parameters
 * @returns {Promise<Array>} - Book recommendation result array
 */
async function recommendBooksByLLM(userProfile, userEmotion, bookList, options = {}) {
  try {
    // Build input data
    const userInput = JSON.stringify({
      userProfile,
      userEmotion,
      bookList
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
      
      // Filter out high-scoring recommendations (total score above 7.5)
      const filteredRecommendations = recommendations.filter(item => item.totalScore >= 7.5);
      
      // Ensure each recommendation item has a book title
      return filteredRecommendations.map(item => {
        // Add book title
        if (bookList[item.index]) {
          item.title = bookList[item.index].title;
        }
        return item;
      });
    } catch (parseError) {
      console.error('Error parsing book recommendation response as JSON:', parseError);
      // If parsing fails, return an empty array
      return [];
    }
  } catch (error) {
    console.error('Error generating book recommendations:', error);
    throw error;
  }
}

module.exports = {
  recommendBooksByLLM
};
