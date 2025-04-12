const {processWithByteDance} = require('../llm');

/**
 * 视频推荐提示词
 * 基于用户画像、情绪状态和视频评论来推荐最适合的视频
 */
const prompt = `你是一位专业的个性化内容推荐专家，现在需要你根据用户的画像分析、情绪状态和一系列视频的评论，为用户推荐最适合的视频内容。

你将收到以下JSON格式的输入数据：
{
  "userProfile": "用户画像分析文本，包含人口统计学特征、兴趣爱好、价值观等",
  "userEmotion": "用户情绪分析文本，包含情绪基线、波动和触发因素等",
  "videos": [
    {
      "videoUrl": "视频URL",
      "comments": ["评论1", "评论2", "..."]
    },
    ...
  ]
}

请根据这些信息，分析每个视频的内容特点和受众群体，然后推荐最适合该用户的视频，并提供推荐理由。

评分标准（1-10分）：
- 兴趣匹配度：视频内容与用户兴趣的匹配程度
- 情绪适配度：视频内容对用户当前情绪状态的适配程度
- 价值观一致性：视频内容与用户价值观的一致程度
- 社区反馈：基于评论的整体反馈情况

你必须以JSON格式输出推荐结果，格式如下：
[
  {
    "videoUrl": "视频URL",
    "rank": 1,
    "scores": {
      "interestMatch": 8,
      "emotionalFit": 9,
      "valueAlignment": 7,
      "communityFeedback": 8
    },
    "totalScore": 8.0,
    "recommendation": "推荐理由详细说明"
  },
  ...
]

注意：
- 必须严格按照上述JSON格式输出，不要添加任何额外的文本说明
- 输出必须是一个有效的JSON数组，按推荐度从高到低排序
- 考虑用户当前的情绪状态，推荐能够改善或维持积极情绪的内容
- 避免可能加剧负面情绪的内容
- 优先考虑与用户兴趣高度匹配的内容
- 评论中的情感倾向和主题也是重要参考因素`;

/**
 * 根据用户画像、情绪状态和视频评论推荐最适合的视频
 * @param {string} userProfile - 用户画像分析结果
 * @param {string} userEmotion - 用户情绪分析结果
 * @param {Array<{videoUrl: string, comments: string[]}>} videos - 视频数组，每个包含URL和评论
 * @param {Object} options - 选项参数
 * @returns {Promise<Array>} - 视频推荐结果数组
 */
async function recommendVideos(userProfile, userEmotion, videos, options = {}) {
  try {
    // 构建输入数据
    const userInput = JSON.stringify({
      userProfile,
      userEmotion,
      videos
    });
    // 调用ByteDance API
    const response = await processWithByteDance(prompt, userInput, options);
    // 尝试解析返回的JSON字符串
    try {
      const recommendations = JSON.parse(response);
      
      // 确保返回的是数组
      if (!Array.isArray(recommendations)) {
        console.warn('API did not return an array, converting to array format');
        return []; // 返回空数组作为后备
      }
      
      return recommendations.filter(item => item.totalScore >= 8.0);
    } catch (parseError) {
      console.error('Error parsing recommendation response as JSON:', parseError);
      // 如果解析失败，返回空数组
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