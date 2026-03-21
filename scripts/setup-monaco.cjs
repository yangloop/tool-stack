const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const srcDir = path.join(rootDir, 'node_modules', 'monaco-editor', 'min', 'vs');
const destDir = path.join(rootDir, 'public', 'monaco', 'vs');

if (!fs.existsSync(srcDir)) {
  console.error('[setup-monaco] 未找到 monaco-editor 资源目录:', srcDir);
  process.exit(1);
}

fs.mkdirSync(path.dirname(destDir), { recursive: true });
fs.rmSync(destDir, { recursive: true, force: true });
fs.cpSync(srcDir, destDir, { recursive: true, force: true });

console.log('[setup-monaco] 已同步 Monaco 静态资源到 public/monaco/vs');
