import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // 'base: "./"' is crucial for GitHub Pages deployment (subdirectory support)
  base: './',
  build: {
    outDir: 'dist',
    sourcemap: false
  },
  server: {
    host: true
  }
});