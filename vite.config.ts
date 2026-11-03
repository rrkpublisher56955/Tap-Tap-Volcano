import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    assetsInlineLimit: 4096,
    cssCodeSplit: true,
    target: 'es2022',
  },
  server: {
    host: '0.0.0.0',
  },
});
