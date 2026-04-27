import { useEffect, useState } from 'react'
import useAuth from '../../context/useAuth'
import { useNavigate } from 'react-router-dom'
import {
  getAdminUsers,
  getAuditSummary,
  getUserRoleStats,
} from '../../services/adminService'

const ROLE_LABELS = {
  student: 'Student',
  faculty: 'Faculty',
  coordinator: 'Coordinator',
  sysadmin: 'System Administrator'
}

const AdminDashboard = () => {
  const { user } = useAuth()
  const [users, setUsers] = useState([])
  const [roleStats, setRoleStats] = useState([])
  const [auditSummary, setAuditSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  const loadDashboard = async () => {
    setLoading(true)
    setError('')

    try {
      const query = {
        limit: 8,
        ...(search ? { search: search.trim() } : {})
      }

      const [usersResponse, statsResponse, auditResponse] = await Promise.all([
        getAdminUsers(query),
        getUserRoleStats(),
        getAuditSummary()
      ])

      setUsers(usersResponse.data || [])
      setRoleStats(statsResponse || [])
      setAuditSummary(auditResponse || null)
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to load dashboard data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboard()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadDashboard()
    }, 350)

    return () => window.clearTimeout(timeoutId)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  const recentAuditItems = auditSummary?.actionsByType?.slice(0, 5) || []

  return (
    <>
      <div style={styles.topBar}>
        <div>
          <h1 style={styles.heading}>Welcome back, {user?.name?.split(' ')[0]}!</h1>
          <p style={styles.subheading}>Here's your system overview.</p>
        </div>
      </div>

      <div style={styles.contentRow}>

        <div style={styles.mainSection}>
          <div style={styles.metricsGrid}>
            {roleStats.map(stat => (
              <div key={stat.role} style={styles.metricCard}>
                <div style={styles.metricLabel}>{ROLE_LABELS[stat.role]}</div>
                <div style={styles.metricValue}>{stat.count}</div>
              </div>
            ))}
          </div>

          <h2 style={styles.sectionTitle}>All Users</h2>

          {error && <p style={{ color: '#f97316', fontSize: '14px' }}>{error}</p>}

          {loading ? (
            <p style={styles.dimText}>Loading users...</p>
          ) : (
            <>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name or email..."
                style={styles.searchInput}
              />

              <div style={styles.usersGrid}>
                {users.length === 0 ? (
                  <p style={styles.dimText}>No users found.</p>
                ) : (
                  users.map(person => (
                    <div key={person.user_id} style={styles.userCard}>
                      <div style={styles.userCardTop}>
                        <div>
                          <h3 style={styles.userName}>{person.name}</h3>
                          <p style={styles.userEmail}>{person.email}</p>
                        </div>
                        <span style={{...styles.statusDot, background: person.is_active ? '#22c55e' : '#999'}} />
                      </div>
                      <div style={styles.cardDivider} />
                      <div style={styles.userCardBottom}>
                        <span style={styles.roleLabel}>{ROLE_LABELS[person.role]}</span>
                        <span style={styles.programLabel}>{person.program || 'N/A'}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>

        <div style={styles.activitySection}>
          <h2 style={styles.sectionTitle}>Recent Activity</h2>
          <div style={styles.activityCard}>
            {loading ? (
              <p style={{ ...styles.dimText, textAlign: 'center', padding: '1rem' }}>
                Loading activity...
              </p>
            ) : recentAuditItems.length === 0 ? (
              <p style={{ ...styles.dimText, textAlign: 'center', padding: '1rem' }}>
                No recent activity.
              </p>
            ) : (
              <>
                {recentAuditItems.map(item => (
                  <div key={item.action} style={styles.activityItem}>
                    <div style={{ ...styles.activityDot, background: '#FFBE4F' }} />
                    <div style={{ flex: 1 }}>
                      <p style={styles.activityText}>
                        <strong>{formatAuditLabel(item.action)}</strong>
                      </p>
                      <p style={styles.activityMeta}>{item.count} {item.count === 1 ? 'event' : 'events'}</p>
                    </div>
                  </div>
                ))}
                <div style={styles.activityDivider} />
                <p style={{ ...styles.dimText, textAlign: 'center', fontSize: '12px' }} onClick={() => navigate('/admin/auditTrail')}>
                  Audit log monitored
                </p>
              </>
            )}
          </div>
        </div>

      </div>
    </>
  )
}

const formatAuditLabel = (action) => (
  String(action || '')
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, character => character.toUpperCase())
)

const styles = {
  topBar: {
    marginBottom: '2rem',
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
  contentRow: {
    display: 'flex',
    gap: '2rem',
    alignItems: 'flex-start',
  },
  mainSection: {
    flex: 1,
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: '1rem',
    marginBottom: '2rem',
  },
  metricCard: {
    background: '#ffffff0f',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '14px',
    padding: '1.5rem',
    textAlign: 'center',
  },
  metricLabel: {
    fontSize: '13px',
    color: 'rgba(255,255,255,0.6)',
    marginBottom: '0.5rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  metricValue: {
    fontSize: '2.5rem',
    fontWeight: '800',
    color: '#FFBE4F',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '700',
    marginBottom: '1.25rem',
    marginTop: '1.5rem',
  },
  dimText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: '14px',
  },
  searchInput: {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.15)',
    background: '#ffffff0f',
    color: '#fff',
    fontSize: '14px',
    marginBottom: '1rem',
  },
  usersGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: '1rem',
  },
  userCard: {
    background: '#ffffff0f',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '14px',
    padding: '1.25rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  userCardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '0.75rem',
  },
  userName: {
    fontSize: '15px',
    fontWeight: '700',
    margin: 0,
    marginBottom: '4px',
  },
  userEmail: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.5)',
    margin: 0,
  },
  statusDot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  cardDivider: {
    borderTop: '1px solid rgba(255,255,255,0.1)',
    margin: '0.75rem 0',
  },
  userCardBottom: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '12px',
  },
  roleLabel: {
    color: '#FFBE4F',
    fontWeight: '600',
  },
  programLabel: {
    color: 'rgba(255,255,255,0.4)',
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
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    flexShrink: 0,
    marginTop: '5px',
  },
  activityText: {
    fontSize: '13px',
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 1.4,
    margin: 0,
  },
  activityMeta: {
    fontSize: '11px',
    color: 'rgba(255,255,255,0.4)',
    margin: '3px 0 0',
  },
  activityDivider: {
    borderTop: '1px solid rgba(255,255,255,0.1)',
    margin: '1rem 0',
  },
}

export default AdminDashboard
