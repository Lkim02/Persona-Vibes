const {processWithByteDance} = require('../llm');

/**
 * 音乐推荐提示词
 * 基于用户画像、情绪状态和音乐信息来推荐最适合的音乐
 */
const prompt = `你是一位专业的个性化音乐推荐专家，现在需要你根据用户的画像分析、情绪状态和一系列音乐的歌词、标签及描述，为用户推荐最适合的音乐内容。

你将收到以下JSON格式的输入数据：
{
  "userProfile": "用户画像分析文本，包含人口统计学特征、兴趣爱好、价值观等",
  "userEmotion": "用户情绪分析文本，包含情绪基线、波动和触发因素等",
  "musicList": [
    {
      "lyrics": "歌曲歌词内容",
      "tags": ["标签1", "标签2", "..."],
      "description": "歌曲描述信息"
    },
    ...
  ]
}

请根据这些信息，分析每首音乐的内容特点、风格和情感表达，然后推荐最适合该用户的音乐，并提供推荐理由。

评分标准（1-10分）：
- 风格匹配度：音乐风格与用户音乐品味的匹配程度
- 情绪适配度：音乐情感与用户当前情绪状态的适配程度
- 歌词共鸣度：歌词内容与用户价值观和生活经历的共鸣程度
- 探索价值：为用户提供新音乐体验的价值

你必须以JSON格式输出推荐结果，格式如下：
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
    "recommendation": "推荐理由详细说明"
  },
  ...
]

注意：
- 必须严格按照上述JSON格式输出，不要添加任何额外的文本说明
- 输出必须是一个有效的JSON数组，按推荐度从高到低排序
- 考虑用户当前的情绪状态，推荐能够改善或维持积极情绪的音乐
- 避免可能加剧负面情绪的内容，除非用户需要情感宣泄
- 优先考虑与用户音乐品味高度匹配的内容
- 歌词内容的情感表达和主题是重要参考因素
- 音乐标签和描述提供了额外的风格和情感线索`;

/**
 * 根据用户画像、情绪状态和音乐信息推荐最适合的音乐
 * @param {string} userProfile - 用户画像分析结果
 * @param {string} userEmotion - 用户情绪分析结果
 * @param {Array<{lyrics: string, tags: string[], description: string}>} musicList - 音乐数组，每个包含歌词、标签和描述
 * @param {Object} options - 选项参数
 * @returns {Promise<Array>} - 音乐推荐结果数组
 */
async function recommendMusicByLLM(userProfile, userEmotion, musicList, options = {}) {
  try {
    // 构建输入数据
    const userInput = JSON.stringify({
      userProfile,
      userEmotion,
      musicList
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
      const filteredRecommendations = recommendations.filter(item => item.totalScore >= 7.5);
      return filteredRecommendations.map(item => {
        item.title = musicList[item.index].title;   
        return item;
      });
    } catch (parseError) {
      console.error('Error parsing music recommendation response as JSON:', parseError);
      // 如果解析失败，返回空数组
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