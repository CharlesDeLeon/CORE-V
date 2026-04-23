// pages/faculty/FacultyDashboard.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuth from '../../context/useAuth'
import api from '../../services/api'

const FILTERS = ['All', 'Pending Review', 'Approved', 'Needs Revision']

const FacultyDashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeFilter, setActiveFilter] = useState('All')

  useEffect(() => {
    api.get('/faculty/submissions')
      .then(res => setSubmissions(res.data))
      .catch(() => setError('Failed to load submissions.'))
      .finally(() => setLoading(false))
  }, [])

  const timeAgo = (dateStr) => {
    // eslint-disable-next-line react-hooks/purity
    const days = Math.floor((Date.now() - new Date(dateStr)) / 86400000)
    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    return `${days} days ago`
  }

  const statusColor = (status) => {
    if (status === 'Approved') return { background: '#22c55e22', color: '#22c55e' }
    if (status === 'Needs Revision') return { background: '#f9731622', color: '#f97316' }
    if (status === 'Rejected') return { background: '#ef444422', color: '#ef4444' }
    return { background: '#ffffff22', color: '#fff' }
  }

  const reviewColor = (reviewStatus) => {
    if (reviewStatus === 'Approved') return { background: '#22c55e22', color: '#22c55e' }
    if (reviewStatus === 'For Revision') return { background: '#f9731622', color: '#f97316' }
    if (reviewStatus === 'Rejected') return { background: '#ef444422', color: '#ef4444' }
    return { background: '#ffffff22', color: 'rgba(255,255,255,0.7)' }
  }

  const filteredSubmissions = submissions.filter(s => {
    if (activeFilter === 'All') return true
    if (activeFilter === 'Pending Review') return s.review_status === 'Pending'
    if (activeFilter === 'Approved') return s.review_status === 'Approved'
    if (activeFilter === 'Needs Revision') return s.review_status === 'For Revision'
    return true
  })

  return (
    <>
      <div style={styles.topBar}>
        <div>
          <h1 style={styles.heading}>Welcome back, {user?.name?.split(' ')[0]}!</h1>
          <p style={styles.subheading}>Here are the research submissions assigned to you.</p>
        </div>
        <div style={styles.statsRow}>
          <div style={styles.statBadge}>
            <span style={styles.statNum}>{submissions.length}</span>
            <span style={styles.statLabel}>Total</span>
          </div>
          <div style={styles.statBadge}>
            <span style={{ ...styles.statNum, color: '#FFBE4F' }}>
              {submissions.filter(s => s.review_status === 'Pending').length}
            </span>
            <span style={styles.statLabel}>Pending</span>
          </div>
          <div style={styles.statBadge}>
            <span style={{ ...styles.statNum, color: '#22c55e' }}>
              {submissions.filter(s => s.review_status === 'Approved').length}
            </span>
            <span style={styles.statLabel}>Approved</span>
          </div>
        </div>
      </div>

      <div style={styles.contentRow}>

        <div style={styles.tableSection}>
          <div style={styles.tableHeader}>
            <h2 style={styles.sectionTitle}>Assigned Submissions</h2>
            <div style={styles.filterRow}>
              {FILTERS.map(f => (
                <button
                  key={f}
                  style={{ ...styles.filterBtn, ...(activeFilter === f ? styles.filterBtnActive : {}) }}
                  onClick={() => setActiveFilter(f)}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {loading && <p style={styles.dimText}>Loading submissions...</p>}
          {error && <p style={{ color: '#f97316', fontSize: '14px' }}>{error}</p>}

          {!loading && !error && (
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    {['Title', 'Group', 'Authors', 'Stage', 'Status', 'Review', 'Comments', 'Submitted'].map(col => (
                      <th key={col} style={styles.th}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredSubmissions.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ ...styles.td, textAlign: 'center', color: 'rgba(255,255,255,0.35)', padding: '2rem' }}>
                        No submissions found.
                      </td>
                    </tr>
                  ) : (
                    filteredSubmissions.map(s => (
                      <tr
                        key={s.submission_id}
                        style={styles.tr}
                        onClick={() => navigate(`/faculty/submission/${s.submission_id}`)}
                      >
                        <td style={{ ...styles.td, ...styles.tdTitle }}>{s.title}</td>
                        <td style={styles.td}>{s.group_name}</td>
                        <td style={{ ...styles.td, ...styles.tdAuthors }}>{s.authors}</td>
                        <td style={styles.td}>
                          <span style={styles.stageBadge}>{s.stage}</span>
                        </td>
                        <td style={styles.td}>
                          <span style={{ ...styles.badge, ...statusColor(s.status) }}>{s.status}</span>
                        </td>
                        <td style={styles.td}>
                          <span style={{ ...styles.badge, ...reviewColor(s.review_status) }}>{s.review_status}</span>
                        </td>
                        <td style={styles.td}>
                          <span
                            style={styles.commentsLink}
                            onClick={e => {
                              e.stopPropagation()
                              navigate(`/faculty/submission/${s.submission_id}#comments`)
                            }}
                          >
                            💬 {s.comments_count ?? 0}
                          </span>
                        </td>
                        <td style={{ ...styles.td, ...styles.tdDate }}>{timeAgo(s.submitted_at)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div style={styles.activitySection}>
          <h2 style={styles.sectionTitle}>Recent Activity</h2>
          <div style={styles.activityCard}>
            {!loading && submissions.length === 0 ? (
              <p style={{ ...styles.dimText, textAlign: 'center', padding: '1rem' }}>
                No activity yet.
              </p>
            ) : (
              submissions.slice(0, 4).map(s => (
                <div key={s.submission_id} style={styles.activityItem}>
                  <div style={{ ...styles.activityDot, background: reviewColor(s.review_status).color }} />
                  <div>
                    <p style={styles.activityText}>
                      <strong>{s.title}</strong> — {s.review_status}
                    </p>
                    <p style={styles.activityTime}>{timeAgo(s.submitted_at)}</p>
                  </div>
                </div>
              ))
            )}
            <div style={styles.activityDivider} />
            <p style={{ ...styles.dimText, textAlign: 'center' }}>
              {filteredSubmissions.length} submission{filteredSubmissions.length !== 1 ? 's' : ''} shown
            </p>
          </div>
        </div>

      </div>
    </>
  )
}

const styles = {
  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
  statsRow: {
    display: 'flex',
    gap: '0.75rem',
  },
  statBadge: {
    background: '#ffffff0f',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
    padding: '0.6rem 1.1rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
    minWidth: '64px',
  },
  statNum: {
    fontSize: '20px',
    fontWeight: '700',
    lineHeight: 1,
  },
  statLabel: {
    fontSize: '11px',
    color: 'rgba(255,255,255,0.45)',
  },
  contentRow: {
    display: 'flex',
    gap: '2rem',
    alignItems: 'flex-start',
  },
  tableSection: {
    flex: 1,
    minWidth: 0,
  },
  tableHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.25rem',
    flexWrap: 'wrap',
    gap: '0.75rem',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '700',
    margin: 0,
  },
  filterRow: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  filterBtn: {
    padding: '6px 14px',
    borderRadius: '20px',
    border: '1px solid rgba(255,255,255,0.2)',
    background: 'transparent',
    color: 'rgba(255,255,255,0.6)',
    fontSize: '12px',
    fontWeight: '500',
    cursor: 'pointer',
  },
  filterBtnActive: {
    background: '#FFBE4F',
    color: '#1e2a6e',
    border: '1px solid #FFBE4F',
    fontWeight: '700',
  },
  dimText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: '14px',
  },
  tableWrapper: {
    overflowX: 'auto',
    borderRadius: '14px',
    border: '1px solid rgba(255,255,255,0.1)',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '13px',
  },
  th: {
    padding: '12px 14px',
    textAlign: 'left',
    color: 'rgba(255,255,255,0.45)',
    fontWeight: '600',
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    background: '#ffffff08',
    whiteSpace: 'nowrap',
  },
  tr: {
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    cursor: 'pointer',
    transition: 'background 0.15s',
  },
  td: {
    padding: '13px 14px',
    color: 'rgba(255,255,255,0.85)',
    verticalAlign: 'middle',
  },
  tdTitle: {
    fontWeight: '600',
    maxWidth: '200px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  tdAuthors: {
    maxWidth: '140px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    color: 'rgba(255,255,255,0.55)',
  },
  tdDate: {
    whiteSpace: 'nowrap',
    color: 'rgba(255,255,255,0.4)',
    fontSize: '12px',
  },
  badge: {
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: '500',
    whiteSpace: 'nowrap',
  },
  stageBadge: {
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: '500',
    background: '#ffffff14',
    color: '#FFBE4F',
    whiteSpace: 'nowrap',
  },
  commentsLink: {
    fontSize: '13px',
    color: 'rgba(255,255,255,0.6)',
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: '8px',
    display: 'inline-block',
  },
  activitySection: {
    width: '260px',
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
    marginTop: '4px',
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
}

export default FacultyDashboard