import { createApiMock } from '../src/services/blueprints/apimock.js'

vi.mock('../src/services/apiClient.js', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))

const INTERFACE = ['getAll', 'getByAuthor', 'getByAuthorAndName', 'create']

describe('apimock', () => {
  const mock = createApiMock({ delay: 0 })
  beforeEach(() => mock.reset())

  it('getAll devuelve todos los planos de prueba', async () => {
    const all = await mock.getAll()
    expect(all.length).toBeGreaterThan(0)
    expect(all[0]).toEqual(
      expect.objectContaining({ author: expect.any(String), name: expect.any(String) }),
    )
  })

  it('getByAuthor filtra por autor y devuelve [] si no existe', async () => {
    const john = await mock.getByAuthor('john')
    expect(john.every((bp) => bp.author === 'john')).toBe(true)
    expect(await mock.getByAuthor('nadie')).toEqual([])
  })

  it('getByAuthorAndName devuelve el plano o un 404', async () => {
    expect((await mock.getByAuthorAndName('jane', 'garden')).points).toHaveLength(5)
    await expect(mock.getByAuthorAndName('jane', 'nope')).rejects.toMatchObject({
      response: { status: 404 },
    })
  })

  it('create agrega y rechaza duplicados', async () => {
    await mock.create({ author: 'ana', name: 'x', points: [] })
    expect(await mock.getByAuthor('ana')).toHaveLength(1)
    await expect(mock.create({ author: 'ana', name: 'x', points: [] })).rejects.toMatchObject({
      response: { status: 400 },
    })
  })

  it('devuelve copias: mutar el resultado no altera los datos', async () => {
    const bp = await mock.getByAuthorAndName('john', 'house')
    bp.points.push({ x: 0, y: 0 })
    expect((await mock.getByAuthorAndName('john', 'house')).points).toHaveLength(6)
  })
})

describe('apiclient', () => {
  let api
  let apiclient

  beforeEach(async () => {
    api = (await import('../src/services/apiClient.js')).default
    apiclient = (await import('../src/services/blueprints/apiclient.js')).default
    vi.clearAllMocks()
  })

  it('tiene la misma interfaz que apimock', () => {
    const mock = createApiMock()
    for (const method of INTERFACE) {
      expect(typeof apiclient[method]).toBe('function')
      expect(typeof mock[method]).toBe('function')
    }
  })

  it('desempaqueta el formato { code, message, data } del Lab 4', async () => {
    const set = [{ author: 'john', name: 'house', points: [] }]
    api.get.mockResolvedValue({ data: { code: 200, message: 'execute ok', data: set } })
    expect(await apiclient.getAll()).toEqual(set)
    expect(api.get).toHaveBeenCalledWith('/blueprints')
  })

  it('codifica autor y nombre en la URL', async () => {
    api.get.mockResolvedValue({ data: { data: { author: 'a b', name: 'x/y', points: [] } } })
    await apiclient.getByAuthorAndName('a b', 'x/y')
    expect(api.get).toHaveBeenCalledWith('/blueprints/a%20b/x%2Fy')
  })

  it('getByAuthor traduce el 404 del backend a lista vacía', async () => {
    api.get.mockRejectedValue({ response: { status: 404 } })
    expect(await apiclient.getByAuthor('nadie')).toEqual([])
  })

  it('getByAuthor propaga otros errores', async () => {
    api.get.mockRejectedValue({ response: { status: 401 } })
    await expect(apiclient.getByAuthor('john')).rejects.toMatchObject({ response: { status: 401 } })
  })

  it('create hace POST y devuelve el plano creado aunque data sea null', async () => {
    const bp = { author: 'ana', name: 'x', points: [{ x: 1, y: 1 }] }
    api.post.mockResolvedValue({ data: { code: 201, message: 'blueprint created', data: null } })
    expect(await apiclient.create(bp)).toEqual(bp)
    expect(api.post).toHaveBeenCalledWith('/blueprints', bp)
  })

  it('update y remove usan PUT y DELETE', async () => {
    api.put.mockResolvedValue({ data: { data: null } })
    api.delete.mockResolvedValue({ data: {} })
    await apiclient.update('ana', 'x', { points: [] })
    await apiclient.remove('ana', 'x')
    expect(api.put).toHaveBeenCalledWith('/blueprints/ana/x', { points: [] })
    expect(api.delete).toHaveBeenCalledWith('/blueprints/ana/x')
  })
})

describe('blueprintsService (conmutación por VITE_USE_MOCK)', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('VITE_USE_MOCK=true usa apimock', async () => {
    vi.stubEnv('VITE_USE_MOCK', 'true')
    vi.resetModules()
    const { default: service, isMockMode } = await import('../src/services/blueprintsService.js')
    const { default: apimock } = await import('../src/services/blueprints/apimock.js')
    expect(isMockMode).toBe(true)
    expect(service).toBe(apimock)
  })

  it('VITE_USE_MOCK=false usa apiclient', async () => {
    vi.stubEnv('VITE_USE_MOCK', 'false')
    vi.resetModules()
    const { default: service, isMockMode } = await import('../src/services/blueprintsService.js')
    const { default: apiclient } = await import('../src/services/blueprints/apiclient.js')
    expect(isMockMode).toBe(false)
    expect(service).toBe(apiclient)
  })
})
