// 确保 React 应用能正确加载
document.addEventListener('DOMContentLoaded', function() {
  // 检查是否已经加载了 React 应用
  setTimeout(function() {
    const rootElement = document.getElementById('root');
    if (rootElement && rootElement.children.length <= 1) {
      console.error('React 应用加载失败，尝试重新加载');
      // 如果 React 应用没有正确加载，尝试重新加载脚本
      const script = document.createElement('script');
      script.src = 'assets/index.js';
      document.body.appendChild(script);
    }
  }, 1000);
});
