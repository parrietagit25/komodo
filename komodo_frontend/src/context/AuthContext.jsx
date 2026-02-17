import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { authService } from '../services/authService'

const AuthContext = createContext(null)

const ROLES = {
  SUPERADMIN: 'SUPERADMIN',
  EVENT_ADMIN: 'EVENT_ADMIN',
  STAND_ADMIN: 'STAND_ADMIN',
  USER: 'USER',
}

const ROLE_HOME = {
  [ROLES.SUPERADMIN]: '/superadmin/dashboard',
  [ROLES.EVENT_ADMIN]: '/eventadmin/dashboard',
  [ROLES.STAND_ADMIN]: '/stand/dashboard',
  [ROLES.USER]: '/user/home',
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(authService.getStoredUser())
  const [loading, setLoading] = useState(true)

  const login = useCallback(async (username, password) => {
    const data = await authService.login(username, password)
    authService.setTokens(data.access, data.refresh)
    if (data.user) {
      authService.setUser(data.user)
      setUser(data.user)
    } else {
      const profile = await authService.getProfile()
      authService.setUser(profile)
      setUser(profile)
    }
    return data
  }, [])

  const logout = useCallback(() => {
    authService.logout()
    setUser(null)
  }, [])

  const getHomeForRole = useCallback((role) => ROLE_HOME[role] || '/user/home', [])

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      setLoading(false)
      return
    }
    const stored = authService.getStoredUser()
    if (stored) {
      setUser(stored)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    const onLogout = () => {
      setUser(null)
    }
    window.addEventListener('auth-logout', onLogout)
    return () => window.removeEventListener('auth-logout', onLogout)
  }, [])

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
    getHomeForRole,
    ROLES,
    ROLE_HOME,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export { ROLES, ROLE_HOME }
