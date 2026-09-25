import { screen, fireEvent } from '@testing-library/react'
import { Route, Routes } from 'react-router-dom'
import authReducer, {
  loadInitialAuthState,
  loggedOut,
  login,
  logoutUser,
} from '../src/features/auth/authSlice.js'
import PrivateRoute from '../src/components/PrivateRoute.jsx'
import LoginPage from '../src/pages/LoginPage.jsx'
import { authenticated, fakeToken, renderWithProviders, setupStore } from './utils.jsx'

describe('authSlice', () => {
  it('login exitoso guarda el token y el usuario (sub del JWT)', async () => {
    const token = fakeToken('assistant')
    const { store } = setupStore({ services: { authService: { login: async () => token } } })

    await store.dispatch(login({ username: 'assistant', password: 'assistant123' }))

    expect(store.getState().auth).toMatchObject({ token, user: 'assistant', status: 'succeeded' })
    expect(localStorage.getItem('token')).toBe(token)
  })

  it('credenciales inválidas dejan un mensaje de error', async () => {
    const authService = { login: vi.fn().mockRejectedValue({ response: { status: 401 } }) }
    const { store } = setupStore({ services: { authService } })
    await store.dispatch(login({ username: 'x', password: 'y' }))
    expect(store.getState().auth.error).toMatch(/incorrectos/)
    expect(store.getState().auth.token).toBeNull()
  })

  it('logoutUser borra el token de localStorage y del estado', () => {
    localStorage.setItem('token', 'abc')
    const { store } = setupStore({ auth: authenticated() })
    store.dispatch(logoutUser())
    expect(store.getState().auth.token).toBeNull()
    expect(localStorage.getItem('token')).toBeNull()
  })

  it('loggedOut conserva el motivo como error visible', () => {
    const s = authReducer(authenticated(), loggedOut('Sesión expirada'))
    expect(s).toMatchObject({ token: null, user: null, error: 'Sesión expirada' })
  })

  it('el estado inicial descarta tokens expirados', () => {
    localStorage.setItem('token', fakeToken('student', -10))
    expect(loadInitialAuthState().token).toBeNull()
    expect(localStorage.getItem('token')).toBeNull()

    const valid = fakeToken('student')
    localStorage.setItem('token', valid)
    expect(loadInitialAuthState()).toMatchObject({ token: valid, user: 'student' })
  })
})

function ProtectedApp() {
  return (
    <Routes>
      <Route element={<PrivateRoute />}>
        <Route path="/blueprints/new" element={<p>Formulario protegido</p>} />
      </Route>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<p>Inicio</p>} />
    </Routes>
  )
}

describe('PrivateRoute', () => {
  it('sin sesión redirige a /login', () => {
    renderWithProviders(<ProtectedApp />, { route: '/blueprints/new' })
    expect(screen.queryByText('Formulario protegido')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Login' })).toBeInTheDocument()
    expect(screen.getByText(/Necesitas iniciar sesión/)).toBeInTheDocument()
  })

  it('con sesión muestra la ruta protegida', () => {
    renderWithProviders(<ProtectedApp />, { route: '/blueprints/new', auth: authenticated() })
    expect(screen.getByText('Formulario protegido')).toBeInTheDocument()
  })

  it('tras el login vuelve a la ruta que se quería visitar', async () => {
    renderWithProviders(<ProtectedApp />, { route: '/blueprints/new' })
    fireEvent.change(screen.getByLabelText('Usuario'), { target: { value: 'student' } })
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'student123' } })
    fireEvent.click(screen.getByRole('button', { name: 'Ingresar' }))

    expect(await screen.findByText('Formulario protegido')).toBeInTheDocument()
  })
})
