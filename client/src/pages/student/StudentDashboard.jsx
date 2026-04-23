// pages/student/StudentDashboard.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuth from '../../context/useAuth'
import api from '../../services/api'

const StudentDashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [papers, setPapers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    api.get('/papers/my')
      .then(res => setPapers(res.data))
      .catch(() => setError('Failed to load papers.'))
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
    return { background: '#ffffff22', color: '#fff' }
  }

  return (
    <>
      <div style={styles.topBar}>
        <div>
          <h1 style={styles.heading}>Welcome back, {user?.name?.split(' ')[0]}!</h1>
          <p style={styles.subheading}>Here's what's happening with your research.</p>
        </div>
        <button style={styles.uploadBtn} onClick={() => navigate('/student/upload')}>
          + New Upload
        </button>
      </div>

      <div style={styles.contentRow}>

        <div style={styles.papersSection}>
          <h2 style={styles.sectionTitle}>My Research</h2>

          {loading && <p style={styles.dimText}>Loading papers...</p>}
          {error && <p style={{ color: '#f97316', fontSize: '14px' }}>{error}</p>}

          {!loading && !error && (
            <div style={styles.grid}>
              {papers.map(paper => (
                <div
                  key={paper.paper_id}
                  style={styles.card}
                  onClick={() => navigate(`/student/paper/${paper.paper_id}`)}
                >
                  <div style={styles.cardTop}>
                    <span style={{ ...styles.statusBadge, ...statusColor(paper.status) }}>
                      {paper.status}
                    </span>
                    <span style={styles.updatedText}>{timeAgo(paper.created_at)}</span>
                  </div>
                  <h3 style={styles.cardTitle}>{paper.title}</h3>
                  <p style={styles.cardDesc}>{paper.authors}</p>
                  <div style={styles.cardDivider} />
                  <div style={styles.cardBottom}>
                    <span style={styles.reviewText}>Program: {paper.program}</span>
                  </div>
                </div>
              ))}

              <div style={styles.draftCard} onClick={() => navigate('/student/upload')}>
                <span style={styles.draftText}>+ Start New Draft</span>
              </div>
            </div>
          )}
        </div>

        <div style={styles.activitySection}>
          <h2 style={styles.sectionTitle}>Recent Activity</h2>
          <div style={styles.activityCard}>
            {!loading && papers.length === 0 ? (
              <p style={{ ...styles.dimText, textAlign: 'center', padding: '1rem' }}>
                No activity yet.
              </p>
            ) : (
              papers.slice(0, 3).map(paper => (
                <div key={paper.paper_id} style={styles.activityItem}>
                  <div style={{ ...styles.activityDot, background: statusColor(paper.status).color }} />
                  <div>
                    <p style={styles.activityText}>
                      <strong>{paper.title}</strong> — {paper.status}
                    </p>
                    <p style={styles.activityTime}>{timeAgo(paper.created_at)}</p>
                  </div>
                </div>
              ))
            )}
            <div style={styles.activityDivider} />
            <p
              style={{ ...styles.dimText, textAlign: 'center', cursor: 'pointer' }}
              onClick={() => navigate('/student/upload')}
            >
              View Full History
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
  dimText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: '14px',
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

export default StudentDashboard