import { io } from 'socket.io-client'
import { Client } from '@stomp/stompjs'
import { connectRealtime, isPoint, roomOf } from '../src/lib/realtime.js'
import { brokerUrlOf, topicOf } from '../src/lib/stompClient.js'

// Dobles de las librerías de transporte: registran lo emitido y permiten simular eventos del servidor.
vi.mock('socket.io-client', () => ({ io: vi.fn() }))
vi.mock('@stomp/stompjs', () => ({ Client: vi.fn() }))

function fakeSocket() {
  const handlers = {}
  return {
    id: 'sock-1',
    connected: false,
    on: vi.fn((event, fn) => (handlers[event] = fn)),
    off: vi.fn(),
    emit: vi.fn(),
    disconnect: vi.fn(),
    trigger: (event, ...args) => handlers[event]?.(...args),
  }
}

function fakeStompClient() {
  return {
    connected: false,
    activate: vi.fn(),
    deactivate: vi.fn(),
    publish: vi.fn(),
    subscribe: vi.fn(),
  }
}

const options = () => ({ author: 'john', name: 'house', onUpdate: vi.fn(), onStatus: vi.fn() })

describe('convenciones de canal', () => {
  it('un plano es una sala / tópico blueprints.{author}.{name}', () => {
    expect(roomOf('john', 'house')).toBe('blueprints.john.house')
    expect(topicOf('john', 'house')).toBe('/topic/blueprints.john.house')
  })

  it('el broker STOMP se alcanza por WebSocket en /ws-blueprints', () => {
    expect(brokerUrlOf('http://localhost:8081')).toBe('ws://localhost:8081/ws-blueprints')
    expect(brokerUrlOf('https://rt.example.com/')).toBe('wss://rt.example.com/ws-blueprints')
  })

  it('isPoint exige coordenadas numéricas', () => {
    expect(isPoint({ x: 1, y: 2 })).toBe(true)
    expect(isPoint({ x: '1', y: 2 })).toBe(false)
    expect(isPoint(null)).toBe(false)
  })

  it('rechaza tecnologías desconocidas', () => {
    expect(() => connectRealtime('none', options())).toThrow(/desconocida/)
  })
})

describe('Socket.IO', () => {
  let socket
  beforeEach(() => {
    socket = fakeSocket()
    io.mockReturnValue(socket)
  })

  it('se conecta por WebSocket y se une a la sala del plano en cada (re)conexión', () => {
    const opts = options()
    connectRealtime('socketio', opts)
    expect(io).toHaveBeenCalledWith('http://localhost:3001', { transports: ['websocket'] })

    socket.trigger('connect')
    socket.trigger('disconnect', 'transport close')
    socket.trigger('connect')

    expect(socket.emit.mock.calls).toEqual([
      ['join-room', 'blueprints.john.house'],
      ['join-room', 'blueprints.john.house'],
    ])
    expect(opts.onStatus.mock.calls.flat()).toEqual(['connected', 'disconnected', 'connected'])
  })

  it('envía draw-event solo si está conectado y no espera eco del servidor', () => {
    const conn = connectRealtime('socketio', options())
    expect(conn.echoesSender).toBe(false)
    expect(conn.sendPoint({ x: 1, y: 2 })).toBe(false)

    socket.connected = true
    expect(conn.sendPoint({ x: 1, y: 2 })).toBe(true)
    expect(socket.emit).toHaveBeenCalledWith('draw-event', {
      room: 'blueprints.john.house',
      author: 'john',
      name: 'house',
      point: { x: 1, y: 2 },
    })
  })

  it('entrega blueprint-update y libera el socket al cerrar', () => {
    const opts = options()
    const conn = connectRealtime('socketio', opts)
    const upd = { author: 'john', name: 'house', points: [{ x: 5, y: 5 }] }

    socket.trigger('blueprint-update', upd)
    expect(opts.onUpdate).toHaveBeenCalledWith(upd)

    conn.close()
    expect(socket.off).toHaveBeenCalled()
    expect(socket.disconnect).toHaveBeenCalled()
  })
})

describe('STOMP', () => {
  let client
  beforeEach(() => {
    client = fakeStompClient()
    Client.mockImplementation(() => client)
  })

  it('activa el cliente y se suscribe al tópico del plano al conectar', () => {
    const opts = options()
    connectRealtime('stomp', opts)
    expect(Client).toHaveBeenCalledWith(
      expect.objectContaining({ brokerURL: 'ws://localhost:8081/ws-blueprints' }),
    )
    expect(client.activate).toHaveBeenCalled()

    client.onConnect()
    expect(client.subscribe).toHaveBeenCalledWith(
      '/topic/blueprints.john.house',
      expect.any(Function),
    )
    expect(opts.onStatus).toHaveBeenCalledWith('connected')

    // El mensaje del tópico llega como JSON
    const onMessage = client.subscribe.mock.calls[0][1]
    onMessage({ body: JSON.stringify({ author: 'john', name: 'house', points: [{ x: 3, y: 4 }] }) })
    expect(opts.onUpdate).toHaveBeenCalledWith({
      author: 'john',
      name: 'house',
      points: [{ x: 3, y: 4 }],
    })
  })

  it('publica en /app/draw solo si está conectado; el broker hace eco al emisor', () => {
    const conn = connectRealtime('stomp', options())
    expect(conn.echoesSender).toBe(true)
    expect(conn.sendPoint({ x: 1, y: 2 })).toBe(false)

    client.connected = true
    expect(conn.sendPoint({ x: 1, y: 2 })).toBe(true)
    expect(client.publish).toHaveBeenCalledWith({
      destination: '/app/draw',
      body: JSON.stringify({ author: 'john', name: 'house', point: { x: 1, y: 2 } }),
    })
  })

  it('avisa la caída del WebSocket, pero no tras cerrar a propósito', () => {
    const opts = options()
    const conn = connectRealtime('stomp', opts)

    client.onWebSocketClose()
    expect(opts.onStatus).toHaveBeenLastCalledWith('disconnected')

    opts.onStatus.mockClear()
    conn.close()
    client.onWebSocketClose()
    expect(client.deactivate).toHaveBeenCalled()
    expect(opts.onStatus).not.toHaveBeenCalled()
  })
})
