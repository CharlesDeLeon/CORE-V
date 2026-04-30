import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../services/api'
import StatusBadge from '../../components/StatusBadge'

const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

const PaperDetail = () => {
  const { paperId } = useParams()
  const navigate = useNavigate()
  const [paper, setPaper] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expandedReview, setExpandedReview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState(null)

  const fetchPaper = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/papers/${paperId}`)
      setPaper(res.data)
      setError(null)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load paper details')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPaper()
  }, [paperId])

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const timeAgo = (dateStr) => {
    const days = Math.floor((Date.now() - new Date(dateStr)) / 86400000)
    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    return `${days} days ago`
  }

  const statusColor = (status) => {
    if (!status) return { background: '#ffffff22', color: '#fff' }
    const normalizedStatus = status.toLowerCase()
    if (normalizedStatus === 'approved') return { background: '#22c55e22', color: '#22c55e' }
    if (normalizedStatus === 'needs_revision' || normalizedStatus === 'under_review') {
      return { background: '#f9731622', color: '#f97316' }
    }
    if (normalizedStatus === 'rejected') return { background: '#ef444422', color: '#ef4444' }
    return { background: '#ffffff22', color: '#fff' }
  }

  const getStatusIcon = (status) => {
    if (!status) return '○'
    const s = status.toLowerCase()
    if (s === 'approved') return '✓'
    if (s === 'needs_revision') return '↻'
    if (s === 'rejected') return '✕'
    return '•'
  }

  const downloadFile = (filePath, fileName) => {
    const fileNameOnly = filePath?.split('\\').pop()?.split('/').pop() || filePath
    const link = document.createElement('a')
    link.href = `http://localhost:5000/uploads/${encodeURIComponent(fileNameOnly)}`
    link.download = fileName
    link.click()
  }

  const handleUploadNewVersion = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) return

    if (!ALLOWED_TYPES.includes(file.type)) {
      setUploadError('Only PDF, DOC, and DOCX files are allowed.')
      return
    }

    if (file.size > 20 * 1024 * 1024) {
      setUploadError('File exceeds the 20 MB limit.')
      return
    }

    const formData = new FormData()
    formData.append('file', file)

    try {
      setUploading(true)
      setUploadError(null)
      await api.post(`/papers/${paperId}/versions`, formData)
      await fetchPaper()
    } catch (err) {
      setUploadError(err.response?.data?.message || 'Failed to upload new version.')
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.topBar}>
          <button style={styles.backBtn} onClick={() => navigate(-1)}>← Back</button>
        </div>
        <p style={styles.dimText}>Loading paper details...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.topBar}>
          <button style={styles.backBtn} onClick={() => navigate(-1)}>← Back</button>
        </div>
        <div style={styles.errorBox}>
          <p style={styles.errorText}>{error}</p>
          <button style={styles.retryBtn} onClick={() => window.location.reload()}>
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (!paper) {
    return (
      <div style={styles.container}>
        <div style={styles.topBar}>
          <button style={styles.backBtn} onClick={() => navigate(-1)}>← Back</button>
        </div>
        <p style={styles.dimText}>Paper not found</p>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.topBar}>
        <button style={styles.backBtn} onClick={() => navigate(-1)}>← Back</button>
        <div style={styles.topActions}>
          <label style={styles.uploadBtnLabel}>
            {uploading ? 'Uploading...' : 'Upload new version'}
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleUploadNewVersion}
              style={styles.hiddenFileInput}
              disabled={uploading}
            />
          </label>
          <StatusBadge status={paper.status} />
        </div>
      </div>

      {uploadError && <div style={styles.uploadError}>{uploadError}</div>}

      <div style={styles.contentRow}>
        <div style={styles.leftColumn}>
          <div style={styles.section}>
            <h1 style={styles.title}>{paper.title}</h1>
            <div style={styles.metadataGrid}>
              <div>
                <p style={styles.metaLabel}>AUTHORS</p>
                <p style={styles.metaValue}>{paper.authors}</p>
              </div>
              <div>
                <p style={styles.metaLabel}>PROGRAM</p>
                <p style={styles.metaValue}>{paper.program}</p>
              </div>
              <div>
                <p style={styles.metaLabel}>SCHOOL YEAR</p>
                <p style={styles.metaValue}>{paper.school_year}</p>
              </div>
              <div>
                <p style={styles.metaLabel}>SUBMITTED</p>
                <p style={styles.metaValue}>{timeAgo(paper.created_at)}</p>
              </div>
            </div>
          </div>

          {paper.abstract && (
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>ABSTRACT</h2>
              <p style={styles.abstractText}>{paper.abstract}</p>
            </div>
          )}

          {paper.keywords && (
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>KEYWORDS</h2>
              <div style={styles.keywordsList}>
                {paper.keywords.split(',').map((keyword, idx) => (
                  <span key={idx} style={styles.keywordTag}>
                    {keyword.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>FILE VERSIONS</h2>
            {paper.versions && paper.versions.length > 0 ? (
              <div style={styles.versionsList}>
                {paper.versions.map((version, idx) => (
                  <div key={version.version_number} style={styles.versionCard}>
                    <div style={styles.versionHeader}>
                      <div>
                        <p style={styles.versionNumber}>
                          Version {version.version_number}
                          {idx === 0 && <span style={styles.currentBadge}>CURRENT</span>}
                        </p>
                        <p style={styles.versionFileName}>{version.file_name}</p>
                        <p style={styles.versionMeta}>
                          {formatFileSize(version.file_size)} • {timeAgo(version.uploaded_at)}
                        </p>
                      </div>
                      <button
                        style={styles.downloadBtn}
                        onClick={() => downloadFile(version.file_path, version.file_name)}
                      >
                        ↓ Download
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={styles.dimText}>No files uploaded yet</p>
            )}
          </div>
        </div>

        <div style={styles.rightColumn}>
          <div style={styles.statusPanel}>
            <p style={styles.statusLabel}>SUBMISSION STATUS</p>
            <div style={styles.statusDisplay}>
              <span style={{ ...styles.statusIcon, color: statusColor(paper.status).color }}>
                {getStatusIcon(paper.status)}
              </span>
              <p style={{ ...styles.statusText, color: statusColor(paper.status).color }}>
                {paper.status ? paper.status.replace('_', ' ').toUpperCase() : 'UNKNOWN'}
              </p>
            </div>
            <p style={styles.statusDate}>Updated {timeAgo(paper.updated_at)}</p>
          </div>

          <div style={styles.reviewsPanel}>
            <h2 style={styles.reviewsTitle}>REVIEWS & FEEDBACK</h2>
            {paper.reviews && paper.reviews.length > 0 ? (
              <div style={styles.reviewsList}>
                {paper.reviews.map((review) => (
                  <div key={review.review_id} style={styles.reviewCard}>
                    <div style={styles.reviewHeader}>
                      <div>
                        <p style={styles.reviewerName}>{review.reviewer_name}</p>
                        <p style={styles.reviewStatus}>
                          <span
                            style={{
                              ...styles.reviewStatusBadge,
                              ...statusColor(review.status_assigned)
                            }}
                          >
                            {review.status_assigned.replace('_', ' ').toUpperCase()}
                          </span>
                        </p>
                      </div>
                      <p style={styles.reviewDate}>{timeAgo(review.reviewed_at)}</p>
                    </div>

                    {review.comments && review.comments.length > 0 && (
                      <button
                        style={styles.expandBtn}
                        onClick={() =>
                          setExpandedReview(
                            expandedReview === review.review_id ? null : review.review_id
                          )
                        }
                      >
                        {expandedReview === review.review_id ? '▼' : '▶'} Comments (
                        {review.comments.length})
                      </button>
                    )}

                    {expandedReview === review.review_id && review.comments && (
                      <div style={styles.commentsSection}>
                        {review.comments.map((comment) => (
                          <div key={comment.comment_id} style={styles.commentBox}>
                            <p style={styles.commentAuthor}>{comment.author_name}</p>
                            <p style={styles.commentDate}>{timeAgo(comment.created_at)}</p>
                            <p style={styles.commentText}>{comment.comment_text}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p style={styles.dimText}>No reviews yet. Awaiting feedback...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: {
    padding: '2rem',
    color: '#fff',
  },
  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
  },
  topActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  backBtn: {
    background: 'transparent',
    border: 'none',
    color: 'rgba(255,255,255,0.7)',
    fontSize: '14px',
    cursor: 'pointer',
    padding: '8px 12px',
  },
  uploadBtnLabel: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '10px 14px',
    borderRadius: '10px',
    background: '#FFBE4F',
    color: '#1e2a6e',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  hiddenFileInput: {
    display: 'none',
  },
  uploadError: {
    marginBottom: '1rem',
    padding: '12px 14px',
    borderRadius: '10px',
    background: '#ef444422',
    border: '1px solid #ef4444',
    color: '#ef4444',
    fontSize: '14px',
  },
  contentRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 380px',
    gap: '2rem',
  },
  leftColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem',
  },
  rightColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem',
  },
  section: {
    background: '#ffffff0f',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '14px',
    padding: '1.5rem',
  },
  title: {
    fontSize: 'clamp(1.5rem, 3vw, 2rem)',
    fontWeight: '700',
    margin: '0 0 1.5rem 0',
  },
  metadataGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1.5rem',
  },
  metaLabel: {
    fontSize: '11px',
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    margin: '0 0 4px 0',
  },
  metaValue: {
    fontSize: '14px',
    color: '#fff',
    margin: 0,
  },
  sectionTitle: {
    fontSize: 'clamp(1.1rem, 2.5vw, 1.4rem)',
    fontWeight: '700',
    margin: '0 0 1rem 0',
  },
  abstractText: {
    fontSize: '14px',
    lineHeight: '1.6',
    color: 'rgba(255,255,255,0.9)',
    margin: 0,
  },
  keywordsList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  keywordTag: {
    display: 'inline-block',
    background: '#FFBE4F22',
    color: '#FFBE4F',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '500',
  },
  versionsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  versionCard: {
    background: '#1e2a6e22',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '10px',
    padding: '12px',
  },
  versionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '12px',
  },
  versionNumber: {
    fontSize: '14px',
    fontWeight: '600',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  currentBadge: {
    display: 'inline-block',
    background: '#22c55e',
    color: '#0b1228',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '10px',
    fontWeight: '700',
  },
  versionFileName: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.7)',
    margin: '4px 0 0 0',
  },
  versionMeta: {
    fontSize: '11px',
    color: 'rgba(255,255,255,0.4)',
    margin: '2px 0 0 0',
  },
  downloadBtn: {
    background: '#FFBE4F',
    color: '#1e2a6e',
    border: 'none',
    borderRadius: '8px',
    padding: '8px 12px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  statusPanel: {
    background: '#ffffff0f',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '14px',
    padding: '1.5rem',
  },
  statusLabel: {
    fontSize: '11px',
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    margin: '0 0 1rem 0',
  },
  statusDisplay: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    padding: '1.5rem 0',
  },
  statusIcon: {
    fontSize: '32px',
    fontWeight: '700',
  },
  statusText: {
    fontSize: '16px',
    fontWeight: '600',
    margin: 0,
  },
  statusDate: {
    fontSize: '11px',
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
    margin: 0,
  },
  reviewsPanel: {
    background: '#ffffff0f',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '14px',
    padding: '1.5rem',
  },
  reviewsTitle: {
    fontSize: 'clamp(1.1rem, 2.5vw, 1.4rem)',
    fontWeight: '700',
    margin: '0 0 1rem 0',
  },
  reviewsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  reviewCard: {
    background: '#1e2a6e22',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '10px',
    padding: '12px',
  },
  reviewHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '10px',
  },
  reviewerName: {
    fontSize: '13px',
    fontWeight: '600',
    margin: 0,
  },
  reviewStatus: {
    margin: '4px 0 0 0',
  },
  reviewStatusBadge: {
    display: 'inline-block',
    padding: '3px 8px',
    borderRadius: '4px',
    fontSize: '10px',
    fontWeight: '600',
  },
  reviewDate: {
    fontSize: '11px',
    color: 'rgba(255,255,255,0.4)',
    margin: 0,
  },
  expandBtn: {
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.2)',
    color: '#FFBE4F',
    padding: '6px 10px',
    borderRadius: '6px',
    fontSize: '11px',
    cursor: 'pointer',
    fontWeight: '500',
    width: '100%',
    textAlign: 'left',
    marginTop: '8px',
  },
  commentsSection: {
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: '1px solid rgba(255,255,255,0.08)',
  },
  commentBox: {
    marginBottom: '10px',
    paddingBottom: '10px',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
  },
  commentAuthor: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#FFBE4F',
    margin: '0 0 2px 0',
  },
  commentDate: {
    fontSize: '10px',
    color: 'rgba(255,255,255,0.3)',
    margin: '0 0 6px 0',
  },
  commentText: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.8)',
    lineHeight: '1.5',
    margin: 0,
  },
  dimText: {
    fontSize: '14px',
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
    padding: '2rem 1rem',
  },
  errorBox: {
    background: '#ef444422',
    border: '1px solid #ef4444',
    borderRadius: '14px',
    padding: '2rem',
    textAlign: 'center',
  },
  errorText: {
    fontSize: '14px',
    color: '#ef4444',
    margin: '0 0 1rem 0',
  },
  retryBtn: {
    background: '#ef4444',
    color: '#fff',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
  },
}

export default PaperDetail
