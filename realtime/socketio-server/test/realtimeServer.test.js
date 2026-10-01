import { after, before, test } from 'node:test'
import assert from 'node:assert/strict'
import { io as connect } from 'socket.io-client'
import { createRealtimeServer, drawEventError } from '../src/realtimeServer.js'

const silent = { info() {}, warn() {} }
const ROOM = 'blueprints.john.house'
const drawing = (point = { x: 10, y: 20 }) => ({ room: ROOM, author: 'john', name: 'house', point })

let server
let url
const clients = []

before(async () => {
  server = createRealtimeServer({ logger: silent })
  await new Promise((resolve) => server.httpServer.listen(0, resolve))
  url = `http://localhost:${server.httpServer.address().port}`
})

after(() => {
  clients.forEach((c) => c.disconnect())
  server.io.close()
})

/** Cliente conectado y (opcionalmente) unido a una sala. */
async function client(room) {
  const socket = connect(url, { transports: ['websocket'] })
  clients.push(socket)
  await new Promise((resolve) => socket.on('connect', resolve))
  if (room) await socket.emitWithAck('join-room', room)
  return socket
}

const nextUpdate = (socket) => new Promise((resolve) => socket.once('blueprint-update', resolve))
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

test('draw-event se reenvía a los demás clientes de la sala, no al emisor', async () => {
  const [a, b] = await Promise.all([client(ROOM), client(ROOM)])
  let echoed = false
  a.on('blueprint-update', () => (echoed = true))

  const received = nextUpdate(b)
  const ack = await a.emitWithAck('draw-event', drawing())

  assert.deepEqual(ack, { ok: true })
  assert.deepEqual(await received, { author: 'john', name: 'house', points: [{ x: 10, y: 20 }] })
  await wait(50)
  assert.equal(echoed, false)
})

test('los planos están aislados: otra sala no recibe el punto', async () => {
  const [a, other] = await Promise.all([client(ROOM), client('blueprints.jane.garden')])
  let leaked = false
  other.on('blueprint-update', () => (leaked = true))

  await a.emitWithAck('draw-event', drawing())
  await wait(50)
  assert.equal(leaked, false)
})

test('rechaza dibujar en una sala a la que no se unió', async () => {
  const [intruder, member] = await Promise.all([client(), client(ROOM)])
  let received = false
  member.on('blueprint-update', () => (received = true))

  const ack = await intruder.emitWithAck('draw-event', drawing())
  await wait(50)
  assert.deepEqual(ack, { ok: false, error: 'no estás en la sala' })
  assert.equal(received, false)
})

test('rechaza salas y payloads inválidos', async () => {
  const a = await client(ROOM)
  assert.equal((await a.emitWithAck('join-room', 'otra-cosa')).ok, false)
  assert.equal((await a.emitWithAck('draw-event', drawing({ x: 'a', y: 1 }))).ok, false)
  assert.equal((await a.emitWithAck('draw-event', null)).ok, false)
})

test('drawEventError valida el payload', () => {
  assert.equal(drawEventError(drawing()), null)
  assert.match(drawEventError({ ...drawing(), room: 'blueprints.jane.garden' }), /no corresponde/)
  assert.match(drawEventError({ ...drawing(), author: '' }), /obligatorios/)
  assert.match(drawEventError({ ...drawing(), point: { x: 1 } }), /point/)
})

test('solo acepta conexiones de los orígenes permitidos', async () => {
  const restricted = createRealtimeServer({
    corsOrigins: ['http://localhost:5173'],
    logger: silent,
  })
  await new Promise((resolve) => restricted.httpServer.listen(0, resolve))
  const target = `http://localhost:${restricted.httpServer.address().port}`
  const from = (origin) =>
    new Promise((resolve) => {
      const socket = connect(target, {
        transports: ['websocket'],
        extraHeaders: { origin },
        reconnection: false,
      })
      clients.push(socket)
      socket.on('connect', () => resolve('connected'))
      socket.on('connect_error', () => resolve('rejected'))
    })

  assert.equal(await from('http://localhost:5173'), 'connected')
  assert.equal(await from('http://evil.example'), 'rejected')
  restricted.io.close()
})

test('GET /health responde UP', async () => {
  const res = await fetch(`${url}/health`)
  assert.equal(res.status, 200)
  assert.equal((await res.json()).status, 'UP')
})
