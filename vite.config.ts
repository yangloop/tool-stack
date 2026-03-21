import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

function getManualChunk(id: string) {
  if (!id.includes('node_modules')) {
    return undefined
  }

  if (id.includes('/react/') || id.includes('/react-dom/')) {
    return 'vendor-react'
  }

  if (id.includes('/react-router-dom/') || id.includes('/react-router/')) {
    return 'vendor-router'
  }

  if (id.includes('/lucide-react/')) {
    return 'vendor-lucide'
  }

  if (id.includes('/react-colorful/')) {
    return 'vendor-react-colorful'
  }

  if (id.includes('/axios/')) {
    return 'vendor-axios'
  }

  if (id.includes('/qrcode/')) {
    return 'vendor-qrcode'
  }

  if (id.includes('/jsencrypt/')) {
    return 'vendor-jsencrypt'
  }

  if (id.includes('/crypto-js/')) {
    return 'vendor-crypto-js'
  }

  if (id.includes('/otpauth/')) {
    return 'vendor-otpauth'
  }

  if (id.includes('/composerize/')) {
    return 'vendor-composerize'
  }

  if (id.includes('/decomposerize/')) {
    return 'vendor-decomposerize'
  }

  if (id.includes('/sql-formatter/')) {
    return 'vendor-sql-formatter'
  }

  if (id.includes('/prettier/standalone')) {
    return 'vendor-prettier-core'
  }

  if (id.includes('/prettier/plugins/estree')) {
    return 'vendor-prettier-estree'
  }

  if (id.includes('/prettier/plugins/babel')) {
    return 'vendor-prettier-babel'
  }

  if (id.includes('/prettier/plugins/typescript')) {
    return 'vendor-prettier-typescript'
  }

  if (id.includes('/prettier/plugins/html')) {
    return 'vendor-prettier-html'
  }

  if (id.includes('/prettier/plugins/postcss')) {
    return 'vendor-prettier-postcss'
  }

  if (id.includes('/prettier/plugins/yaml')) {
    return 'vendor-prettier-yaml'
  }

  return undefined
}

export default defineConfig(({ mode }) => ({
  plugins: [
    {
      name: 'resolve-tools-data',
      enforce: 'pre',
      resolveId(id) {
        if (id !== '@tools-data') {
          return null
        }
        return resolve(__dirname, 'src/data/tools.client.tsx')
      },
    },
    react({
      jsxRuntime: 'automatic',
      include: '**/*.{jsx,tsx}',
    }),
  ],
  
  build: {
    outDir: 'dist',
    sourcemap: false,

    rollupOptions: {
      output: {
        manualChunks: getManualChunk,
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

    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },

    target: 'es2015',
    chunkSizeWarningLimit: 1500,
    reportCompressedSize: true,
    cssMinify: true,
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
