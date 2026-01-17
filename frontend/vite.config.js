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
    // Remove console and debugger in production
    // Note: esbuild automatically removes console in production builds
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // CRITICAL: Never split React or React-related packages
          // They must all be in the same chunk to share the same React instance
          if (
            id.includes('node_modules/react') || 
            id.includes('node_modules/react-dom') || 
            id.includes('node_modules/react-redux') ||
            id.includes('node_modules/react-router') ||
            id.includes('node_modules/@reduxjs/toolkit')
          ) {
            return 'react-vendor'
          }
          
          if (id.includes('node_modules')) {
            if (id.includes('@mui')) {
              return 'mui-vendor'
            }
            if (id.includes('dayjs')) {
              return 'date-vendor'
            }
            return 'vendor'
          }
          
          // Don't split lazy-loaded components from React Router
          // This ensures they have access to Router context
          if (id.includes('pages/dashboard')) {
            return 'dashboard-pages'
          }
        },
        assetFileNames: 'assets/[name].[hash].[ext]',
        chunkFileNames: 'assets/[name].[hash].js',
        entryFileNames: 'assets/[name].[hash].js'
      }
    },
    cssCodeSplit: true,
    sourcemap: false,
    chunkSizeWarningLimit: 1000
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
