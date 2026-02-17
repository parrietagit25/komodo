import { useEffect } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ROLES, ROLE_HOME } from '../context/AuthContext'
import './Sidebar.css'

const navByRole = {
  [ROLES.SUPERADMIN]: [
    { to: '/superadmin/dashboard', label: 'Dashboard', end: false },
    { to: '/superadmin/organizations', label: 'Organizations', end: true },
    { to: '/superadmin/users', label: 'Users', end: true },
    { to: '/superadmin/investment', label: '📈 Investment Story', end: true },
    { to: '/superadmin/financial', label: '📊 Financial Overview', end: true },
    { to: '/superadmin/audit', label: '🛡 Audit', end: true },
    { to: '/eventadmin/events', label: 'Events', end: false },
    { to: '/eventadmin/stands', label: 'Stands', end: false },
    { to: '/eventadmin/products', label: 'Products', end: true },
    { to: '/wallet', label: 'Wallet', end: true },
    { to: '/orders', label: 'Orders', end: true },
  ],
  [ROLES.EVENT_ADMIN]: [
    { to: '/eventadmin/dashboard', label: 'Dashboard', end: false },
    { to: '/eventadmin/events', label: 'Events', end: false },
    { to: '/eventadmin/stands', label: 'Stands', end: false },
    { to: '/eventadmin/products', label: 'Products', end: true },
    { to: '/wallet', label: 'Wallet', end: true },
    { to: '/orders', label: 'Orders', end: true },
  ],
  [ROLES.STAND_ADMIN]: [
    { to: '/stand/dashboard', label: 'Dashboard', end: false },
    { to: '/wallet', label: 'Wallet', end: true },
    { to: '/orders', label: 'Orders', end: true },
  ],
  [ROLES.USER]: [
    { to: '/user/home', label: 'Home', end: false },
    { to: '/user/events', label: 'Events', end: false },
    { to: '/user/checkout', label: 'Checkout', end: true },
    { to: '/wallet', label: 'Wallet', end: true },
    { to: '/orders', label: 'Orders', end: true },
  ],
}

export function Sidebar({ isOpen = false, onClose }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const links = (user && navByRole[user.role]) || []

  useEffect(() => {
    onClose?.()
  }, [location.pathname])

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
    onClose?.()
  }

  const handleLinkClick = () => {
    onClose?.()
  }

  return (
    <aside className={`sidebar ${isOpen ? 'sidebar--open' : ''}`}>
      <div className="sidebar-header">
        <NavLink to={user ? (ROLE_HOME[user.role] || '/') : '/'} className="sidebar-brand" onClick={handleLinkClick}>
          <span className="brand-icon">K</span>
          <span className="brand-text text-glow-primary">Komodo</span>
        </NavLink>
        <button
          type="button"
          className="sidebar-close-btn"
          onClick={onClose}
          aria-label="Close menu"
        >
          ×
        </button>
      </div>
      <nav className="sidebar-nav">
        {links.map(({ to, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={handleLinkClick}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <span className="sidebar-user-name">{user?.username ?? '—'}</span>
          <span className="sidebar-user-role">{user?.role ?? '—'}</span>
        </div>
        <button
          type="button"
          className="sidebar-btn-logout"
          onClick={handleLogout}
        >
          Log out
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
