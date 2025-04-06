const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const fs = require('fs');

// 检查 React 构建输出是否存在
const reactBuildExists = fs.existsSync(path.resolve(__dirname, 'react-dashboard/dist/assets'));

module.exports = {
  mode: 'production',
  entry: {
    background: './background.js',
    content: './content.js',
    'tiktok-content': './tiktok-content.js'
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
        { from: 'popup.js', to: 'popup.js' },
        ...(reactBuildExists 
          ? [{ from: 'react-dashboard/dist/assets', to: 'assets' }] 
          : []),
      ],
    }),
  ],
};
