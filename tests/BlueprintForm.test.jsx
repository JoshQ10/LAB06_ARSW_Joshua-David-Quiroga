import { render, screen, fireEvent } from '@testing-library/react'
import BlueprintForm from '../src/components/BlueprintForm.jsx'

const clickCanvas = (x, y) =>
  fireEvent.click(screen.getByTestId('blueprint-canvas'), { clientX: x, clientY: y })

describe('BlueprintForm', () => {
  it('envía el formulario con autor, nombre y los puntos dibujados', () => {
    const onSubmit = vi.fn()
    render(<BlueprintForm onSubmit={onSubmit} />)

    fireEvent.change(screen.getByLabelText(/Autor/i), { target: { value: 'john' } })
    fireEvent.change(screen.getByLabelText(/Nombre/i), { target: { value: 'house' } })
    clickCanvas(1, 2)
    clickCanvas(30, 40)
    fireEvent.click(screen.getByRole('button', { name: /Guardar/i }))

    expect(onSubmit).toHaveBeenCalledWith({
      author: 'john',
      name: 'house',
      points: [
        { x: 1, y: 2 },
        { x: 30, y: 40 },
      ],
    })
  })

  it('valida campos obligatorios y no envía', () => {
    const onSubmit = vi.fn()
    render(<BlueprintForm onSubmit={onSubmit} />)

    fireEvent.submit(screen.getByRole('button', { name: /Guardar/i }))

    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent(/obligatorios/i)
  })

  it('exige al menos un punto', () => {
    const onSubmit = vi.fn()
    render(<BlueprintForm onSubmit={onSubmit} />)
    fireEvent.change(screen.getByLabelText(/Autor/i), { target: { value: 'john' } })
    fireEvent.change(screen.getByLabelText(/Nombre/i), { target: { value: 'house' } })
    fireEvent.submit(screen.getByRole('button', { name: /Guardar/i }))

    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent(/al menos un punto/i)
  })

  it('Deshacer y Limpiar modifican los puntos', () => {
    render(<BlueprintForm onSubmit={vi.fn()} />)
    clickCanvas(1, 1)
    clickCanvas(2, 2)
    clickCanvas(3, 3)
    expect(screen.getByText(/Puntos \(3\)/)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Deshacer' }))
    expect(screen.getByText(/Puntos \(2\)/)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Limpiar' }))
    expect(screen.getByText(/Puntos \(0\)/)).toBeInTheDocument()
  })

  it('en modo edición bloquea autor/nombre y parte de los puntos existentes', () => {
    const onSubmit = vi.fn()
    render(
      <BlueprintForm
        lockIdentity
        initialValues={{ author: 'jane', name: 'garden', points: [{ x: 5, y: 5 }] }}
        onSubmit={onSubmit}
      />,
    )
    expect(screen.getByLabelText(/Autor/i)).toBeDisabled()
    expect(screen.getByLabelText(/Nombre/i)).toBeDisabled()

    clickCanvas(9, 9)
    fireEvent.click(screen.getByRole('button', { name: /Guardar/i }))
    expect(onSubmit).toHaveBeenCalledWith({
      author: 'jane',
      name: 'garden',
      points: [
        { x: 5, y: 5 },
        { x: 9, y: 9 },
      ],
    })
  })
})
