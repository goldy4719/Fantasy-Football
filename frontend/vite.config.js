import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Forward /api/* to the Flask backend so the browser never needs CORS or a hardcoded URL.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.resolve(import.meta.dirname, '../backend'), '')
  const port = env.PORT || 5000

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': `http://localhost:${port}`,
      },
    },
  }
})


