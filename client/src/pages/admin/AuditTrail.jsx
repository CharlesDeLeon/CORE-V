import React, { useEffect, useState } from 'react'
import api from '../../services/api'

const AuditTrail = () => {
  const [audits, setAudits] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [limit] = useState(25)
  const [total, setTotal] = useState(0)
  const [filters, setFilters] = useState({ action: '', userId: '', targetType: '', startDate: '', endDate: '' })
  const [expanded, setExpanded] = useState(null)

  // eslint-disable-next-line react-hooks/exhaustive-deps, no-undef
  const fetchAudits = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = {
        page,
        limit,
        action: filters.action || undefined,
        userId: filters.userId || undefined,
        targetType: filters.targetType || undefined,
        dateFrom: filters.startDate || undefined,
        dateTo: filters.endDate || undefined
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
  })

  useEffect(() => { fetchAudits() }, [page, limit, fetchAudits])

  const applyFilters = () => { setPage(1); fetchAudits() }

  return (
    <div>
      <h2>Audit Trail</h2>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input placeholder="Action" value={filters.action} onChange={e => setFilters({ ...filters, action: e.target.value })} />
        <input placeholder="User ID" value={filters.userId} onChange={e => setFilters({ ...filters, userId: e.target.value })} />
        <input placeholder="Target Type" value={filters.targetType} onChange={e => setFilters({ ...filters, targetType: e.target.value })} />
        <input type="date" value={filters.startDate} onChange={e => setFilters({ ...filters, startDate: e.target.value })} />
        <input type="date" value={filters.endDate} onChange={e => setFilters({ ...filters, endDate: e.target.value })} />
        <button onClick={applyFilters}>Apply</button>
      </div>

      {loading && <div>Loading...</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>Date</th>
            <th>Action</th>
            <th>User</th>
            <th>Target</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          {audits.map(a => (
            <React.Fragment key={a.log_id}>
              <tr style={{ borderTop: '1px solid #ddd' }}>
                <td>{new Date(a.created_at).toLocaleString()}</td>
                <td>{a.action}</td>
                <td>{a.user_name || a.user_id || 'system'}</td>
                <td>{(a.target_type || '') + (a.target_id ? ` (${a.target_id})` : '')}</td>
                <td>
                  <button onClick={() => setExpanded(expanded === a.log_id ? null : a.log_id)}>
                    {expanded === a.log_id ? 'Hide' : 'View'}
                  </button>
                </td>
              </tr>
              {expanded === a.log_id && (
                <tr>
                  <td colSpan={5} style={{ background: '#fafafa' }}>
                    <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>
{(() => {
  const parsedChanges = a.changes ? (typeof a.changes === 'string' ? tryParse(a.changes) : a.changes) : null
  const parsedDetails = tryParse(a.details)
  return JSON.stringify({ changes: parsedChanges, details: parsedDetails }, null, 2)
})()}
                    </pre>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between' }}>
        <div>Showing {audits.length} of {total}</div>
        <div>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Prev</button>
          <span style={{ margin: '0 8px' }}>Page {page}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={page * limit >= total}>Next</button>
        </div>
      </div>
    </div>
  )
}

function tryParse(v) {
  if (!v) return null
  // eslint-disable-next-line no-unused-vars
  try { return typeof v === 'string' ? JSON.parse(v) : v } catch (e) { return v }
}

export default AuditTrail
