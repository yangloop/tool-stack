import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig(({ mode, isSsrBuild }) => ({
  plugins: [
    react({
      jsxRuntime: 'automatic',
      include: '**/*.{jsx,tsx}',
    }),
  ],
  
  build: {
    outDir: isSsrBuild ? 'dist/server' : 'dist/client',
    sourcemap: false,
    
    // SSR 构建时不使用 manualChunks
    rollupOptions: isSsrBuild ? {
      input: '/src/entry-server.tsx',
    } : {
      output: {
        manualChunks: {
          'vendor-core': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['lucide-react', 'react-colorful'],
          'vendor-docker': ['composerize', 'decomposerize'],
          'vendor-crypto': ['jsencrypt', 'crypto-js', 'otpauth'],
          'vendor-utils': ['axios', 'qrcode'],
        },
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.')
          const ext = info[info.length - 1]
          if (/\.(png|jpe?g|gif|svg|webp|ico)$/i.test(assetInfo.name)) {
            return `assets/images/[name]-[hash][extname]`
          }
          return `assets/[name]-[hash][extname]`
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
      },
    },
    
    minify: isSsrBuild ? false : 'terser',
    terserOptions: isSsrBuild ? undefined : {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    
    target: 'es2015',
    chunkSizeWarningLimit: 1500,
    reportCompressedSize: !isSsrBuild,
    cssMinify: !isSsrBuild,
  },
  
  server: {
    port: 5173,
    host: true,
    hmr: mode === 'development' ? {
      overlay: false,
    } : false,
  },
  
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@components': resolve(__dirname, 'src/components'),
      '@hooks': resolve(__dirname, 'src/hooks'),
      '@utils': resolve(__dirname, 'src/utils'),
      '@types': resolve(__dirname, 'src/types'),
    },
  },
  
  worker: {
    format: 'es',
  },
  
  css: {
    devSourcemap: true,
  },
  
  preview: {
    port: 4173,
    host: true,
  },
  
  optimizeDeps: {
    include: [
      'react', 
      'react-dom', 
      'react-router-dom',
      '@codemirror/lang-json',
      '@codemirror/lang-sql',
      '@codemirror/lang-xml',
      '@codemirror/lang-html',
      '@codemirror/lang-yaml',
      '@codemirror/legacy-modes/mode/shell',
    ],
    esbuildOptions: {
      target: 'es2020',
    },
  },
  
  esbuild: {
    jsx: 'automatic',
    target: 'es2020',
  },
}))
