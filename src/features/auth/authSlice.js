import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import defaultAuthService from '../../services/authService.js'
import { errorMessage } from '../../services/apiClient.js'
import {
  clearToken,
  decodeToken,
  getToken,
  isTokenExpired,
  saveToken,
} from '../../services/tokenStorage.js'

const userFrom = (token) => decodeToken(token)?.sub ?? null

export function loadInitialAuthState() {
  const token = getToken()
  if (!token || isTokenExpired(token)) {
    if (token) clearToken()
    return { token: null, user: null, status: 'idle', error: null }
  }
  return { token, user: userFrom(token), status: 'idle', error: null }
}

export const login = createAsyncThunk(
  'auth/login',
  async ({ username, password }, { extra, rejectWithValue }) => {
    const service = extra?.authService || defaultAuthService
    try {
      const token = await service.login(username, password)
      saveToken(token)
      return token
    } catch (err) {
      const status = err?.response?.status
      return rejectWithValue(
        status === 401 ? 'Usuario o contraseña incorrectos.' : errorMessage(err),
      )
    }
  },
)

const slice = createSlice({
  name: 'auth',
  initialState: { token: null, user: null, status: 'idle', error: null },
  reducers: {
    // El borrado de localStorage lo hace quien despacha (logoutUser / interceptor 401).
    loggedOut(state, action) {
      state.token = null
      state.user = null
      state.status = 'idle'
      state.error = action.payload ?? null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (s) => {
        s.status = 'loading'
        s.error = null
      })
      .addCase(login.fulfilled, (s, a) => {
        s.status = 'succeeded'
        s.token = a.payload
        s.user = userFrom(a.payload)
      })
      .addCase(login.rejected, (s, a) => {
        s.status = 'failed'
        s.error = a.payload || a.error.message
      })
  },
})

export const { loggedOut } = slice.actions

export const logoutUser = (reason) => (dispatch) => {
  clearToken()
  dispatch(loggedOut(reason))
}

export const selectIsAuthenticated = (state) => !!state.auth.token
export const selectUser = (state) => state.auth.user

export default slice.reducer
