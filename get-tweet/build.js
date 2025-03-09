const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 确保输出目录存在
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// 构建 React 应用
console.log('Building React application...');
execSync('cd react-dashboard && npm run build', { stdio: 'inherit' });

// 复制 Chrome 扩展文件
console.log('Copying extension files...');
execSync('npx webpack --config webpack.config.js', { stdio: 'inherit' });

console.log('Build completed successfully!');
