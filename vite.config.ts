import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: { outDir: 'dist' },
  server: { port: 5173 },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './vitest.setup.ts',
    exclude: ['node_modules', 'dist', '.git', 'tests/e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov']
    }
  }
});
