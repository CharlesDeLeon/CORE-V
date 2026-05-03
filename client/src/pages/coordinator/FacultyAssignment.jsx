/* eslint-disable no-unused-vars */
import React, { useEffect, useState, useCallback } from 'react'
import api from '../../services/api'

const FacultyAssignment = () => {
  const [groups, setGroups]           = useState([])
  const [facultyList, setFacultyList] = useState([])
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [panel, setPanel]             = useState([])
  const [loading, setLoading]         = useState(false)
  const [panelLoading, setPanelLoading] = useState(false)
  const [error, setError]             = useState(null)
  const [search, setSearch]           = useState('')
  const [assignFacultyId, setAssignFacultyId] = useState('')
  const [assignRole, setAssignRole]   = useState('adviser')
  const [saving, setSaving]           = useState(false)

  const fetchGroups = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/coordinator/groups', { params: { search: search || undefined } })
      setGroups(res.data.data || [])
    } catch (e) {
      setError('Failed to load groups')
    } finally {
      setLoading(false)
    }
  }, [search])

  const fetchFaculty = useCallback(async () => {
    try {
      const res = await api.get('/coordinator/faculty')
      setFacultyList(res.data.data || [])
    } catch (e) {
      console.error(e)
    }
  }, [])

  useEffect(() => { fetchGroups(); fetchFaculty() }, [fetchGroups, fetchFaculty])

  const selectGroup = async (group) => {
    setSelectedGroup(group)
    setPanelLoading(true)
    try {
      const res = await api.get(`/coordinator/groups/${group.group_id}/panel`)
      setPanel(res.data.data || [])
    } catch (e) {
      setError('Failed to load panel')
    } finally {
      setPanelLoading(false)
    }
  }

  const handleAssign = async () => {
    if (!assignFacultyId || !selectedGroup) return
    setSaving(true)
    try {
      await api.post(`/coordinator/groups/${selectedGroup.group_id}/panel`, {
        faculty_id: Number(assignFacultyId),
        role_in_panel: assignRole,
      })
      setAssignFacultyId('')
      selectGroup(selectedGroup) // refresh panel
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to assign faculty')
    } finally {
      setSaving(false)
    }
  }

  const handleRemove = async (assignmentId) => {
    if (!window.confirm('Remove this faculty from the panel?')) return
    try {
      await api.delete(`/coordinator/panel/${assignmentId}`)
      selectGroup(selectedGroup)
    } catch (e) {
      setError('Failed to remove from panel')
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.topBar}>
        <h2 style={styles.heading}>Assign Faculties</h2>
        <p style={styles.subheading}>Assign advisers and panelists to research groups</p>
      </div>

      {error && <div style={styles.errorText}>{error}</div>}

      <div style={styles.layout}>

        {/* Left: Group List */}
        <div style={styles.card}>
          <div style={styles.cardTitle}>Research Groups</div>
          <div style={styles.filterBar}>
            <input
              style={styles.searchInput}
              placeholder="Search group..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && fetchGroups()}
            />
            <button style={styles.applyBtn} onClick={fetchGroups}>Go</button>
          </div>

          {loading && <div style={styles.loadingText}>Loading...</div>}

          {groups.map(g => (
            <div
              key={g.group_id}
              style={{ ...styles.groupRow, ...(selectedGroup?.group_id === g.group_id ? styles.groupRowActive : styles.groupRowInactive) }}
              onClick={() => selectGroup(g)}
            >
              <div>
                <div style={styles.groupName}>{g.group_name}</div>
                <div style={styles.groupMeta}>{g.program || 'No program'} · {g.school_year || '—'}</div>
              </div>
              <span style={styles.badge}>{g.member_count} members</span>
            </div>
          ))}

          {!loading && groups.length === 0 && (
            <div style={styles.emptyState}>No groups found.</div>
          )}
        </div>

        {/* Right: Panel for selected group */}
        <div style={styles.card}>
          {!selectedGroup ? (
            <div style={styles.emptyState}>
              ← Select a group to manage its panel
            </div>
          ) : (
            <>
              <div style={styles.cardTitle}>{selectedGroup.group_name}</div>

              <div style={styles.sectionTitle}>Current Panel</div>
              {panelLoading && <div style={styles.loadingText}>Loading panel...</div>}
              {!panelLoading && panel.length === 0 && <p style={styles.emptyText}>No faculty assigned yet.</p>}
              {panel.map(p => (
                <div key={p.assignment_id} style={styles.panelRow}>
                  <div>
                    <div style={styles.panelName}>{p.name}</div>
                    <div style={styles.panelRole}>{p.email}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={styles.roleBadge(p.role_in_panel)}>{p.role_in_panel}</span>
                    <button style={styles.removeBtn} onClick={() => handleRemove(p.assignment_id)}>Remove</button>
                  </div>
                </div>
              ))}

              <div style={styles.sectionTitle}>Assign Faculty</div>
              <div style={styles.assignForm}>
                <select style={styles.assignSelect} value={assignFacultyId} onChange={e => setAssignFacultyId(e.target.value)}>
                  <option value="">Select faculty...</option>
                  {facultyList.map(f => (
                    <option key={f.user_id} value={f.user_id}>{f.name} — {f.email}</option>
                  ))}
                </select>
                <select style={styles.assignSelect} value={assignRole} onChange={e => setAssignRole(e.target.value)}>
                  <option value="adviser">Adviser</option>
                  <option value="panelist">Panelist</option>
                </select>
                <button style={styles.assignBtn} onClick={handleAssign} disabled={saving || !assignFacultyId}>
                  {saving ? 'Assigning...' : 'Assign to Panel'}
                </button>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  )
}

const styles = {
  container: { padding: '2rem', color: '#fff', minHeight: '100vh' },
  topBar: { marginBottom: '2rem' },
  heading: { fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', fontWeight: '700', margin: '0 0 0.25rem 0' },
  subheading: { fontSize: '14px', color: 'rgba(255,255,255,0.5)', marginTop: '4px' },
  layout: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' },
  card: { background: '#ffffff0f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '1.5rem' },
  cardTitle: { fontSize: '16px', fontWeight: '700', marginBottom: '1rem' },
  filterBar: { display: 'flex', gap: '8px', marginBottom: '1rem' },
  searchInput: { flex: 1, padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.15)', background: '#ffffff0f', color: '#fff', fontSize: '14px', outline: 'none' },
  filterSelect: { padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.15)', background: '#ffffff0f', color: '#fff', fontSize: '14px', outline: 'none', cursor: 'pointer' },
  applyBtn: { padding: '10px 16px', borderRadius: '10px', border: 'none', background: '#FFBE4F', color: '#000', fontWeight: '700', fontSize: '13px', cursor: 'pointer' },
  loadingText: { color: 'rgba(255,255,255,0.5)', fontSize: '14px', marginBottom: '1rem' },
  errorText: { color: '#ff6b6b', fontSize: '14px', marginBottom: '1rem' },
  groupRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderRadius: '10px', cursor: 'pointer', marginBottom: '6px', border: '1px solid transparent', transition: 'all 0.15s' },
  groupRowActive: { background: 'rgba(255,190,79,0.1)', border: '1px solid rgba(255,190,79,0.3)' },
  groupRowInactive: { background: '#ffffff07', border: '1px solid rgba(255,255,255,0.07)' },
  groupName: { fontSize: '14px', fontWeight: '600' },
  groupMeta: { fontSize: '12px', color: 'rgba(255,255,255,0.45)' },
  badge: { display: 'inline-block', padding: '3px 10px', borderRadius: '999px', background: 'rgba(255,190,79,0.15)', color: '#FFBE4F', fontWeight: '600', fontSize: '12px' },
  sectionTitle: { fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(255,255,255,0.5)', margin: '1.25rem 0 0.75rem' },
  panelRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' },
  panelName: { fontSize: '14px', fontWeight: '600' },
  panelRole: { fontSize: '12px', color: 'rgba(255,255,255,0.45)' },
  roleBadge: (role) => ({ display: 'inline-block', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', background: role === 'adviser' ? 'rgba(167,139,250,0.15)' : 'rgba(96,165,250,0.15)', color: role === 'adviser' ? '#a78bfa' : '#60a5fa' }),
  removeBtn: { padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(255,100,100,0.3)', background: 'transparent', color: 'rgba(255,100,100,0.8)', fontSize: '11px', cursor: 'pointer' },
  assignForm: { marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '8px' },
  assignSelect: { width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.15)', background: '#0d0d1a', color: '#fff', fontSize: '14px', outline: 'none', cursor: 'pointer' },
  assignBtn: { padding: '10px 18px', borderRadius: '10px', border: 'none', background: '#FFBE4F', color: '#000', fontWeight: '700', fontSize: '14px', cursor: 'pointer' },
  emptyState: { textAlign: 'center', padding: '2rem 1rem', color: 'rgba(255,255,255,0.3)', fontSize: '14px' },
  emptyText: { color: 'rgba(255,255,255,0.35)', fontSize: '13px', fontStyle: 'italic' },
}

export default FacultyAssignment