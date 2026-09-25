import { useState } from 'react'

/** Botón de eliminar con confirmación en dos pasos (sin window.confirm). */
export default function DeleteButton({ onConfirm, label = 'Eliminar', disabled = false }) {
  const [confirming, setConfirming] = useState(false)

  if (!confirming) {
    return (
      <button
        type="button"
        className="btn danger"
        onClick={() => setConfirming(true)}
        disabled={disabled}
      >
        {label}
      </button>
    )
  }
  return (
    <span className="confirm">
      <span className="muted">¿Seguro?</span>
      <button
        type="button"
        className="btn danger"
        onClick={() => {
          setConfirming(false)
          onConfirm()
        }}
      >
        Sí, eliminar
      </button>
      <button type="button" className="btn ghost" onClick={() => setConfirming(false)}>
        Cancelar
      </button>
    </span>
  )
}
