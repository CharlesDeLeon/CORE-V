import React, { useEffect, useState, useCallback } from 'react'
import api from '../../services/api'

const EMPTY_FORM = { name: '', email: '', password: '', role: 'student', status: 'active', program: '' }
const ManageUsers = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [limit] = useState(25)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null) // null = add, object = edit
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const adminCount = users.filter(u => u.role === 'sysadmin').length
  const facultyCount = users.filter(u => u.role === 'faculty').length
  const coordinatorCount = users.filter(u => u.role === 'coordinator').length
  const activeCount = users.filter(u => (u.status || (u.is_active ? 'active' : 'inactive')) === 'active').length


  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = {
        page,
        limit,
        search: search || undefined,
        role: roleFilter || undefined,
        status: statusFilter || undefined,
      }
      const res = await api.get('/admin/users', { params })
      setUsers(res.data.data || [])
      setTotal(res.data.pagination?.total || 0)
    } catch (e) {
      console.error(e)
      setError('Failed to load users')
    } finally {
      setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, search, roleFilter, statusFilter])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const applyFilters = () => { setPage(1); fetchUsers() }

  const openAdd = () => {
    setEditTarget(null)
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }

  const openEdit = (user) => {
    setEditTarget(user)
    setForm({
      name: user.name || '',
      email: user.email || '',
      password: '',
      role: user.role || 'student',
      status: user.status || (user.is_active ? 'active' : 'inactive') || 'active',
      program: user.program || '',
    })
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditTarget(null)
    setForm(EMPTY_FORM)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      if (editTarget) {
        await api.put(`/admin/users/${editTarget.user_id}`, form)
      } else {
        await api.post('/admin/users', form)
      }
      closeModal()
      fetchUsers()
    } catch (e) {
      console.error(e)
      setError('Failed to save user')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return
    try {
      await api.delete(`/admin/users/${userId}`)
      fetchUsers()
    } catch (e) {
      console.error(e)
      setError('Failed to delete user')
    }
  }

  const getInitials = (name) => {
    if (!name) return '?'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <div style={styles.container}>

      {/* Header */}
      <div style={styles.topBar}>
        <div>
          <h2 style={styles.heading}>Manage Users</h2>
          <p style={styles.subheading}>View, create, and manage all user accounts</p>
        </div>
        <button style={styles.addButton} onClick={openAdd}>+ Add User</button>
      </div>

      {/* Metrics */}
      <div style={styles.metricsGrid}>
        <div style={styles.metricCard}>
          <div style={styles.metricLabel}>Total Users</div>
          <div style={styles.metricValue}>{total}</div>
        </div>
        <div style={styles.metricCard}>
          <div style={styles.metricLabel}>Active</div>
          <div style={styles.metricValue}>{activeCount}</div>
        </div>
        <div style={styles.metricCard}>
          <div style={styles.metricLabel}>Admins</div>
          <div style={styles.metricValue}>{adminCount}</div>
        </div>
        <div style={styles.metricCard}>
          <div style={styles.metricLabel}>Faculty</div>
          <div style={styles.metricValue}>{facultyCount}</div>
        </div>
        <div style={styles.metricCard}>
          <div style={styles.metricLabel}>Coordinator</div>
          <div style={styles.metricValue}>{coordinatorCount}</div>
        </div>
      </div>

      {/* Filters */}
      <div style={styles.filterBar}>
        <input
          style={styles.searchInput}
          placeholder="Search by name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && applyFilters()}
        />
        <select
          style={styles.filterSelect}
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
        >
          <option value="">All Roles</option>
          <option value="sysadmin">SysAdmin</option>
          <option value="faculty">Faculty</option>
          <option value="coordinator">Coordinator</option>
          <option value="student">Student</option>
        </select>
        <select
          style={styles.filterSelect}
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <button style={styles.addButton} onClick={applyFilters}>Apply</button>
      </div>

      {loading && <div style={styles.loadingText}>Loading...</div>}
      {error && <div style={styles.errorText}>{error}</div>}

      {/* Table */}
      <table style={styles.table}>
        <thead style={styles.thead}>
          <tr>
            <th style={styles.th}>User</th>
            <th style={styles.th}>Role</th>
            <th style={styles.th}>Status</th>
            <th style={styles.th}>Program</th>
            <th style={styles.th}>Joined</th>
            <th style={styles.th}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.user_id}>
              <td style={styles.td}>
                <div style={styles.avatarCell}>
                  <div style={styles.avatar}>{getInitials(u.name)}</div>
                  <div>
                    <p style={styles.userName}>{u.name || '—'}</p>
                    <p style={styles.userEmail}>{u.email || '—'}</p>
                  </div>
                </div>
              </td>
              <td style={styles.td}>
                  <span style={styles.roleBadge}>{u.role || 'student'}</span>
                </td>
              <td style={styles.td}>
                {(u.status || (u.is_active ? 'active' : 'inactive')) === 'active' ? (
                  <span style={styles.statusBadgeActive}>
                    <span style={{ ...styles.statusDot, background: '#4ade80' }} />
                    Active
                  </span>
                ) : (
                  <span style={styles.statusBadgeInactive}>
                    <span style={{ ...styles.statusDot, background: 'rgba(255,255,255,0.3)' }} />
                    Inactive
                  </span>
                )}
              </td>
              <td style={styles.td}>{u.program || '—'}</td>
              <td style={styles.td}>
                {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
              </td>
              <td style={styles.td}>
                <div style={styles.actionGroup}>
                  <button style={styles.editButton} onClick={() => openEdit(u)}>Edit</button>
                  <button style={styles.deleteButton} onClick={() => handleDelete(u.user_id)}>Deactivate</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      <div style={styles.pagination}>
        <div style={styles.paginationInfo}>Showing {users.length} of {total}</div>
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

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div style={styles.overlay} onClick={closeModal}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <h3 style={styles.modalHeading}>{editTarget ? 'Edit User' : 'Add User'}</h3>

            <div style={styles.modalField}>
              <label style={styles.modalLabel}>Full Name</label>
              <input
                style={styles.modalInput}
                placeholder="e.g. Juan dela Cruz"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div style={styles.modalField}>
              <label style={styles.modalLabel}>Email</label>
              <input
                style={styles.modalInput}
                type="email"
                placeholder="e.g. juan@email.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
              />
            </div>

            {/* Password — only shown when adding a new user */}
            {!editTarget && (
              <div style={styles.modalField}>
                <label style={styles.modalLabel}>Password</label>
                <div style={styles.passwordWrapper}>
                  <input
                    style={{ ...styles.modalInput, paddingRight: '44px' }}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Set a password"
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                  />
                  <button
                    type="button"
                    style={styles.eyeButton}
                    onClick={() => setShowPassword(p => !p)}
                    tabIndex={-1}
                  >
                    {showPassword ? 'hide' : 'show'}
                  </button>
                </div>
              </div>
            )}

            <div style={styles.modalField}>
              <label style={styles.modalLabel}>Role</label>
              <select
                style={styles.modalSelect}
                value={form.role}
                onChange={e => setForm({ ...form, role: e.target.value })}
              >
                <option value="student">Student</option>
                <option value="sysadmin">SysAdmin</option>
                <option value="faculty">Faculty</option>
                <option value="coordinator">Coordinator</option>
              </select>
            </div>

            <div style={styles.modalField}>
              <label style={styles.modalLabel}>Program</label>
              <input
                style={styles.modalInput}
                placeholder="e.g. BSIT"
                value={form.program}
                onChange={e => setForm({ ...form, program: e.target.value })}
              />
            </div>

            <div style={styles.modalActions}>
              <button style={styles.cancelButton} onClick={closeModal}>Cancel</button>
              <button style={styles.saveButton} onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : editTarget ? 'Save Changes' : 'Add User'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

const styles = {
  // Layout
  container: {
    padding: '2rem',
    color: '#fff',
    minHeight: '100vh',
  },
  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '2rem',
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
  },

  // Metrics
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: '1rem',
    marginBottom: '2rem',
  },
  metricCard: {
    background: '#ffffff0f',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '14px',
    padding: '1.5rem',
    textAlign: 'center',
  },
  metricLabel: {
    fontSize: '13px',
    color: 'rgba(255,255,255,0.6)',
    marginBottom: '0.5rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  metricValue: {
    fontSize: '2.5rem',
    fontWeight: '800',
    color: '#FFBE4F',
    lineHeight: 1,
  },

  // Filter bar
  filterBar: {
    display: 'flex',
    gap: '8px',
    marginBottom: '1.5rem',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    minWidth: '200px',
    padding: '10px 14px',
    borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.15)',
    background: '#ffffff0f',
    color: '#fff',
    fontSize: '14px',
    outline: 'none',
  },
  filterSelect: {
    padding: '10px 14px',
    borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.15)',
    background: '#ffffff0f',
    color: '#fff',
    fontSize: '14px',
    outline: 'none',
    cursor: 'pointer',
  },
  addButton: {
    padding: '10px 18px',
    borderRadius: '10px',
    border: 'none',
    background: '#FFBE4F',
    color: '#000',
    fontWeight: '700',
    fontSize: '14px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },

  // Status
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

  // Table
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

  // Avatar
  avatarCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  avatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    background: 'rgba(255,190,79,0.2)',
    border: '1px solid rgba(255,190,79,0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: '700',
    color: '#FFBE4F',
    flexShrink: 0,
  },
  userName: {
    fontWeight: '600',
    fontSize: '14px',
    margin: '0 0 2px 0',
  },
  userEmail: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.45)',
    margin: 0,
  },

  // Badges
  roleBadge: {
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: '999px',
    background: 'rgba(255,190,79,0.15)',
    color: '#FFBE4F',
    fontWeight: '600',
    fontSize: '12px',
    letterSpacing: '0.03em',
  },
  statusBadgeActive: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    padding: '3px 10px',
    borderRadius: '999px',
    background: 'rgba(74,222,128,0.12)',
    color: '#4ade80',
    fontWeight: '600',
    fontSize: '12px',
  },
  statusBadgeInactive: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    padding: '3px 10px',
    borderRadius: '999px',
    background: 'rgba(255,255,255,0.07)',
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '600',
    fontSize: '12px',
  },
  statusDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    flexShrink: 0,
  },

  // Actions
  actionGroup: {
    display: 'flex',
    gap: '6px',
  },
  editButton: {
    padding: '5px 12px',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.15)',
    background: 'transparent',
    color: 'rgba(255,255,255,0.7)',
    fontSize: '12px',
    cursor: 'pointer',
  },
  deleteButton: {
    padding: '5px 12px',
    borderRadius: '8px',
    border: '1px solid rgba(255,100,100,0.3)',
    background: 'transparent',
    color: 'rgba(255,100,100,0.8)',
    fontSize: '12px',
    cursor: 'pointer',
  },

  // Pagination
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

  // Modal overlay
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  modal: {
    background: '#1a1a2e',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '16px',
    padding: '2rem',
    width: '100%',
    maxWidth: '440px',
    color: '#fff',
  },
  modalHeading: {
    fontSize: '20px',
    fontWeight: '700',
    margin: '0 0 1.5rem 0',
  },
  modalField: {
    marginBottom: '1rem',
  },
  modalLabel: {
    display: 'block',
    fontSize: '13px',
    color: 'rgba(255,255,255,0.6)',
    marginBottom: '6px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  modalInput: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.15)',
    background: '#ffffff0f',
    color: '#fff',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  modalSelect: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.15)',
    background: '#0d0d1a',
    color: '#fff',
    fontSize: '14px',
    outline: 'none',
    cursor: 'pointer',
    boxSizing: 'border-box',
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '8px',
    marginTop: '1.5rem',
  },
  cancelButton: {
    padding: '10px 18px',
    borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.15)',
    background: 'transparent',
    color: 'rgba(255,255,255,0.7)',
    fontSize: '14px',
    cursor: 'pointer',
  },
  saveButton: {
    padding: '10px 18px',
    borderRadius: '10px',
    border: 'none',
    background: '#FFBE4F',
    color: '#000',
    fontWeight: '700',
    fontSize: '14px',
    cursor: 'pointer',
  },
}

export default ManageUsers
