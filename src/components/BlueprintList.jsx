/** Tabla de planos de un autor: nombre, número de puntos y botón Open. */
export default function BlueprintList({ items = [], currentName, onOpen }) {
  if (!items.length) return <p className="muted">Sin resultados.</p>
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th scope="col">Blueprint name</th>
            <th scope="col" className="num">
              Number of points
            </th>
            <th scope="col">
              <span className="sr-only">Acciones</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((bp) => (
            <tr key={bp.name} className={bp.name === currentName ? 'is-active' : undefined}>
              <td>{bp.name}</td>
              <td className="num">{bp.points?.length || 0}</td>
              <td className="actions">
                <button
                  type="button"
                  className="btn small"
                  onClick={() => onOpen(bp)}
                  aria-label={`Open ${bp.name}`}
                >
                  Open
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
