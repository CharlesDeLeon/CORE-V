import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import useAuth from '../../context/useAuth'

const StudentLayout = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase()
    : 'S'

  const isActive = (path) => location.pathname === path

  return (
    <div style={styles.root}>

      <div style={styles.sidebar}>
        <div style={styles.logoRow}>
          <div style={styles.logoIcon}>
            <svg width="18" height="18" fill="none" stroke="#FFBE4F" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <span style={styles.logoText}>CORE <span style={{ color: '#FFBE4F' }}>V</span></span>
        </div>

        <nav style={styles.nav}>
          <div
            style={{ ...styles.navItem, ...(isActive('/student') ? styles.navItemActive : {}) }}
            onClick={() => navigate('/student')}
          >
            Dashboard
          </div>
          <div
            style={{ ...styles.navItem, ...(isActive('/student/upload') ? styles.navItemActive : {}) }}
            onClick={() => navigate('/student/upload')}
          >
            New Upload
          </div>
        </nav>

        <div style={styles.profile}>
          <div style={styles.avatar}>{initials}</div>
          <div>
            <div style={styles.profileName}>{user?.name}</div>
            <div style={styles.profileRole}>Student</div>
          </div>
        </div>

        <button style={styles.logoutBtn} onClick={logout}>Logout</button>
      </div>

      <div style={styles.main}>
        <Outlet />
      </div>

    </div>
  )
}

const styles = {
  root: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'flex-start',
    background: 'linear-gradient(135deg, #1e2a6e 0%, #0f172a 100%)',
    color: '#fff',
  },
  sidebar: {
    width: '260px',
    flexShrink: 0,
    position: 'sticky',
    top: 0,
    height: '100vh',
    overflowY: 'auto',
    background: '#0b1228cc',
    borderRight: '1px solid rgba(255,255,255,0.08)',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
    padding: '1.25rem',
  },
  logoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  logoIcon: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    background: '#ffffff14',
    display: 'grid',
    placeItems: 'center',
  },
  logoText: {
    fontSize: '1rem',
    fontWeight: 700,
    letterSpacing: '0.4px',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  navItem: {
    padding: '10px 12px',
    borderRadius: '10px',
    color: 'rgba(255,255,255,0.75)',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
  },
  navItemActive: {
    background: '#ffffff18',
    color: '#fff',
  },
  profile: {
    marginTop: 'auto',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 0',
  },
  avatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    background: '#FFBE4F',
    color: '#1e2a6e',
    fontWeight: 700,
    display: 'grid',
    placeItems: 'center',
    fontSize: '13px',
  },
  profileName: {
    fontSize: '13px',
    fontWeight: 600,
  },
  profileRole: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.55)',
  },
  logoutBtn: {
    padding: '10px 12px',
    borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.2)',
    background: 'transparent',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '13px',
  },
  main: {
    flex: 1,
    padding: '2rem',
    overflowY: 'auto',
  },
}

export default StudentLayout
