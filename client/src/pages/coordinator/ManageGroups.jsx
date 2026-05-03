/* eslint-disable no-unused-vars */
import React, { useEffect, useState, useCallback } from 'react'
import api from '../../services/api'

const EMPTY_FORM = { group_name: '', program: '', school_year: '' }

const ManageGroups = () => {
  const [groups, setGroups]         = useState([])
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState(null)
  const [page, setPage]             = useState(1)
  const [limit]                     = useState(25)
  const [total, setTotal]           = useState(0)
  const [search, setSearch]         = useState('')
  const [modalOpen, setModalOpen]   = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [form, setForm]             = useState(EMPTY_FORM)
  const [saving, setSaving]         = useState(false)

  // Modal student management
  const [modalMemberSearch, setModalMemberSearch]   = useState('')
  const [modalMemberResults, setModalMemberResults] = useState([])
  const [modalMembers, setModalMembers]             = useState([]) // staged list of { user_id, name, email }
  const [hoveredStudent, setHoveredStudent]         = useState(null)

  // Detail panel state
  const [detail, setDetail]         = useState(null)
  const [ setDetailLoading] = useState(false)
  const [newMemberSearch, setNewMemberSearch] = useState('')
  const [studentResults, setStudentResults]   = useState([])

  const fetchGroups = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get('/coordinator/groups', { params: { search: search || undefined, page, limit } })
      setGroups(res.data.data || [])
      setTotal(res.data.pagination?.total || res.data.data?.length || 0)
    } catch (e) {
      console.error(e)
      setError('Failed to load groups')
    } finally {
      setLoading(false)
    }
  }, [page, limit, search])

  useEffect(() => { fetchGroups() }, [fetchGroups])

  // ── Modal open helpers ──────────────────────────────────────────────────────
  const openAdd = () => {
    setEditTarget(null)
    setForm(EMPTY_FORM)
    setModalMembers([])
    setModalMemberSearch('')
    setModalMemberResults([])
    setModalOpen(true)
  }

  const openEdit = async (g) => {
    setEditTarget(g)
    setForm({ group_name: g.group_name, program: g.program || '', school_year: g.school_year || '' })
    setModalMemberSearch('')
    setModalMemberResults([])

    // Pre-load existing members for the edit modal
    try {
      const res = await api.get(`/coordinator/groups/${g.group_id}`)      
      const existingMembers = (res.data.data?.members || []).map(m => ({ user_id: m.user_id, name: m.name, email: m.email }))
      setModalMembers(existingMembers)
    } catch (e) {
      console.error(e)
      setModalMembers([])
    }

    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditTarget(null)
    setForm(EMPTY_FORM)
    setModalMembers([])
    setModalMemberSearch('')
    setModalMemberResults([])
  }

  // ── Student search inside modal ─────────────────────────────────────────────
  const searchModalStudents = async (q) => {
    setModalMemberSearch(q)
    if (!q.trim()) return setModalMemberResults([])
    try {
      const res = await api.get('/coordinator/groups/students', { params: { search: q } })
      const all = res.data.data || []
      // Filter out students already added to prevent duplicates
      const alreadyAdded = new Set(modalMembers.map(m => m.user_id))
      setModalMemberResults(all.filter(s => !alreadyAdded.has(s.user_id)))
    } catch (e) {
      console.error(e)
    }
  }

  const addModalMember = (student) => {
    setModalMembers(prev => [...prev, { user_id: student.user_id, name: student.name, email: student.email }])
    setModalMemberSearch('')
    setModalMemberResults([])
  }

  const removeModalMember = (userId) => {
    setModalMembers(prev => prev.filter(m => m.user_id !== userId))
  }

  // ── Save (create or edit) ───────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true)
    try {
      let groupId

      if (editTarget) {
        // 1. Update group info
        await api.put(`/coordinator/groups/${editTarget.group_id}`, form)
        groupId = editTarget.group_id

        // 2. Sync members: fetch current, diff, add/remove as needed
        const currentRes = await api.get(`/coordinator/groups/${groupId}`)
        const currentMembers = currentRes.data.data?.members || []
        const currentIds = new Set(currentMembers.map(m => m.user_id))
        const desiredIds = new Set(modalMembers.map(m => m.user_id))

        // Add new members
        for (const m of modalMembers) {
          if (!currentIds.has(m.user_id)) {
            await api.post(`/coordinator/groups/${groupId}/members`, { user_id: m.user_id })
          }
        }
        // Remove removed members
        for (const m of currentMembers) {
          if (!desiredIds.has(m.user_id)) {
            await api.delete(`/coordinator/groups/${groupId}/members/${m.user_id}`)
          }
        }
      } else {
        // 1. Create group
        const res = await api.post('/coordinator/groups', form)
        groupId = res.data.group_id

        // 2. Add all staged members
        for (const m of modalMembers) {
          await api.post(`/coordinator/groups/${groupId}/members`, { user_id: m.user_id })
        }
      }

      closeModal()
      fetchGroups()
    } catch (e) {
      console.error(e)
      setError('Failed to save group')
    } finally {
      setSaving(false)
    }
  }

  // ── Delete group ────────────────────────────────────────────────────────────
  const handleDelete = async (groupId) => {
    if (!window.confirm('Delete this group? This cannot be undone.')) return
    try {
      await api.delete(`/coordinator/groups/${groupId}`)
      fetchGroups()
      
    // eslint-disable-next-line no-unused-vars
    } catch (e) {
      setError('Failed to delete group')
    }
  }

  // ── Detail panel ────────────────────────────────────────────────────────────
  const openDetail = async (groupId) => {
    setDetailLoading(true)
    try {
      const res = await api.get(`/coordinator/groups/${groupId}`)
      setDetail(res.data.data)
    } catch (e) {
      setError('Failed to load group detail')
    } finally {
      setDetailLoading(false)
    }
  }

  const searchStudents = async (q) => {
    if (!q) return setStudentResults([])
    try {
      const res = await api.get('/coordinator/groups/students', { params: { search: q } })
      setStudentResults(res.data.data || [])
    } catch (e) { console.error(e) }
  }

  const addMember = async (userId) => {
    try {
      await api.post(`/coordinator/groups/${detail.group_id}/members`, { user_id: userId })
      setNewMemberSearch('')
      setStudentResults([])
      openDetail(detail.group_id)
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to add member')
    }
  }

  const removeMember = async (userId) => {
    if (!window.confirm('Remove this student from the group?')) return
    try {
      await api.delete(`/coordinator/groups/${detail.group_id}/members/${userId}`)
      openDetail(detail.group_id)
    } catch (e) {
      setError('Failed to remove member')
    }
  }

  return (
    <div style={styles.container}>

      <div style={styles.topBar}>
        <div>
          <h2 style={styles.heading}>Manage Groups</h2>
          <p style={styles.subheading}>Create and manage research groups and their members</p>
        </div>
        <button style={styles.addButton} onClick={openAdd}>+ New Group</button>
      </div>

      <div style={styles.metricsGrid}>
        <div style={styles.metricCard}>
          <div style={styles.metricLabel}>Total Groups</div>
          <div style={styles.metricValue}>{total}</div>
        </div>
        <div style={styles.metricCard}>
          <div style={styles.metricLabel}>This Page</div>
          <div style={styles.metricValue}>{groups.length}</div>
        </div>
      </div>

      <div style={styles.filterBar}>
        <input
          style={styles.searchInput}
          placeholder="Search group name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && fetchGroups()}
        />
        <button style={styles.addButton} onClick={fetchGroups}>Search</button>
      </div>

      {loading && <div style={styles.loadingText}>Loading...</div>}
      {error   && <div style={styles.errorText}>{error}</div>}

      <table style={styles.table}>
        <thead style={styles.thead}>
          <tr>
            <th style={styles.th}>Group</th>
            <th style={styles.th}>Program</th>
            <th style={styles.th}>School Year</th>
            <th style={styles.th}>Members</th>
            <th style={styles.th}>Papers</th>
            <th style={styles.th}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {groups.map(g => (
            <tr key={g.group_id}>
              <td style={styles.td}>
                <p style={styles.groupName}>{g.group_name}</p>
                <p style={styles.groupMeta}>Created {new Date(g.created_at).toLocaleDateString()}</p>
              </td>
              <td style={styles.td}>{g.program || '—'}</td>
              <td style={styles.td}>{g.school_year || '—'}</td>
              <td style={styles.td}>
                <span style={styles.badge}>{g.member_count}</span>
              </td>
              <td style={styles.td}>
                <span style={styles.badge}>{g.submission_count}</span>
              </td>
              <td style={styles.td}>
                <div style={styles.actionGroup}>
                  <button style={styles.viewButton} onClick={() => openDetail(g.group_id)}>View</button>
                  <button style={styles.editButton} onClick={() => openEdit(g)}>Edit</button>
                  <button style={styles.deleteButton} onClick={() => handleDelete(g.group_id)}>Delete</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={styles.pagination}>
        <div style={styles.paginationInfo}>Showing {groups.length} of {total}</div>
        <div style={styles.paginationControls}>
          <button style={page === 1 ? styles.pageButtonDisabled : styles.pageButton} onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Prev</button>
          <span style={styles.pageLabel}>Page {page}</span>
          <button style={page * limit >= total ? styles.pageButtonDisabled : styles.pageButton} onClick={() => setPage(p => p + 1)} disabled={page * limit >= total}>Next</button>
        </div>
      </div>

      {/* ── Add / Edit Modal ── */}
      {modalOpen && (
        <div style={styles.overlay} onClick={closeModal}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <h3 style={styles.modalHeading}>{editTarget ? 'Edit Group' : 'New Group'}</h3>

            {/* Group info fields */}
            <div style={styles.modalField}>
              <label style={styles.modalLabel}>Group Name</label>
              <input style={styles.modalInput} placeholder="e.g. Group Alpha" value={form.group_name} onChange={e => setForm({ ...form, group_name: e.target.value })} />
            </div>
            <div style={styles.modalField}>
              <label style={styles.modalLabel}>Program</label>
              <input style={styles.modalInput} placeholder="e.g. BSIT" value={form.program} onChange={e => setForm({ ...form, program: e.target.value })} />
            </div>
            <div style={styles.modalField}>
              <label style={styles.modalLabel}>School Year</label>
              <input style={styles.modalInput} placeholder="e.g. 2024-2025" value={form.school_year} onChange={e => setForm({ ...form, school_year: e.target.value })} />
            </div>

            <div style={styles.modalDivider} />

            {/* ── Student Members Section ── */}
            <div style={styles.modalSectionTitle}>
              Add Students ({modalMembers.length} added)
            </div>

            {/* Search input */}
            <div style={styles.studentSearchRow}>
              <input
                style={styles.studentSearchInput}
                placeholder="Search student by name or email..."
                value={modalMemberSearch}
                onChange={e => searchModalStudents(e.target.value)}
              />
            </div>

            {/* Dropdown results */}
            {modalMemberResults.length > 0 && (
              <div style={styles.studentDropdown}>
                {modalMemberResults.map(s => (
                  <div
                    key={s.user_id}
                    style={{
                      ...styles.studentDropdownItem,
                      ...(hoveredStudent === s.user_id ? styles.studentDropdownItemHover : {})
                    }}
                    onMouseEnter={() => setHoveredStudent(s.user_id)}
                    onMouseLeave={() => setHoveredStudent(null)}
                    onClick={() => addModalMember(s)}
                  >
                    <span>
                      <strong style={{ color: '#fff' }}>{s.name}</strong>
                      <span style={{ color: 'rgba(255,255,255,0.4)', marginLeft: '8px' }}>{s.email}</span>
                    </span>
                    <span style={{ color: '#FFBE4F', fontSize: '12px', fontWeight: '700' }}>+ Add</span>
                  </div>
                ))}
              </div>
            )}

            {/* Added members chips */}
            {modalMembers.length > 0 ? (
              <div style={styles.addedMembersList}>
                {modalMembers.map(m => (
                  <div key={m.user_id} style={styles.addedMemberChip}>
                    <div style={styles.addedMemberInfo}>
                      <span style={styles.addedMemberName}>{m.name}</span>
                      <span style={styles.addedMemberEmail}>{m.email}</span>
                    </div>
                    <button style={styles.chipRemoveBtn} onClick={() => removeModalMember(m.user_id)}>Remove</button>
                  </div>
                ))}
              </div>
            ) : (
              <p style={styles.emptyMembersHint}>No students added yet. Search above to add members.</p>
            )}

            <div style={styles.modalActions}>
              <button style={styles.cancelButton} onClick={closeModal}>Cancel</button>
              <button style={styles.saveButton} onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : editTarget ? 'Save Changes' : 'Create Group'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Group Detail Side Panel ── */}
      {detail && (
        <>
          <div style={styles.detailOverlay} onClick={() => setDetail(null)} />
          <div style={styles.detailPanel}>
            <button style={styles.closeBtn} onClick={() => setDetail(null)}>← Back</button>
            <h3 style={styles.detailHeading}>{detail.group_name}</h3>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', margin: '0 0 4px' }}>{detail.program || 'No program'} · {detail.school_year || 'No school year'}</p>

            {/* Members */}
            <div style={styles.sectionTitle}>Members ({detail.members?.length || 0})</div>
            {detail.members?.length === 0 && <p style={styles.emptyText}>No members yet.</p>}
            {detail.members?.map(m => (
              <div key={m.user_id} style={styles.memberRow}>
                <div>
                  <div style={styles.memberName}>{m.name}</div>
                  <div style={styles.memberEmail}>{m.email}</div>
                </div>
                <button style={styles.removeBtn} onClick={() => removeMember(m.user_id)}>Remove</button>
              </div>
            ))}

            {/* Add member search */}
            <div style={styles.addMemberRow}>
              <input
                style={styles.addMemberInput}
                placeholder="Search student by name or email..."
                value={newMemberSearch}
                onChange={e => { setNewMemberSearch(e.target.value); searchStudents(e.target.value) }}
              />
            </div>
            {studentResults.length > 0 && (
              <div style={{ marginTop: '6px', background: '#0b1228', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                {studentResults.map(s => (
                  <div key={s.user_id} style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer', fontSize: '13px' }} onClick={() => addMember(s.user_id)}>
                    <strong>{s.name}</strong> <span style={{ color: 'rgba(255,255,255,0.45)' }}>{s.email}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Submissions */}
            <div style={styles.sectionTitle}>Papers ({detail.submissions?.length || 0})</div>
            {detail.submissions?.length === 0 && <p style={styles.emptyText}>No submissions yet.</p>}
            {detail.submissions?.map(s => (
              <div key={s.submission_id} style={{ padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>{s.title}</div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)' }}>{s.stage} · {s.status}</div>
              </div>
            ))}

            {/* Panel */}
            <div style={styles.sectionTitle}>Panel ({detail.panel?.length || 0})</div>
            {detail.panel?.length === 0 && <p style={styles.emptyText}>No panel assigned yet.</p>}
            {detail.panel?.map(p => (
              <div key={p.assignment_id} style={styles.memberRow}>
                <div>
                  <div style={styles.memberName}>{p.name}</div>
                  <div style={styles.memberEmail}>{p.role_in_panel}</div>
                </div>
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
  addButton: { padding: '10px 18px', borderRadius: '10px', border: 'none', background: '#FFBE4F', color: '#000', fontWeight: '700', fontSize: '14px', cursor: 'pointer', whiteSpace: 'nowrap' },
  metricsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' },
  metricCard: { background: '#ffffff0f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '1.5rem', textAlign: 'center' },
  metricLabel: { fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' },
  metricValue: { fontSize: '2.5rem', fontWeight: '800', color: '#FFBE4F', lineHeight: 1 },
  filterBar: { display: 'flex', gap: '8px', marginBottom: '1.5rem', flexWrap: 'wrap' },
  searchInput: { flex: 1, minWidth: '200px', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.15)', background: '#ffffff0f', color: '#fff', fontSize: '14px', outline: 'none' },
  loadingText: { color: 'rgba(255,255,255,0.5)', fontSize: '14px', marginBottom: '1rem' },
  errorText: { color: '#ff6b6b', fontSize: '14px', marginBottom: '1rem' },
  table: { width: '100%', borderCollapse: 'collapse', background: '#ffffff0f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', overflow: 'hidden' },
  thead: { background: 'rgba(255,255,255,0.05)' },
  th: { padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(255,255,255,0.6)', borderBottom: '1px solid rgba(255,255,255,0.1)' },
  td: { padding: '12px 16px', fontSize: '14px', color: 'rgba(255,255,255,0.85)', borderTop: '1px solid rgba(255,255,255,0.07)', verticalAlign: 'middle' },
  groupName: { fontWeight: '600', fontSize: '14px', margin: '0 0 2px 0' },
  groupMeta: { fontSize: '12px', color: 'rgba(255,255,255,0.45)', margin: 0 },
  badge: { display: 'inline-block', padding: '3px 10px', borderRadius: '999px', background: 'rgba(255,190,79,0.15)', color: '#FFBE4F', fontWeight: '600', fontSize: '12px' },
  actionGroup: { display: 'flex', gap: '6px' },
  editButton: { padding: '5px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: 'rgba(255,255,255,0.7)', fontSize: '12px', cursor: 'pointer' },
  viewButton: { padding: '5px 12px', borderRadius: '8px', border: '1px solid rgba(255,190,79,0.3)', background: 'transparent', color: '#FFBE4F', fontSize: '12px', cursor: 'pointer' },
  deleteButton: { padding: '5px 12px', borderRadius: '8px', border: '1px solid rgba(255,100,100,0.3)', background: 'transparent', color: 'rgba(255,100,100,0.8)', fontSize: '12px', cursor: 'pointer' },
  pagination: { marginTop: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  paginationInfo: { color: 'rgba(255,255,255,0.5)', fontSize: '14px' },
  paginationControls: { display: 'flex', alignItems: 'center', gap: '8px' },
  pageButton: { padding: '7px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: '#ffffff0f', color: '#fff', fontSize: '13px', cursor: 'pointer' },
  pageButtonDisabled: { padding: '7px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.07)', background: 'transparent', color: 'rgba(255,255,255,0.25)', fontSize: '13px', cursor: 'not-allowed' },
  pageLabel: { fontSize: '14px', color: 'rgba(255,255,255,0.6)' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },

  // Wider modal to accommodate student section
  modal: { background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '16px', padding: '2rem', width: '100%', maxWidth: '620px', color: '#fff', maxHeight: '90vh', overflowY: 'auto' },
  modalHeading: { fontSize: '20px', fontWeight: '700', margin: '0 0 1.5rem 0' },
  modalField: { marginBottom: '1rem' },
  modalLabel: { display: 'block', fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginBottom: '6px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em' },
  modalInput: { width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.15)', background: '#ffffff0f', color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box' },
  modalDivider: { borderTop: '1px solid rgba(255,255,255,0.1)', margin: '1.25rem 0' },
  modalSectionTitle: { fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(255,255,255,0.5)', marginBottom: '0.75rem' },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '1.5rem' },
  cancelButton: { padding: '10px 18px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: 'rgba(255,255,255,0.7)', fontSize: '14px', cursor: 'pointer' },
  saveButton: { padding: '10px 18px', borderRadius: '10px', border: 'none', background: '#FFBE4F', color: '#000', fontWeight: '700', fontSize: '14px', cursor: 'pointer' },

  // Student search inside modal
  studentSearchRow: { display: 'flex', gap: '8px', marginBottom: '6px' },
  studentSearchInput: { flex: 1, padding: '9px 13px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.15)', background: '#ffffff0f', color: '#fff', fontSize: '13px', outline: 'none' },
  studentDropdown: { background: '#0b1228', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden', marginBottom: '8px', maxHeight: '160px', overflowY: 'auto' },
  studentDropdownItem: { padding: '9px 13px', borderBottom: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer', fontSize: '13px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  studentDropdownItemHover: { background: 'rgba(255,190,79,0.08)' },
  addedMembersList: { display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' },
  addedMemberChip: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderRadius: '8px', background: 'rgba(255,190,79,0.07)', border: '1px solid rgba(255,190,79,0.2)' },
  addedMemberInfo: { display: 'flex', flexDirection: 'column', gap: '1px' },
  addedMemberName: { fontSize: '13px', fontWeight: '600', color: '#fff' },
  addedMemberEmail: { fontSize: '11px', color: 'rgba(255,255,255,0.4)' },
  chipRemoveBtn: { padding: '3px 9px', borderRadius: '6px', border: '1px solid rgba(255,100,100,0.3)', background: 'transparent', color: 'rgba(255,100,100,0.8)', fontSize: '11px', cursor: 'pointer', flexShrink: 0 },
  emptyMembersHint: { fontSize: '12px', color: 'rgba(255,255,255,0.3)', fontStyle: 'italic', padding: '6px 0' },

  // Detail panel (slide-in)
  detailOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 90 },
  detailPanel: { position: 'fixed', top: 0, right: 0, width: '480px', height: '100vh', background: '#0f1629', borderLeft: '1px solid rgba(255,255,255,0.1)', overflowY: 'auto', padding: '2rem', zIndex: 91 },
  detailHeading: { fontSize: '18px', fontWeight: '700', marginBottom: '1.5rem' },
  sectionTitle: { fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(255,255,255,0.5)', margin: '1.5rem 0 0.75rem' },
  memberRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' },
  memberName: { fontSize: '14px', fontWeight: '600' },
  memberEmail: { fontSize: '12px', color: 'rgba(255,255,255,0.45)' },
  removeBtn: { padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(255,100,100,0.3)', background: 'transparent', color: 'rgba(255,100,100,0.8)', fontSize: '11px', cursor: 'pointer' },
  addMemberRow: { display: 'flex', gap: '8px', marginTop: '0.75rem' },
  addMemberInput: { flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: '#ffffff0f', color: '#fff', fontSize: '13px', outline: 'none' },
  closeBtn: { padding: '8px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: '#fff', fontSize: '13px', cursor: 'pointer', marginBottom: '1rem' },
  emptyText: { color: 'rgba(255,255,255,0.35)', fontSize: '13px', fontStyle: 'italic' },
}

export default ManageGroups