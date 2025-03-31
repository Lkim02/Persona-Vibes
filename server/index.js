const express = require('express');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const tweetRoutes = require('./routes/tweets');
const { getSongInfo } = require('./scrapper/music');
require('dotenv').config();

// Initialize express app
const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tweets', tweetRoutes);

// Root route
app.get('/', (req, res) => {
  res.send('Media Recommend API is running');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

getSongInfo("The Shape of You", "Ed Sheeran")
.then(data => {
  console.log(data);
})

//测试

module.exports = app;
