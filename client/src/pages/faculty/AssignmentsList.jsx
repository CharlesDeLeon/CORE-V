// pages/faculty/AssignmentsList.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'

const AssignmentsList = () => {
  const navigate = useNavigate()
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeFilter, setActiveFilter] = useState('All')

  useEffect(() => {
    api.get('/faculty/assignments')
      .then(res => setAssignments(res.data))
      .catch(() => setError('Failed to load assignments.'))
      .finally(() => setLoading(false))
  }, [])

  const filteredAssignments = assignments.filter(a => {
    if (activeFilter === 'All') return true
    return a.role?.toLowerCase() === activeFilter.toLowerCase()
  })

  const roleColor = (role) => {
    if (!role) return { background: '#ffffff22', color: '#fff' }
    if (role.toLowerCase() === 'adviser')
      return { background: '#FFBE4F22', color: '#FFBE4F' }
    if (role.toLowerCase() === 'panelist')
      return { background: '#818cf822', color: '#818cf8' }
    return { background: '#ffffff22', color: '#fff' }
  }

  return (
    <>
      <div style={styles.topBar}>
        <div>
          <h1 style={styles.heading}>My Assignments</h1>
          <p style={styles.subheading}>
            Groups assigned to you as adviser or panelist.
          </p>
        </div>
        <div style={styles.statsRow}>
          <div style={styles.statBadge}>
            <span style={styles.statNum}>{assignments.length}</span>
            <span style={styles.statLabel}>Total</span>
          </div>
          <div style={styles.statBadge}>
            <span style={{ ...styles.statNum, color: '#FFBE4F' }}>
              {assignments.filter(a => a.role?.toLowerCase() === 'adviser').length}
            </span>
            <span style={styles.statLabel}>Adviser</span>
          </div>
          <div style={styles.statBadge}>
            <span style={{ ...styles.statNum, color: '#818cf8' }}>
              {assignments.filter(a => a.role?.toLowerCase() === 'panelist').length}
            </span>
            <span style={styles.statLabel}>Panelist</span>
          </div>
        </div>
      </div>

      {/* Filter Row */}
      <div style={styles.filterRow}>
        {['All', 'Adviser', 'Panelist'].map(f => (
          <button
            key={f}
            style={{ ...styles.filterBtn, ...(activeFilter === f ? styles.filterBtnActive : {}) }}
            onClick={() => setActiveFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      {loading && <p style={styles.dimText}>Loading assignments...</p>}
      {error && <p style={{ color: '#f97316', fontSize: '14px' }}>{error}</p>}

      {!loading && !error && (
        <>
          {filteredAssignments.length === 0 ? (
            <div style={styles.emptyState}>
              <p style={styles.emptyText}>No assignments found.</p>
            </div>
          ) : (
            <div style={styles.grid}>
              {filteredAssignments.map(a => (
                <div
                  key={a.group_id}
                  style={styles.card}
                  onClick={() => navigate(`/faculty/assignments/${a.group_id}`)}
                >
                  {/* Card Header */}
                  <div style={styles.cardTop}>
                    <span style={{ ...styles.roleBadge, ...roleColor(a.role) }}>
                      {a.role ?? 'Unassigned'}
                    </span>
                    <span style={styles.syText}>{a.school_year ?? '—'}</span>
                  </div>

                  {/* Group Name */}
                  <h3 style={styles.groupName}>{a.group_name}</h3>
                  <p style={styles.program}>{a.program}</p>

                  <div style={styles.divider} />

                  {/* Stats Row */}
                  <div style={styles.cardStats}>
                    <div style={styles.stat}>
                      <span style={styles.statIcon}>👥</span>
                      <span style={styles.statValue}>{a.student_count ?? 0}</span>
                      <span style={styles.statDesc}>Students</span>
                    </div>
                    <div style={styles.statSep} />
                    <div style={styles.stat}>
                      <span style={styles.statIcon}>📄</span>
                      <span style={styles.statValue}>{a.submission_count ?? 0}</span>
                      <span style={styles.statDesc}>Submissions</span>
                    </div>
                  </div>

                  {/* View Arrow */}
                  <div style={styles.cardFooter}>
                    <span style={styles.viewLink}>View Group →</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </>
  )
}

const styles = {
  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '1.5rem',
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
  filterRow: {
    display: 'flex',
    gap: '8px',
    marginBottom: '1.5rem',
  },
  filterBtn: {
    padding: '6px 16px',
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
  emptyState: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '200px',
    border: '2px dashed rgba(255,255,255,0.1)',
    borderRadius: '14px',
  },
  emptyText: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: '14px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '1rem',
  },
  card: {
    background: '#ffffff0f',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '14px',
    padding: '1.25rem',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    transition: 'border-color 0.15s, background 0.15s',
  },
  cardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roleBadge: {
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: '600',
  },
  syText: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.4)',
  },
  groupName: {
    fontSize: '16px',
    fontWeight: '700',
    margin: '0.25rem 0 0',
    lineHeight: 1.3,
  },
  program: {
    fontSize: '13px',
    color: 'rgba(255,255,255,0.5)',
    margin: 0,
  },
  divider: {
    borderTop: '1px solid rgba(255,255,255,0.08)',
    margin: '0.5rem 0',
  },
  cardStats: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  stat: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  statIcon: {
    fontSize: '14px',
  },
  statValue: {
    fontSize: '15px',
    fontWeight: '700',
  },
  statDesc: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.45)',
  },
  statSep: {
    width: '1px',
    height: '20px',
    background: 'rgba(255,255,255,0.1)',
  },
  cardFooter: {
    marginTop: '0.5rem',
  },
  viewLink: {
    fontSize: '12px',
    color: '#FFBE4F',
    fontWeight: '600',
  },
}

export default AssignmentsList