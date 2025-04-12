const User = require('../models/User');
const { getBookInfo } = require('../scrapper/book');
const { recommendBooksByLLM } = require('../llm/book/book');

/**
 * 延时函数
 * @param {number} ms - 延时毫秒数
 * @returns {Promise} - 延时Promise
 */
function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 推荐书籍
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @returns {Promise<void>}
 */
const recommendBooks = async (req, res) => {
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

        const bookList = req.body.bookList;
        if (!bookList || !Array.isArray(bookList) || bookList.length === 0) {
            return res.status(400).json({ message: 'Invalid or empty book list' });
        }

        // 爬取书籍信息
        const bookListInfo = [];

        for (const book of bookList) {
            console.log('book', book);
            const data = await getBookInfo(book.title, book.author);
            if (data) {
                bookListInfo.push({
                    ...data,
                    title: book.title,
                    author: book.author
                });
            } else {
                // 如果无法获取详细信息，至少保留基本信息
                bookListInfo.push({
                    description: '',
                    genres: [],
                    reviews: [],
                    title: book.title,
                    author: book.author
                });
            }
            // 添加延时，避免API限制
            await timeout(1000);
        }
        
        console.log(`Success get book list info`);
        let recommendations = await recommendBooksByLLM(userProfile, userEmotion, bookListInfo);
        
        // 确保推荐结果包含书籍标题
        recommendations = recommendations.map(recommendation => {
            return {
                ...recommendation,
                title: bookList[recommendation.index].title
            };
        });
        
        console.log(`Success recommend books`);
        return res.status(200).json({ 
            recommendations, 
            url: req.body.url 
        });
    } catch (error) {
        console.error('Error recommending books:', error);
        return res.status(500).json({ 
            message: 'An error occurred while processing book recommendations',
            error: error.message
        });
    }
};

module.exports = {
    recommendBooks
};
