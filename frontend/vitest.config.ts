import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
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
      // No threshold gate yet — the current 5-test baseline only covers
      // format.ts (~1% overall). Setting a meaningful floor needs at
      // least a hooks/components test pass first. Coverage runs in CI
      // for visibility (HTML report uploaded as artifact); ratchet up a
      // floor here once tests grow.
    },
  },
});
