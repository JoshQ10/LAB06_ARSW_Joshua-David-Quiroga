import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  fetchBlueprint,
  selectAuthor,
  selectCurrent,
  selectErrors,
  selectStatus,
  updateBlueprint,
} from '../features/blueprints/blueprintsSlice.js'
import BlueprintForm from '../components/BlueprintForm.jsx'
import ErrorBanner from '../components/ErrorBanner.jsx'

export default function EditBlueprintPage() {
  const { author, name } = useParams()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const current = useSelector(selectCurrent)
  const status = useSelector(selectStatus)
  const errors = useSelector(selectErrors)
  const bp = current?.author === author && current?.name === name ? current : null

  useEffect(() => {
    if (!bp) dispatch(fetchBlueprint({ author, name }))
    // Solo al entrar a la página o cambiar de plano
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [author, name, dispatch])

  if (!bp) {
    return (
      <div className="card stack narrow">
        <ErrorBanner
          message={status.fetchBlueprint === 'failed' ? errors.fetchBlueprint : null}
          onRetry={() => dispatch(fetchBlueprint({ author, name }))}
        />
        {status.fetchBlueprint !== 'failed' && <p className="muted">Cargando…</p>}
        <Link to="/" className="btn">
          ← Volver
        </Link>
      </div>
    )
  }

  // Actualización optimista: se navega de inmediato; si el backend falla,
  // el slice revierte el cambio y la página principal muestra el error.
  const submit = ({ points }) => {
    dispatch(updateBlueprint({ author, name, points }))
    dispatch(selectAuthor(author))
    navigate('/')
  }

  return (
    <div className="stack narrow">
      <BlueprintForm
        key={`${author}/${name}`}
        title={`Editar “${name}”`}
        initialValues={bp}
        lockIdentity
        onSubmit={submit}
        submitLabel="Guardar cambios"
      />
    </div>
  )
}
