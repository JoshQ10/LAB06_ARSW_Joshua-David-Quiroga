import { act, screen, fireEvent, waitFor } from '@testing-library/react'
import BlueprintsPage from '../src/pages/BlueprintsPage.jsx'
import { connectRealtime } from '../src/lib/realtime.js'
import { authenticated, renderWithProviders } from './utils.jsx'

// Se reemplaza solo la conexión: la página, el hook y Redux son los reales.
vi.mock('../src/lib/realtime.js', async (importOriginal) => ({
  ...(await importOriginal()),
  connectRealtime: vi.fn(),
}))

const house = {
  author: 'john',
  name: 'house',
  points: [
    { x: 100, y: 100 },
    { x: 200, y: 150 },
  ],
}

/** Conexión falsa que guarda las opciones para simular mensajes y cambios de estado. */
function fakeConnection({ echoesSender = false, connected = true } = {}) {
  const conn = { echoesSender, sendPoint: vi.fn(() => connected), close: vi.fn(), options: null }
  connectRealtime.mockImplementation((_tech, options) => {
    conn.options = options
    return conn
  })
  return conn
}

const renderPage = (extra = {}) =>
  renderWithProviders(<BlueprintsPage />, {
    blueprints: { current: house, items: { 'john/house': house }, selectedAuthor: 'john' },
    auth: authenticated(),
    ...extra,
  })

const selectTech = (label) =>
  fireEvent.change(screen.getByLabelText('Tiempo real'), { target: { value: label } })
const clickCanvas = (x, y) =>
  fireEvent.click(screen.getByTestId('blueprint-canvas'), { clientX: x, clientY: y })
const pointsOf = (store) => store.getState().blueprints.current.points

describe('BlueprintsPage – tiempo real', () => {
  afterEach(() => vi.clearAllMocks())

  it('ofrece None / Socket.IO / STOMP y recuerda la elección', () => {
    fakeConnection()
    const { unmount } = renderPage()
    const select = screen.getByLabelText('Tiempo real')
    expect([...select.options].map((o) => o.textContent)).toEqual(['None', 'Socket.IO', 'STOMP'])
    expect(select).toHaveValue('none')
    expect(screen.getByTestId('rt-status')).toHaveTextContent('Sin tiempo real')
    expect(connectRealtime).not.toHaveBeenCalled()

    selectTech('stomp')
    unmount()
    renderPage()
    expect(screen.getByLabelText('Tiempo real')).toHaveValue('stomp')
  })

  it('con None el clic dibuja localmente y Guardar envía el plano (PUT)', async () => {
    const { store, blueprintsService } = renderPage()
    const update = vi.spyOn(blueprintsService, 'update')
    const saveButton = screen.getByRole('button', { name: 'Guardar' })
    expect(saveButton).toBeDisabled()

    clickCanvas(300, 250)
    expect(pointsOf(store)).toEqual([...house.points, { x: 300, y: 250 }])
    expect(screen.getByRole('img')).toHaveAccessibleName('house: 3 puntos')
    expect(screen.getByText(/Hay cambios sin guardar/)).toBeInTheDocument()

    fireEvent.click(saveButton)
    await waitFor(() => expect(store.getState().blueprints.status.update).toBe('succeeded'))
    expect(update).toHaveBeenCalledWith(
      'john',
      'house',
      expect.objectContaining({ points: [...house.points, { x: 300, y: 250 }] }),
    )
    // La tabla y el total del autor reflejan el plano guardado
    expect(screen.getByTestId('total-points')).toHaveTextContent('3')
    expect(saveButton).toBeDisabled()
  })

  it('abre el canal del plano con la tecnología elegida y lo cierra al cambiarla', () => {
    const conn = fakeConnection()
    renderPage()

    selectTech('socketio')
    expect(connectRealtime).toHaveBeenCalledWith(
      'socketio',
      expect.objectContaining({ author: 'john', name: 'house' }),
    )
    expect(screen.getByTestId('rt-status')).toHaveTextContent('Conectando…')

    act(() => conn.options.onStatus('connected'))
    expect(screen.getByTestId('rt-status')).toHaveTextContent('Conectado')

    selectTech('none')
    expect(conn.close).toHaveBeenCalled()
  })

  it('sin plano abierto no se conecta', () => {
    fakeConnection()
    renderWithProviders(<BlueprintsPage />)
    selectTech('socketio')
    expect(connectRealtime).not.toHaveBeenCalled()
    expect(screen.getByTestId('rt-status')).toHaveTextContent('Abre un plano')
  })

  it('Socket.IO: publica el punto y lo pinta de inmediato (el servidor no hace eco)', () => {
    const conn = fakeConnection()
    const { store } = renderPage()
    selectTech('socketio')

    clickCanvas(50, 60)
    expect(conn.sendPoint).toHaveBeenCalledWith({ x: 50, y: 60 })
    expect(pointsOf(store)).toHaveLength(3)
  })

  it('STOMP: el punto propio se pinta cuando vuelve del tópico, sin duplicarse', () => {
    const conn = fakeConnection({ echoesSender: true })
    const { store } = renderPage()
    selectTech('stomp')

    clickCanvas(50, 60)
    expect(conn.sendPoint).toHaveBeenCalledWith({ x: 50, y: 60 })
    expect(pointsOf(store)).toHaveLength(2)

    act(() => conn.options.onUpdate({ author: 'john', name: 'house', points: [{ x: 50, y: 60 }] }))
    expect(pointsOf(store)).toEqual([...house.points, { x: 50, y: 60 }])
  })

  it('si el canal está caído el punto se conserva localmente', () => {
    fakeConnection({ echoesSender: true, connected: false })
    const { store } = renderPage()
    selectTech('stomp')

    clickCanvas(50, 60)
    expect(pointsOf(store)).toHaveLength(3)
  })

  it('agrega los puntos de otros clientes e ignora otros planos y payloads inválidos', () => {
    const conn = fakeConnection()
    const { store } = renderPage()
    selectTech('socketio')

    act(() => {
      conn.options.onUpdate({ author: 'john', name: 'house', points: [{ x: 9, y: 9 }] })
      conn.options.onUpdate({ author: 'jane', name: 'garden', points: [{ x: 1, y: 1 }] })
      conn.options.onUpdate({ author: 'john', name: 'house', points: [{ x: 'a', y: 1 }] })
      conn.options.onUpdate({ author: 'john', name: 'house' })
    })

    expect(pointsOf(store)).toEqual([...house.points, { x: 9, y: 9 }])
    expect(screen.getByRole('img')).toHaveAccessibleName('house: 3 puntos')
  })

  it('sin sesión se reciben trazos pero no se puede dibujar ni guardar', () => {
    const conn = fakeConnection()
    const { store } = renderPage({ auth: undefined })
    selectTech('socketio')

    clickCanvas(50, 60)
    expect(conn.sendPoint).not.toHaveBeenCalled()
    expect(pointsOf(store)).toHaveLength(2)
    expect(screen.queryByRole('button', { name: 'Guardar' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Inicia sesión' })).toBeInTheDocument()

    act(() => conn.options.onUpdate({ author: 'john', name: 'house', points: [{ x: 9, y: 9 }] }))
    expect(pointsOf(store)).toHaveLength(3)
  })
})
