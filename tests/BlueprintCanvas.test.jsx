import { render, screen, fireEvent } from '@testing-library/react'
import BlueprintCanvas, { computeTransform } from '../src/components/BlueprintCanvas.jsx'
import { createContextMock } from './setup.js'

const points = [
  { x: 10, y: 10 },
  { x: 150, y: 60 },
  { x: 300, y: 200 },
]

function renderWithContextSpy(ui) {
  const ctx = createContextMock()
  const spy = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(ctx)
  const result = render(ui)
  return { ...result, ctx, spy }
}

describe('BlueprintCanvas', () => {
  afterEach(() => vi.restoreAllMocks())

  it('renderiza un canvas de 520x360 con su propio id y pide el contexto 2d', () => {
    const { spy } = renderWithContextSpy(<BlueprintCanvas points={points} />)
    const canvas = screen.getByTestId('blueprint-canvas')

    expect(canvas).toBeInTheDocument()
    expect(canvas.tagName).toBe('CANVAS')
    expect(canvas).toHaveAttribute('id', 'blueprint-canvas')
    expect(canvas).toHaveAttribute('width', '520')
    expect(canvas).toHaveAttribute('height', '360')
    expect(spy).toHaveBeenCalledWith('2d')
  })

  it('dibuja los segmentos consecutivos y marca cada punto', () => {
    const { ctx } = renderWithContextSpy(<BlueprintCanvas points={points} />)

    // El trazo del plano arranca en el primer punto (el resto de moveTo es la cuadrícula).
    expect(ctx.moveTo).toHaveBeenCalledWith(10, 10)
    expect(ctx.lineTo).toHaveBeenCalledWith(150, 60)
    expect(ctx.lineTo).toHaveBeenCalledWith(300, 200)
    // Un círculo por punto
    expect(ctx.arc).toHaveBeenCalledTimes(points.length)
  })

  it('no dibuja segmentos ni marcas sin puntos', () => {
    const { ctx } = renderWithContextSpy(<BlueprintCanvas points={[]} />)
    expect(ctx.arc).not.toHaveBeenCalled()
    expect(screen.getByRole('img')).toHaveAccessibleName(/0 puntos/)
  })

  it('en modo interactivo agrega un punto al hacer clic', () => {
    const onAddPoint = vi.fn()
    render(<BlueprintCanvas points={[]} onAddPoint={onAddPoint} />)
    // jsdom reporta un bounding rect de 0x0 en (0,0): el clic se toma en coordenadas del lienzo.
    fireEvent.click(screen.getByTestId('blueprint-canvas'), { clientX: 42, clientY: 84 })
    expect(onAddPoint).toHaveBeenCalledWith({ x: 42, y: 84 })
  })

  it('sin onAddPoint el clic no hace nada', () => {
    render(<BlueprintCanvas points={points} />)
    const canvas = screen.getByTestId('blueprint-canvas')
    fireEvent.click(canvas, { clientX: 1, clientY: 1 })
    expect(canvas).not.toHaveClass('is-interactive')
  })
})

describe('computeTransform', () => {
  it('no escala puntos que ya caben en el lienzo', () => {
    expect(computeTransform(points, 520, 360)).toEqual({ scale: 1, offset: 0 })
  })

  it('amplía planos diminutos como el seed del Lab 4', () => {
    const { scale, offset } = computeTransform(
      [
        { x: 0, y: 0 },
        { x: 10, y: 10 },
      ],
      520,
      360,
    )
    expect(scale).toBeGreaterThan(10)
    expect(offset).toBeGreaterThan(0)
  })

  it('reduce planos que se salen del lienzo', () => {
    const { scale } = computeTransform([{ x: 2000, y: 100 }], 520, 360)
    expect(scale).toBeLessThan(1)
  })
})
