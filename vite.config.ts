import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { componentTagger } from "lovable-tagger"
import dotenv from 'dotenv'

dotenv.config()

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
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
    },
  },
}))