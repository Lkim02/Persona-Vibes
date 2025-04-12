const axios = require('axios');
const dotenv = require('dotenv');
const { Readable } = require('stream');

// 加载环境变量
dotenv.config();

// DeepSeek API配置
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';

// ByteDance API配置
const BYTE_DANCE_API_KEY = process.env.BYTE_DANCE_API_KEY;
const BYTE_DANCE_API_URL = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions';

/**
 * 创建一个用于处理DeepSeek API流式响应的可读流
 * @param {Object} response - Axios响应对象
 * @returns {Readable} 可读流
 */
function createReadableStream(response) {
  const stream = new Readable({
    read() {}
  });

  let buffer = '';
  
  response.data.on('data', (chunk) => {
    const chunkString = chunk.toString();
    buffer += chunkString;
    
    // 处理流式数据，按行分割
    const lines = buffer.split('\n');
    buffer = lines.pop(); // 保留最后一个可能不完整的行
    
    for (const line of lines) {
      if (line.trim() === '') continue;
      if (line.trim() === 'data: [DONE]') {
        stream.push(null); // 结束流
        return;
      }
      
      try {
        // 移除 "data: " 前缀并解析JSON
        const dataString = line.replace(/^data: /, '').trim();
        if (!dataString) continue;
        
        const data = JSON.parse(dataString);
        const content = data.choices[0]?.delta?.content || '';
        if (content) {
          stream.push(content);
        }
      } catch (error) {
        console.error('Error parsing stream data:', error, line);
      }
    }
  });
  
  response.data.on('end', () => {
    // 处理缓冲区中剩余的数据
    if (buffer.trim() && buffer.trim() !== 'data: [DONE]') {
      try {
        const dataString = buffer.replace(/^data: /, '').trim();
        if (dataString) {
          const data = JSON.parse(dataString);
          const content = data.choices[0]?.delta?.content || '';
          if (content) {
            stream.push(content);
          }
        }
      } catch (error) {
        console.error('Error parsing remaining buffer:', error);
      }
    }
    stream.push(null); // 确保流结束
  });
  
  return stream;
}

/**
 * 使用DeepSeek API处理提示词并返回结果
 * 
 * @param {string} prompt - 系统提示词
 * @param {string} userInput - 用户输入内容
 * @param {Object} options - 配置选项
 * @param {string} options.model - 模型名称，默认为'deepseek-chat'
 * @param {number} options.temperature - 温度参数，控制随机性，默认为0.7
 * @param {number} options.max_tokens - 最大生成token数，默认为4095
 * @param {boolean} options.stream - 是否使用流式输出，默认为true
 * @returns {Promise<string>} 返回完整响应文本
 */
async function processWithDeepSeek(prompt, userInput = '', options = {}) {
  const {
    model = 'deepseek-chat',
    temperature = 0.7,
    max_tokens = 4095,
    stream = false,  // 默认改为false
    ...otherOptions
  } = options;
  
  const messages = [
    { role: 'system', content: prompt },
    { role: 'user', content: userInput }
  ];
  
  const requestData = {
    model,
    messages,
    temperature,
    max_tokens,
    stream: false,  // 始终设置为false
    ...otherOptions
  };
  
  try {
    const response = await axios({
      method: 'post',
      url: DEEPSEEK_API_URL,
      data: requestData,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      responseType: 'json'  // 始终使用json响应类型
    });
    
    // 直接返回文本内容
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('DeepSeek API error:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * 使用ByteDance API处理提示词并返回结果
 * 
 * @param {string} prompt - 系统提示词
 * @param {string} userInput - 用户输入内容
 * @param {Object} options - 配置选项
 * @param {string} options.model - 模型名称，默认为'doubao-1-5-lite-32k-250115'
 * @param {number} options.temperature - 温度参数，控制随机性，默认为0.7
 * @param {number} options.max_tokens - 最大生成token数，默认为4095
 * @returns {Promise<string>} 返回完整响应文本
 */
async function processWithByteDance(prompt, userInput = '', options = {}) {
  console.log('调用ByteDance API');
  let startTime = Date.now();
  const {
    model = 'doubao-1-5-lite-32k-250115',
    temperature = 0.7,
    max_tokens = 12287,
    ...otherOptions
  } = options;
  
  const messages = [
    { role: 'system', content: prompt },
    { role: 'user', content: userInput }
  ];
  
  const requestData = {
    model,
    messages,
    temperature,
    max_tokens,
    ...otherOptions
  };
  
  try {
    const response = await axios({
      method: 'post',
      url: BYTE_DANCE_API_URL,
      data: requestData,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${BYTE_DANCE_API_KEY}`
      },
      responseType: 'json'
    });
    console.log(`ByteDance API response time: ${Date.now() - startTime}ms`);
    // 直接返回文本内容
    return response.data.choices[0].message.content;
  } catch (error) {
    console.log(error?.response?.data)
    console.error('ByteDance API error:', error.response?.data || error.message);
    throw new Error('ByteDance API error');
  }
}

module.exports = {
  processWithDeepSeek,
  processWithByteDance
};