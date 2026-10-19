import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base を相対パスにして Vercel / GitHub Pages のどちらでも動くようにする
export default defineConfig({
  base: './',
  plugins: [react()],
});
