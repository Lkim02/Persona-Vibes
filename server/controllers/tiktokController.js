const Tweet = require('../models/Tweet');
const User = require('../models/User');
const { getTikTokComments } = require('../scrapper/titok-comment');
const { recommendVideos } = require('../llm/video/video');
const http = require('http');
const https = require('https');

// 增加 Node.js 的并发连接数限制
http.globalAgent.maxSockets = 100;
https.globalAgent.maxSockets = 100;

function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 获取单个视频的评论
 * @param {string} videoUrl - 视频URL
 * @returns {Promise<Object>} - 包含视频URL和评论的对象
 */
async function fetchVideoComments(videoUrl) {
    try {
        const videoId = videoUrl.split('/').pop();
        // 获取视频评论
        const comments = await getTikTokComments(videoId);
        
        return {
            videoUrl,
            comments: comments || []
        };
    } catch (error) {
        console.error(`Error fetching comments for video ${videoUrl}:`, error);
        // 即使获取评论失败，也返回视频（没有评论）
        return {
            videoUrl,
            comments: []
        };
    }
}

/**
 * 并发获取多个视频的评论，控制并发数
 * @param {Array<string>} videoUrls - 视频URL数组
 * @param {number} concurrency - 并发数
 * @returns {Promise<Array<Object>>} - 包含视频URL和评论的对象数组
 */
async function fetchCommentsWithConcurrency(videoUrls, concurrency = 50) {
    const results = [];
    const chunks = [];
    
    // 将视频URL分成多个批次
    for (let i = 0; i < videoUrls.length; i += concurrency) {
        chunks.push(videoUrls.slice(i, i + concurrency));
    }
    
    // 逐批次并发处理
    for (const chunk of chunks) {
        const chunkPromises = chunk.map(url => fetchVideoComments(url));
        const chunkResults = await Promise.all(chunkPromises);
        results.push(...chunkResults);
        
        // 每批次之间添加短暂延迟，避免过度请求
        if (chunks.length > 1) {
            await timeout(1000);
        }
    }
    
    return results;
}

/**
 * 推荐TikTok视频
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
const recommendVideoes = async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // 获取用户画像和情绪分析
        const userProfile = user.profile;
        const userEmotion = user.todayEmotion;
        
        // 如果用户没有画像分析，返回错误
        if (!userProfile) {
            return res.status(400).json({ 
                message: 'User profile not available. Please post some tweets first to generate a profile.' 
            });
        }
        
        const videoesUrls = req.body.videoesUrls;
        if (!videoesUrls || !Array.isArray(videoesUrls) || videoesUrls.length === 0) {
            return res.status(400).json({ message: 'Invalid or empty videos list' });
        }
        
        // 从请求中获取是否使用ByteDance API的选项
        const useByteDance = req.body.useByteDance === true;
        
        console.log(`开始获取 ${videoesUrls.length} 个视频的评论...${useByteDance ? '(使用ByteDance API)' : '(使用DeepSeek API)'}`);
        const startTime = Date.now();
        
        // 并发获取所有视频的评论
        const videos = await fetchCommentsWithConcurrency(videoesUrls);
        
        const endTime = Date.now();
        console.log(`获取完成，共 ${videos.length} 个视频，耗时 ${(endTime - startTime) / 1000} 秒`);
        
        // 调用LLM进行视频推荐，传递API选择选项
        const recommendations = await recommendVideos(
            userProfile, 
            userEmotion || '', // 如果没有情绪分析，传递空字符串
            videos,
            { useByteDance } // 传递API选择选项
        );
        
        res.status(200).json({
            message: 'Video recommendations generated successfully',
            recommendations: recommendations || [], // 确保即使出错也返回空数组
            api: useByteDance ? 'ByteDance' : 'DeepSeek' // 在响应中包含使用的API信息
        });
        
    } catch (error) {
        console.error('Error recommending videos:', error);
        res.status(500).json({ 
            message: 'Error generating video recommendations',
            error: error.message 
        });
    }
};

module.exports = {
    recommendVideoes
};