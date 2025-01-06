import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    host: true,
    proxy: {
      '/socket.io': {
        target: process.env.DOCKER_ENV
          ? 'ws://backend:8000'
          : 'ws://localhost:8000',
        ws: true,
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/socket\.io/, '/socket.io'),
      },
      '/api': {
        target: process.env.DOCKER_ENV
          ? 'http://backend:8000'
          : 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
