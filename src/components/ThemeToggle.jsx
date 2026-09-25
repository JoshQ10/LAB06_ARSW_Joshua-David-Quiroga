import { useEffect, useState } from 'react'

const KEY = 'theme'

function initialTheme() {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved === 'light' || saved === 'dark') return saved
  } catch {
    /* sin almacenamiento */
  }
  return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

/** Alterna entre modo claro y oscuro (se recuerda en localStorage). */
export default function ThemeToggle() {
  const [theme, setTheme] = useState(initialTheme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try {
      localStorage.setItem(KEY, theme)
    } catch {
      /* noop */
    }
  }, [theme])

  const next = theme === 'dark' ? 'light' : 'dark'
  return (
    <button
      type="button"
      className="btn ghost small"
      onClick={() => setTheme(next)}
      aria-label={`Cambiar a modo ${next === 'dark' ? 'oscuro' : 'claro'}`}
      title={`Modo ${next === 'dark' ? 'oscuro' : 'claro'}`}
    >
      {theme === 'dark' ? '☀' : '☾'}
    </button>
  )
}
