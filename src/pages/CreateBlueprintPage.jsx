import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
  clearError,
  createBlueprint,
  fetchByAuthor,
  selectErrors,
  selectStatus,
} from '../features/blueprints/blueprintsSlice.js'
import { selectUser } from '../features/auth/authSlice.js'
import BlueprintForm from '../components/BlueprintForm.jsx'
import ErrorBanner from '../components/ErrorBanner.jsx'

export default function CreateBlueprintPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const user = useSelector(selectUser)
  const status = useSelector(selectStatus)
  const errors = useSelector(selectErrors)

  const submit = async (blueprint) => {
    try {
      await dispatch(createBlueprint(blueprint)).unwrap()
      dispatch(fetchByAuthor(blueprint.author))
      navigate('/')
    } catch {
      /* el error queda en el estado y se muestra en el banner */
    }
  }

  return (
    <div className="stack narrow">
      <ErrorBanner
        message={errors.create && `No se pudo crear: ${errors.create}`}
        onDismiss={() => dispatch(clearError('create'))}
      />
      <BlueprintForm
        initialValues={{ author: user || '', name: '', points: [] }}
        onSubmit={submit}
        submitting={status.create === 'loading'}
      />
    </div>
  )
}
