import { useSelector } from 'react-redux'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { selectIsAuthenticated } from '../features/auth/authSlice.js'

/**
 * Protege rutas que requieren JWT. Sin sesión redirige a /login recordando
 * la ruta de origen para volver después de autenticarse.
 */
export default function PrivateRoute({ children }) {
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }
  return children ?? <Outlet />
}
