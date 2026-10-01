import { io } from 'socket.io-client'

/** Crea el socket forzando WebSocket (sin long-polling); reconecta solo. */
export function createSocket(baseUrl) {
  return io(baseUrl, { transports: ['websocket'] })
}
