import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { login, selectIsAuthenticated } from '../features/auth/authSlice.js'

export default function LoginPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { status, error } = useSelector((s) => s.auth)
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const from = location.state?.from?.pathname || '/'

  if (isAuthenticated) return <Navigate to={from} replace />

  const submit = async (e) => {
    e.preventDefault()
    try {
      await dispatch(login({ username, password })).unwrap()
      navigate(from, { replace: true })
    } catch {
      /* el mensaje queda en state.auth.error */
    }
  }

  return (
    <form className="card stack narrow" onSubmit={submit}>
      <h2 className="card-title">Login</h2>
      {location.state?.from && (
        <p className="muted">Necesitas iniciar sesión para acceder a esa página.</p>
      )}
      <div className="grid cols-2">
        <div className="field">
          <label htmlFor="login-user">Usuario</label>
          <input
            id="login-user"
            className="input"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="login-pass">Contraseña</label>
          <input
            id="login-pass"
            type="password"
            className="input"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
      </div>
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
      <div className="toolbar">
        <span className="muted small">
          Usuarios del Lab 4: <code>student / student123</code>,{' '}
          <code>assistant / assistant123</code>
        </span>
        <span className="spacer" />
        <button type="submit" className="btn primary" disabled={status === 'loading'}>
          {status === 'loading' ? 'Ingresando…' : 'Ingresar'}
        </button>
      </div>
    </form>
  )
}
