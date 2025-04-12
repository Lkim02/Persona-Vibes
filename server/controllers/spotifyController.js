const User = require('../models/User');
const { getSongInfo } = require('../scrapper/music');
const { recommendMusicByLLM } = require('../llm/music/music');



function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const recommendMusic = async (req, res) => {
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
        const musicList = req.body.musicList;
        if (!musicList || !Array.isArray(musicList) || musicList.length === 0) {
            return res.status(400).json({ message: 'Invalid or empty music list' });
        }

        // 爬取music 信息
        const musicListInfo = [];

        for (const music of musicList) {
            console.log('music', music);
            const data = await getSongInfo(music.title, music.author);
            musicListInfo.push(data);
            await timeout(1000);
        }
        
        console.log(`Success get music list info`)
        let recommendations = await recommendMusicByLLM(userProfile, userEmotion, musicListInfo);
        recommendations = recommendations.map(recommendation => {
            return {
                ...recommendation,
                title: musicList[recommendation.index].title
            }
        })
        console.log(`Success recommend music`)
        return res.status(200).json({ recommendations, url: req.body.url });
    } catch(error) {}
}

module.exports = {
    recommendMusic
}