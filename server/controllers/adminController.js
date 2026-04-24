const pool = require('../config/db')
const { logAction, getAuditLogs, getAuditSummary } = require('../utils/auditLogger')

// Role permissions mapping
const rolePermissions = {
  student: {
    canUploadPapers: true,
    canViewOwnSubmissions: true,
    canViewComments: true,
    canViewNotifications: true
  },
  faculty: {
    canUploadPapers: true,
    canViewSubmissions: true,
    canAddComments: true,
    canSubmitReview: true,
    canManageAssignments: true,
    canViewNotifications: true,
    canViewAuditLogs: false
  },
  coordinator: {
    canUploadPapers: true,
    canViewSubmissions: true,
    canAddComments: true,
    canSubmitReview: true,
    canManageAssignments: true,
    canManageUsers: true,
    canViewNotifications: true,
    canViewAuditLogs: true,
    canExportData: true
  },
  sysadmin: {
    canUploadPapers: true,
    canViewSubmissions: true,
    canAddComments: true,
    canSubmitReview: true,
    canManageAssignments: true,
    canManageUsers: true,
    canManageRoles: true,
    canViewNotifications: true,
    canViewAuditLogs: true,
    canExportData: true,
    canManageBackups: true,
    canConfigureSystem: true
  }
}

// Get all users with pagination
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, role = '', search = '' } = req.query
    const offset = (page - 1) * limit

    let query = `SELECT user_id, name, email, role, created_at, updated_at 
                 FROM users 
                 WHERE 1=1`
    const params = []

    if (role) {
      query += ` AND role = ?`
      params.push(role)
    }

    if (search) {
      query += ` AND (name LIKE ? OR email LIKE ?)`
      const searchTerm = `%${search}%`
      params.push(searchTerm, searchTerm)
    }

    query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`
    params.push(parseInt(limit), offset)

    const [users] = await pool.query(query, params)

    // Get total count
    let countQuery = `SELECT COUNT(*) as total FROM users WHERE 1=1`
    const countParams = []

    if (role) {
      countQuery += ` AND role = ?`
      countParams.push(role)
    }

    if (search) {
      countQuery += ` AND (name LIKE ? OR email LIKE ?)`
      const searchTerm = `%${search}%`
      countParams.push(searchTerm, searchTerm)
    }

    const [countResult] = await pool.query(countQuery, countParams)
    const total = countResult[0].total

    res.json({
      data: users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

// Get single user details
const getUserDetail = async (req, res) => {
  try {
    const { userId } = req.params

    const [users] = await pool.query(
      `SELECT user_id, name, email, role, created_at, updated_at 
       FROM users 
       WHERE user_id = ?`,
      [userId]
    )

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' })
    }

    const user = users[0]
    res.json({
      ...user,
      permissions: rolePermissions[user.role] || {}
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

// Update user role
const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params
    const { role } = req.body

    // Validate role
    const validRoles = ['student', 'faculty', 'coordinator', 'sysadmin']
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role' })
    }

    // Check user exists
    const [users] = await pool.query(
      `SELECT user_id FROM users WHERE user_id = ?`,
      [userId]
    )

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' })
    }

    // Update role
    await pool.query(
      `UPDATE users SET role = ?, updated_at = NOW() WHERE user_id = ?`,
      [role, userId]
    )

    // Log the action
    await logAction(
      req.user.user_id,
      'update_role',
      'user',
      userId,
      { new_role: role, updated_by: req.user.user_id }
    )

    res.json({ message: 'User role updated successfully' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

// Get role permissions
const getRolePermissions = async (req, res) => {
  try {
    const { role } = req.params

    if (!rolePermissions[role]) {
      return res.status(404).json({ message: 'Role not found' })
    }

    res.json({
      role,
      permissions: rolePermissions[role]
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

// Get all available roles and their permissions
const getAllRolePermissions = async (req, res) => {
  try {
    res.json(rolePermissions)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

// Get user count by role
const getUserStats = async (req, res) => {
  try {
    const [stats] = await pool.query(
      `SELECT role, COUNT(*) as count 
       FROM users 
       GROUP BY role`
    )

    res.json(stats)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

// Get audit logs
const getAuditLogsList = async (req, res) => {
  try {
    const { page = 1, limit = 50, action, targetType, targetId, userId, dateFrom, dateTo } = req.query

    const filters = {}
    if (action) filters.action = action
    if (targetType) filters.targetType = targetType
    if (targetId) filters.targetId = targetId
    if (userId) filters.userId = userId
    if (dateFrom) filters.dateFrom = dateFrom
    if (dateTo) filters.dateTo = dateTo

    const result = await getAuditLogs(filters, parseInt(page), parseInt(limit))
    res.json(result)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

// Get audit summary
const getAuditLogsSummary = async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query

    const filters = {}
    if (dateFrom) filters.dateFrom = dateFrom
    if (dateTo) filters.dateTo = dateTo

    const result = await getAuditSummary(filters)
    res.json(result)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

module.exports = {
  getAllUsers,
  getUserDetail,
  updateUserRole,
  getRolePermissions,
  getAllRolePermissions,
  getUserStats,
  getAuditLogsList,
  getAuditLogsSummary
}
