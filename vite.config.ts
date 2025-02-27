
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 8080,
    proxy: {
      '/api/analyze-portfolio': {
        target: 'http://localhost:54321/functions/v1/analyze-portfolio',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/analyze-portfolio/, ''),
      },
    },
  },
})
