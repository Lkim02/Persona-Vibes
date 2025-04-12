const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { SocksProxyAgent } = require('socks-proxy-agent');

/**
 * 从代理文件中随机获取一个代理
 * @returns {string} 代理URL
 */
function getRandomProxy() {
  try {
    // 读取代理文件
    const proxyFilePath = path.join(__dirname, 'ip-proxy.txt');
    const proxyLines = fs.readFileSync(proxyFilePath, 'utf8').trim().split('\n');
    
    // 随机选择一行
    const randomLine = proxyLines[Math.floor(Math.random() * proxyLines.length)];
    
    // 返回代理URL
    return randomLine.trim();
  } catch (error) {
    console.error(`获取代理失败: ${error.message}`);
    return null;
  }
}

/**
 * 获取TikTok视频评论的最简单函数
 * @param {string} videoId - TikTok视频ID
 */
async function getTikTokComments(videoId) {
  try {
    console.log(`正在获取视频 ${videoId} 的评论...`);
    
    // 构建API URL
    const url = `https://www.tiktok.com/api/comment/list/?aid=1988&aweme_id=${videoId}&count=50&cursor=0`;
    
    // 设置请求头
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Referer': `https://www.tiktok.com/@user/video/${videoId}`
    };
    
    // 获取随机代理
    const proxyUrl = getRandomProxy();
    const proxyAgent = proxyUrl ? new SocksProxyAgent(proxyUrl) : null;
    
    // 配置请求选项
    const requestOptions = { 
      headers,
      ...(proxyAgent && { httpsAgent: proxyAgent })
    };
    
    // 发送请求
    console.log(`使用代理: ${proxyUrl || '无代理'}`);
    const response = await axios.get(url, requestOptions);
    
    // 检查响应
    if (!response.data || !response.data.comments) {
      console.log('未找到评论或响应格式不正确');
      return [];
    }
    
    // 打印评论
    console.log(`找到 ${response.data.comments.length} 条评论`);
    
    return response.data.comments.map(comment => comment.text);
    
  } catch (error) {
    console.error(`获取评论失败: ${error.message}`);
    return [];
  }
}

module.exports = {
  getTikTokComments
}