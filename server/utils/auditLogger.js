const pool = require('../config/db')

/**
 * Log an action to the audit_logs table
 * @param {number} userId - ID of the user performing the action (optional for system actions)
 * @param {string} action - Action type (e.g., 'upload_paper', 'submit_review', 'update_role')
 * @param {string} targetType - Type of entity affected (e.g., 'submission', 'user', 'file')
 * @param {number} targetId - ID of the affected entity
 * @param {object} details - Additional details in JSON format
 * @param {string} ipAddress - IP address of the request (optional)
 */
const logAction = async (
  userId,
  action,
  targetType,
  targetId,
  details = {},
  ipAddress = null
) => {
  try {
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, target_type, target_id, details, ip_address)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        userId || null,
        action,
        targetType,
        targetId || null,
        JSON.stringify(details),
        ipAddress
      ]
    )
  } catch (err) {
    console.error('Error logging action to audit_logs:', err)
    // Don't throw - audit logging should not break the main request
  }
}

/**
 * Get audit logs with filtering and pagination
 * @param {object} filters - Filter criteria {action, targetType, targetId, userId, dateFrom, dateTo}
 * @param {number} page - Page number for pagination
 * @param {number} limit - Results per page
 */
const getAuditLogs = async (filters = {}, page = 1, limit = 50) => {
  try {
    const { action, targetType, targetId, userId, dateFrom, dateTo } = filters
    const offset = (page - 1) * limit

    let query = `SELECT 
                  al.log_id,
                  al.user_id,
                  u.name as user_name,
                  u.email as user_email,
                  al.action,
                  al.target_type,
                  al.target_id,
                  al.details,
                  al.ip_address,
                  al.created_at
                FROM audit_logs al
                LEFT JOIN users u ON al.user_id = u.user_id
                WHERE 1=1`

    const params = []

    if (action) {
      query += ` AND al.action = ?`
      params.push(action)
    }

    if (targetType) {
      query += ` AND al.target_type = ?`
      params.push(targetType)
    }

    if (targetId) {
      query += ` AND al.target_id = ?`
      params.push(targetId)
    }

    if (userId) {
      query += ` AND al.user_id = ?`
      params.push(userId)
    }

    if (dateFrom) {
      query += ` AND al.created_at >= ?`
      params.push(dateFrom)
    }

    if (dateTo) {
      query += ` AND al.created_at <= ?`
      params.push(dateTo)
    }

    query += ` ORDER BY al.created_at DESC LIMIT ? OFFSET ?`
    params.push(parseInt(limit), offset)

    const [logs] = await pool.query(query, params)

    // Get total count
    let countQuery = `SELECT COUNT(*) as total FROM audit_logs al WHERE 1=1`
    const countParams = []

    if (action) {
      countQuery += ` AND al.action = ?`
      countParams.push(action)
    }

    if (targetType) {
      countQuery += ` AND al.target_type = ?`
      countParams.push(targetType)
    }

    if (targetId) {
      countQuery += ` AND al.target_id = ?`
      countParams.push(targetId)
    }

    if (userId) {
      countQuery += ` AND al.user_id = ?`
      countParams.push(userId)
    }

    if (dateFrom) {
      countQuery += ` AND al.created_at >= ?`
      countParams.push(dateFrom)
    }

    if (dateTo) {
      countQuery += ` AND al.created_at <= ?`
      countParams.push(dateTo)
    }

    const [countResult] = await pool.query(countQuery, countParams)
    const total = countResult[0].total

    return {
      data: logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  } catch (err) {
    console.error('Error retrieving audit logs:', err)
    throw err
  }
}

/**
 * Get audit summary (actions by type, user, etc.)
 */
const getAuditSummary = async (filters = {}) => {
  try {
    const { dateFrom, dateTo } = filters

    let dateFilter = ``
    const dateParams = []

    if (dateFrom || dateTo) {
      if (dateFrom && dateTo) {
        dateFilter = ` WHERE al.created_at BETWEEN ? AND ?`
        dateParams.push(dateFrom, dateTo)
      } else if (dateFrom) {
        dateFilter = ` WHERE al.created_at >= ?`
        dateParams.push(dateFrom)
      } else {
        dateFilter = ` WHERE al.created_at <= ?`
        dateParams.push(dateTo)
      }
    }

    // Actions count
    const [actionsCounts] = await pool.query(
      `SELECT action, COUNT(*) as count FROM audit_logs ${dateFilter} GROUP BY action ORDER BY count DESC`,
      dateParams
    )

    // Users count
    const [usersCounts] = await pool.query(
      `SELECT u.name, COUNT(*) as count FROM audit_logs al
       LEFT JOIN users u ON al.user_id = u.user_id ${dateFilter}
       GROUP BY al.user_id ORDER BY count DESC`,
      dateParams
    )

    // Target types count
    const [targetsCounts] = await pool.query(
      `SELECT target_type, COUNT(*) as count FROM audit_logs ${dateFilter} GROUP BY target_type ORDER BY count DESC`,
      dateParams
    )

    return {
      actionsByType: actionsCounts,
      actionsByUser: usersCounts,
      actionsByTarget: targetsCounts
    }
  } catch (err) {
    console.error('Error retrieving audit summary:', err)
    throw err
  }
}

module.exports = {
  logAction,
  getAuditLogs,
  getAuditSummary
}
