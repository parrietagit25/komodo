import { useEffect, useState, useMemo } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { ROLES, ROLE_HOME } from '../context/AuthContext'
import './Sidebar.css'

const INFO_ADMIN_GROUP = 'infoAdmin'

const INFO_SUBMENU = [
  { to: '/superadmin/project-status', labelKey: 'sidebar.projectStatus', end: true },
  { to: '/superadmin/investor-readiness', labelKey: 'sidebar.investorReadiness', end: true },
  { to: '/superadmin/investment', labelKey: 'sidebar.investmentStory', end: true },
  { to: '/superadmin/financial', labelKey: 'sidebar.financialOverview', end: true },
  { to: '/superadmin/audit', labelKey: 'sidebar.audit', end: true },
  { to: '/superadmin/users', labelKey: 'sidebar.users', end: true },
]

const navByRole = {
  [ROLES.SUPERADMIN]: [
    { to: '/superadmin/dashboard', labelKey: 'sidebar.dashboard', end: false },
    { groupKey: INFO_ADMIN_GROUP, labelKey: 'sidebar.infoAdmin', children: INFO_SUBMENU },
    { to: '/superadmin/organizations', labelKey: 'sidebar.organizations', end: true },
    { to: '/eventadmin/events', labelKey: 'sidebar.events', end: false },
    { to: '/eventadmin/stands', labelKey: 'sidebar.stands', end: false },
    { to: '/eventadmin/products', labelKey: 'sidebar.products', end: true },
    { to: '/wallet', labelKey: 'sidebar.wallet', end: true },
    { to: '/orders', labelKey: 'sidebar.orders', end: true },
    { to: '/settings', labelKey: 'sidebar.configuration', end: true },
  ],
  [ROLES.EVENT_ADMIN]: [
    { to: '/eventadmin/dashboard', labelKey: 'sidebar.dashboard', end: false },
    { to: '/eventadmin/events', labelKey: 'sidebar.events', end: false },
    { to: '/eventadmin/stands', labelKey: 'sidebar.stands', end: false },
    { to: '/eventadmin/products', labelKey: 'sidebar.products', end: true },
    { to: '/wallet', labelKey: 'sidebar.wallet', end: true },
    { to: '/orders', labelKey: 'sidebar.orders', end: true },
    { to: '/settings', labelKey: 'sidebar.configuration', end: true },
  ],
  [ROLES.STAND_ADMIN]: [
    { to: '/stand/dashboard', labelKey: 'sidebar.dashboard', end: false },
    { to: '/wallet', labelKey: 'sidebar.wallet', end: true },
    { to: '/orders', labelKey: 'sidebar.orders', end: true },
    { to: '/settings', labelKey: 'sidebar.configuration', end: true },
  ],
  [ROLES.USER]: [
    { to: '/user/home', labelKey: 'sidebar.home', end: false },
    { to: '/user/events', labelKey: 'sidebar.events', end: false },
    { to: '/user/checkout', labelKey: 'sidebar.checkout', end: true },
    { to: '/wallet', labelKey: 'sidebar.wallet', end: true },
    { to: '/orders', labelKey: 'sidebar.orders', end: true },
    { to: '/settings', labelKey: 'sidebar.configuration', end: true },
  ],
}

export function Sidebar({ isOpen = false, onClose }) {
  const { user, logout } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const location = useLocation()
  const links = (user && navByRole[user.role]) || []

  const infoPaths = useMemo(() => INFO_SUBMENU.map((c) => c.to), [])
  const isInfoActive = useMemo(
    () => infoPaths.some((path) => location.pathname === path || location.pathname.startsWith(path + '/')),
    [location.pathname, infoPaths]
  )
  const [infoOpen, setInfoOpen] = useState(isInfoActive)

  useEffect(() => {
    if (isInfoActive) setInfoOpen(true)
  }, [isInfoActive])

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
          aria-label={t('sidebar.closeMenu')}
        >
          ×
        </button>
      </div>
      <nav className="sidebar-nav">
        {links.map((item, idx) => {
          if (item.children) {
            const groupOpen = item.groupKey === INFO_ADMIN_GROUP ? infoOpen : false
            const toggle = item.groupKey === INFO_ADMIN_GROUP ? () => setInfoOpen((o) => !o) : undefined
            const label = t(item.labelKey)
            return (
              <div key={item.groupKey || idx} className="sidebar-group">
                <button
                  type="button"
                  className={`sidebar-group-btn ${isInfoActive ? 'sidebar-group-btn--active' : ''}`}
                  onClick={toggle}
                  aria-expanded={groupOpen}
                  aria-controls={`sidebar-sub-${item.groupKey}`}
                >
                  <span>{label}</span>
                  <span className={`sidebar-group-chevron ${groupOpen ? 'sidebar-group-chevron--open' : ''}`} aria-hidden>▼</span>
                </button>
                <div
                  id={`sidebar-sub-${item.groupKey}`}
                  className={`sidebar-sub ${groupOpen ? 'sidebar-sub--open' : ''}`}
                  role="region"
                  aria-label={`${label} ${t('sidebar.submenu')}`}
                >
                  {item.children.map((child) => (
                    <NavLink
                      key={child.to}
                      to={child.to}
                      end={child.end}
                      onClick={handleLinkClick}
                      className={({ isActive }) =>
                        `sidebar-link sidebar-link--sub ${isActive ? 'sidebar-link-active' : ''}`
                      }
                    >
                      {t(child.labelKey)}
                    </NavLink>
                  ))}
                </div>
              </div>
            )
          }
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={handleLinkClick}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
              }
            >
              {t(item.labelKey)}
            </NavLink>
          )
        })}
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
          {t('sidebar.logOut')}
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
