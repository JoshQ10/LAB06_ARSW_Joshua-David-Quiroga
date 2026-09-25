import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { NavLink, Route, Routes } from 'react-router-dom'
import BlueprintsPage from './pages/BlueprintsPage.jsx'
import BlueprintDetailPage from './pages/BlueprintDetailPage.jsx'
import CreateBlueprintPage from './pages/CreateBlueprintPage.jsx'
import EditBlueprintPage from './pages/EditBlueprintPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import NotFound from './pages/NotFound.jsx'
import PrivateRoute from './components/PrivateRoute.jsx'
import ThemeToggle from './components/ThemeToggle.jsx'
import { fetchAllBlueprints } from './features/blueprints/blueprintsSlice.js'
import { logoutUser, selectUser } from './features/auth/authSlice.js'
import { isMockMode } from './services/blueprintsService.js'

export default function App() {
  const dispatch = useDispatch()
  const token = useSelector((s) => s.auth.token)
  const user = useSelector(selectUser)

  // Catálogo general (autores + top 5). Se recarga al iniciar/cerrar sesión.
  useEffect(() => {
    dispatch(fetchAllBlueprints())
  }, [dispatch, token])

  return (
    <div className="container">
      <header className="app-header">
        <div className="brand">
          <h1>ECI · Blueprints</h1>
          <span className={`badge ${isMockMode ? 'mock' : 'api'}`}>
            {isMockMode ? 'apimock' : 'apiclient'}
          </span>
        </div>
        <nav>
          <NavLink to="/" end>
            Blueprints
          </NavLink>
          <NavLink to="/blueprints/new">Nuevo</NavLink>
          {user ? (
            <>
              <span className="user">{user}</span>
              <button
                type="button"
                className="btn small ghost"
                onClick={() => dispatch(logoutUser())}
              >
                Salir
              </button>
            </>
          ) : (
            <NavLink to="/login">Login</NavLink>
          )}
          <ThemeToggle />
        </nav>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<BlueprintsPage />} />
          <Route element={<PrivateRoute />}>
            <Route path="/blueprints/new" element={<CreateBlueprintPage />} />
            <Route path="/blueprints/:author/:name/edit" element={<EditBlueprintPage />} />
          </Route>
          <Route path="/blueprints/:author/:name" element={<BlueprintDetailPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  )
}
