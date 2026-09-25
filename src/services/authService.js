import api from './apiClient.js'
import { isMockMode } from './blueprintsService.js'

const AUTH_URL = import.meta.env.VITE_AUTH_URL || '/auth/login'

// Mismos usuarios que InMemoryUserService del Lab 4.
const MOCK_USERS = { student: 'student123', assistant: 'assistant123' }

const b64url = (obj) =>
  btoa(JSON.stringify(obj)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_')

const mockAuth = {
  async login(username, password) {
    await new Promise((r) => setTimeout(r, 150))
    if (!username || MOCK_USERS[username] !== password) {
      throw Object.assign(new Error('invalid_credentials'), {
        response: { status: 401, data: { error: 'invalid_credentials' } },
      })
    }
    const now = Math.floor(Date.now() / 1000)
    const header = b64url({ alg: 'none', typ: 'JWT' })
    const payload = b64url({
      sub: username,
      scope: 'blueprints.read blueprints.write',
      iat: now,
      exp: now + 3600,
    })
    return `${header}.${payload}.mock`
  },
}

const apiAuth = {
  async login(username, password) {
    // /auth/login no cuelga de /api/v1: se anula la baseURL para esta petición.
    const { data } = await api.post(AUTH_URL, { username, password }, { baseURL: '' })
    const token = data?.access_token || data?.token
    if (!token) throw new Error('La respuesta de login no contiene un token')
    return token
  },
}

const authService = isMockMode ? mockAuth : apiAuth

export default authService
