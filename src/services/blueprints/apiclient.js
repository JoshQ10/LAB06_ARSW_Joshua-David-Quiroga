import api from '../apiClient.js'

// El backend del Lab 4 envuelve las respuestas en { code, message, data }.
const unwrap = (res) =>
  res.data && typeof res.data === 'object' && 'data' in res.data ? res.data.data : res.data
const path = (...parts) => `/blueprints/${parts.map(encodeURIComponent).join('/')}`
const toArray = (data) => (Array.isArray(data) ? data : data ? Object.values(data) : [])

/** Servicio que consume la API REST real con Axios (misma interfaz que apimock). */
const apiclient = {
  async getAll() {
    return toArray(unwrap(await api.get('/blueprints')))
  },

  async getByAuthor(author) {
    try {
      return toArray(unwrap(await api.get(path(author))))
    } catch (err) {
      // El backend responde 404 cuando el autor no tiene planos.
      if (err.response?.status === 404) return []
      throw err
    }
  },

  async getByAuthorAndName(author, name) {
    return unwrap(await api.get(path(author, name)))
  },

  async create(blueprint) {
    const data = unwrap(await api.post('/blueprints', blueprint))
    // El Lab 4 responde 201 con data = null: se devuelve lo que se creó.
    return data || blueprint
  },

  async update(author, name, blueprint) {
    const data = unwrap(await api.put(path(author, name), blueprint))
    return data || { ...blueprint, author, name }
  },

  async remove(author, name) {
    await api.delete(path(author, name))
    return { author, name }
  },
}

export default apiclient
