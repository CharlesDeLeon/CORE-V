const pool = require('../config/db')
const bcrypt = require('bcryptjs')
const { logAction, getAuditLogs, getAuditSummary } = require('../utils/auditLogger')
const { rolePermissions, validRoles } = require('../constants/rbac')

const roleAliases = {
  admin: 'sysadmin',
  moderator: 'coordinator',
  user: 'student'
}

const normalizeRole = (role) => {
  if (!role) return null
  const value = String(role).toLowerCase()
  return validRoles.includes(value) ? value : roleAliases[value] || null
}

// Get all users with pagination
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, role = '', search = '', status = '' } = req.query
    const offset = (page - 1) * limit

    let query = `SELECT user_id, name, email, role, is_active, 
                        CASE WHEN is_active = 1 THEN 'active' ELSE 'inactive' END AS status,
                        program, created_at, updated_at 
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

    if (status === 'active') {
      query += ` AND is_active = 1`
    } else if (status === 'inactive') {
      query += ` AND is_active = 0`
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

    if (status === 'active') {
      countQuery += ` AND is_active = 1`
    } else if (status === 'inactive') {
      countQuery += ` AND is_active = 0`
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
      `SELECT user_id, name, email, role, is_active, program, created_at, updated_at 
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
    const role = normalizeRole(req.body.role)

    if (!role) {
      return res.status(400).json({ message: 'Invalid role' })
    }

    // Check user exists
    const [users] = await pool.query(
      `SELECT user_id, role FROM users WHERE user_id = ?`,
      [userId]
    )

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' })
    }

    const existingUser = users[0]

    if (String(existingUser.role).toLowerCase() === role) {
      return res.json({ message: 'User already has this role' })
    }

    if (req.user.user_id === parseInt(userId, 10) && role !== 'sysadmin') {
      return res.status(400).json({ message: 'You cannot remove your own system administrator access' })
    }

    if (String(existingUser.role).toLowerCase() === 'sysadmin' && role !== 'sysadmin') {
      const [sysadmins] = await pool.query(
        `SELECT COUNT(*) AS total FROM users WHERE role = 'sysadmin'`
      )

      if (sysadmins[0].total <= 1) {
        return res.status(400).json({ message: 'At least one system administrator must remain assigned' })
      }
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
      {
        previous_role: existingUser.role,
        new_role: role,
        updated_by: req.user.user_id
      }
    )

    res.json({ message: 'User role updated successfully' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

// Update user profile and optionally role/status
const updateUser = async (req, res) => {
  try {
    const { userId } = req.params
    const updates = []
    const values = []

    const [users] = await pool.query(
      `SELECT user_id, name, email, role, is_active, program FROM users WHERE user_id = ?`,
      [userId]
    )

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' })
    }

    const existingUser = users[0]

    if (req.body.name !== undefined) {
      updates.push('name = ?')
      values.push(String(req.body.name).trim())
    }

    if (req.body.email !== undefined) {
      updates.push('email = ?')
      values.push(String(req.body.email).trim().toLowerCase())
    }

    if (req.body.program !== undefined) {
      updates.push('program = ?')
      values.push(req.body.program ? String(req.body.program).trim() : null)
    }

    if (req.body.status !== undefined) {
      const isActive = String(req.body.status).toLowerCase() === 'active' ? 1 : 0
      updates.push('is_active = ?')
      values.push(isActive)
    }

    if (req.body.role !== undefined) {
      const role = normalizeRole(req.body.role)
      if (!role) {
        return res.status(400).json({ message: 'Invalid role' })
      }

      if (String(existingUser.role).toLowerCase() !== role) {
        if (req.user.user_id === parseInt(userId, 10) && role !== 'sysadmin') {
          return res.status(400).json({ message: 'You cannot remove your own system administrator access' })
        }

        if (String(existingUser.role).toLowerCase() === 'sysadmin' && role !== 'sysadmin') {
          const [sysadmins] = await pool.query(
            `SELECT COUNT(*) AS total FROM users WHERE role = 'sysadmin'`
          )

          if (sysadmins[0].total <= 1) {
            return res.status(400).json({ message: 'At least one system administrator must remain assigned' })
          }
        }

        updates.push('role = ?')
        values.push(role)
      }
    }

    if (!updates.length) {
      return res.json({ message: 'No changes to update' })
    }

    values.push(userId)
    await pool.query(
      `UPDATE users SET ${updates.join(', ')}, updated_at = NOW() WHERE user_id = ?`,
      values
    )

    await logAction(
      req.user.user_id,
      'update_user',
      'user',
      userId,
      {
        previous_data: existingUser,
        updated_by: req.user.user_id
      }
    )

    res.json({ message: 'User updated successfully' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

// Create a new user
const createUser = async (req, res) => {
  try {
    const { name, email, password, role, program } = req.body
    const normalizedRole = normalizeRole(role || 'student')

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' })
    }

    if (!normalizedRole) {
      return res.status(400).json({ message: 'Invalid role' })
    }

    const [existing] = await pool.query(
      'SELECT user_id FROM users WHERE email = ?',
      [String(email).trim().toLowerCase()]
    )

    if (existing.length > 0) {
      return res.status(409).json({ message: 'Email already exists' })
    }

    const hashedPassword = await bcrypt.hash(String(password), 10)

    const [result] = await pool.query(
      `INSERT INTO users (name, email, password, role, program, is_active)
       VALUES (?, ?, ?, ?, ?, 1)`,
      [
        String(name).trim(),
        String(email).trim().toLowerCase(),
        hashedPassword,
        normalizedRole,
        program ? String(program).trim() : null
      ]
    )

    await logAction(
      req.user.user_id,
      'create_user',
      'user',
      result.insertId,
      {
        name: String(name).trim(),
        email: String(email).trim().toLowerCase(),
        role: normalizedRole,
        program: program ? String(program).trim() : null,
        created_by: req.user.user_id
      }
    )

    res.status(201).json({
      message: 'User created successfully',
      userId: result.insertId
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

// Deactivate a user
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params

    const [users] = await pool.query(
      `SELECT user_id, name, email, role, is_active FROM users WHERE user_id = ?`,
      [userId]
    )

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' })
    }

    const existingUser = users[0]
    const existingRole = String(existingUser.role).toLowerCase()

    if (req.user.user_id === parseInt(userId, 10)) {
      return res.status(400).json({ message: 'You cannot deactivate your own account' })
    }

    if (existingRole === 'sysadmin') {
      const [sysadmins] = await pool.query(
        `SELECT COUNT(*) AS total FROM users WHERE role = 'sysadmin' AND is_active = 1`
      )

      if (sysadmins[0].total <= 1 && Number(existingUser.is_active) === 1) {
        return res.status(400).json({ message: 'At least one active system administrator must remain assigned' })
      }
    }

    if (Number(existingUser.is_active) === 0) {
      return res.json({ message: 'User is already inactive' })
    }

    await pool.query(
      `UPDATE users SET is_active = 0, updated_at = NOW() WHERE user_id = ?`,
      [userId]
    )

    await logAction(
      req.user.user_id,
      'delete_user',
      'user',
      userId,
      {
        previous_data: existingUser,
        deleted_by: req.user.user_id,
        soft_deleted: true
      }
    )

    res.json({ message: 'User deactivated successfully' })
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
  createUser,
  deleteUser,
  updateUserRole,
  updateUser,
  getRolePermissions,
  getAllRolePermissions,
  getUserStats,
  getAuditLogsList,
  getAuditLogsSummary
}
