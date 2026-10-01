import { createSocket } from './socketIoClient.js'
import { createStompClient, subscribeBlueprint } from './stompClient.js'

export const REALTIME_TECHS = [
  { value: 'none', label: 'None' },
  { value: 'socketio', label: 'Socket.IO' },
  { value: 'stomp', label: 'STOMP' },
]

const IO_BASE = import.meta.env.VITE_IO_BASE || 'http://localhost:3001'
// El 8080 lo ocupa la API CRUD del Lab 4: el backend STOMP corre en el 8081.
const STOMP_BASE = import.meta.env.VITE_STOMP_BASE || 'http://localhost:8081'

/** Un plano es un canal: sala de Socket.IO y sufijo del tópico STOMP. */
export const roomOf = (author, name) => `blueprints.${author}.${name}`

export const isPoint = (p) => Number.isFinite(p?.x) && Number.isFinite(p?.y)

const log = (tech, ...args) => {
  if (import.meta.env.MODE !== 'test') console.info(`[rt:${tech}]`, ...args)
}

/*
 * Ambos adaptadores exponen la misma interfaz:
 *   sendPoint(point) -> true si el punto salió por el canal
 *   close()          -> libera la conexión
 *   echoesSender     -> true si el servidor le devuelve al emisor su propio punto
 * y avisan con onUpdate({ author, name, points }) y onStatus('connected' | 'disconnected').
 */

function connectSocketIo({ author, name, onUpdate, onStatus }) {
  const room = roomOf(author, name)
  const socket = createSocket(IO_BASE)

  // 'connect' también se dispara al reconectar: el servidor olvida las salas, hay que volver a unirse.
  socket.on('connect', () => {
    socket.emit('join-room', room)
    log('socketio', `conectado (${socket.id}), join-room ${room}`)
    onStatus('connected')
  })
  socket.on('disconnect', (reason) => {
    log('socketio', `desconectado: ${reason}`)
    onStatus('disconnected')
  })
  socket.on('connect_error', (err) => {
    log('socketio', `error de conexión: ${err.message}`)
    onStatus('disconnected')
  })
  socket.on('blueprint-update', (upd) => {
    log('socketio', 'blueprint-update', upd)
    onUpdate(upd)
  })

  return {
    // socket.to(room) excluye al emisor: el punto propio se pinta localmente.
    echoesSender: false,
    sendPoint(point) {
      if (!socket.connected) return false
      socket.emit('draw-event', { room, author, name, point })
      return true
    },
    close() {
      socket.off()
      socket.disconnect()
    },
  }
}

function connectStomp({ author, name, onUpdate, onStatus }) {
  const client = createStompClient(STOMP_BASE)
  let closed = false

  // onConnect también corre en cada reconexión: se vuelve a suscribir al tópico.
  client.onConnect = () => {
    subscribeBlueprint(client, author, name, (upd) => {
      log('stomp', 'update', upd)
      onUpdate(upd)
    })
    log('stomp', `conectado, suscrito a /topic/${roomOf(author, name)}`)
    onStatus('connected')
  }
  client.onWebSocketClose = () => {
    if (closed) return
    log('stomp', 'conexión cerrada, reintentando…')
    onStatus('disconnected')
  }
  client.onStompError = (frame) => log('stomp', `error: ${frame.headers?.message}`)
  client.activate()

  return {
    // El broker publica en el tópico a todos los suscriptores, incluido el emisor.
    echoesSender: true,
    sendPoint(point) {
      if (!client.connected) return false
      client.publish({ destination: '/app/draw', body: JSON.stringify({ author, name, point }) })
      return true
    },
    close() {
      closed = true
      client.deactivate()
    },
  }
}

const CONNECTORS = { socketio: connectSocketIo, stomp: connectStomp }

/** Abre el canal de tiempo real de un plano con la tecnología elegida. */
export function connectRealtime(tech, options) {
  const connect = CONNECTORS[tech]
  if (!connect) throw new Error(`Tecnología de tiempo real desconocida: ${tech}`)
  return connect(options)
}
