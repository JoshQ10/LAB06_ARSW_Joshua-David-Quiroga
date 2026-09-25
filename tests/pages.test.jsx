import { screen, fireEvent, waitFor } from '@testing-library/react'
import { Route, Routes } from 'react-router-dom'
import BlueprintDetailPage from '../src/pages/BlueprintDetailPage.jsx'
import CreateBlueprintPage from '../src/pages/CreateBlueprintPage.jsx'
import EditBlueprintPage from '../src/pages/EditBlueprintPage.jsx'
import ErrorBanner from '../src/components/ErrorBanner.jsx'
import { authenticated, renderWithProviders } from './utils.jsx'

function Pages() {
  return (
    <Routes>
      <Route path="/" element={<p>Inicio</p>} />
      <Route path="/blueprints/new" element={<CreateBlueprintPage />} />
      <Route path="/blueprints/:author/:name" element={<BlueprintDetailPage />} />
      <Route path="/blueprints/:author/:name/edit" element={<EditBlueprintPage />} />
    </Routes>
  )
}

describe('BlueprintDetailPage', () => {
  it('carga el plano de la URL y lo dibuja en el canvas (no svg)', async () => {
    const { container } = renderWithProviders(<Pages />, { route: '/blueprints/john/house' })
    expect(await screen.findByRole('heading', { name: 'house' })).toBeInTheDocument()
    expect(container.querySelector('svg')).toBeNull()
    expect(screen.getByRole('img')).toHaveAccessibleName('house: 6 puntos')
  })

  it('muestra error con Reintentar si no existe', async () => {
    renderWithProviders(<Pages />, { route: '/blueprints/john/nope' })
    expect(await screen.findByRole('alert')).toHaveTextContent(/not found/i)
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
  })

  it('eliminar (con confirmación) quita el plano y vuelve al inicio', async () => {
    const { store } = renderWithProviders(<Pages />, {
      route: '/blueprints/john/house',
      auth: authenticated(),
    })
    fireEvent.click(await screen.findByRole('button', { name: 'Eliminar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Sí, eliminar' }))

    expect(await screen.findByText('Inicio')).toBeInTheDocument()
    await waitFor(() => expect(store.getState().blueprints.status.delete).toBe('succeeded'))
  })
})

describe('CreateBlueprintPage', () => {
  it('crea el plano dibujado y navega al inicio', async () => {
    const { store } = renderWithProviders(<Pages />, {
      route: '/blueprints/new',
      auth: authenticated('student'),
    })
    // El autor se precarga con el usuario autenticado
    expect(screen.getByLabelText('Autor')).toHaveValue('student')
    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'cabana' } })
    fireEvent.click(screen.getByTestId('blueprint-canvas'), { clientX: 5, clientY: 5 })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))

    expect(await screen.findByText('Inicio')).toBeInTheDocument()
    expect(store.getState().blueprints.items['student/cabana'].points).toEqual([{ x: 5, y: 5 }])
  })

  it('muestra el error del backend si el plano ya existe', async () => {
    renderWithProviders(<Pages />, { route: '/blueprints/new', auth: authenticated('john') })
    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'house' } })
    fireEvent.click(screen.getByTestId('blueprint-canvas'), { clientX: 5, clientY: 5 })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/already exists/)
  })
})

describe('EditBlueprintPage', () => {
  it('agrega puntos y aplica la actualización de forma optimista', async () => {
    const { store } = renderWithProviders(<Pages />, {
      route: '/blueprints/jane/garden/edit',
      auth: authenticated(),
    })
    const canvas = await screen.findByTestId('blueprint-canvas')
    expect(screen.getByLabelText('Nombre')).toBeDisabled()

    fireEvent.click(canvas, { clientX: 7, clientY: 7 })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    // Inmediatamente (antes de que responda el servicio) el estado ya refleja el cambio
    expect(store.getState().blueprints.items['jane/garden'].points).toHaveLength(6)
    expect(store.getState().blueprints.selectedAuthor).toBe('jane')
    expect(await screen.findByText('Inicio')).toBeInTheDocument()
  })
})

describe('ErrorBanner', () => {
  it('no se renderiza sin mensaje', () => {
    const { container } = renderWithProviders(<ErrorBanner message={null} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('Reintentar invoca el callback', () => {
    const onRetry = vi.fn()
    renderWithProviders(<ErrorBanner message="Falló" onRetry={onRetry} />)
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})
