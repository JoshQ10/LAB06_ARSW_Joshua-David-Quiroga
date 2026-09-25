import api, {
  attachToken,
  errorMessage,
  handleResponseError,
  setUnauthorizedHandler,
} from '../src/services/apiClient.js'
import { decodeToken, isTokenExpired } from '../src/services/tokenStorage.js'
import { fakeToken } from './utils.jsx'

describe('apiClient (axios + interceptores JWT)', () => {
  afterEach(() => setUnauthorizedHandler(null))

  it('usa la URL base configurada en el entorno', () => {
    expect(api.defaults.baseURL).toBe('/api/v1')
  })

  it('agrega Authorization: Bearer <token> si hay sesión', () => {
    localStorage.setItem('token', 'abc.def.ghi')
    const config = attachToken({ headers: {} })
    expect(config.headers.Authorization).toBe('Bearer abc.def.ghi')
  })

  it('no agrega el header sin token', () => {
    const config = attachToken({ headers: {} })
    expect(config.headers.Authorization).toBeUndefined()
  })

  it('los interceptores están registrados en la instancia', () => {
    expect(api.interceptors.request.handlers.length).toBeGreaterThan(0)
    expect(api.interceptors.response.handlers.length).toBeGreaterThan(0)
  })

  it('un 401 dispara el manejador de sesión inválida y propaga el error', async () => {
    const handler = vi.fn()
    setUnauthorizedHandler(handler)
    const err = { response: { status: 401 } }
    await expect(handleResponseError(err)).rejects.toBe(err)
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('otros errores no cierran la sesión', async () => {
    const handler = vi.fn()
    setUnauthorizedHandler(handler)
    await expect(handleResponseError({ response: { status: 500 } })).rejects.toBeTruthy()
    expect(handler).not.toHaveBeenCalled()
  })

  it('errorMessage traduce los errores comunes', () => {
    expect(errorMessage({ response: { status: 401 } })).toMatch(/inicia sesión/)
    expect(errorMessage({ response: { status: 403 } })).toMatch(/permisos/)
    expect(errorMessage({ response: { status: 405 } })).toMatch(/no soporta/)
    expect(
      errorMessage({ response: { status: 404, data: { message: 'Blueprint not found' } } }),
    ).toBe('Blueprint not found')
    expect(errorMessage({ request: {} })).toMatch(/conectar/)
    expect(errorMessage(new Error('x'))).toBe('x')
  })
})

describe('tokenStorage', () => {
  it('decodifica el payload del JWT', () => {
    expect(decodeToken(fakeToken('assistant')).sub).toBe('assistant')
    expect(decodeToken('basura')).toBeNull()
  })

  it('detecta tokens expirados', () => {
    expect(isTokenExpired(fakeToken('a', 60))).toBe(false)
    expect(isTokenExpired(fakeToken('a', -60))).toBe(true)
    expect(isTokenExpired('basura')).toBe(true)
  })
})
