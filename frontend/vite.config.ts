import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Emit hashed bundles under /app-assets/ (not the default /assets/) so the
  // dashboard's assets never collide with the public website's /assets/ when
  // Caddy serves both apps from the same domain (path-split). Caddy routes
  // /app-assets/* to this frontend container; the website keeps /assets/*.
  build: {
    assetsDir: 'app-assets',
  },
  server: {
    port: 5173,
    host: true,
  },
})
