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
    
    // 生成 sourcemap，便于调试
    sourcemap: true,
    
    // 代码分割策略
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
      output: {
        // 代码分割
        manualChunks: {
          // 第三方库单独打包
          vendor: ['react', 'react-dom', 'react-router-dom'],
          // UI 相关
          ui: ['lucide-react'],
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
