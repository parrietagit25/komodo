import api from './api'

const AUTH_BASE = '/auth'

export const authService = {
  async login(username, password) {
    const { data } = await api.post(`${AUTH_BASE}/token/`, { username, password })
    return data
  },

  async refresh(refreshToken) {
    const { data } = await api.post(`${AUTH_BASE}/token/refresh/`, { refresh: refreshToken })
    return data
  },

  async getProfile() {
    const { data } = await api.get(`${AUTH_BASE}/profile/`)
    return data
  },

  logout() {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
  },

  getStoredUser() {
    try {
      const raw = localStorage.getItem('user')
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  },

  setTokens(access, refresh) {
    if (access) localStorage.setItem('access_token', access)
    if (refresh) localStorage.setItem('refresh_token', refresh)
  },

  setUser(user) {
    localStorage.setItem('user', JSON.stringify(user))
  },
}

export default authService
