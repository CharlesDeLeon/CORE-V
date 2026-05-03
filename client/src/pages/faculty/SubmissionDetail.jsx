// pages/faculty/SubmissionDetail.jsx
import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import useAuth from '../../context/useAuth'
import api from '../../services/api'

const SubmissionDetail = () => {
  const { submission_id, group_id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [submission, setSubmission] = useState(null)
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [commentText, setCommentText] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)

  const [reviewStatus, setReviewStatus] = useState(null)
  const [submittingReview, setSubmittingReview] = useState(false)

  const [toast, setToast] = useState(null) // { message, type: 'success' | 'error' }
  const commentsEndRef = useRef(null)

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const endpoint = group_id
          ? `/faculty/assignments/${group_id}`
          : `/faculty/submissions/${submission_id}/comments`

        const res = await api.get(endpoint)
        setSubmission(res.data.submission)
        setComments(res.data.comments ?? [])
        setReviewStatus(res.data.submission?.review_status ?? null)
        setError(null)
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load submission details.')
      } finally {
        setLoading(false)
      }
    }
    fetchDetail()
  }, [submission_id, group_id])

  // Scroll to comments section if URL has #comments
  useEffect(() => {
    if (window.location.hash === '#comments' && commentsEndRef.current) {
      commentsEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [comments])

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  const timeAgo = (dateStr) => {
    if (!dateStr) return '—'
    const days = Math.floor((Date.now() - new Date(dateStr)) / 86400000)
    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    return `${days} days ago`
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    })
  }

  const statusColor = (status) => {
    if (!status) return { background: '#ffffff22', color: '#fff' }
    const s = status.toLowerCase()
    if (s === 'approved') return { background: '#22c55e22', color: '#22c55e' }
    if (s === 'for_revision' || s === 'needs revision') return { background: '#f9731622', color: '#f97316' }
    if (s === 'rejected') return { background: '#ef444422', color: '#ef4444' }
    return { background: '#ffffff22', color: 'rgba(255,255,255,0.8)' }
  }

  const downloadFile = (filePath, fileName) => {
    const link = document.createElement('a')
    link.href = `http://localhost:5000/${filePath}`
    link.download = fileName
    link.click()
  }

  const handleAddComment = async () => {
    if (!commentText.trim()) return
    const targetSubmissionId = submission?.submission_id || submission_id
    if (!targetSubmissionId) return

    setSubmittingComment(true)
    try {
      const res = await api.post(`/faculty/submissions/${targetSubmissionId}/comment`, {
        comment_text: commentText.trim(),
      })
      // Append new comment to list
      setComments(prev => [...prev, res.data.comment ?? {
        comment_id: Date.now(),
        author_name: user?.name,
        comment_text: commentText.trim(),
        created_at: new Date().toISOString(),
      }])
      setCommentText('')
      showToast('Comment posted successfully.')
      commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to post comment.', 'error')
    } finally {
      setSubmittingComment(false)
    }
  }

  const handleReview = async (statusAssigned) => {
    const targetSubmissionId = submission?.submission_id || submission_id
    if (!targetSubmissionId) return

    setSubmittingReview(true)
    try {
      await api.post(`/faculty/submissions/${targetSubmissionId}/review`, {
        status_assigned: statusAssigned,
      })
      setReviewStatus(statusAssigned)
      showToast(`Submission marked as "${statusAssigned.replace('_', ' ')}".`)
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to submit review.', 'error')
    } finally {
      setSubmittingReview(false)
    }
  }

  // ─── Loading / Error states ───────────────────────────────────────────────

  if (loading) {
    return (
      <div style={styles.container}>
        <button style={styles.backBtn} onClick={() => navigate(-1)}>← Back</button>
        <p style={styles.dimText}>Loading submission...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={styles.container}>
        <button style={styles.backBtn} onClick={() => navigate(-1)}>← Back</button>
        <div style={styles.errorBox}>
          <p style={styles.errorText}>{error}</p>
          <button style={styles.retryBtn} onClick={() => window.location.reload()}>
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (!submission) {
    return (
      <div style={styles.container}>
        <button style={styles.backBtn} onClick={() => navigate(-1)}>← Back</button>
        <p style={styles.dimText}>Submission not found.</p>
      </div>
    )
  }

  const currentReview = reviewStatus?.toLowerCase()

  return (
    <div style={styles.container}>

      {/* Toast */}
      {toast && (
        <div style={{ ...styles.toast, ...(toast.type === 'error' ? styles.toastError : styles.toastSuccess) }}>
          {toast.message}
        </div>
      )}

      {/* Top Bar */}
      <div style={styles.topBar}>
        <button style={styles.backBtn} onClick={() => navigate(-1)}>← Back</button>
        <span style={{ ...styles.badge, ...statusColor(submission.status) }}>
          {submission.status ?? 'Pending'}
        </span>
      </div>

      <div style={styles.contentRow}>

        {/* ── LEFT COLUMN ─────────────────────────────────────────── */}
        <div style={styles.leftColumn}>

          {/* Section 1: Submission Info */}
          <div style={styles.section}>
            <h1 style={styles.title}>{submission.title}</h1>
            <div style={styles.metaGrid}>
              <div>
                <p style={styles.metaLabel}>GROUP</p>
                <p style={styles.metaValue}>{submission.group_name ?? '—'}</p>
              </div>
              <div>
                <p style={styles.metaLabel}>AUTHORS</p>
                <p style={styles.metaValue}>{submission.authors ?? '—'}</p>
              </div>
              <div>
                <p style={styles.metaLabel}>PROGRAM</p>
                <p style={styles.metaValue}>{submission.program ?? '—'}</p>
              </div>
              <div>
                <p style={styles.metaLabel}>SCHOOL YEAR</p>
                <p style={styles.metaValue}>{submission.school_year ?? '—'}</p>
              </div>
              <div>
                <p style={styles.metaLabel}>STAGE</p>
                <p style={styles.metaValue}>{submission.stage ?? '—'}</p>
              </div>
              <div>
                <p style={styles.metaLabel}>SUBMITTED</p>
                <p style={styles.metaValue}>{formatDate(submission.submitted_at)}</p>
              </div>
            </div>
          </div>

          {/* Abstract */}
          {submission.abstract && (
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>ABSTRACT</h2>
              <p style={styles.abstractText}>{submission.abstract}</p>
            </div>
          )}

          {/* Keywords */}
          {submission.keywords && (
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>KEYWORDS</h2>
              <div style={styles.keywordsList}>
                {submission.keywords.split(',').map((kw, i) => (
                  <span key={i} style={styles.keywordTag}>{kw.trim()}</span>
                ))}
              </div>
            </div>
          )}

          {/* Download */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>DOCUMENT</h2>
            {submission.file_path ? (
              <div style={styles.fileRow}>
                <div>
                  <p style={styles.fileName}>{submission.file_name ?? 'research-paper.pdf'}</p>
                  <p style={styles.fileMeta}>
                    {/* Adjust version info fields to match your API */}
                    Latest version · {timeAgo(submission.submitted_at)}
                  </p>
                </div>
                <button
                  style={styles.downloadBtn}
                  onClick={() => downloadFile(submission.file_path, submission.file_name ?? 'paper.pdf')}
                >
                  ↓ Download
                </button>
              </div>
            ) : (
              <p style={styles.dimText}>No document uploaded yet.</p>
            )}
          </div>

          {/* Section 2: Comments */}
          <div style={styles.section} id="comments">
            <h2 style={styles.sectionTitle}>COMMENTS & FEEDBACK</h2>

            {/* Comment List */}
            <div style={styles.commentsList}>
              {comments.length === 0 ? (
                <p style={styles.dimText}>No comments yet. Be the first to leave feedback.</p>
              ) : (
                comments.map(c => (
                  <div key={c.comment_id} style={styles.commentCard}>
                    <div style={styles.commentHeader}>
                      <span style={styles.commentAuthor}>{c.author_name}</span>
                      <span style={styles.commentTime}>{timeAgo(c.created_at)}</span>
                    </div>
                    <p style={styles.commentText}>{c.comment_text}</p>
                  </div>
                ))
              )}
              <div ref={commentsEndRef} />
            </div>

            {/* Add Comment */}
            <div style={styles.commentInputRow}>
              <textarea
                style={styles.commentInput}
                placeholder="Write your feedback or comment..."
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                rows={3}
                onKeyDown={e => {
                  if (e.key === 'Enter' && e.ctrlKey) handleAddComment()
                }}
              />
              <button
                style={{
                  ...styles.postBtn,
                  opacity: submittingComment || !commentText.trim() ? 0.5 : 1,
                }}
                onClick={handleAddComment}
                disabled={submittingComment || !commentText.trim()}
              >
                {submittingComment ? 'Posting...' : 'Post'}
              </button>
            </div>
            <p style={styles.hintText}>Ctrl + Enter to submit</p>
          </div>

        </div>

        {/* ── RIGHT COLUMN ────────────────────────────────────────── */}
        <div style={styles.rightColumn}>

          {/* Current Status */}
          <div style={styles.statusPanel}>
            <p style={styles.metaLabel}>CURRENT REVIEW STATUS</p>
            <div style={styles.statusDisplay}>
              <span style={{ ...styles.statusBig, ...statusColor(reviewStatus) }}>
                {reviewStatus
                  ? reviewStatus.replace('_', ' ').toUpperCase()
                  : 'PENDING'}
              </span>
            </div>
            <p style={styles.statusDate}>
              Last updated {timeAgo(submission.updated_at ?? submission.submitted_at)}
            </p>
          </div>

          {/* Section 3: Approval Panel */}
          <div style={styles.approvalPanel}>
            <h2 style={styles.sectionTitle}>REVIEW DECISION</h2>
            <p style={styles.approvalHint}>
              Select a decision for this submission. This cannot be undone.
            </p>

            {currentReview && (
              <div style={{ ...styles.alreadyBadge, ...statusColor(currentReview) }}>
                ✓ Already submitted: {currentReview.replace('_', ' ').toUpperCase()}
              </div>
            )}

            <div style={styles.reviewBtns}>
              {/* Approve */}
              <button
                style={{
                  ...styles.reviewBtn,
                  ...styles.approveBtn,
                  opacity: (submittingReview || currentReview === 'approved') ? 0.5 : 1,
                }}
                onClick={() => handleReview('approved')}
                disabled={submittingReview || currentReview === 'approved'}
              >
                ✓ Approve
              </button>

              {/* For Revision */}
              <button
                style={{
                  ...styles.reviewBtn,
                  ...styles.revisionBtn,
                  opacity: (submittingReview || currentReview === 'for_revision') ? 0.5 : 1,
                }}
                onClick={() => handleReview('for_revision')}
                disabled={submittingReview || currentReview === 'for_revision'}
              >
                ⚠ For Revision
              </button>

              {/* Reject */}
              <button
                style={{
                  ...styles.reviewBtn,
                  ...styles.rejectBtn,
                  opacity: (submittingReview || currentReview === 'rejected') ? 0.5 : 1,
                }}
                onClick={() => handleReview('rejected')}
                disabled={submittingReview || currentReview === 'rejected'}
              >
                ✗ Reject
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

const styles = {
  container: {
    color: '#fff',
    position: 'relative',
  },
  toast: {
    position: 'fixed',
    top: '1.5rem',
    right: '1.5rem',
    padding: '12px 20px',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: '500',
    zIndex: 9999,
    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
  },
  toastSuccess: {
    background: '#22c55e',
    color: '#fff',
  },
  toastError: {
    background: '#ef4444',
    color: '#fff',
  },
  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
  },
  backBtn: {
    background: 'transparent',
    border: 'none',
    color: 'rgba(255,255,255,0.7)',
    fontSize: '14px',
    cursor: 'pointer',
    padding: '8px 0',
  },
  badge: {
    padding: '4px 14px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
  },
  contentRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 340px',
    gap: '2rem',
    alignItems: 'flex-start',
  },
  leftColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  rightColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    position: 'sticky',
    top: '1rem',
  },
  section: {
    background: '#ffffff0f',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '14px',
    padding: '1.5rem',
  },
  title: {
    fontSize: 'clamp(1.3rem, 2.5vw, 1.9rem)',
    fontWeight: '700',
    margin: '0 0 1.25rem 0',
    lineHeight: 1.3,
  },
  metaGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1.25rem',
  },
  metaLabel: {
    fontSize: '11px',
    fontWeight: '600',
    color: 'rgba(255,255,255,0.45)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    margin: '0 0 4px 0',
  },
  metaValue: {
    fontSize: '14px',
    color: '#fff',
    margin: 0,
  },
  sectionTitle: {
    fontSize: '13px',
    fontWeight: '700',
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    margin: '0 0 1rem 0',
  },
  abstractText: {
    fontSize: '14px',
    lineHeight: 1.7,
    color: 'rgba(255,255,255,0.85)',
    margin: 0,
  },
  keywordsList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  keywordTag: {
    background: '#FFBE4F22',
    color: '#FFBE4F',
    padding: '5px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '500',
  },
  fileRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '1rem',
    background: '#1e2a6e22',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '10px',
    padding: '12px',
  },
  fileName: {
    fontSize: '14px',
    fontWeight: '600',
    margin: '0 0 4px 0',
  },
  fileMeta: {
    fontSize: '11px',
    color: 'rgba(255,255,255,0.4)',
    margin: 0,
  },
  downloadBtn: {
    background: '#FFBE4F',
    color: '#1e2a6e',
    border: 'none',
    borderRadius: '8px',
    padding: '8px 14px',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  commentsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginBottom: '1.25rem',
    maxHeight: '360px',
    overflowY: 'auto',
  },
  commentCard: {
    background: '#1e2a6e22',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: '10px',
    padding: '12px',
  },
  commentHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '6px',
  },
  commentAuthor: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#FFBE4F',
  },
  commentTime: {
    fontSize: '11px',
    color: 'rgba(255,255,255,0.35)',
  },
  commentText: {
    fontSize: '13px',
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 1.6,
    margin: 0,
  },
  commentInputRow: {
    display: 'flex',
    gap: '10px',
    alignItems: 'flex-end',
  },
  commentInput: {
    flex: 1,
    background: '#ffffff0f',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: '10px',
    color: '#fff',
    fontSize: '13px',
    padding: '10px 14px',
    resize: 'vertical',
    fontFamily: 'inherit',
    lineHeight: 1.5,
    outline: 'none',
  },
  postBtn: {
    background: '#FFBE4F',
    color: '#1e2a6e',
    border: 'none',
    borderRadius: '10px',
    padding: '10px 20px',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
    flexShrink: 0,
    height: 'fit-content',
  },
  hintText: {
    fontSize: '11px',
    color: 'rgba(255,255,255,0.25)',
    margin: '6px 0 0 0',
  },
  statusPanel: {
    background: '#ffffff0f',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '14px',
    padding: '1.5rem',
  },
  statusDisplay: {
    display: 'flex',
    justifyContent: 'center',
    padding: '1rem 0',
  },
  statusBig: {
    fontSize: '18px',
    fontWeight: '700',
    padding: '8px 20px',
    borderRadius: '10px',
  },
  statusDate: {
    fontSize: '11px',
    color: 'rgba(255,255,255,0.35)',
    textAlign: 'center',
    margin: '0.5rem 0 0 0',
  },
  approvalPanel: {
    background: '#ffffff0f',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '14px',
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  approvalHint: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.4)',
    margin: 0,
    lineHeight: 1.5,
  },
  alreadyBadge: {
    padding: '8px 14px',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: '600',
  },
  reviewBtns: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  reviewBtn: {
    width: '100%',
    padding: '12px',
    borderRadius: '10px',
    border: 'none',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'opacity 0.15s',
  },
  approveBtn: {
    background: '#22c55e',
    color: '#fff',
  },
  revisionBtn: {
    background: '#f97316',
    color: '#fff',
  },
  rejectBtn: {
    background: '#ef4444',
    color: '#fff',
  },
  dimText: {
    fontSize: '13px',
    color: 'rgba(255,255,255,0.4)',
    margin: 0,
    padding: '1rem 0',
  },
  errorBox: {
    background: '#ef444422',
    border: '1px solid #ef4444',
    borderRadius: '14px',
    padding: '2rem',
    textAlign: 'center',
    marginTop: '2rem',
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

export default SubmissionDetail
