/**
 * 将 dist/client 的静态站点内容同步到 dist 根目录。
 * 目的：兼容以 dist 作为发布根目录的 CDN/静态托管场景。
 * 注意：保留 dist/server 与 dist/client，不做覆盖删除。
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const clientDir = path.join(distDir, 'client');

if (!fs.existsSync(clientDir)) {
  console.error('[sync-client-to-dist-root] dist/client 不存在，请先执行客户端构建。');
  process.exit(1);
}

const cleanupTargets = [
  'assets',
  'tool',
  'og',
  'index.html',
  '404.html',
  'sitemap.xml',
  'robots.txt',
  'manifest.json',
  'favicon.ico',
  'favicon.svg',
  'favicon.png',
  'favicon-16x16.png',
  'apple-touch-icon.png',
  'logo.svg',
  'vite.svg',
];

for (const target of cleanupTargets) {
  const targetPath = path.join(distDir, target);
  if (fs.existsSync(targetPath)) {
    fs.rmSync(targetPath, { recursive: true, force: true });
  }
}

const entries = fs.readdirSync(clientDir, { withFileTypes: true });
for (const entry of entries) {
  const srcPath = path.join(clientDir, entry.name);
  const dstPath = path.join(distDir, entry.name);

  // 保留 SSR 产物目录，仅同步静态页面产物。
  if (entry.name === 'server') {
    continue;
  }

  fs.cpSync(srcPath, dstPath, { recursive: true, force: true });
}

console.log('[sync-client-to-dist-root] 已同步 dist/client -> dist');
