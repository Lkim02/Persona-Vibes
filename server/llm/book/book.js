const {processWithByteDance} = require('../llm');

/**
 * 书籍推荐提示词
 * 基于用户画像、情绪状态和书籍信息来推荐最适合的书籍
 */
const prompt = `你是一位专业的个性化书籍推荐专家，现在需要你根据用户的画像分析、情绪状态和一系列书籍的描述、类型及评论，为用户推荐最适合的书籍内容。

你将收到以下JSON格式的输入数据：
{
  "userProfile": "用户画像分析文本，包含人口统计学特征、兴趣爱好、价值观等",
  "userEmotion": "用户情绪分析文本，包含情绪基线、波动和触发因素等",
  "bookList": [
    {
      "title": "书籍标题",
      "author": "作者名称",
      "description": "书籍描述内容",
      "genres": ["类型1", "类型2", "..."],
      "reviews": ["评论1", "评论2", "..."]
    },
    ...
  ]
}

请根据这些信息，分析每本书籍的内容特点、风格和主题，然后推荐最适合该用户的书籍，并提供推荐理由。

评分标准（1-10分）：
- 主题匹配度：书籍主题与用户兴趣的匹配程度
- 情绪适配度：书籍情感基调与用户当前情绪状态的适配程度
- 内容共鸣度：书籍内容与用户价值观和生活经历的共鸣程度
- 探索价值：为用户提供新视角或知识的价值

你必须以JSON格式输出推荐结果，格式如下：
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
    "recommendation": "推荐理由详细说明"
  },
  ...
]

注意：
- 必须严格按照上述JSON格式输出，不要添加任何额外的文本说明
- 输出必须是一个有效的JSON数组，按推荐度从高到低排序
- 考虑用户当前的情绪状态，推荐能够改善或维持积极情绪的书籍
- 避免可能加剧负面情绪的内容，除非用户需要情感宣泄
- 优先考虑与用户阅读兴趣高度匹配的内容
- 书籍的类型和评论提供了额外的风格和情感线索`;

/**
 * 根据用户画像、情绪状态和书籍信息推荐最适合的书籍
 * @param {string} userProfile - 用户画像分析结果
 * @param {string} userEmotion - 用户情绪分析结果
 * @param {Array<{title: string, author: string, description: string, genres: string[], reviews: string[]}>} bookList - 书籍数组
 * @param {Object} options - 选项参数
 * @returns {Promise<Array>} - 书籍推荐结果数组
 */
async function recommendBooksByLLM(userProfile, userEmotion, bookList, options = {}) {
  try {
    // 构建输入数据
    const userInput = JSON.stringify({
      userProfile,
      userEmotion,
      bookList
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
      
      // 过滤出高分推荐（总分7.5分以上）
      const filteredRecommendations = recommendations.filter(item => item.totalScore >= 7.5);
      
      // 确保每个推荐项都有书籍标题
      return filteredRecommendations.map(item => {
        // 添加书籍标题
        if (bookList[item.index]) {
          item.title = bookList[item.index].title;
        }
        return item;
      });
    } catch (parseError) {
      console.error('Error parsing book recommendation response as JSON:', parseError);
      // 如果解析失败，返回空数组
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
