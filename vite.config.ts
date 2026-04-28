import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: '/PhotoColors-Web/',
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  worker: {
    format: 'es',
  },
});
