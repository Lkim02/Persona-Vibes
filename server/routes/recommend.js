const express = require('express');
const auth = require('../middlewares/auth');
const { recommendVideoes } = require('../controllers/tiktokController');
const { recommendMusic } = require('../controllers/spotifyController');
const { recommendBooks } = require('../controllers/bookController');
const router = express.Router();

router.post('/videos', auth, recommendVideoes);
router.post('/music', auth, recommendMusic);
router.post('/books', auth, recommendBooks);

module.exports = router;