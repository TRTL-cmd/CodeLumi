import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  // Use relative base so built `index.html` loads assets relative to file location
  base: './',
  plugins: [
    react({
      // Use classic JSX runtime so compiled JSX calls React.createElement()
      // instead of importing from react/jsx-runtime (which would bundle a second React)
      jsxRuntime: 'classic'
    })
  ],
  resolve: {
    alias: {
      // Point React imports to our shims that re-export from window.React/ReactDOM
      // (loaded via CDN <script> tags in index.html). This prevents Vite from
      // bundling its own copy of React, which causes dual-instance hook crashes.
      'react': path.resolve(__dirname, 'src/shims/react.js'),
      'react-dom': path.resolve(__dirname, 'src/shims/react-dom.js')
    }
  },
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
