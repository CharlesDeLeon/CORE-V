/* eslint-disable no-unused-vars */
import React, { useEffect, useState, useCallback } from 'react'
import api from '../../services/api'

const STAGE_ORDER  = ['proposal', 'defense', 'final_submission']
const STAGE_LABELS = { proposal: 'Proposal', defense: 'Defense', final_submission: 'Final Submission' }
const STATUS_COLORS = {
  submitted:    { bg: 'rgba(255,255,255,0.08)',   color: 'rgba(255,255,255,0.6)' },
  under_review: { bg: 'rgba(96,165,250,0.15)',    color: '#60a5fa' },
  needs_revision:{ bg: 'rgba(251,191,36,0.15)',   color: '#fbbf24' },
  approved:     { bg: 'rgba(74,222,128,0.12)',    color: '#4ade80' },
  rejected:     { bg: 'rgba(248,113,113,0.12)',   color: '#f87171' },
  published:    { bg: 'rgba(167,139,250,0.15)',   color: '#a78bfa' },
}

const ManageSubmissions = () => {
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState(null)
  const [page, setPage]               = useState(1)
  const [limit]                       = useState(25)
  const [total, setTotal]             = useState(0)
  const [search, setSearch]           = useState('')
  const [stageFilter, setStageFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const [detail, setDetail]           = useState(null)
  const [, setDetailLoading] = useState(false)
  const [newStage, setNewStage]       = useState('')
  const [newStatus, setNewStatus]     = useState('')
  const [updating, setUpdating]       = useState(false)

  const fetchSubmissions = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get('/coordinator/submissions', {
        params: { search: search || undefined, stage: stageFilter || undefined, status: statusFilter || undefined, page, limit }
      })
      setSubmissions(res.data.data || [])
      setTotal(res.data.pagination?.total || 0)
    } catch (e) {
      console.error(e)
      setError('Failed to load submissions')
    } finally {
      setLoading(false)
    }
  }, [page, limit, search, stageFilter, statusFilter])

  useEffect(() => { fetchSubmissions() }, [fetchSubmissions])

  const openDetail = async (id) => {
    setDetailLoading(true)
    try {
      const res = await api.get(`/coordinator/submissions/${id}`)
      const d = res.data.data
      setDetail(d)
      setNewStage(d.stage)
      setNewStatus(d.status)
    } catch (e) {
      setError('Failed to load submission detail')
    } finally {
      setDetailLoading(false)
    }
  }

  const handleStageUpdate = async () => {
    if (!detail || newStage === detail.stage) return
    setUpdating(true)
    try {
      await api.patch(`/coordinator/submissions/${detail.submission_id}/stage`, { stage: newStage })
      openDetail(detail.submission_id)
      fetchSubmissions()
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to update stage')
    } finally {
      setUpdating(false)
    }
  }

  const handleStatusUpdate = async () => {
    if (!detail || newStatus === detail.status) return
    setUpdating(true)
    try {
      await api.patch(`/coordinator/submissions/${detail.submission_id}/status`, { status: newStatus })
      openDetail(detail.submission_id)
      fetchSubmissions()
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to update status')
    } finally {
      setUpdating(false)
    }
  }

  const pendingCount  = submissions.filter(s => s.status === 'submitted').length
  const approvedCount = submissions.filter(s => s.status === 'approved').length
  const publishedCount = submissions.filter(s => s.status === 'published').length

  return (
    <div style={styles.container}>

      <div style={styles.topBar}>
        <div>
          <h2 style={styles.heading}>Manage Submissions</h2>
          <p style={styles.subheading}>Review papers and control workflow stages</p>
        </div>
      </div>

      <div style={styles.metricsGrid}>
        <div style={styles.metricCard}>
          <div style={styles.metricLabel}>Total</div>
          <div style={styles.metricValue}>{total}</div>
        </div>
        <div style={styles.metricCard}>
          <div style={styles.metricLabel}>Pending</div>
          <div style={styles.metricValue}>{pendingCount}</div>
        </div>
        <div style={styles.metricCard}>
          <div style={styles.metricLabel}>Approved</div>
          <div style={styles.metricValue}>{approvedCount}</div>
        </div>
        <div style={styles.metricCard}>
          <div style={styles.metricLabel}>Published</div>
          <div style={styles.metricValue}>{publishedCount}</div>
        </div>
      </div>

      <div style={styles.filterBar}>
        <input
          style={styles.searchInput}
          placeholder="Search title or author..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && fetchSubmissions()}
        />
        <select style={styles.filterSelect} value={stageFilter} onChange={e => setStageFilter(e.target.value)}>
          <option value="">All Stages</option>
          <option value="proposal">Proposal</option>
          <option value="defense">Defense</option>
          <option value="final_submission">Final Submission</option>
        </select>
        <select style={styles.filterSelect} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="submitted">Submitted</option>
          <option value="under_review">Under Review</option>
          <option value="needs_revision">Needs Revision</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="published">Published</option>
        </select>
        <button style={styles.applyBtn} onClick={() => { setPage(1); fetchSubmissions() }}>Apply</button>
      </div>

      {loading && <div style={styles.loadingText}>Loading...</div>}
      {error   && <div style={styles.errorText}>{error}</div>}

      <table style={styles.table}>
        <thead style={styles.thead}>
          <tr>
            <th style={styles.th}>Title</th>
            <th style={styles.th}>Group</th>
            <th style={styles.th}>Stage</th>
            <th style={styles.th}>Status</th>
            <th style={styles.th}>Versions</th>
            <th style={styles.th}>Updated</th>
            <th style={styles.th}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {submissions.map(s => (
            <tr key={s.submission_id}>
              <td style={styles.td}>
                <p style={styles.titleText}>{s.title}</p>
                <p style={styles.groupText}>{s.submitted_by_name}</p>
              </td>
              <td style={styles.td}>{s.group_name}</td>
              <td style={styles.td}>
                <span style={styles.stagePill(s.stage)}>{STAGE_LABELS[s.stage]}</span>
              </td>
              <td style={styles.td}>
                <span style={styles.statusPill(s.status)}>{s.status.replace('_', ' ')}</span>
              </td>
              <td style={styles.td}>{s.version_count}</td>
              <td style={styles.td}>{new Date(s.updated_at).toLocaleDateString()}</td>
              <td style={styles.td}>
                <button style={styles.viewButton} onClick={() => openDetail(s.submission_id)}>View</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={styles.pagination}>
        <div style={styles.paginationInfo}>Showing {submissions.length} of {total}</div>
        <div style={styles.paginationControls}>
          <button style={page === 1 ? styles.pageButtonDisabled : styles.pageButton} onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Prev</button>
          <span style={styles.pageLabel}>Page {page}</span>
          <button style={page * limit >= total ? styles.pageButtonDisabled : styles.pageButton} onClick={() => setPage(p => p + 1)} disabled={page * limit >= total}>Next</button>
        </div>
      </div>

      {/* Submission Detail Panel */}
      {detail && (
        <>
          <div style={styles.detailOverlay} onClick={() => setDetail(null)} />
          <div style={styles.detailPanel}>
            <button style={styles.closeBtn} onClick={() => setDetail(null)}>← Back</button>

            <h3 style={styles.detailTitle}>{detail.title}</h3>
            <p style={styles.detailMeta}>{detail.group_name} · {detail.submitted_by_name}</p>

            {/* Stage Control */}
            <div style={styles.sectionTitle}>Advance Stage</div>
            <div style={styles.controlRow}>
              <select style={styles.controlSelect} value={newStage} onChange={e => setNewStage(e.target.value)}>
                {STAGE_ORDER.map(s => (
                  <option key={s} value={s} disabled={STAGE_ORDER.indexOf(s) < STAGE_ORDER.indexOf(detail.stage)}>
                    {STAGE_LABELS[s]}
                  </option>
                ))}
              </select>
              <button style={styles.controlBtn} onClick={handleStageUpdate} disabled={updating || newStage === detail.stage}>
                {updating ? 'Saving...' : 'Update Stage'}
              </button>
            </div>

            {/* Status Control */}
            <div style={styles.sectionTitle}>Update Status</div>
            <div style={styles.controlRow}>
              <select style={styles.controlSelect} value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                <option value="submitted">Submitted</option>
                <option value="under_review">Under Review</option>
                <option value="needs_revision">Needs Revision</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="published">Published</option>
              </select>
              <button style={styles.controlBtn} onClick={handleStatusUpdate} disabled={updating || newStatus === detail.status}>
                {updating ? 'Saving...' : 'Update Status'}
              </button>
            </div>

            {/* Faculty Reviews */}
            <div style={styles.sectionTitle}>Faculty Reviews ({detail.reviews?.length || 0})</div>
            {detail.reviews?.length === 0 && <p style={styles.emptyText}>No reviews yet.</p>}
            {detail.reviews?.map(r => (
              <div key={r.review_id} style={styles.reviewRow}>
                <div style={styles.reviewerName}>{r.reviewer_name}</div>
                <span style={styles.reviewVerdict(r.status_assigned)}>{r.status_assigned.replace('_', ' ')}</span>
              </div>
            ))}

            {/* Document Versions */}
            <div style={styles.sectionTitle}>Document Versions ({detail.versions?.length || 0})</div>
            {detail.versions?.length === 0 && <p style={styles.emptyText}>No files uploaded.</p>}
            {detail.versions?.map(v => (
              <div key={v.version_id} style={styles.versionRow}>
                <div>
                  <div style={styles.versionLabel}>v{v.version_number} — {v.file_name}</div>
                  <div style={styles.versionMeta}>Uploaded by {v.uploaded_by_name} · {new Date(v.uploaded_at).toLocaleDateString()}</div>
                </div>
                <a href={`http://localhost:5000/${v.file_path}`} target="_blank" rel="noreferrer" style={styles.downloadLink}>Download</a>
              </div>
            ))}

            {/* Comments */}
            <div style={styles.sectionTitle}>Comments ({detail.comments?.length || 0})</div>
            {detail.comments?.length === 0 && <p style={styles.emptyText}>No comments yet.</p>}
            {detail.comments?.map(c => (
              <div key={c.comment_id} style={styles.commentRow}>
                <div style={styles.commentAuthor}>{c.author_name} · {new Date(c.created_at).toLocaleDateString()}</div>
                <div style={styles.commentText}>{c.comment_text}</div>
              </div>
            ))}

            {/* Panel */}
            <div style={styles.sectionTitle}>Panel</div>
            {detail.panel?.length === 0 && <p style={styles.emptyText}>No panel assigned to this group.</p>}
            {detail.panel?.map((p, i) => (
              <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: '13px' }}>
                <strong>{p.name}</strong> <span style={{ color: 'rgba(255,255,255,0.45)', marginLeft: '6px' }}>{p.role_in_panel}</span>
              </div>
            ))}
          </div>
        </>
      )}

    </div>
  )
}

const styles = {
  container: { padding: '2rem', color: '#fff', minHeight: '100vh' },
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' },
  heading: { fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', fontWeight: '700', margin: '0 0 0.25rem 0' },
  subheading: { fontSize: '14px', color: 'rgba(255,255,255,0.5)', marginTop: '4px' },
  metricsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' },
  metricCard: { background: '#ffffff0f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '1.5rem', textAlign: 'center' },
  metricLabel: { fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' },
  metricValue: { fontSize: '2.5rem', fontWeight: '800', color: '#FFBE4F', lineHeight: 1 },
  filterBar: { display: 'flex', gap: '8px', marginBottom: '1.5rem', flexWrap: 'wrap' },
  searchInput: { flex: 1, minWidth: '200px', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.15)', background: '#ffffff0f', color: '#fff', fontSize: '14px', outline: 'none' },
  filterSelect: { padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.15)', background: '#ffffff0f', color: '#fff', fontSize: '14px', outline: 'none', cursor: 'pointer' },
  applyBtn: { padding: '10px 18px', borderRadius: '10px', border: 'none', background: '#FFBE4F', color: '#000', fontWeight: '700', fontSize: '14px', cursor: 'pointer' },
  loadingText: { color: 'rgba(255,255,255,0.5)', fontSize: '14px', marginBottom: '1rem' },
  errorText: { color: '#ff6b6b', fontSize: '14px', marginBottom: '1rem' },
  table: { width: '100%', borderCollapse: 'collapse', background: '#ffffff0f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', overflow: 'hidden' },
  thead: { background: 'rgba(255,255,255,0.05)' },
  th: { padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(255,255,255,0.6)', borderBottom: '1px solid rgba(255,255,255,0.1)' },
  td: { padding: '12px 16px', fontSize: '14px', color: 'rgba(255,255,255,0.85)', borderTop: '1px solid rgba(255,255,255,0.07)', verticalAlign: 'middle' },
  titleText: { fontWeight: '600', fontSize: '14px', margin: '0 0 2px 0' },
  groupText: { fontSize: '12px', color: 'rgba(255,255,255,0.45)', margin: 0 },
  stagePill: (stage) => ({ display: 'inline-block', padding: '3px 10px', borderRadius: '999px', background: 'rgba(255,190,79,0.15)', color: '#FFBE4F', fontWeight: '600', fontSize: '12px' }),
  statusPill: (status) => ({ display: 'inline-block', padding: '3px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: '600', ...STATUS_COLORS[status] }),
  viewButton: { padding: '5px 12px', borderRadius: '8px', border: '1px solid rgba(255,190,79,0.3)', background: 'transparent', color: '#FFBE4F', fontSize: '12px', cursor: 'pointer' },
  pagination: { marginTop: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  paginationInfo: { color: 'rgba(255,255,255,0.5)', fontSize: '14px' },
  paginationControls: { display: 'flex', alignItems: 'center', gap: '8px' },
  pageButton: { padding: '7px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: '#ffffff0f', color: '#fff', fontSize: '13px', cursor: 'pointer' },
  pageButtonDisabled: { padding: '7px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.07)', background: 'transparent', color: 'rgba(255,255,255,0.25)', fontSize: '13px', cursor: 'not-allowed' },
  pageLabel: { fontSize: '14px', color: 'rgba(255,255,255,0.6)' },

  // Detail panel
  detailOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 90 },
  detailPanel: { position: 'fixed', top: 0, right: 0, width: '520px', height: '100vh', background: '#0f1629', borderLeft: '1px solid rgba(255,255,255,0.1)', overflowY: 'auto', padding: '2rem', zIndex: 91 },
  closeBtn: { padding: '8px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: '#fff', fontSize: '13px', cursor: 'pointer', marginBottom: '1.5rem' },
  detailTitle: { fontSize: '18px', fontWeight: '700', marginBottom: '4px' },
  detailMeta: { fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginBottom: '1.5rem' },
  sectionTitle: { fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(255,255,255,0.5)', margin: '1.5rem 0 0.75rem' },
  controlRow: { display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1rem' },
  controlSelect: { padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: '#ffffff0f', color: '#fff', fontSize: '13px', outline: 'none', cursor: 'pointer' },
  controlBtn: { padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#FFBE4F', color: '#000', fontWeight: '700', fontSize: '13px', cursor: 'pointer' },
  versionRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' },
  versionLabel: { fontSize: '13px', fontWeight: '600' },
  versionMeta: { fontSize: '12px', color: 'rgba(255,255,255,0.4)' },
  downloadLink: { fontSize: '12px', color: '#FFBE4F', textDecoration: 'none', padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(255,190,79,0.3)' },
  reviewRow: { padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' },
  reviewerName: { fontSize: '13px', fontWeight: '600', marginBottom: '2px' },
  reviewVerdict: (v) => ({
    display: 'inline-block', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700',
    background: v === 'approved' ? 'rgba(74,222,128,0.12)' : v === 'rejected' ? 'rgba(248,113,113,0.12)' : 'rgba(251,191,36,0.12)',
    color: v === 'approved' ? '#4ade80' : v === 'rejected' ? '#f87171' : '#fbbf24',
  }),
  commentRow: { padding: '8px 12px', background: '#ffffff07', borderRadius: '8px', marginBottom: '6px' },
  commentAuthor: { fontSize: '12px', fontWeight: '700', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' },
  commentText: { fontSize: '13px', color: 'rgba(255,255,255,0.85)' },
  emptyText: { color: 'rgba(255,255,255,0.35)', fontSize: '13px', fontStyle: 'italic' },
}

export default ManageSubmissions