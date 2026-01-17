import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  base: '/',
  plugins: [react()],
  resolve: {
    // Force deduplication of React to prevent multiple instances
    dedupe: [
      'react', 
      'react-dom',
      'react/jsx-runtime',
      'react/jsx-dev-runtime',
      'react-redux',
      'react-router',
      'react-router-dom',
      '@reduxjs/toolkit',
      '@mui/material', 
      '@mui/x-date-pickers'
    ],
    // Ensure we always resolve to the same React instance
    alias: {
      'react': path.resolve(__dirname, 'node_modules/react'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
    }
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react/jsx-runtime',
      'react-redux',
      'react-router',
      'react-router-dom',
      '@reduxjs/toolkit',
      '@mui/material',
      '@mui/icons-material',
      '@mui/x-date-pickers',
      '@mui/x-date-pickers/DatePicker',
      '@mui/x-date-pickers/LocalizationProvider',
      '@mui/x-date-pickers/AdapterDayjs',
      'dayjs'
    ],
    esbuildOptions: {
      jsx: 'automatic'
    }
  },
  build: {
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // CRITICAL: Bundle ALL React-dependent packages together
          // This includes React, React-DOM, React-Redux, React-Router, 
          // MUI, and Emotion since they all depend on React
          const isReactPackage = (
            id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom/') ||
            id.includes('node_modules/react-redux/') ||
            id.includes('node_modules/react-router/') ||
            id.includes('node_modules/react-router-dom/') ||
            id.includes('node_modules/@reduxjs/toolkit/') ||
            id.includes('react/jsx-runtime') ||
            id.includes('react/jsx-dev-runtime')
          )
          
          // Emotion and MUI MUST be bundled with React since they depend on it
          const isMUIOrEmotion = (
            id.includes('@mui') ||
            id.includes('@emotion')
          )
          
          if (isReactPackage || isMUIOrEmotion) {
            // Keep all React-dependent packages in entry chunk
            // This ensures React is available when Emotion/MUI try to use it
            return undefined  // Keep in entry chunk
          }
          
          // Other vendor packages that don't depend on React
          if (id.includes('node_modules')) {
            if (id.includes('dayjs')) {
              return 'date-vendor'
            }
            return 'vendor'
          }
        },
        assetFileNames: 'assets/[name].[hash].[ext]',
        chunkFileNames: 'assets/[name].[hash].js',
        entryFileNames: 'assets/[name].[hash].js'
      }
    },
    cssCodeSplit: true,
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true
    },
    target: 'esnext',
    modulePreload: {
      polyfill: true
    }
  },
  server: {
    headers: {
      'Cache-Control': 'public, max-age=31536000'
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler' 
      }
    }
  }
})
