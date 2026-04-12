import { useState, useEffect } from 'react'
import useAuth from '../context/useAuth'
import api from '../services/api'

const StudentDashboard = () => {
  const { user, logout } = useAuth()
  const [papers, setPapers] = useState([])
  const [loading, setLoading] = useState(true)
  const [activePage, setActivePage] = useState('dashboard')

  useEffect(() => {
    const fetchPapers = async () => {
      try {
        const res = await api.get('/papers/my')
        setPapers(res.data)
      } catch (err) {
        console.error('Failed to fetch papers:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchPapers()
  }, [])

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase()
    : 'S'

  const statusColor = (status) => {
    if (status === 'Approved') return { background: '#22c55e22', color: '#22c55e' }
    if (status === 'Needs Revision') return { background: '#f97316aa', color: '#fff' }
    return { background: '#ffffff22', color: '#fff' }
  }

  return (
    <div style={styles.root}>

      {/* sidebar */}
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
            style={{ ...styles.navItem, ...(activePage === 'dashboard' ? styles.navItemActive : {}) }}
            onClick={() => setActivePage('dashboard')}
          >
            Dashboard
          </div>
          <div
            style={{ ...styles.navItem, ...(activePage === 'uploads' ? styles.navItemActive : {}) }}
            onClick={() => setActivePage('uploads')}
          >
            My Uploads
          </div>
          <div
            style={{ ...styles.navItem, ...(activePage === 'activity' ? styles.navItemActive : {}) }}
            onClick={() => setActivePage('activity')}
          >
            Activity Log
          </div>
        </nav>

        <div style={styles.profile}>
          <div style={styles.avatar}>{initials}</div>
          <div>
            <div style={styles.profileName}>{user?.name}</div>
            <div style={styles.profileRole}>BSIT</div>
          </div>
        </div>
      </div>

      {/* main content */}
      <div style={styles.main}>

        {/* top bar */}
        <div style={styles.topBar}>
          <div>
            <h1 style={styles.heading}>Welcome back, {user?.name?.split(' ')[0]}!</h1>
            <p style={styles.subheading}>Here is what's happening with your research projects.</p>
          </div>
          <div style={styles.topBarRight}>
            <button style={styles.uploadBtn} onClick={() => setActivePage('upload')}>
              New Upload
            </button>
            <button style={styles.logoutBtn} onClick={logout}>Logout</button>
          </div>
        </div>

        <div style={styles.contentRow}>

          {/* papers section */}
          <div style={styles.papersSection}>
            <h2 style={styles.sectionTitle}>My Research</h2>

            {loading ? (
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>Loading papers...</p>
            ) : (
              <div style={styles.grid}>
                {papers.map(paper => (
                  <div key={paper.paper_id} style={styles.card}>
                    <div style={styles.cardTop}>
                      <span style={{ ...styles.statusBadge, ...statusColor(paper.status) }}>
                        {paper.status}
                      </span>
                      <span style={styles.updatedText}>Updated recently</span>
                    </div>
                    <h3 style={styles.cardTitle}>{paper.title}</h3>
                    <p style={styles.cardDesc}>{paper.authors}</p>
                    <div style={styles.cardDivider} />
                    <div style={styles.cardBottom}>
                      <span style={styles.reviewText}>Program: {paper.program}</span>
                      <span style={styles.dots}>•••</span>
                    </div>
                  </div>
                ))}

                {/* start new draft card */}
                <div style={styles.draftCard} onClick={() => setActivePage('upload')}>
                  <span style={styles.draftText}>Start New Draft</span>
                </div>
              </div>
            )}
          </div>

          {/* recent activity */}
          <div style={styles.activitySection}>
            <h2 style={styles.sectionTitle}>Recent Activity</h2>
            <div style={styles.activityCard}>
              {papers.length === 0 && !loading ? (
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', textAlign: 'center', padding: '1rem' }}>
                  No activity yet. Upload your first paper!
                </p>
              ) : (
                papers.slice(0, 3).map(paper => (
                  <div key={paper.paper_id} style={styles.activityItem}>
                    <div style={{ ...styles.activityDot, ...statusColor(paper.status) }} />
                    <div>
                      <p style={styles.activityText}>
                        <strong>{paper.title}</strong> — {paper.status}
                      </p>
                      <p style={styles.activityTime}>Recently submitted</p>
                    </div>
                  </div>
                ))
              )}
              <div style={styles.activityDivider} />
              <p style={styles.viewHistory}>View Full History</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

const styles = {
  root: {
    display: 'flex',
    minHeight: '100vh',
    background: '#1e2a6e',
    fontFamily: 'sans-serif',
    color: 'white',
  },
  sidebar: {
    width: '220px',
    minHeight: '100vh',
    background: '#182260',
    display: 'flex',
    flexDirection: 'column',
    padding: '1.5rem 0',
    flexShrink: 0,
  },
  logoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '0 1.25rem',
    marginBottom: '2rem',
  },
  logoIcon: {
    width: '32px',
    height: '32px',
    background: '#ffffff15',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: '16px',
    fontWeight: '700',
    letterSpacing: '1px',
    color: 'white',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    padding: '0 .75rem',
    flex: 1,
  },
  navItem: {
    padding: '10px 14px',
    borderRadius: '8px',
    fontSize: '14px',
    color: 'rgba(255,255,255,0.6)',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  navItemActive: {
    background: '#ffffff18',
    color: 'white',
    fontWeight: '500',
  },
  profile: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '1rem 1.25rem',
    borderTop: '1px solid rgba(255,255,255,0.1)',
    marginTop: 'auto',
  },
  avatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    background: '#FFBE4F',
    color: '#1e2a6e',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '13px',
    fontWeight: '700',
    flexShrink: 0,
  },
  profileName: {
    fontSize: '13px',
    fontWeight: '500',
    color: 'white',
  },
  profileRole: {
    fontSize: '11px',
    color: 'rgba(255,255,255,0.5)',
  },
  main: {
    flex: 1,
    padding: '2rem 2.5rem',
    overflowY: 'auto',
  },
  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '2rem',
  },
  topBarRight: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
  },
  heading: {
    fontSize: 'clamp(1.5rem, 3vw, 2.25rem)',
    fontWeight: '700',
    margin: 0,
  },
  subheading: {
    fontSize: '14px',
    color: 'rgba(255,255,255,0.5)',
    marginTop: '4px',
  },
  uploadBtn: {
    padding: '12px 24px',
    background: '#FFBE4F',
    color: '#1e2a6e',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  logoutBtn: {
    padding: '12px 16px',
    background: 'rgba(255,255,255,0.1)',
    color: 'white',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: '10px',
    fontSize: '14px',
    cursor: 'pointer',
  },
  contentRow: {
    display: 'flex',
    gap: '2rem',
    alignItems: 'flex-start',
  },
  papersSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '700',
    marginBottom: '1.25rem',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '1rem',
  },
  card: {
    background: '#ffffff0f',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '14px',
    padding: '1.25rem',
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  cardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.75rem',
  },
  statusBadge: {
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '500',
  },
  updatedText: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.4)',
  },
  cardTitle: {
    fontSize: '16px',
    fontWeight: '700',
    marginBottom: '0.5rem',
    lineHeight: 1.3,
  },
  cardDesc: {
    fontSize: '13px',
    color: 'rgba(255,255,255,0.55)',
    marginBottom: '1rem',
    lineHeight: 1.5,
  },
  cardDivider: {
    borderTop: '1px solid rgba(255,255,255,0.1)',
    marginBottom: '0.75rem',
  },
  cardBottom: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewText: {
    fontSize: '12px',
    color: '#FFBE4F',
  },
  dots: {
    fontSize: '16px',
    color: 'rgba(255,255,255,0.4)',
    cursor: 'pointer',
    letterSpacing: '2px',
  },
  draftCard: {
    background: 'transparent',
    border: '2px dashed rgba(255,255,255,0.2)',
    borderRadius: '14px',
    padding: '1.25rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    minHeight: '180px',
    transition: 'border-color 0.2s',
  },
  draftText: {
    fontSize: '14px',
    color: 'rgba(255,255,255,0.35)',
  },
  activitySection: {
    width: '280px',
    flexShrink: 0,
  },
  activityCard: {
    background: '#ffffff0f',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '14px',
    padding: '1.25rem',
  },
  activityItem: {
    display: 'flex',
    gap: '10px',
    alignItems: 'flex-start',
    marginBottom: '1rem',
  },
  activityDot: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  activityText: {
    fontSize: '13px',
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 1.4,
    margin: 0,
  },
  activityTime: {
    fontSize: '11px',
    color: 'rgba(255,255,255,0.35)',
    margin: '3px 0 0',
  },
  activityDivider: {
    borderTop: '1px solid rgba(255,255,255,0.1)',
    margin: '1rem 0',
  },
  viewHistory: {
    fontSize: '13px',
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    cursor: 'pointer',
    margin: 0,
  },
}

export default StudentDashboard