import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit'
import defaultService from '../../services/blueprintsService.js'
import { errorMessage } from '../../services/apiClient.js'

export const keyOf = (author, name) => `${author}/${name}`

// El servicio llega por el extraArgument del thunk (inyección de dependencias):
// en la app es blueprintsService (mock o API real) y en las pruebas un doble.
const serviceFrom = (extra) => extra?.blueprintsService || defaultService

const withService = (type, run) =>
  createAsyncThunk(type, async (arg, { extra, rejectWithValue }) => {
    try {
      return await run(serviceFrom(extra), arg)
    } catch (err) {
      return rejectWithValue(errorMessage(err))
    }
  })

export const fetchAllBlueprints = withService('blueprints/fetchAll', (svc) => svc.getAll())

export const fetchByAuthor = withService('blueprints/fetchByAuthor', async (svc, author) => ({
  author,
  items: await svc.getByAuthor(author),
}))

export const fetchBlueprint = withService('blueprints/fetchBlueprint', (svc, { author, name }) =>
  svc.getByAuthorAndName(author, name),
)

export const createBlueprint = withService('blueprints/create', (svc, blueprint) =>
  svc.create(blueprint),
)

export const updateBlueprint = withService('blueprints/update', (svc, { author, name, points }) =>
  svc.update(author, name, { author, name, points }),
)

export const deleteBlueprint = withService('blueprints/delete', (svc, { author, name }) =>
  svc.remove(author, name),
)

const OPERATIONS = ['fetchAll', 'fetchByAuthor', 'fetchBlueprint', 'create', 'update', 'delete']
const byOperation = (value) => Object.fromEntries(OPERATIONS.map((op) => [op, value]))

export const initialState = {
  items: {}, // { 'author/name': blueprint }
  selectedAuthor: '',
  current: null,
  status: byOperation('idle'),
  errors: byOperation(null),
  backups: {}, // requestId -> estado previo, para revertir actualizaciones optimistas
}

const sameBlueprint = (bp, author, name) => !!bp && bp.author === author && bp.name === name

const slice = createSlice({
  name: 'blueprints',
  initialState,
  reducers: {
    selectAuthor(state, action) {
      state.selectedAuthor = action.payload
    },
    clearCurrent(state) {
      state.current = null
    },
    clearError(state, action) {
      state.errors[action.payload] = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllBlueprints.fulfilled, (s, a) => {
        s.items = {}
        for (const bp of a.payload) s.items[keyOf(bp.author, bp.name)] = bp
      })
      .addCase(fetchByAuthor.pending, (s, a) => {
        s.selectedAuthor = a.meta.arg
      })
      .addCase(fetchByAuthor.fulfilled, (s, a) => {
        const { author, items } = a.payload
        for (const k of Object.keys(s.items)) {
          if (s.items[k].author === author) delete s.items[k]
        }
        for (const bp of items) s.items[keyOf(bp.author, bp.name)] = bp
      })
      .addCase(fetchBlueprint.fulfilled, (s, a) => {
        s.current = a.payload
      })
      .addCase(createBlueprint.fulfilled, (s, a) => {
        const bp = a.payload
        s.items[keyOf(bp.author, bp.name)] = bp
        s.current = bp
      })

      // PUT optimista: se aplica en pending y se revierte en rejected
      .addCase(updateBlueprint.pending, (s, a) => {
        const { author, name, points } = a.meta.arg
        const k = keyOf(author, name)
        s.backups[a.meta.requestId] = { key: k, item: s.items[k] ?? null, current: s.current }
        s.items[k] = { ...(s.items[k] || { author, name }), points }
        if (sameBlueprint(s.current, author, name)) s.current = { ...s.current, points }
      })
      .addCase(updateBlueprint.fulfilled, (s, a) => {
        delete s.backups[a.meta.requestId]
      })
      .addCase(updateBlueprint.rejected, (s, a) => restore(s, a.meta.requestId))

      // DELETE optimista
      .addCase(deleteBlueprint.pending, (s, a) => {
        const { author, name } = a.meta.arg
        const k = keyOf(author, name)
        s.backups[a.meta.requestId] = { key: k, item: s.items[k] ?? null, current: s.current }
        delete s.items[k]
        if (sameBlueprint(s.current, author, name)) s.current = null
      })
      .addCase(deleteBlueprint.fulfilled, (s, a) => {
        delete s.backups[a.meta.requestId]
      })
      .addCase(deleteBlueprint.rejected, (s, a) => restore(s, a.meta.requestId))

    // Estados loading/error por thunk (los matchers corren después de los addCase)
    const tracked = {
      fetchAll: fetchAllBlueprints,
      fetchByAuthor,
      fetchBlueprint,
      create: createBlueprint,
      update: updateBlueprint,
      delete: deleteBlueprint,
    }
    for (const [op, thunk] of Object.entries(tracked)) {
      builder
        .addMatcher(thunk.pending.match, (s) => {
          s.status[op] = 'loading'
          s.errors[op] = null
        })
        .addMatcher(thunk.fulfilled.match, (s) => {
          s.status[op] = 'succeeded'
        })
        .addMatcher(thunk.rejected.match, (s, a) => {
          s.status[op] = 'failed'
          s.errors[op] = a.payload || a.error.message
        })
    }
  },
})

function restore(state, requestId) {
  const backup = state.backups[requestId]
  if (!backup) return
  if (backup.item) state.items[backup.key] = backup.item
  else delete state.items[backup.key]
  state.current = backup.current
  delete state.backups[requestId]
}

export const { selectAuthor, clearCurrent, clearError } = slice.actions
export default slice.reducer

// ---- Selectores (memoizados con createSelector) ----
const selectSlice = (state) => state.blueprints
export const selectItems = (state) => selectSlice(state).items
export const selectCurrent = (state) => selectSlice(state).current
export const selectCurrentName = (state) => selectSlice(state).current?.name ?? ''
export const selectSelectedAuthor = (state) => selectSlice(state).selectedAuthor
export const selectStatus = (state) => selectSlice(state).status
export const selectErrors = (state) => selectSlice(state).errors

const pointCount = (bp) => bp.points?.length || 0

export const selectAllBlueprints = createSelector([selectItems], (items) => Object.values(items))

export const selectAuthors = createSelector([selectAllBlueprints], (all) =>
  [...new Set(all.map((bp) => bp.author))].sort(),
)

export const selectSelectedAuthorBlueprints = createSelector(
  [selectAllBlueprints, selectSelectedAuthor],
  (all, author) =>
    all.filter((bp) => bp.author === author).sort((a, b) => a.name.localeCompare(b.name)),
)

export const selectSelectedAuthorTotalPoints = createSelector(
  [selectSelectedAuthorBlueprints],
  (items) => items.reduce((acc, bp) => acc + pointCount(bp), 0),
)

export const selectTop5ByPoints = createSelector([selectAllBlueprints], (all) =>
  [...all]
    .sort(
      (a, b) =>
        pointCount(b) - pointCount(a) ||
        keyOf(a.author, a.name).localeCompare(keyOf(b.author, b.name)),
    )
    .slice(0, 5),
)
