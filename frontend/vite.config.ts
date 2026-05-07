import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command }) => ({
  optimizeDeps: {
    include: ["@pixi/interaction"]
  },
  plugins: [react()],
  ...(command === 'serve' && {
    server: {
      host: true,
      port: 5173,
      watch: {
        usePolling: true,
      },
      proxy: {
        '/ws': {
          target: 'ws://backend:8080',
          ws: true,
        },
        '/api': {
          target: 'http://backend:8080',
          changeOrigin: true,
        }
      }
    },
  }),
}))