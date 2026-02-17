import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * Protects routes: redirects to /login if not authenticated.
 * After login, redirects to role-specific home.
 */
export function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading, getHomeForRole } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="page-loading">
        <div className="loader neon-loader" aria-hidden />
        <span>Loading...</span>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    const home = getHomeForRole(user.role)
    return <Navigate to={home} replace />
  }

  return children
}

export default ProtectedRoute
