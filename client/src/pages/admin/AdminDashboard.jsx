import { useEffect, useMemo, useState } from 'react'
import useAuth from '../../context/useAuth'
import {
  getAdminUsers,
  getAuditSummary,
  getRolePermissions,
  getUserRoleStats,
  updateUserRole
} from '../../services/adminService'

const ROLE_LABELS = {
  student: 'Student',
  faculty: 'Faculty',
  coordinator: 'Coordinator',
  sysadmin: 'System Administrator'
}

const ADMIN_ROLES = Object.keys(ROLE_LABELS)

const AdminDashboard = () => {
  const { user, logout } = useAuth()
  const [users, setUsers] = useState([])
  const [permissionsByRole, setPermissionsByRole] = useState({})
  const [roleStats, setRoleStats] = useState([])
  const [auditSummary, setAuditSummary] = useState(null)
  const [selectedRole, setSelectedRole] = useState('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [savingUserId, setSavingUserId] = useState(null)
  const [feedback, setFeedback] = useState('')

  const isSysadmin = user?.role?.toLowerCase() === 'sysadmin'

  const loadDashboard = async (filters = {}) => {
    setLoading(true)
    setError('')

    try {
      const query = {
        limit: 100,
        ...(filters.role && filters.role !== 'all' ? { role: filters.role } : {}),
        ...(filters.search ? { search: filters.search } : {})
      }

      const [usersResponse, permissionsResponse, statsResponse, auditResponse] = await Promise.all([
        getAdminUsers(query),
        getRolePermissions(),
        getUserRoleStats(),
        getAuditSummary()
      ])

      setUsers(usersResponse.data || [])
      setPermissionsByRole(permissionsResponse || {})
      setRoleStats(statsResponse || [])
      setAuditSummary(auditResponse || null)
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to load role-based access control data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboard({ role: selectedRole, search })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRole])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadDashboard({ role: selectedRole, search: search.trim() })
    }, 350)

    return () => window.clearTimeout(timeoutId)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  const roleCounts = useMemo(() => {
    const counts = Object.fromEntries(ADMIN_ROLES.map(role => [role, 0]))
    roleStats.forEach(item => {
      counts[item.role] = item.count
    })
    return counts
  }, [roleStats])

  const permissionRows = useMemo(() => {
    const permissionNames = new Set()

    Object.values(permissionsByRole).forEach(permissions => {
      Object.keys(permissions).forEach(permission => permissionNames.add(permission))
    })

    return Array.from(permissionNames).sort()
  }, [permissionsByRole])

  const recentAuditItems = auditSummary?.actionsByType?.slice(0, 4) || []

  const handleRoleChange = async (userId, role) => {
    setSavingUserId(userId)
    setFeedback('')
    setError('')

    try {
      const response = await updateUserRole(userId, role)
      setFeedback(response.message || 'Role updated successfully.')
      await loadDashboard({ role: selectedRole, search: search.trim() })
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to update the selected role.')
    } finally {
      setSavingUserId(null)
    }
  }

  return (
    <div style={styles.page}>
      <aside style={styles.sidebar}>
        <div>
          <div style={styles.brandMark}>CV</div>
          <h1 style={styles.sidebarTitle}>System Access Console</h1>
          <p style={styles.sidebarText}>
            Manage permissions for students, faculty, coordinators, and admins from one protected workspace.
          </p>
        </div>

        <div style={styles.sidebarCard}>
          <div style={styles.profileLabel}>Signed in as</div>
          <div style={styles.profileName}>{user?.name}</div>
          <div style={styles.profileRole}>{ROLE_LABELS[user?.role?.toLowerCase()] || user?.role}</div>
        </div>

        <div style={styles.sidebarCard}>
          <div style={styles.profileLabel}>Security focus</div>
          <div style={styles.sidebarListItem}>Role-based access control</div>
          <div style={styles.sidebarListItem}>Protected role assignment</div>
          <div style={styles.sidebarListItem}>Permission visibility</div>
          <div style={styles.sidebarListItem}>Audit activity summary</div>
        </div>

        <button style={styles.logoutButton} onClick={logout}>Logout</button>
      </aside>

      <main style={styles.main}>
        <section style={styles.hero}>
          <div>
            <p style={styles.eyebrow}>System Administrator</p>
            <h2 style={styles.heading}>Role-Based Access Control</h2>
            <p style={styles.subheading}>
              Assign access levels confidently, review who has what rights, and keep administrative changes visible.
            </p>
          </div>

          <div style={styles.statGrid}>
            {ADMIN_ROLES.map(role => (
              <div key={role} style={styles.statCard}>
                <div style={styles.statValue}>{roleCounts[role] || 0}</div>
                <div style={styles.statLabel}>{ROLE_LABELS[role]}</div>
              </div>
            ))}
          </div>
        </section>

        {(error || feedback) && (
          <section style={styles.messageRow}>
            {error ? <div style={{ ...styles.message, ...styles.messageError }}>{error}</div> : null}
            {!error && feedback ? <div style={{ ...styles.message, ...styles.messageSuccess }}>{feedback}</div> : null}
          </section>
        )}

        <section style={styles.panelGrid}>
          <div style={styles.primaryPanel}>
            <div style={styles.panelHeader}>
              <div>
                <h3 style={styles.panelTitle}>User Access Management</h3>
                <p style={styles.panelSubtitle}>
                  {isSysadmin
                    ? 'Update roles for users and enforce proper access levels.'
                    : 'Review current assignments. Only system administrators can change roles.'}
                </p>
              </div>

              <div style={styles.controlRow}>
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search name or email"
                  style={styles.searchInput}
                />
                <select
                  value={selectedRole}
                  onChange={(event) => setSelectedRole(event.target.value)}
                  style={styles.selectInput}
                >
                  <option value="all">All roles</option>
                  {ADMIN_ROLES.map(role => (
                    <option key={role} value={role}>
                      {ROLE_LABELS[role]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {loading ? (
              <div style={styles.emptyState}>Loading access rules and user assignments...</div>
            ) : (
              <div style={styles.tableShell}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>User</th>
                      <th style={styles.th}>Program</th>
                      <th style={styles.th}>Current Role</th>
                      <th style={styles.th}>Status</th>
                      <th style={styles.th}>Access Level</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={styles.emptyCell}>No matching users found.</td>
                      </tr>
                    ) : (
                      users.map(person => (
                        <tr key={person.user_id}>
                          <td style={styles.td}>
                            <div style={styles.userName}>{person.name}</div>
                            <div style={styles.userMeta}>{person.email}</div>
                          </td>
                          <td style={styles.td}>{person.program || 'N/A'}</td>
                          <td style={styles.td}>
                            <span style={styles.roleBadge}>{ROLE_LABELS[person.role] || person.role}</span>
                          </td>
                          <td style={styles.td}>
                            <span style={person.is_active ? styles.activeBadge : styles.inactiveBadge}>
                              {person.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td style={styles.td}>
                            {isSysadmin ? (
                              <select
                                value={person.role}
                                onChange={(event) => handleRoleChange(person.user_id, event.target.value)}
                                disabled={savingUserId === person.user_id}
                                style={styles.roleSelect}
                              >
                                {ADMIN_ROLES.map(role => (
                                  <option key={role} value={role}>
                                    {ROLE_LABELS[role]}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <span style={styles.readOnlyText}>Read-only for coordinators</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div style={styles.sideColumn}>
            <section style={styles.secondaryPanel}>
              <h3 style={styles.panelTitle}>Permission Matrix</h3>
              <p style={styles.panelSubtitle}>Review which actions are granted to each role.</p>

              {loading ? (
                <div style={styles.emptyState}>Loading permissions...</div>
              ) : (
                <div style={styles.permissionList}>
                  {permissionRows.map(permission => (
                    <div key={permission} style={styles.permissionRow}>
                      <div style={styles.permissionName}>{formatPermission(permission)}</div>
                      <div style={styles.permissionDots}>
                        {ADMIN_ROLES.map(role => (
                          <span
                            key={`${permission}-${role}`}
                            title={`${ROLE_LABELS[role]}: ${permissionsByRole[role]?.[permission] ? 'Allowed' : 'Not allowed'}`}
                            style={{
                              ...styles.permissionDot,
                              background: permissionsByRole[role]?.[permission] ? roleColor(role) : '#d9dfec'
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section style={styles.secondaryPanel}>
              <h3 style={styles.panelTitle}>Security Snapshot</h3>
              <p style={styles.panelSubtitle}>Recent admin-sensitive actions grouped from the audit trail.</p>

              {loading ? (
                <div style={styles.emptyState}>Loading audit summary...</div>
              ) : recentAuditItems.length === 0 ? (
                <div style={styles.emptyState}>No audit entries available yet.</div>
              ) : (
                <div style={styles.auditList}>
                  {recentAuditItems.map(item => (
                    <div key={item.action} style={styles.auditItem}>
                      <div>
                        <div style={styles.auditAction}>{formatAuditLabel(item.action)}</div>
                        <div style={styles.auditMeta}>Tracked administrative event</div>
                      </div>
                      <div style={styles.auditCount}>{item.count}</div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </section>
      </main>
    </div>
  )
}

const formatPermission = (permission) => (
  permission
    .replace(/^can/, '')
    .replace(/([A-Z])/g, ' $1')
    .trim()
)

const formatAuditLabel = (action) => (
  String(action || '')
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, character => character.toUpperCase())
)

const roleColor = (role) => {
  if (role === 'student') return '#5bc0eb'
  if (role === 'faculty') return '#f6aa1c'
  if (role === 'coordinator') return '#7bd389'
  return '#ff6b6b'
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'grid',
    gridTemplateColumns: '280px 1fr',
    background: 'linear-gradient(135deg, #f3f0e8 0%, #dfe7f2 45%, #f9fafc 100%)',
    color: '#14213d',
  },
  sidebar: {
    padding: '28px',
    background: 'linear-gradient(180deg, #12355b 0%, #0b233f 100%)',
    color: '#f4f7fb',
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
  },
  brandMark: {
    width: '52px',
    height: '52px',
    borderRadius: '16px',
    background: 'linear-gradient(135deg, #f6aa1c 0%, #ffd166 100%)',
    color: '#102542',
    display: 'grid',
    placeItems: 'center',
    fontWeight: 800,
    letterSpacing: '0.08em',
    marginBottom: '18px',
  },
  sidebarTitle: {
    fontSize: '1.35rem',
    margin: 0,
  },
  sidebarText: {
    color: 'rgba(244,247,251,0.72)',
    lineHeight: 1.6,
    fontSize: '0.95rem',
  },
  sidebarCard: {
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '20px',
    padding: '16px',
  },
  profileLabel: {
    fontSize: '0.74rem',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'rgba(244,247,251,0.58)',
    marginBottom: '8px',
  },
  profileName: {
    fontSize: '1rem',
    fontWeight: 700,
    marginBottom: '4px',
  },
  profileRole: {
    fontSize: '0.92rem',
    color: '#ffd166',
  },
  sidebarListItem: {
    padding: '8px 0',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    fontSize: '0.92rem',
  },
  logoutButton: {
    marginTop: 'auto',
    padding: '12px 16px',
    borderRadius: '14px',
    border: '1px solid rgba(255,255,255,0.18)',
    background: 'transparent',
    color: '#f4f7fb',
    cursor: 'pointer',
    fontWeight: 600,
  },
  main: {
    padding: '32px',
  },
  hero: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '24px',
    alignItems: 'flex-start',
    marginBottom: '24px',
    flexWrap: 'wrap',
  },
  eyebrow: {
    margin: 0,
    color: '#bf6c00',
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    fontSize: '0.76rem',
    fontWeight: 700,
  },
  heading: {
    margin: '10px 0 12px',
    fontSize: 'clamp(1.8rem, 3vw, 3rem)',
    lineHeight: 1.1,
  },
  subheading: {
    maxWidth: '650px',
    color: '#44556f',
    lineHeight: 1.6,
    fontSize: '1rem',
  },
  statGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(140px, 1fr))',
    gap: '14px',
    minWidth: '320px',
  },
  statCard: {
    background: 'rgba(255,255,255,0.7)',
    border: '1px solid rgba(18,53,91,0.08)',
    borderRadius: '20px',
    padding: '18px',
    boxShadow: '0 10px 30px rgba(18,53,91,0.08)',
  },
  statValue: {
    fontSize: '2rem',
    fontWeight: 800,
  },
  statLabel: {
    marginTop: '6px',
    color: '#5c6b80',
    fontSize: '0.92rem',
  },
  messageRow: {
    marginBottom: '18px',
  },
  message: {
    padding: '14px 16px',
    borderRadius: '16px',
    fontWeight: 600,
  },
  messageError: {
    background: '#ffe1dc',
    color: '#8f250c',
    border: '1px solid #ffc3b7',
  },
  messageSuccess: {
    background: '#e6f7ea',
    color: '#1b6b3f',
    border: '1px solid #bce7c8',
  },
  panelGrid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1.5fr) minmax(320px, 0.9fr)',
    gap: '20px',
    alignItems: 'start',
  },
  primaryPanel: {
    background: 'rgba(255,255,255,0.82)',
    borderRadius: '26px',
    padding: '24px',
    boxShadow: '0 18px 40px rgba(18,53,91,0.08)',
  },
  sideColumn: {
    display: 'grid',
    gap: '20px',
  },
  secondaryPanel: {
    background: 'rgba(255,255,255,0.78)',
    borderRadius: '26px',
    padding: '24px',
    boxShadow: '0 18px 40px rgba(18,53,91,0.08)',
  },
  panelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '16px',
    marginBottom: '18px',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
  },
  panelTitle: {
    margin: 0,
    fontSize: '1.2rem',
  },
  panelSubtitle: {
    margin: '6px 0 0',
    color: '#5c6b80',
    lineHeight: 1.5,
    fontSize: '0.92rem',
  },
  controlRow: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
  },
  searchInput: {
    minWidth: '220px',
    padding: '12px 14px',
    borderRadius: '14px',
    border: '1px solid #ccd6e3',
    background: '#fffdf8',
    color: '#14213d',
  },
  selectInput: {
    padding: '12px 14px',
    borderRadius: '14px',
    border: '1px solid #ccd6e3',
    background: '#fffdf8',
    color: '#14213d',
  },
  tableShell: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    textAlign: 'left',
    padding: '12px 10px',
    fontSize: '0.78rem',
    color: '#6a7a90',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    borderBottom: '1px solid #e6ecf2',
  },
  td: {
    padding: '14px 10px',
    borderBottom: '1px solid #edf2f7',
    verticalAlign: 'middle',
    fontSize: '0.95rem',
  },
  userName: {
    fontWeight: 700,
    marginBottom: '4px',
  },
  userMeta: {
    color: '#5c6b80',
    fontSize: '0.84rem',
  },
  roleBadge: {
    display: 'inline-flex',
    padding: '6px 10px',
    borderRadius: '999px',
    background: '#e9eef5',
    color: '#17324d',
    fontWeight: 700,
    fontSize: '0.82rem',
  },
  activeBadge: {
    display: 'inline-flex',
    padding: '6px 10px',
    borderRadius: '999px',
    background: '#e8f7ee',
    color: '#236742',
    fontWeight: 700,
    fontSize: '0.82rem',
  },
  inactiveBadge: {
    display: 'inline-flex',
    padding: '6px 10px',
    borderRadius: '999px',
    background: '#f6e9e9',
    color: '#8e3131',
    fontWeight: 700,
    fontSize: '0.82rem',
  },
  roleSelect: {
    padding: '10px 12px',
    borderRadius: '12px',
    border: '1px solid #ccd6e3',
    minWidth: '190px',
    background: '#fff',
    color: '#14213d',
  },
  readOnlyText: {
    color: '#6a7a90',
    fontSize: '0.84rem',
    fontWeight: 600,
  },
  emptyCell: {
    padding: '28px 12px',
    textAlign: 'center',
    color: '#6a7a90',
  },
  emptyState: {
    padding: '20px 0',
    color: '#6a7a90',
  },
  permissionList: {
    display: 'grid',
    gap: '12px',
  },
  permissionRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '14px',
    alignItems: 'center',
    paddingBottom: '12px',
    borderBottom: '1px solid #edf2f7',
  },
  permissionName: {
    fontSize: '0.92rem',
    color: '#17324d',
  },
  permissionDots: {
    display: 'flex',
    gap: '8px',
  },
  permissionDot: {
    width: '14px',
    height: '14px',
    borderRadius: '50%',
    boxShadow: 'inset 0 0 0 1px rgba(20,33,61,0.08)',
  },
  auditList: {
    display: 'grid',
    gap: '12px',
  },
  auditItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    padding: '14px 16px',
    borderRadius: '18px',
    background: '#f6f8fb',
  },
  auditAction: {
    fontWeight: 700,
    marginBottom: '4px',
  },
  auditMeta: {
    color: '#6a7a90',
    fontSize: '0.84rem',
  },
  auditCount: {
    minWidth: '42px',
    height: '42px',
    borderRadius: '14px',
    background: '#12355b',
    color: '#fff',
    display: 'grid',
    placeItems: 'center',
    fontWeight: 800,
  },
}

export default AdminDashboard
