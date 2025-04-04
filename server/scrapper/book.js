const axios = require("axios");



const queryBook = async (title, author) => {
    try {
        const result = await axios.get(`https://goodreads12.p.rapidapi.com/searchBooks?keyword=${title}&page=1`, {
            headers: {
                'x-rapidapi-key': process.env.RAPIDAPI_KEY,
                'x-rapidapi-host': process.env.RAPIDAPI_BOOK_HOST
            }
        });
        if (result && result.data && Array.isArray(result.data) && result.data.length > 0) {
            return result.data.find(bookItem => {
                const authors = bookItem.author.map(author => author.name.toLowerCase());
                return authors.includes(author.toLowerCase());
            })
        }
        console.log('未找到书籍');
        return null;
    } catch (error) {
        console.error('获取书籍信息失败:', error.message);
        return null;
    }
}

const fetchBookDetail = async (bookId) => {
    try {
        const result = await axios.get(`https://goodreads12.p.rapidapi.com/getBookByID?bookID=${bookId}`, {
            headers: {
                'x-rapidapi-key': process.env.RAPIDAPI_KEY,
                'x-rapidapi-host': process.env.RAPIDAPI_BOOK_HOST
            }
        });
        console.log(result.data)
        if (result && result.data) {
            return {
                description: result.data.description,
                genres: result.data.bookGenres?.map(genre => genre.name),
                reviews: result.data.reviews?.map(review => review.text)
            }
        }
        console.log('未找到书籍');
        return null;
    } catch (error) {
        console.error('获取书籍信息失败:', error.message);
        return null;
    }
}

const getBookInfo = async (title, author) => {
    try {
        const book = await queryBook(title, author);
        if (!book) {
            console.error('未找到书籍');
            return null;
        }
        const [detail] = await Promise.all(
            [fetchBookDetail(book.bookId)]
        );
        return {
            ...detail
        };
    } catch (error) {
        console.error('获取书籍信息失败:', error.message);
        return null;
    }
}

module.exports = {
    getBookInfo
}