import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      // 优化 JSX 转换
      jsxRuntime: 'automatic',
    }),
  ],
  
  // 构建优化
  build: {
    // 输出目录
    outDir: 'dist',
    
    // 生产环境不生成 sourcemap，减少体积
    sourcemap: false,
    
    // 代码分割策略
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
      output: {
        // 代码分割 - 静态配置避免循环依赖
        manualChunks: {
          // 核心框架
          'vendor-core': ['react', 'react-dom', 'react-router-dom'],
          // UI 组件
          'vendor-ui': ['lucide-react', 'react-colorful'],
          // CodeMirror 编辑器核心（不含语言包）
          'vendor-codemirror': ['@codemirror/state', '@codemirror/view', '@codemirror/language', '@uiw/react-codemirror'],
          // CodeMirror 语言包（按需加载）
          'vendor-codemirror-langs': ['@codemirror/lang-json', '@codemirror/lang-sql', '@codemirror/lang-xml', '@codemirror/lang-html', '@codemirror/lang-yaml'],
          // 语法高亮 - 改为懒加载，不再打包到 vendor
          // 'vendor-highlight': ['react-syntax-highlighter'],
          // Docker 工具（大）
          'vendor-docker': ['composerize', 'decomposerize'],
          // JSON 查看器（大）
          'vendor-json': ['react-json-view'],
          // SQL 格式化器 (sql-formatter 现在只在 Web Worker 中使用，不打包到主 bundle)
          // 'vendor-sql': ['sql-formatter'],
          // 加密相关
          'vendor-crypto': ['jsencrypt', 'crypto-js', 'otpauth'],
          // 其他工具
          'vendor-utils': ['axios', 'qrcode'],
        },
        // 静态资源命名
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.')
          const ext = info[info.length - 1]
          if (/\.(png|jpe?g|gif|svg|webp|ico)$/i.test(assetInfo.name)) {
            return `assets/images/[name]-[hash][extname]`
          }
          return `assets/[name]-[hash][extname]`
        },
        // JS 文件命名
        chunkFileNames: 'assets/js/[name]-[hash].js',
        // 入口文件命名
        entryFileNames: 'assets/js/[name]-[hash].js',
      },
    },
    
    // 压缩选项
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    
    // 目标浏览器
    target: 'es2015',
    
    // 调整 chunk 大小警告阈值（第三方库较大是正常的）
    chunkSizeWarningLimit: 700,
    
    // 启用 gzip 压缩报告
    reportCompressedSize: true,
    
    // CSS 优化
    cssMinify: true,
  },
  
  // 开发服务器配置
  server: {
    port: 5173,
    host: true,
  },
  
  // 路径别名
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@components': resolve(__dirname, 'src/components'),
      '@hooks': resolve(__dirname, 'src/hooks'),
      '@utils': resolve(__dirname, 'src/utils'),
      '@types': resolve(__dirname, 'src/types'),
    },
  },
  
  // Worker 配置
  worker: {
    format: 'es',
  },
  
  // CSS 配置
  css: {
    devSourcemap: true,
  },
  
  // 预览配置
  preview: {
    port: 4173,
    host: true,
  },
})
