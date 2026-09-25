import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  deleteBlueprint,
  fetchBlueprint,
  selectCurrent,
  selectErrors,
  selectStatus,
} from '../features/blueprints/blueprintsSlice.js'
import { selectIsAuthenticated } from '../features/auth/authSlice.js'
import BlueprintCanvas from '../components/BlueprintCanvas.jsx'
import ErrorBanner from '../components/ErrorBanner.jsx'
import DeleteButton from '../components/DeleteButton.jsx'

export default function BlueprintDetailPage() {
  const { author, name } = useParams()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const current = useSelector(selectCurrent)
  const status = useSelector(selectStatus)
  const errors = useSelector(selectErrors)
  const isAuthenticated = useSelector(selectIsAuthenticated)

  useEffect(() => {
    dispatch(fetchBlueprint({ author, name }))
  }, [author, name, dispatch])

  const bp = current?.author === author && current?.name === name ? current : null
  const retry = () => dispatch(fetchBlueprint({ author, name }))

  if (!bp) {
    return (
      <div className="card stack">
        <ErrorBanner
          message={status.fetchBlueprint === 'failed' ? errors.fetchBlueprint : null}
          onRetry={retry}
        />
        {status.fetchBlueprint !== 'failed' && (
          <p className="muted">
            <span className="spinner" /> Cargando…
          </p>
        )}
        <Link to="/" className="btn">
          ← Volver
        </Link>
      </div>
    )
  }

  const remove = () => {
    dispatch(deleteBlueprint({ author, name }))
    navigate('/')
  }

  return (
    <div className="card stack">
      <div className="toolbar">
        <h2 className="card-title">{bp.name}</h2>
        <span className="spacer" />
        <Link to="/" className="btn">
          ← Volver
        </Link>
        {isAuthenticated && (
          <>
            <Link
              to={`/blueprints/${encodeURIComponent(author)}/${encodeURIComponent(name)}/edit`}
              className="btn"
            >
              Editar
            </Link>
            <DeleteButton onConfirm={remove} />
          </>
        )}
      </div>
      <p>
        <strong>Autor:</strong> {bp.author} · <strong>Puntos:</strong> {bp.points?.length || 0}
      </p>
      <BlueprintCanvas id="blueprint-detail-canvas" title={bp.name} points={bp.points || []} />
    </div>
  )
}
