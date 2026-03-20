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
      mathbox: 'mathbox/build/esm/index.js',
      'mathbox/mathbox.css': 'mathbox/build/mathbox.css'
    }
  },
  optimizeDeps: {
    include: ['mathbox', 'three', 'threestrap'],
  }
});