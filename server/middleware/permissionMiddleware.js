const { rolePermissions } = require('../constants/rbac')

// Middleware to check specific permissions beyond role
const permissionMiddleware = (requiredPermission) => {
  return (req, res, next) => {
    const userRole = String(req.user?.role || '').toLowerCase()
    const permissions = rolePermissions[userRole] || {}

    if (!permissions[requiredPermission]) {
      return res.status(403).json({ 
        message: `Access denied: ${requiredPermission} permission required` 
      })
    }

    next()
  }
}

module.exports = permissionMiddleware
