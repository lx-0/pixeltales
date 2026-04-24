/// <reference types="vitest" />
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
  // Vitest config — co-located here so vite plugins (react, tailwindcss) +
  // resolve aliases apply identically to test runs and the dev/prod build.
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'dist', 'tests-e2e'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      // Report on every source file, not just transitively imported ones.
      // Without this the report only shows files the (currently tiny) test
      // suite happens to touch — a misleading view of what's covered.
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/api/types.gen.ts',
        'src/test/**',
        'src/**/*.test.{ts,tsx}',
        'src/**/*.spec.{ts,tsx}',
        // Phaser scenes need a real GL context; skip until we have a Phaser
        // mock in the test setup.
        'src/game/**',
        '**/*.config.*',
        '**/main.tsx',
      ],
      // First-pass floor — set after the E15 hooks/components test pass
      // brought coverage from ~1% to ~16%. Ratchet up as the suite grows;
      // ratchet down never. Trips CI if a regression drops coverage below.
      thresholds: {
        statements: 15,
        branches: 9,
        functions: 8,
        lines: 15,
      },
    },
  },
});
