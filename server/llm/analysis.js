const processWithDeepSeek = require('./llm');
const { userProfilePrompt, userEmotionPrompt } = require('./analysis.prompt');

/**
 * 分析用户推文生成用户画像
 * @param {Array} tweets - 推文数组，每条推文包含content和createdAt字段
 * @param {Object} options - 选项参数
 * @returns {Promise<string>} - 用户画像分析结果
 */
async function analyzeUserProfile(tweets, options = {}) {
  try {
    // 替换提示词中的占位符
    const prompt = userProfilePrompt.replace('{{tweets}}', JSON.stringify(tweets));
    
    // 调用DeepSeek API
    return await processWithDeepSeek(prompt, '', options);
  } catch (error) {
    console.error('Error analyzing user profile:', error);
    throw error;
  }
}

/**
 * 分析用户推文生成情绪分析
 * @param {Array} tweets - 推文数组，每条推文包含content和createdAt字段
 * @param {Object} options - 选项参数
 * @returns {Promise<string>} - 情绪分析结果
 */
async function analyzeUserEmotion(tweets, options = {}) {
  try {
    // 替换提示词中的占位符
    const prompt = userEmotionPrompt.replace('{{tweets}}', JSON.stringify(tweets));
    
    // 调用DeepSeek API
    return await processWithDeepSeek(prompt, '', options);
  } catch (error) {
    console.error('Error analyzing user emotion:', error);
    throw error;
  }
}

module.exports = {
  analyzeUserProfile,
  analyzeUserEmotion
};