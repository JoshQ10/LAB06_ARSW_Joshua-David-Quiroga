import { createRealtimeServer } from './src/realtimeServer.js'

const PORT = process.env.PORT || 3001
// Orígenes permitidos (separados por coma). En producción, solo el dominio del front.
const corsOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:4173')
  .split(',')
  .map((o) => o.trim())

const { httpServer } = createRealtimeServer({ corsOrigins })

httpServer.listen(PORT, () => {
  console.info(`Socket.IO up on :${PORT} (orígenes: ${corsOrigins.join(', ')})`)
})
