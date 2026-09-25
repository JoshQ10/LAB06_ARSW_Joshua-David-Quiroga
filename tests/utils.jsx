import { render } from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { makeStore } from '../src/store/index.js'
import { createApiMock } from '../src/services/blueprints/apimock.js'
import { initialState as blueprintsInitialState } from '../src/features/blueprints/blueprintsSlice.js'

const routerFuture = { v7_startTransition: true, v7_relativeSplatPath: true }

export const anonymous = { token: null, user: null, status: 'idle', error: null }

// JWT sin firma con sub=student y expiración en 1 hora (suficiente para el cliente).
export function fakeToken(sub = 'student', expInSeconds = 3600) {
  const enc = (o) => btoa(JSON.stringify(o)).replace(/=+$/, '')
  const exp = Math.floor(Date.now() / 1000) + expInSeconds
  return `${enc({ alg: 'none' })}.${enc({ sub, exp })}.sig`
}

export const authenticated = (sub = 'student') => ({
  token: fakeToken(sub),
  user: sub,
  status: 'idle',
  error: null,
})

/** Store real con servicios en memoria inyectados (sin red, sin delay). */
export function setupStore({ blueprints = {}, auth = anonymous, services = {} } = {}) {
  const blueprintsService = services.blueprintsService || createApiMock({ delay: 0 })
  const authService = services.authService || { login: async () => fakeToken() }
  const store = makeStore({
    preloadedState: { blueprints: { ...blueprintsInitialState, ...blueprints }, auth },
    services: { blueprintsService, authService },
  })
  return { store, blueprintsService, authService }
}

export function renderWithProviders(ui, { route = '/', store, ...storeOptions } = {}) {
  const setup = store ? { store } : setupStore(storeOptions)
  const result = render(
    <Provider store={setup.store}>
      <MemoryRouter initialEntries={[route]} future={routerFuture}>
        {ui}
      </MemoryRouter>
    </Provider>,
  )
  return { ...result, ...setup }
}
