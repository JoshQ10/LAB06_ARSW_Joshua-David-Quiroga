import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.js',
    include: ['tests/**/*.test.{js,jsx}'],
    // Valores por defecto para las pruebas (se pueden sobreescribir con vi.stubEnv)
    env: {
      VITE_USE_MOCK: 'true',
      VITE_API_BASE_URL: '/api/v1',
      VITE_AUTH_URL: '/auth/login',
    },
  },
})
