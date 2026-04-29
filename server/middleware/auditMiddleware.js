const pool = require('../config/db')
const crypto = require('crypto')

module.exports = (req, res, next) => {
  const corr = req.headers['x-correlation-id'] || (crypto.randomUUID ? crypto.randomUUID() : require('crypto').randomBytes(16).toString('hex'))
  const reqid = req.headers['x-request-id'] || (crypto.randomUUID ? crypto.randomUUID() : require('crypto').randomBytes(16).toString('hex'))
  req.correlationId = corr
  req.requestId = reqid

  req.audit = {
    log: async ({ user_id = (req.user && req.user.user_id) || null, actor_name = (req.user && req.user.name) || null, action, target_type = null, target_id = null, changes = null, details = null } = {}) => {
      try {
        const ip = req.headers['x-forwarded-for'] || req.ip || (req.connection && req.connection.remoteAddress) || null
        const ua = req.headers['user-agent'] || null
        const sql = `INSERT INTO audit_logs (user_id, actor_name, action, target_type, target_id, changes, details, ip_address, user_agent, correlation_id, request_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        const params = [user_id, actor_name, action, target_type, target_id, changes ? JSON.stringify(changes) : null, details ? (typeof details === 'object' ? JSON.stringify(details) : details) : null, ip, ua, corr, reqid]
        await pool.query(sql, params)
      } catch (err) {
        // Do not interrupt main request flow on audit failure
        console.error('Failed to write audit log', err)
      }
    }
  }

  next()
}
