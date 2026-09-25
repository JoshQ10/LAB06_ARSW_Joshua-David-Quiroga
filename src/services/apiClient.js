import axios from 'axios'
import { getToken } from './tokenStorage.js'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  timeout: 8000,
  headers: { 'Content-Type': 'application/json' },
})

// Permite que la capa de estado (Redux) reaccione a un 401 sin que este
// módulo dependa del store (evita imports circulares).
let onUnauthorized = () => {}
export function setUnauthorizedHandler(handler) {
  onUnauthorized = typeof handler === 'function' ? handler : () => {}
}

/** Interceptor de request: agrega el JWT guardado como header Authorization. */
export function attachToken(config) {
  const token = getToken()
  if (token) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
}

/** Interceptor de response: un 401 invalida la sesión local. */
export function handleResponseError(err) {
  if (err?.response?.status === 401) {
    onUnauthorized()
  }
  return Promise.reject(err)
}

api.interceptors.request.use(attachToken)
api.interceptors.response.use((res) => res, handleResponseError)

/** Extrae un mensaje legible de un error de Axios o del backend ({ code, message, data }). */
export function errorMessage(err) {
  const status = err?.response?.status
  const body = err?.response?.data
  if (status === 401) return 'No autorizado: inicia sesión para continuar.'
  if (status === 403) return 'No tienes permisos para esta operación.'
  if (status === 405) return 'El backend no soporta esta operación (405 Method Not Allowed).'
  if (body?.message) return body.message
  if (body?.error) return body.error
  if (err?.code === 'ECONNABORTED') return 'El servidor tardó demasiado en responder.'
  if (err?.request && !err?.response) return 'No se pudo conectar con el servidor.'
  return err?.message || 'Error inesperado'
}

export default api
