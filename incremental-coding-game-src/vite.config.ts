import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: '../public/incremental-coding-game',
    emptyOutDir: true,
  },
  test: {
    globals: true,
    environment: 'jsdom',
  },
} as any);
