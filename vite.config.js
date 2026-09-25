import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // El backend de los Labs 3/4 no expone CORS: en desarrollo las peticiones
  // a /api y /auth pasan por este proxy y el navegador las ve como mismo origen.
  const target = env.VITE_BACKEND_URL || 'http://localhost:8080'
  const proxy = {
    '/api': { target, changeOrigin: true },
    '/auth': { target, changeOrigin: true },
  }

  return {
    plugins: [react()],
    server: { port: 5173, proxy },
    preview: { port: 4173, proxy },
  }
})
