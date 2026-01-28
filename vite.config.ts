import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Use relative base so built `index.html` loads assets relative to file location
  base: './',
  plugins: [react()],
  server: {
    port: 5173
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  },
  define: {
    'process.env.VITE_DEV_SERVER_URL': JSON.stringify(process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173')
  }
});
