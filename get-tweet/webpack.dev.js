const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'development',
  devtool: 'source-map',
  entry: {
    background: './background.js',
    content: './content.js',
    'tiktok-content': './tiktok-content.js',
    'spotify-content': './spotify-content.js',
    'book-content': './book-content.js'
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'manifest.json', to: 'manifest.json' },
        { from: 'icons', to: 'icons' },
        { from: 'index.html', to: 'index.html' },
        { from: 'react-dashboard/dist/assets', to: 'assets' },
      ],
    }),
  ],
};
