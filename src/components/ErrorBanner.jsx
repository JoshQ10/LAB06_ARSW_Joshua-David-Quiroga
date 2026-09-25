/** Banner de error con botón opcional para reintentar la operación fallida. */
export default function ErrorBanner({ message, onRetry, onDismiss, retrying = false }) {
  if (!message) return null
  return (
    <div className="banner error" role="alert">
      <span>{message}</span>
      <span className="banner-actions">
        {onRetry && (
          <button type="button" className="btn small" onClick={onRetry} disabled={retrying}>
            {retrying ? 'Reintentando…' : 'Reintentar'}
          </button>
        )}
        {onDismiss && (
          <button type="button" className="btn small ghost" onClick={onDismiss} aria-label="Cerrar">
            ✕
          </button>
        )}
      </span>
    </div>
  )
}
