// Middleware to check specific permissions beyond role
const permissionMiddleware = (requiredPermission) => {
  return (req, res, next) => {
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
