import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      fabric: 'fabric/dist/index.js',
      mathbox: 'mathbox/build/bundle/mathbox.js',
    }
  },
  optimizeDeps: {
    include: ['mathbox', 'three', 'threestrap'],
  }
});