// Datos de prueba en memoria. Mismos autores que el seed del Lab 4,
// con coordenadas pensadas para el canvas de 520x360.
const seed = () => [
  {
    author: 'john',
    name: 'house',
    points: [
      { x: 140, y: 300 },
      { x: 140, y: 160 },
      { x: 260, y: 60 },
      { x: 380, y: 160 },
      { x: 380, y: 300 },
      { x: 140, y: 300 },
    ],
  },
  {
    author: 'john',
    name: 'garage',
    points: [
      { x: 80, y: 280 },
      { x: 80, y: 140 },
      { x: 300, y: 140 },
      { x: 300, y: 280 },
    ],
  },
  {
    author: 'john',
    name: 'tower',
    points: [
      { x: 230, y: 330 },
      { x: 230, y: 40 },
      { x: 290, y: 40 },
      { x: 290, y: 330 },
      { x: 230, y: 330 },
      { x: 290, y: 40 },
      { x: 230, y: 40 },
      { x: 290, y: 330 },
    ],
  },
  {
    author: 'jane',
    name: 'garden',
    points: [
      { x: 60, y: 60 },
      { x: 180, y: 120 },
      { x: 300, y: 60 },
      { x: 420, y: 200 },
      { x: 300, y: 320 },
    ],
  },
  {
    author: 'jane',
    name: 'bridge',
    points: [
      { x: 40, y: 250 },
      { x: 150, y: 150 },
      { x: 260, y: 120 },
      { x: 370, y: 150 },
      { x: 480, y: 250 },
    ],
  },
]

const clone = (v) => JSON.parse(JSON.stringify(v))
const httpError = (status, message) =>
  Object.assign(new Error(message), { response: { status, data: { message } } })

/** Crea un servicio en memoria con la misma interfaz que apiclient. */
export function createApiMock({ data = seed(), delay = 150 } = {}) {
  let store = clone(data)
  const wait = (value) => new Promise((resolve) => setTimeout(() => resolve(clone(value)), delay))
  const find = (author, name) => store.find((bp) => bp.author === author && bp.name === name)

  return {
    getAll() {
      return wait(store)
    },

    getByAuthor(author) {
      return wait(store.filter((bp) => bp.author === author))
    },

    async getByAuthorAndName(author, name) {
      const bp = find(author, name)
      if (!bp) throw httpError(404, `Blueprint not found: ${author}/${name}`)
      return wait(bp)
    },

    async create(blueprint) {
      if (find(blueprint.author, blueprint.name)) {
        throw httpError(400, `Blueprint already exists: ${blueprint.author}:${blueprint.name}`)
      }
      const bp = { author: blueprint.author, name: blueprint.name, points: blueprint.points || [] }
      store = [...store, bp]
      return wait(bp)
    },

    async update(author, name, blueprint) {
      const current = find(author, name)
      if (!current) throw httpError(404, `Blueprint not found: ${author}/${name}`)
      const updated = { ...current, points: blueprint.points || [] }
      store = store.map((bp) => (bp === current ? updated : bp))
      return wait(updated)
    },

    async remove(author, name) {
      if (!find(author, name)) throw httpError(404, `Blueprint not found: ${author}/${name}`)
      store = store.filter((bp) => !(bp.author === author && bp.name === name))
      return wait({ author, name })
    },

    /** Solo para pruebas: restablece los datos iniciales. */
    reset(next = seed()) {
      store = clone(next)
    },
  }
}

const apimock = createApiMock()

export default apimock
