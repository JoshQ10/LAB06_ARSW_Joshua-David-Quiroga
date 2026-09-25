import reducer, {
  clearError,
  createBlueprint,
  deleteBlueprint,
  fetchAllBlueprints,
  fetchBlueprint,
  fetchByAuthor,
  initialState,
  selectAuthor,
  selectAuthors,
  selectSelectedAuthorBlueprints,
  selectSelectedAuthorTotalPoints,
  selectTop5ByPoints,
  updateBlueprint,
} from '../src/features/blueprints/blueprintsSlice.js'
import { setupStore } from './utils.jsx'

const bp = (author, name, n) => ({
  author,
  name,
  points: Array.from({ length: n }, (_, i) => ({ x: i, y: i })),
})

// Acciones sintéticas con la forma que genera createAsyncThunk
const pending = (thunk, arg, requestId = 'r1') => ({
  type: thunk.pending.type,
  meta: { arg, requestId, requestStatus: 'pending' },
})
const fulfilled = (thunk, payload, arg, requestId = 'r1') => ({
  type: thunk.fulfilled.type,
  payload,
  meta: { arg, requestId, requestStatus: 'fulfilled' },
})
const rejected = (thunk, message, arg, requestId = 'r1') => ({
  type: thunk.rejected.type,
  payload: message,
  error: { message: 'Rejected' },
  meta: { arg, requestId, requestStatus: 'rejected', rejectedWithValue: true },
})

const withItems = (...list) => ({
  ...initialState,
  items: Object.fromEntries(list.map((b) => [`${b.author}/${b.name}`, b])),
})

describe('blueprints slice (reducers puros)', () => {
  it('se inicializa correctamente', () => {
    const state = reducer(undefined, { type: '@@INIT' })
    expect(state.items).toEqual({})
    expect(state.current).toBeNull()
    expect(state.status.fetchByAuthor).toBe('idle')
    expect(state.errors.fetchByAuthor).toBeNull()
  })

  it('maneja loading/succeeded/failed por thunk', () => {
    let s = reducer(initialState, pending(fetchByAuthor, 'john'))
    expect(s.status.fetchByAuthor).toBe('loading')
    expect(s.selectedAuthor).toBe('john')
    expect(s.status.fetchAll).toBe('idle') // los demás thunks no se afectan

    s = reducer(s, rejected(fetchByAuthor, 'Network Error', 'john'))
    expect(s.status.fetchByAuthor).toBe('failed')
    expect(s.errors.fetchByAuthor).toBe('Network Error')

    s = reducer(s, pending(fetchByAuthor, 'john'))
    expect(s.errors.fetchByAuthor).toBeNull()
    s = reducer(s, fulfilled(fetchByAuthor, { author: 'john', items: [bp('john', 'a', 2)] }))
    expect(s.status.fetchByAuthor).toBe('succeeded')
    expect(s.items['john/a'].points).toHaveLength(2)
  })

  it('fetchAll reemplaza el catálogo', () => {
    const s = reducer(
      withItems(bp('old', 'x', 1)),
      fulfilled(fetchAllBlueprints, [bp('john', 'a', 1), bp('jane', 'b', 2)]),
    )
    expect(Object.keys(s.items).sort()).toEqual(['jane/b', 'john/a'])
  })

  it('fetchByAuthor reemplaza solo los planos de ese autor', () => {
    const start = withItems(bp('john', 'viejo', 1), bp('jane', 'b', 2))
    const s = reducer(
      start,
      fulfilled(fetchByAuthor, { author: 'john', items: [bp('john', 'nuevo', 3)] }),
    )
    expect(Object.keys(s.items).sort()).toEqual(['jane/b', 'john/nuevo'])
  })

  it('fetchBlueprint y createBlueprint actualizan el plano actual', () => {
    let s = reducer(initialState, fulfilled(fetchBlueprint, bp('john', 'a', 2)))
    expect(s.current.name).toBe('a')
    s = reducer(s, fulfilled(createBlueprint, bp('ana', 'nuevo', 1)))
    expect(s.current.name).toBe('nuevo')
    expect(s.items['ana/nuevo']).toBeDefined()
  })

  it('selectAuthor y clearError', () => {
    let s = reducer(initialState, selectAuthor('jane'))
    expect(s.selectedAuthor).toBe('jane')
    s = reducer(s, rejected(createBlueprint, 'existe', {}))
    s = reducer(s, clearError('create'))
    expect(s.errors.create).toBeNull()
  })

  describe('actualizaciones optimistas', () => {
    const original = bp('john', 'house', 2)
    const arg = { author: 'john', name: 'house', points: [{ x: 9, y: 9 }] }

    it('update se aplica en pending y se confirma en fulfilled', () => {
      let s = reducer({ ...withItems(original), current: original }, pending(updateBlueprint, arg))
      expect(s.items['john/house'].points).toEqual(arg.points)
      expect(s.current.points).toEqual(arg.points)
      s = reducer(s, fulfilled(updateBlueprint, arg, arg))
      expect(s.items['john/house'].points).toEqual(arg.points)
      expect(s.backups).toEqual({})
    })

    it('update se revierte si falla', () => {
      let s = reducer({ ...withItems(original), current: original }, pending(updateBlueprint, arg))
      s = reducer(s, rejected(updateBlueprint, 'Server error', arg))
      expect(s.items['john/house']).toEqual(original)
      expect(s.current).toEqual(original)
      expect(s.errors.update).toBe('Server error')
      expect(s.backups).toEqual({})
    })

    it('delete quita el plano en pending y lo restaura si falla', () => {
      const ref = { author: 'john', name: 'house' }
      let s = reducer({ ...withItems(original), current: original }, pending(deleteBlueprint, ref))
      expect(s.items['john/house']).toBeUndefined()
      expect(s.current).toBeNull()
      s = reducer(s, rejected(deleteBlueprint, '405', ref))
      expect(s.items['john/house']).toEqual(original)
      expect(s.current).toEqual(original)
    })
  })
})

describe('selectores memoizados', () => {
  const state = {
    blueprints: {
      ...withItems(
        bp('john', 'b', 4),
        bp('john', 'a', 1),
        bp('jane', 'c', 9),
        bp('jane', 'd', 7),
        bp('ana', 'e', 5),
        bp('ana', 'f', 2),
      ),
      selectedAuthor: 'john',
    },
  }

  it('top-5 por número de puntos', () => {
    const top = selectTop5ByPoints(state)
    expect(top.map((b) => b.name)).toEqual(['c', 'd', 'e', 'b', 'f'])
    // Misma referencia si el estado no cambia (memoización)
    expect(selectTop5ByPoints(state)).toBe(top)
  })

  it('autores únicos ordenados', () => {
    expect(selectAuthors(state)).toEqual(['ana', 'jane', 'john'])
  })

  it('planos y total de puntos del autor seleccionado', () => {
    expect(selectSelectedAuthorBlueprints(state).map((b) => b.name)).toEqual(['a', 'b'])
    expect(selectSelectedAuthorTotalPoints(state)).toBe(5)
  })
})

describe('thunks contra el servicio inyectado', () => {
  it('dispatch(fetchByAuthor) consulta el servicio y guarda el resultado', async () => {
    const { store, blueprintsService } = setupStore()
    const spy = vi.spyOn(blueprintsService, 'getByAuthor')

    const action = await store.dispatch(fetchByAuthor('john'))

    expect(action.type).toBe('blueprints/fetchByAuthor/fulfilled')
    expect(spy).toHaveBeenCalledWith('john')
    expect(selectSelectedAuthorBlueprints(store.getState())).toHaveLength(3)
  })

  it('un error del servicio queda como mensaje en errors', async () => {
    const failing = { getAll: vi.fn().mockRejectedValue({ response: { status: 401 } }) }
    const { store } = setupStore({ services: { blueprintsService: failing } })
    await store.dispatch(fetchAllBlueprints())
    expect(store.getState().blueprints.errors.fetchAll).toMatch(/No autorizado/)
  })

  it('create + update + delete de extremo a extremo con el mock', async () => {
    const { store } = setupStore()
    const points = [{ x: 1, y: 1 }]
    await store.dispatch(createBlueprint({ author: 'ana', name: 'casa', points }))
    await store.dispatch(
      updateBlueprint({ author: 'ana', name: 'casa', points: [...points, { x: 2, y: 2 }] }),
    )
    expect(store.getState().blueprints.items['ana/casa'].points).toHaveLength(2)

    await store.dispatch(deleteBlueprint({ author: 'ana', name: 'casa' }))
    expect(store.getState().blueprints.items['ana/casa']).toBeUndefined()

    // Crear un duplicado falla
    await store.dispatch(fetchAllBlueprints())
    const dup = await store.dispatch(createBlueprint({ author: 'john', name: 'house', points }))
    expect(dup.type).toBe('blueprints/create/rejected')
    expect(store.getState().blueprints.errors.create).toMatch(/already exists/)
  })
})
