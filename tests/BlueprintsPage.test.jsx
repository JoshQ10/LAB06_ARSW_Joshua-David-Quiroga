import { screen, fireEvent, within, waitFor } from '@testing-library/react'
import BlueprintsPage from '../src/pages/BlueprintsPage.jsx'
import { authenticated, renderWithProviders } from './utils.jsx'

const search = (author) => {
  fireEvent.change(screen.getByPlaceholderText(/Author/i), { target: { value: author } })
  fireEvent.click(screen.getByRole('button', { name: /Get blueprints/i }))
}

describe('BlueprintsPage', () => {
  it('despacha fetchByAuthor al hacer click en Get blueprints', async () => {
    const { store, blueprintsService } = renderWithProviders(<BlueprintsPage />)
    const dispatchSpy = vi.spyOn(store, 'dispatch')
    const getByAuthor = vi.spyOn(blueprintsService, 'getByAuthor')

    search('john')

    // El thunk despachado emite blueprints/fetchByAuthor/pending con el autor como argumento.
    expect(store.getState().blueprints.selectedAuthor).toBe('john')
    expect(dispatchSpy).toHaveBeenCalledWith(expect.any(Function))
    expect(getByAuthor).toHaveBeenCalledWith('john')
    await screen.findByRole('table')
  })

  it('lista los planos del autor en una tabla con nombre, puntos y Open', async () => {
    renderWithProviders(<BlueprintsPage />)
    search('john')

    const table = await screen.findByRole('table')
    const headers = within(table)
      .getAllByRole('columnheader')
      .map((th) => th.textContent)
    expect(headers).toEqual(['Blueprint name', 'Number of points', 'Acciones'])

    const rows = within(table).getAllByRole('row').slice(1)
    expect(rows).toHaveLength(3)
    expect(within(rows[0]).getByText('garage')).toBeInTheDocument()
    expect(within(rows[0]).getByText('4')).toBeInTheDocument()
    expect(within(rows[0]).getByRole('button', { name: /Open/ })).toBeInTheDocument()

    expect(screen.getByText("john's blueprints:")).toBeInTheDocument()
    expect(screen.getByTestId('total-points')).toHaveTextContent('18') // 4 + 6 + 8
  })

  it('Open actualiza el nombre del plano actual (estado global) y lo grafica', async () => {
    const { store } = renderWithProviders(<BlueprintsPage />)
    search('jane')
    fireEvent.click(await screen.findByRole('button', { name: 'Open garden' }))

    await waitFor(() => expect(screen.getByLabelText('Current blueprint')).toHaveValue('garden'))
    expect(store.getState().blueprints.current.name).toBe('garden')
    expect(screen.getByRole('img')).toHaveAccessibleName('garden: 5 puntos')
  })

  it('muestra "Sin resultados" si el autor no tiene planos', async () => {
    renderWithProviders(<BlueprintsPage />)
    search('nadie')
    expect(await screen.findByText('Sin resultados.')).toBeInTheDocument()
  })

  it('si el GET falla muestra un banner y Reintentar vuelve a disparar el thunk', async () => {
    const getByAuthor = vi
      .fn()
      .mockRejectedValueOnce(Object.assign(new Error('boom'), { request: {} }))
      .mockResolvedValueOnce([{ author: 'ana', name: 'plano', points: [{ x: 1, y: 1 }] }])
    renderWithProviders(<BlueprintsPage />, {
      services: { blueprintsService: { getByAuthor } },
    })

    search('ana')
    expect(await screen.findByRole('alert')).toHaveTextContent(/No se pudo conectar/)

    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    const table = await screen.findByRole('table')
    expect(within(table).getByText('plano')).toBeInTheDocument()
    expect(getByAuthor).toHaveBeenCalledTimes(2)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('solo muestra Editar/Eliminar con sesión iniciada', async () => {
    const current = { author: 'john', name: 'house', points: [{ x: 1, y: 1 }] }
    const { unmount } = renderWithProviders(<BlueprintsPage />, { blueprints: { current } })
    expect(screen.queryByRole('button', { name: 'Eliminar' })).not.toBeInTheDocument()
    unmount()

    renderWithProviders(<BlueprintsPage />, { blueprints: { current }, auth: authenticated() })
    expect(screen.getByRole('button', { name: 'Eliminar' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Editar' })).toHaveAttribute(
      'href',
      '/blueprints/john/house/edit',
    )
  })
})
