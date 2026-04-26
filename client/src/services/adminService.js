import api from './api'

export const getAdminUsers = async (params = {}) => {
  const response = await api.get('/admin/users', { params })
  return response.data
}

export const getRolePermissions = async () => {
  const response = await api.get('/admin/roles/permissions')
  return response.data
}

export const getUserRoleStats = async () => {
  const response = await api.get('/admin/stats/users')
  return response.data
}

export const getAuditSummary = async () => {
  const response = await api.get('/admin/audit-summary')
  return response.data
}

export const updateUserRole = async (userId, role) => {
  const response = await api.patch(`/admin/users/${userId}/role`, { role })
  return response.data
}
