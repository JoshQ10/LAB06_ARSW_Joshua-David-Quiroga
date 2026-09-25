import { useState } from 'react'
import BlueprintCanvas from './BlueprintCanvas.jsx'

/**
 * Formulario de creación/edición. Los puntos se agregan haciendo clic en el lienzo.
 * En modo edición (`lockIdentity`) autor y nombre no se pueden cambiar.
 */
export default function BlueprintForm({
  initialValues = { author: '', name: '', points: [] },
  onSubmit,
  submitting = false,
  lockIdentity = false,
  title = 'Crear Blueprint',
  submitLabel = 'Guardar',
}) {
  const [author, setAuthor] = useState(initialValues.author || '')
  const [name, setName] = useState(initialValues.name || '')
  const [points, setPoints] = useState(initialValues.points || [])
  const [error, setError] = useState(null)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!author.trim() || !name.trim()) {
      setError('Autor y nombre son obligatorios.')
      return
    }
    if (!points.length) {
      setError('Haz clic en el lienzo para agregar al menos un punto.')
      return
    }
    setError(null)
    onSubmit({ author: author.trim(), name: name.trim(), points })
  }

  const addPoint = (p) => {
    setPoints((prev) => [...prev, p])
    setError(null)
  }

  return (
    <form onSubmit={handleSubmit} className="card stack" noValidate>
      <h2 className="card-title">{title}</h2>
      <div className="grid cols-2">
        <div className="field">
          <label htmlFor="bp-author">Autor</label>
          <input
            id="bp-author"
            className="input"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="john"
            disabled={lockIdentity}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="bp-name">Nombre</label>
          <input
            id="bp-name"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="mi-dibujo"
            disabled={lockIdentity}
            required
          />
        </div>
      </div>

      <div className="field">
        <span className="label">
          Puntos ({points.length}) — haz clic en el lienzo para agregarlos
        </span>
        <BlueprintCanvas
          id="blueprint-editor-canvas"
          title={name || 'Nuevo blueprint'}
          points={points}
          onAddPoint={addPoint}
        />
      </div>

      <div className="toolbar">
        <button
          type="button"
          className="btn"
          onClick={() => setPoints((prev) => prev.slice(0, -1))}
          disabled={!points.length}
        >
          Deshacer
        </button>
        <button
          type="button"
          className="btn"
          onClick={() => setPoints([])}
          disabled={!points.length}
        >
          Limpiar
        </button>
        <span className="spacer" />
        <button type="submit" className="btn primary" disabled={submitting}>
          {submitting ? 'Guardando…' : submitLabel}
        </button>
      </div>

      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
    </form>
  )
}
