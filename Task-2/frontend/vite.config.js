import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Конфигурация Vite для фронтенда TaskFlow.
 * Прокси перенаправляет запросы /api на backend (по умолчанию порт 4000),
 * что удобно во время локальной разработки.
 */
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
});
