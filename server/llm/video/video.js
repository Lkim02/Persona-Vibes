const processWithDeepSeek = require('../llm');
const { 
  profileBasedVideoRecommendPrompt, 
  emotionBasedVideoRecommendPrompt 
} = require('./video-prompt');

/**
 * 基于用户画像生成视频推荐
 * @param {string} userProfile - 用户画像分析结果
 * @param {Object} options - 选项参数
 * @returns {Promise<string>} - 视频推荐结果
 */
async function recommendVideosByProfile(userProfile, options = {}) {
  try {
    // 替换提示词中的占位符
    const prompt = profileBasedVideoRecommendPrompt.replace('{{userProfile}}', userProfile);
    
    // 调用DeepSeek API
    return await processWithDeepSeek(prompt, '', options);
  } catch (error) {
    console.error('Error generating video recommendations by profile:', error);
    throw error;
  }
}

/**
 * 基于用户情绪分析生成视频推荐
 * @param {string} emotionAnalysis - 用户情绪分析结果
 * @param {Object} options - 选项参数
 * @returns {Promise<string>} - 视频推荐结果
 */
async function recommendVideosByEmotion(emotionAnalysis, options = {}) {
  try {
    // 替换提示词中的占位符
    const prompt = emotionBasedVideoRecommendPrompt.replace('{{emotionAnalysis}}', emotionAnalysis);
    
    // 调用DeepSeek API
    return await processWithDeepSeek(prompt, '', options);
  } catch (error) {
    console.error('Error generating video recommendations by emotion:', error);
    throw error;
  }
}

module.exports = {
  recommendVideosByProfile,
  recommendVideosByEmotion
};
