import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Vite loads .env / .env.local natively (see import.meta.env); no dotenv needed.
// https://vitejs.dev/config/
export default defineConfig(() => ({
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: "::",
    port: 8080,
    proxy: {
      '/api/analyze-portfolio': {
        target: 'http://localhost:54321/functions/v1/analyze-portfolio',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/analyze-portfolio/, ''),
      },
      '/api/news-breaking': {
        target: 'http://localhost:54321/functions/v1/news-breaking',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/news-breaking/, ''),
      },
    },
  },
}))