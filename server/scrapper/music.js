const axios = require('axios');


const fetchSongLyrics = async (songId) => {
  try {
    const result = await axios.get(`https://genius-song-lyrics1.p.rapidapi.com/song/lyrics/?id=${songId}`, {
        headers: {
            'x-rapidapi-key': process.env.RAPIDAPI_KEY,
            'x-rapidapi-host': process.env.RAPIDAPI_MUSIC_HOST
        }
      });
      if (result && result.data && result.data.response && result.data.response.lyrics) {
        return result.data.response.lyrics?.lyrics?.body?.plain;
      }
      return '';
  } catch(error) {
    console.error('获取歌词失败:', error.message);
    return ''
  }
}

const fetchSongDetail = async (songId) => {
  try {
    const result = await axios.get(`https://genius-song-lyrics1.p.rapidapi.com/song/details/?id=${songId}`, {
        headers: {
            'x-rapidapi-key': process.env.RAPIDAPI_KEY,
            'x-rapidapi-host': process.env.RAPIDAPI_MUSIC_HOST
        }
      });
      if (result && result.data && result.data.song) {
        return {
            tags: result.data.song.tags,
            description: result.data.song.description_preview
        }
      }
      return null;
  } catch(error) {
    console.error('获取歌曲信息失败:', error.message);
    return null;
  }
}

const querySong = async (title, author) => {
    try {
        
        const result = await axios.get(`https://genius-song-lyrics1.p.rapidapi.com/search/?q=${title}&per_page=10&page=1`, {
            headers: {
                'x-rapidapi-key': process.env.RAPIDAPI_KEY,
                'x-rapidapi-host': process.env.RAPIDAPI_MUSIC_HOST
            }
        });
        if (result && result.data && result.data && Array.isArray(result.data.hits) && result.data.hits.length > 0) {
            const song = result.data.hits.find(hit => hit?.result?.artist_names.toLowerCase().includes(author.toLowerCase()) || author.toLowerCase().includes(hit?.result?.artist_names.toLowerCase()));
            return song?.result?.id;
        }
        console.log('未找到歌曲');
        return null;
    } catch(error) {
        console.error('获取歌曲信息失败:', error.message);
        return null;
    }
}

const getSongInfo = async (title, author) => {
    try {
        const songId = await querySong(title, author);
        if (!songId) {
            console.error('未找到歌曲');
            return null;
        }
        const [lyrics, detail] = await Promise.all(
            [fetchSongLyrics(songId), fetchSongDetail(songId)]
        );
        return {
            lyrics,
            ...detail,
            tags: detail.tags?.map(tag => tag.name) || []
        };
    } catch(error) {
        console.error('获取歌曲信息失败:', error.message);
        return null;
    }
} 

module.exports = {
    getSongInfo
}