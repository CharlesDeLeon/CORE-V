import React, { useEffect, useState, useCallback } from 'react'
import api from '../../services/api'

function tryParse(v) {
  if (!v) return null
  // eslint-disable-next-line no-unused-vars
  try { return typeof v === 'string' ? JSON.parse(v) : v } catch (e) { return v }
}

function formatValue(value) {
  if (value === null || value === undefined || value === '') return 'N/A'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (value instanceof Date) return value.toLocaleString()
  return String(value)
}

function renderDetailsContent(value, depth = 0) {
  const parsed = tryParse(value)
  if (parsed === null || parsed === undefined) return <span style={styles.detailEmpty}>No details</span>

  if (typeof parsed !== 'object') {
    return <div style={styles.detailValue}>{formatValue(parsed)}</div>
  }

  if (Array.isArray(parsed)) {
    if (!parsed.length) return <span style={styles.detailEmpty}>No details</span>
    return (
      <div style={styles.listWrap}>
        {parsed.map((item, index) => (
          <div key={index} style={styles.listItem}>
            {typeof item === 'object' && item !== null
              ? <pre style={styles.jsonPre}>{JSON.stringify(item, null, 2)}</pre>
              : <span style={styles.detailValue}>{formatValue(item)}</span>}
          </div>
        ))}
      </div>
    )
  }

  const entries = Object.entries(parsed)
  if (!entries.length) return <span style={styles.detailEmpty}>No details</span>

  return (
    <div style={styles.kvGrid}>
      {entries.map(([key, value]) => (
        <React.Fragment key={`${depth}-${key}`}>
          <div style={styles.kvKey}>{key}</div>
          <div style={styles.kvValue}>
            {typeof value === 'object' && value !== null
              ? <pre style={styles.jsonPre}>{JSON.stringify(value, null, 2)}</pre>
              : formatValue(value)}
          </div>
        </React.Fragment>
      ))}
    </div>
  )
}

const AuditTrail = () => {
  const [audits, setAudits] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [limit] = useState(25)
  const [total, setTotal] = useState(0)
  const [expanded, setExpanded] = useState(null)

  const fetchAudits = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = {
        page,
        limit,
      }
      const res = await api.get('/admin/audit-logs', { params })
      setAudits(res.data.data || [])
      setTotal(res.data.pagination?.total || 0)
    } catch (e) {
      console.error(e)
      setError('Failed to load audit logs')
    } finally {
      setLoading(false)
    }
  }, [page, limit])

  useEffect(() => { fetchAudits() }, [page, limit, fetchAudits])

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Audit Trail</h2>
      <p style={styles.subheading}>Track and review all system activity logs</p>

      {loading && <div style={styles.loadingText}>Loading...</div>}
      {error && <div style={styles.errorText}>{error}</div>}

      <table style={styles.table}>
        <thead style={styles.thead}>
          <tr>
            <th style={styles.th}>Date</th>
            <th style={styles.th}>Action</th>
            <th style={styles.th}>User</th>
            <th style={styles.th}>Target</th>
            <th style={styles.th}>Details</th>
          </tr>
        </thead>
        <tbody>
          {audits.map(a => (
            <React.Fragment key={a.log_id}>
              <tr>
                <td style={styles.td}>{a.created_at ? new Date(a.created_at).toLocaleString() : ''}</td>
                <td style={styles.td}>
                  <span style={styles.actionBadge}>{a.action}</span>
                </td>
                <td style={styles.td}>{a.user_name || a.user_id || 'system'}</td>
                <td style={styles.td}>{(a.target_type || '') + (a.target_id ? ` (${a.target_id})` : '')}</td>
                <td style={styles.td}>
                  <button
                    style={styles.viewButton}
                    onClick={() => setExpanded(expanded === a.log_id ? null : a.log_id)}
                  >
                    {expanded === a.log_id ? 'Hide' : 'View'}
                  </button>
                </td>
              </tr>
              {expanded === a.log_id && (
                <tr style={styles.expandedRow}>
                  <td colSpan={5} style={styles.expandedTd}>
                    <div style={styles.expandedPanel}>
                      <div style={styles.detailSection}>
                        <div style={styles.detailTitle}>Changes</div>
                        {renderDetailsContent(a.changes)}
                      </div>
                      <div style={styles.detailSection}>
                        <div style={styles.detailTitle}>Details</div>
                        {renderDetailsContent(a.details)}
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>

      <div style={styles.pagination}>
        <div style={styles.paginationInfo}>Showing {audits.length} of {total}</div>
        <div style={styles.paginationControls}>
          <button
            style={page === 1 ? styles.pageButtonDisabled : styles.pageButton}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Prev
          </button>
          <span style={styles.pageLabel}>Page {page}</span>
          <button
            style={page * limit >= total ? styles.pageButtonDisabled : styles.pageButton}
            onClick={() => setPage(p => p + 1)}
            disabled={page * limit >= total}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: {
    padding: '2rem',
    color: '#fff',
    minHeight: '100vh',
  },
  heading: {
    fontSize: 'clamp(1.5rem, 3vw, 2.25rem)',
    fontWeight: '700',
    margin: '0 0 0.25rem 0',
  },
  subheading: {
    fontSize: '14px',
    color: 'rgba(255,255,255,0.5)',
    marginTop: '4px',
    marginBottom: '2rem',
  },
  filterBar: {
    display: 'flex',
    gap: '8px',
    marginBottom: '1.5rem',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  filterInput: {
    padding: '10px 14px',
    borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.15)',
    background: '#ffffff0f',
    color: '#fff',
    fontSize: '14px',
    outline: 'none',
    minWidth: '120px',
  },
  applyButton: {
    padding: '10px 18px',
    borderRadius: '10px',
    border: 'none',
    background: '#FFBE4F',
    color: '#000',
    fontWeight: '700',
    fontSize: '14px',
    cursor: 'pointer',
  },
  loadingText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: '14px',
    marginBottom: '1rem',
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: '14px',
    marginBottom: '1rem',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    background: '#ffffff0f',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '14px',
    overflow: 'hidden',
  },
  thead: {
    background: 'rgba(255,255,255,0.05)',
  },
  th: {
    padding: '12px 16px',
    textAlign: 'left',
    fontSize: '13px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: 'rgba(255,255,255,0.6)',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
  },
  td: {
    padding: '12px 16px',
    fontSize: '14px',
    color: 'rgba(255,255,255,0.85)',
    borderTop: '1px solid rgba(255,255,255,0.07)',
    verticalAlign: 'middle',
  },
  actionBadge: {
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: '999px',
    background: 'rgba(255,190,79,0.15)',
    color: '#FFBE4F',
    fontWeight: '600',
    fontSize: '12px',
    letterSpacing: '0.03em',
  },
  viewButton: {
    padding: '5px 12px',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.15)',
    background: 'transparent',
    color: 'rgba(255,255,255,0.7)',
    fontSize: '12px',
    cursor: 'pointer',
  },
  expandedRow: {
    background: 'rgba(0,0,0,0.2)',
  },
  expandedTd: {
    padding: '12px 16px',
    borderTop: '1px solid rgba(255,255,255,0.07)',
  },
  expandedPanel: {
    display: 'grid',
    gap: '14px',
  },
  detailSection: {
    padding: '14px',
    borderRadius: '12px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
  },
  detailTitle: {
    fontSize: '12px',
    fontWeight: '700',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.6)',
    marginBottom: '10px',
  },
  kvGrid: {
    display: 'grid',
    gridTemplateColumns: '180px 1fr',
    gap: '10px 14px',
    alignItems: 'start',
  },
  kvKey: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: '13px',
    fontWeight: '600',
    wordBreak: 'break-word',
  },
  kvValue: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: '13px',
    wordBreak: 'break-word',
  },
  detailValue: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: '13px',
    wordBreak: 'break-word',
  },
  detailEmpty: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: '13px',
    fontStyle: 'italic',
  },
  listWrap: {
    display: 'grid',
    gap: '10px',
  },
  listItem: {
    padding: '10px 12px',
    borderRadius: '10px',
    background: 'rgba(0,0,0,0.18)',
    border: '1px solid rgba(255,255,255,0.06)',
  },
  jsonPre: {
    margin: 0,
    whiteSpace: 'pre-wrap',
    fontSize: '12px',
    lineHeight: 1.5,
    color: 'rgba(255,255,255,0.8)',
    fontFamily: 'monospace',
  },
  pagination: {
    marginTop: '1.25rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paginationInfo: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: '14px',
  },
  paginationControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  pageButton: {
    padding: '7px 14px',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.15)',
    background: '#ffffff0f',
    color: '#fff',
    fontSize: '13px',
    cursor: 'pointer',
  },
  pageButtonDisabled: {
    padding: '7px 14px',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.07)',
    background: 'transparent',
    color: 'rgba(255,255,255,0.25)',
    fontSize: '13px',
    cursor: 'not-allowed',
  },
  pageLabel: {
    fontSize: '14px',
    color: 'rgba(255,255,255,0.6)',
  },
}

export default AuditTrail

