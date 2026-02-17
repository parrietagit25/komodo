import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import './MainLayout.css'

export function MainLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const onEscape = (e) => {
      if (e.key === 'Escape') setMobileMenuOpen(false)
    }
    if (mobileMenuOpen) {
      document.addEventListener('keydown', onEscape)
      document.body.style.overflow = 'hidden'
      return () => {
        document.removeEventListener('keydown', onEscape)
        document.body.style.overflow = ''
      }
    }
  }, [mobileMenuOpen])

  return (
    <div className="main-layout">
      <header className="mobile-header" aria-label="Mobile navigation">
        <button
          type="button"
          className="mobile-header-menu-btn"
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Open menu"
        >
          <span className="mobile-header-menu-icon" aria-hidden />
        </button>
        <span className="mobile-header-brand text-glow-primary">Komodo</span>
      </header>

      <div
        className="sidebar-overlay"
        data-open={mobileMenuOpen}
        onClick={() => setMobileMenuOpen(false)}
        aria-hidden="true"
      />

      <Sidebar
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}

export default MainLayout
