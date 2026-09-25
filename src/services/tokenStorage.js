const KEY = 'token'

// localStorage puede no estar disponible (modo privado, políticas del navegador).
export function getToken() {
  try {
    return localStorage.getItem(KEY)
  } catch {
    return null
  }
}

export function saveToken(token) {
  try {
    localStorage.setItem(KEY, token)
  } catch {
    /* sin persistencia: el token vive solo en Redux */
  }
}

export function clearToken() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* noop */
  }
}

/** Decodifica el payload de un JWT (sin validar firma: eso le corresponde al backend). */
export function decodeToken(token) {
  try {
    const payload = token.split('.')[1]
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(json)
  } catch {
    return null
  }
}

export function isTokenExpired(token, now = Date.now()) {
  const claims = decodeToken(token)
  if (!claims) return true
  return typeof claims.exp === 'number' && claims.exp * 1000 <= now
}
