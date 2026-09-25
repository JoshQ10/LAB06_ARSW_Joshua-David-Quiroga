import { useSelector } from 'react-redux'
import { selectTop5ByPoints } from '../features/blueprints/blueprintsSlice.js'

/** Top-5 de blueprints por cantidad de puntos (derivado con un selector memoizado). */
export default function TopBlueprints({ onOpen }) {
  const top = useSelector(selectTop5ByPoints)
  const max = top[0]?.points?.length || 1

  return (
    <div className="card">
      <h3 className="card-title">Top 5 por número de puntos</h3>
      {!top.length ? (
        <p className="muted">Aún no hay blueprints cargados.</p>
      ) : (
        <ol className="top-list">
          {top.map((bp) => {
            const n = bp.points?.length || 0
            return (
              <li key={`${bp.author}/${bp.name}`}>
                <button type="button" className="link-btn" onClick={() => onOpen(bp)}>
                  <span className="top-name">
                    {bp.name} <span className="muted">· {bp.author}</span>
                  </span>
                  <span className="top-count">{n}</span>
                </button>
                <span className="bar" style={{ width: `${(n / max) * 100}%` }} />
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}
