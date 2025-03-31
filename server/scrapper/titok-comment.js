const axios = require('axios');

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
    
    // 发送请求
    const response = await axios.get(url, { headers });
    
    // 检查响应
    if (!response.data || !response.data.comments) {
      console.log('未找到评论或响应格式不正确');
      return;
    }
    
    // 打印评论
    console.log(`找到 ${response.data.comments.length} 条评论：\n`);
    
    // response.data.comments.forEach((comment, index) => {
    //   console.log(`${index + 1}. ${comment.user.nickname}: ${comment.text}`);
    // });
    // console.log(response.data.comments);
    return response.data.comments.map(comment => comment.text);
    
  } catch (error) {
    console.error(`获取评论失败: ${error.message}`);
  }
}


module.exports = {
  getTikTokComments
}