import http from 'node:http'
import express from 'express'
import cors from 'cors'
import { Server } from 'socket.io'

const ROOM_PREFIX = 'blueprints.'
const MAX_ROOM_LENGTH = 200

const isRoom = (room) =>
  typeof room === 'string' && room.startsWith(ROOM_PREFIX) && room.length <= MAX_ROOM_LENGTH
const isText = (v) => typeof v === 'string' && v.trim().length > 0
const isPoint = (p) => Number.isFinite(p?.x) && Number.isFinite(p?.y)
// El ack es opcional: el cliente del lab emite sin callback.
const replier = (ack) => (typeof ack === 'function' ? ack : () => {})

/** Devuelve el motivo por el que un draw-event es inválido, o null si es válido. */
export function drawEventError(evt) {
  if (!evt || typeof evt !== 'object') return 'payload inválido'
  if (!isRoom(evt.room)) return 'room inválida'
  if (!isText(evt.author) || !isText(evt.name)) return 'author y name son obligatorios'
  if (evt.room !== `${ROOM_PREFIX}${evt.author}.${evt.name}`) return 'room no corresponde al plano'
  if (!isPoint(evt.point)) return 'point debe ser { x, y } numérico'
  return null
}

/**
 * Servidor de tiempo real de Blueprints. Cada plano es una sala
 * `blueprints.{author}.{name}`; un punto dibujado se reenvía al resto de la sala.
 */
export function createRealtimeServer({ corsOrigins = '*', logger = console } = {}) {
  const app = express()
  app.use(cors({ origin: corsOrigins }))

  // CORS no aplica al handshake WebSocket: el origen se valida aquí. Los clientes
  // que no son navegadores (pruebas, curl) no envían Origin y se aceptan.
  const originAllowed = (origin) => corsOrigins === '*' || !origin || corsOrigins.includes(origin)

  const httpServer = http.createServer(app)
  const io = new Server(httpServer, {
    cors: { origin: corsOrigins },
    allowRequest: (req, callback) => {
      const allowed = originAllowed(req.headers.origin)
      if (!allowed) logger.warn(`[io] origen rechazado: ${req.headers.origin}`)
      callback(null, allowed)
    },
  })

  app.get('/health', (_req, res) => {
    res.json({ status: 'UP', clients: io.engine.clientsCount, uptime: process.uptime() })
  })

  io.on('connection', (socket) => {
    logger.info(`[io] connect ${socket.id} (clientes: ${io.engine.clientsCount})`)

    socket.on('join-room', (room, ack) => {
      const reply = replier(ack)
      if (!isRoom(room)) {
        logger.warn(`[io] join-room rechazado ${socket.id}: room inválida`)
        return reply({ ok: false, error: 'room inválida' })
      }
      socket.join(room)
      logger.info(`[io] join-room ${socket.id} -> ${room}`)
      reply({ ok: true })
    })

    socket.on('draw-event', (evt, ack) => {
      const reply = replier(ack)
      // Solo se puede dibujar en una sala a la que el socket se unió (aislamiento por plano).
      const error =
        drawEventError(evt) || (socket.rooms.has(evt.room) ? null : 'no estás en la sala')
      if (error) {
        logger.warn(`[io] draw-event rechazado ${socket.id}: ${error}`)
        return reply({ ok: false, error })
      }
      const { room, author, name, point } = evt
      const update = { author, name, points: [{ x: point.x, y: point.y }] }
      socket.to(room).emit('blueprint-update', update)
      logger.info(`[io] draw-event ${socket.id} -> ${room} (${point.x}, ${point.y})`)
      reply({ ok: true })
    })

    socket.on('disconnect', (reason) => {
      logger.info(`[io] disconnect ${socket.id}: ${reason}`)
    })
  })

  return { app, httpServer, io }
}
