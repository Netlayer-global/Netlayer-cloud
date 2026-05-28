import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Public marketing site dev server runs on 5174 so it can run side-by-side
 * with the dashboard frontend (5173). Both proxy `/api` to the backend
 * on 5000 — a customer who hits /login on the website goes to the
 * dashboard's auth page, which is served by the dashboard at 5173 (or
 * the same domain in production where Caddy splits paths).
 */
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        ws: true,
      },
    },
  },
})
