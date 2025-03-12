import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { componentTagger } from "lovable-tagger"
import dotenv from 'dotenv'

dotenv.config()

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
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
            const headers = proxyReq.getHeaders();
            const headersObj: Record<string, string | string[] | number> = {};
            
            // Ensure we forward all headers, especially Authorization
            Object.entries(headers).forEach(([key, value]) => {
              if (value !== undefined) {
                headersObj[key] = value;
              }
            });
            
            console.log('Headers being sent:', headersObj);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
          });
        },
      },
    },
  },
}))
