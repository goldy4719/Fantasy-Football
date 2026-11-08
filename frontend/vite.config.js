import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Forward /api/* to the Flask backend so the browser never needs CORS or a hardcoded URL.
export default defineConfig({
  plugins: [react()],
  server: { proxy: { '/api': 'http://localhost:5001' } },
})
