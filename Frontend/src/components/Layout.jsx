import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useState, useEffect } from 'react'
import { healthCheck } from '../services/api'

const navItems = [
  { to: '/',            icon: '⬡',  label: 'Dashboard',     exact: true },
  { to: '/detect',      icon: '🎯', label: 'Detection',     badge: null },
  { to: '/risk',        icon: '⚖️', label: 'Risk Scoring'   },
  { to: '/incidents',   icon: '🚨', label: 'Incidents',     badge: 'live' },
  { to: '/cases',       icon: '📁', label: 'Cases & Automation' },
  { to: '/workforce',   icon: '👥', label: 'Workforce'      },
  { to: '/ingest',      icon: '📥', label: 'Ingest'         },
  { to: '/integrations',icon: '🔌', label: 'Integrations'   },
  { to: '/store',       icon: '🛡️', label: 'Store Threat'   },
  { to: '/scanner',     icon: '🔍', label: 'Email Scanner'  },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [healthy, setHealthy] = useState(null)

  useEffect(() => {
    healthCheck()
      .then(() => setHealthy(true))
      .catch(() => setHealthy(false))
  }, [])

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">🛡️</div>
          <div>
            <div className="logo-text">NAR<span>IP</span></div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '1px' }}>Threat Intelligence</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">
            <div className="nav-label">Navigation</div>
            {navItems.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.exact}
                className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              >
                <span className="nav-icon">{item.icon}</span>
                {item.label}
                {item.badge === 'live' && <span className="nav-badge">LIVE</span>}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* User footer */}
        <div style={{ padding: '16px', borderTop: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '14px', fontWeight: 700, flexShrink: 0
            }}>
              {(user?.firstName?.[0] || user?.email?.[0] || '?').toUpperCase()}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.firstName ? `${user.firstName} ${user.lastName || ''}` : user?.email}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{user?.role || 'analyst'}</div>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" style={{ width: '100%' }} onClick={handleLogout}>
            🚪 Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="main-content">
        <header className="topbar">
          <div className="topbar-title">
            NARIP Platform
            <span>Enterprise Security Intelligence</span>
          </div>
          <div className="topbar-actions">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
              <div className="status-dot" style={{ background: healthy === false ? 'var(--danger)' : 'var(--success)' }} />
              {healthy === null ? 'Checking…' : healthy ? 'Backend Online' : 'Backend Offline'}
            </div>
            <button className="btn btn-ghost btn-sm" onClick={handleLogout}>Sign Out</button>
          </div>
        </header>

        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
