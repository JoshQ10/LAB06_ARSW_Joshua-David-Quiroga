import { useEffect, useMemo, useRef } from 'react'

const PADDING = 24
const GRID = 40
const COLORS = {
  background: '#0c3b7a',
  grid: 'rgba(255,255,255,0.12)',
  line: '#e0f2fe',
  point: '#fbbf24',
  start: '#34d399',
}

/**
 * Calcula la transformación de coordenadas del plano al lienzo. Si los puntos
 * caben razonablemente se dibujan tal cual; si son diminutos (p. ej. el seed del
 * Lab 4, 0..15) o se salen del lienzo, se escalan manteniendo el origen.
 */
export function computeTransform(points, width, height) {
  if (!points.length) return { scale: 1, offset: 0 }
  const maxX = Math.max(...points.map((p) => p.x), 1)
  const maxY = Math.max(...points.map((p) => p.y), 1)
  const fits = maxX <= width && maxY <= height
  const tiny = maxX < width / 4 && maxY < height / 4
  if (fits && !tiny) return { scale: 1, offset: 0 }
  const scale = Math.min((width - 2 * PADDING) / maxX, (height - 2 * PADDING) / maxY)
  return { scale, offset: PADDING }
}

export default function BlueprintCanvas({
  id = 'blueprint-canvas',
  points = [],
  width = 520,
  height = 360,
  title = 'Blueprint',
  onAddPoint,
}) {
  const ref = useRef(null)
  const interactive = typeof onAddPoint === 'function'
  // En modo dibujo se usan coordenadas reales para que el clic coincida con el punto.
  const transform = useMemo(
    () => (interactive ? { scale: 1, offset: 0 } : computeTransform(points, width, height)),
    [interactive, points, width, height],
  )

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext('2d')
    if (!ctx) return
    const { scale, offset } = transform
    const toCanvas = (p) => ({ x: offset + p.x * scale, y: offset + p.y * scale })

    ctx.clearRect(0, 0, width, height)
    ctx.fillStyle = COLORS.background
    ctx.fillRect(0, 0, width, height)

    ctx.strokeStyle = COLORS.grid
    ctx.lineWidth = 1
    for (let x = 0; x <= width; x += GRID) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
      ctx.stroke()
    }
    for (let y = 0; y <= height; y += GRID) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    }

    const pts = points.map(toCanvas)

    // Segmentos consecutivos
    if (pts.length > 1) {
      ctx.strokeStyle = COLORS.line
      ctx.lineWidth = 2
      ctx.lineJoin = 'round'
      ctx.beginPath()
      ctx.moveTo(pts[0].x, pts[0].y)
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y)
      ctx.stroke()
    }

    // Marca de cada punto (el primero en verde para ver el sentido del trazo)
    pts.forEach((p, i) => {
      ctx.fillStyle = i === 0 ? COLORS.start : COLORS.point
      ctx.beginPath()
      ctx.arc(p.x, p.y, 4.5, 0, Math.PI * 2)
      ctx.fill()
    })
  }, [points, transform, width, height])

  const handleClick = (e) => {
    if (!interactive) return
    const canvas = ref.current
    const rect = canvas.getBoundingClientRect()
    // El canvas se escala con CSS: se convierte de píxeles de pantalla a píxeles del lienzo.
    const sx = width / (rect.width || width)
    const sy = height / (rect.height || height)
    const x = Math.round((e.clientX - rect.left) * sx)
    const y = Math.round((e.clientY - rect.top) * sy)
    onAddPoint({ x: Math.min(Math.max(x, 0), width), y: Math.min(Math.max(y, 0), height) })
  }

  return (
    <canvas
      id={id}
      ref={ref}
      width={width}
      height={height}
      className={`blueprint-canvas${interactive ? ' is-interactive' : ''}`}
      style={{ maxWidth: width }}
      role="img"
      aria-label={`${title}: ${points.length} puntos`}
      data-testid="blueprint-canvas"
      onClick={handleClick}
    />
  )
}
