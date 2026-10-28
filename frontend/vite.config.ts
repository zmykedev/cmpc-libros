/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const API = process.env.VITE_PROXY_TARGET ?? 'http://localhost:3000';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: { '/api': API, '/uploads': API },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/setupTests.ts',
    coverage: {
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/main.tsx', 'src/**/*.test.{ts,tsx}', 'src/setupTests.ts', 'src/vite-env.d.ts'],
      thresholds: { lines: 80, statements: 80, functions: 80, branches: 70 },
    },
  },
});
