import { configureStore } from '@reduxjs/toolkit'
import blueprintsReducer from '../features/blueprints/blueprintsSlice.js'
import authReducer, { loadInitialAuthState, logoutUser } from '../features/auth/authSlice.js'
import blueprintsService from '../services/blueprintsService.js'
import authService from '../services/authService.js'
import { setUnauthorizedHandler } from '../services/apiClient.js'

/**
 * Crea un store. Los servicios se inyectan como extraArgument de los thunks,
 * lo que permite usar dobles de prueba sin mockear módulos.
 */
export function makeStore({ preloadedState, services = { blueprintsService, authService } } = {}) {
  return configureStore({
    reducer: {
      blueprints: blueprintsReducer,
      auth: authReducer,
    },
    preloadedState: preloadedState ?? { auth: loadInitialAuthState() },
    middleware: (getDefault) => getDefault({ thunk: { extraArgument: services } }),
  })
}

const store = makeStore()

// Un 401 del backend invalida la sesión en Redux (el interceptor no conoce el store).
setUnauthorizedHandler(() => {
  if (store.getState().auth.token) {
    store.dispatch(logoutUser('Tu sesión expiró o no es válida. Inicia sesión de nuevo.'))
  }
})

export default store
