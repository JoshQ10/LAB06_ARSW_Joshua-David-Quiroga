import { REALTIME_TECHS } from '../lib/realtime.js'

const STATUS_LABELS = {
  off: 'Sin tiempo real',
  idle: 'Abre un plano para conectar',
  connecting: 'Conectando…',
  connected: 'Conectado',
  disconnected: 'Sin conexión, reintentando…',
}

/** Selector de tecnología de tiempo real (None / Socket.IO / STOMP) con el estado del canal. */
export default function RealtimeSelector({ tech, onChange, status }) {
  return (
    <div className="rt-selector">
      <label htmlFor="rt-tech">Tiempo real</label>
      <select
        id="rt-tech"
        className="input"
        value={tech}
        onChange={(e) => onChange(e.target.value)}
      >
        {REALTIME_TECHS.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </select>
      <span className={`rt-status ${status}`} role="status" data-testid="rt-status">
        {STATUS_LABELS[status]}
      </span>
    </div>
  )
}
