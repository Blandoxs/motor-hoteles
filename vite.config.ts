import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    proxy: {
      '/amadeus': {
        target: 'https://test.api.amadeus.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/amadeus/, ''),
      }
    }
  }
})