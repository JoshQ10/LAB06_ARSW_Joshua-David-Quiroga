import '@testing-library/jest-dom'
import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

// ---- Canvas mock para jsdom ----
// jsdom define getContext pero no lo implementa (devuelve null y registra un
// error), por eso se reemplaza siempre por un contexto 2D con funciones espía.
export function createContextMock() {
  const fn = () => vi.fn()
  return {
    canvas: {},
    fillRect: fn(),
    clearRect: fn(),
    beginPath: fn(),
    moveTo: fn(),
    lineTo: fn(),
    stroke: fn(),
    arc: fn(),
    fill: fn(),
    strokeRect: fn(),
    closePath: fn(),
    save: fn(),
    restore: fn(),
    setTransform: fn(),
    translate: fn(),
    scale: fn(),
    rotate: fn(),
    transform: fn(),
    drawImage: fn(),
    fillText: fn(),
    measureText: vi.fn(() => ({ width: 0 })),
    putImageData: fn(),
    createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    createPattern: vi.fn(() => ({})),
    createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    getImageData: vi.fn(() => ({})),
    getLineDash: vi.fn(() => []),
    setLineDash: fn(),
  }
}

HTMLCanvasElement.prototype.getContext = function getContext() {
  return createContextMock()
}

afterEach(() => {
  cleanup()
  localStorage.clear()
})
