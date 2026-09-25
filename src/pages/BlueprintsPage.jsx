import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import {
  clearError,
  deleteBlueprint,
  fetchAllBlueprints,
  fetchBlueprint,
  fetchByAuthor,
  selectAuthors,
  selectCurrent,
  selectCurrentName,
  selectErrors,
  selectSelectedAuthor,
  selectSelectedAuthorBlueprints,
  selectSelectedAuthorTotalPoints,
  selectStatus,
} from '../features/blueprints/blueprintsSlice.js'
import { selectIsAuthenticated } from '../features/auth/authSlice.js'
import BlueprintCanvas from '../components/BlueprintCanvas.jsx'
import BlueprintList from '../components/BlueprintList.jsx'
import TopBlueprints from '../components/TopBlueprints.jsx'
import ErrorBanner from '../components/ErrorBanner.jsx'
import DeleteButton from '../components/DeleteButton.jsx'

export default function BlueprintsPage() {
  const dispatch = useDispatch()
  const selectedAuthor = useSelector(selectSelectedAuthor)
  const items = useSelector(selectSelectedAuthorBlueprints)
  const totalPoints = useSelector(selectSelectedAuthorTotalPoints)
  const authors = useSelector(selectAuthors)
  const current = useSelector(selectCurrent)
  const currentName = useSelector(selectCurrentName)
  const status = useSelector(selectStatus)
  const errors = useSelector(selectErrors)
  const isAuthenticated = useSelector(selectIsAuthenticated)

  const [authorInput, setAuthorInput] = useState(selectedAuthor)
  const [lastOpened, setLastOpened] = useState(null)

  const search = (e) => {
    e.preventDefault()
    const author = authorInput.trim()
    if (!author) return
    dispatch(fetchByAuthor(author))
  }

  const open = (bp) => {
    const ref = { author: bp.author, name: bp.name }
    setLastOpened(ref)
    dispatch(fetchBlueprint(ref))
  }

  const openFromTop = (bp) => {
    setAuthorInput(bp.author)
    dispatch(fetchByAuthor(bp.author))
    open(bp)
  }

  const loadingList = status.fetchByAuthor === 'loading'
  const loadingCurrent = status.fetchBlueprint === 'loading'

  return (
    <div className="layout">
      <section className="stack">
        <ErrorBanner
          message={errors.fetchAll && `No se pudo cargar el catálogo: ${errors.fetchAll}`}
          onRetry={() => dispatch(fetchAllBlueprints())}
          retrying={status.fetchAll === 'loading'}
        />
        {errors.fetchAll && !isAuthenticated && (
          <p className="muted">
            El API real exige JWT: <Link to="/login">inicia sesión</Link> y vuelve a intentarlo.
          </p>
        )}

        <form className="card" onSubmit={search} role="search">
          <h2 className="card-title">Blueprints</h2>
          <label htmlFor="author-input">Autor</label>
          <div className="search-row">
            <input
              id="author-input"
              className="input"
              placeholder="Author"
              list="authors-list"
              value={authorInput}
              onChange={(e) => setAuthorInput(e.target.value)}
              autoComplete="off"
            />
            <datalist id="authors-list">
              {authors.map((a) => (
                <option key={a} value={a} />
              ))}
            </datalist>
            <button type="submit" className="btn primary" disabled={loadingList}>
              Get blueprints
            </button>
          </div>
          {!!authors.length && (
            <p className="muted small">Autores disponibles: {authors.join(', ')}</p>
          )}
        </form>

        <div className="card" aria-busy={loadingList}>
          <h3 className="card-title">
            {selectedAuthor ? `${selectedAuthor}'s blueprints:` : 'Resultados'}
          </h3>
          <ErrorBanner
            message={errors.fetchByAuthor}
            onRetry={() => dispatch(fetchByAuthor(selectedAuthor))}
            retrying={loadingList}
          />
          {loadingList ? (
            <p className="muted">
              <span className="spinner" /> Cargando…
            </p>
          ) : selectedAuthor ? (
            <BlueprintList items={items} currentName={currentName} onOpen={open} />
          ) : (
            <p className="muted">Escribe un autor y presiona “Get blueprints”.</p>
          )}
          <p className="total">
            Total user points: <strong data-testid="total-points">{totalPoints}</strong>
          </p>
        </div>

        <TopBlueprints onOpen={openFromTop} />
      </section>

      <section className="card stack">
        <div className="field">
          <label htmlFor="current-blueprint">Current blueprint</label>
          <input
            id="current-blueprint"
            className="input current-name"
            value={currentName}
            placeholder="—"
            readOnly
          />
        </div>

        <ErrorBanner
          message={errors.fetchBlueprint}
          onRetry={lastOpened ? () => dispatch(fetchBlueprint(lastOpened)) : undefined}
          retrying={loadingCurrent}
        />
        <ErrorBanner
          message={errors.update && `No se pudo actualizar (cambio revertido): ${errors.update}`}
          onDismiss={() => dispatch(clearError('update'))}
        />
        <ErrorBanner
          message={errors.delete && `No se pudo eliminar (cambio revertido): ${errors.delete}`}
          onDismiss={() => dispatch(clearError('delete'))}
        />

        <div className="canvas-wrap" aria-busy={loadingCurrent}>
          <BlueprintCanvas title={currentName || 'Sin plano'} points={current?.points || []} />
          {loadingCurrent && <div className="canvas-overlay">Cargando…</div>}
        </div>

        {current && (
          <div className="toolbar">
            <span className="muted">
              {current.author} · {current.points?.length || 0} puntos
            </span>
            <span className="spacer" />
            <Link
              className="btn"
              to={`/blueprints/${encodeURIComponent(current.author)}/${encodeURIComponent(current.name)}`}
            >
              Detalle
            </Link>
            {isAuthenticated && (
              <>
                <Link
                  className="btn"
                  to={`/blueprints/${encodeURIComponent(current.author)}/${encodeURIComponent(current.name)}/edit`}
                >
                  Editar
                </Link>
                <DeleteButton
                  onConfirm={() =>
                    dispatch(deleteBlueprint({ author: current.author, name: current.name }))
                  }
                />
              </>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
