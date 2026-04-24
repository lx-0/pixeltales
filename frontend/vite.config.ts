import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    // Split the production bundle by dependency cluster so the largest
    // libs cache independently and parse in parallel. Without this
    // everything lands in one ~2.5 MB JS file. Function form catches
    // sub-paths (e.g. react-dom/client) that the array form misses.
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('node_modules/phaser')) return 'phaser';
          if (id.includes('node_modules/recharts')) return 'recharts';
          if (
            id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom/') ||
            id.includes('node_modules/scheduler/')
          ) {
            return 'react-vendor';
          }
          if (id.includes('node_modules/@tanstack/') || id.includes('node_modules/openapi-fetch')) {
            return 'query-vendor';
          }
          return 'vendor';
        },
      },
    },
  },
  server: {
    host: true,
    proxy: {
      '/socket.io': {
        target: process.env.DOCKER_ENV ? 'ws://backend:8000' : 'ws://localhost:8000',
        ws: true,
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/socket\.io/, '/socket.io'),
      },
      '/api': {
        target: process.env.DOCKER_ENV ? 'http://backend:8000' : 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
