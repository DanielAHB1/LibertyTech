import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000', //cambiar a 3000 si backend .env usa otro port
        changeOrigin: true,
        secure: false,
      },
    },
  },
});