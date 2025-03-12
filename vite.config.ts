
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
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
            // Convert headers to a format compatible with Object.fromEntries
            const headers = proxyReq.getHeaders();
            const headersObj: Record<string, string | string[] | number> = {};
            for (const key in headers) {
              if (Object.prototype.hasOwnProperty.call(headers, key)) {
                const headerValue = headers[key];
                // Only assign if the value is not undefined
                if (headerValue !== undefined) {
                  headersObj[key] = headerValue;
                }
              }
            }
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
