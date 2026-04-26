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

const validRoles = Object.keys(rolePermissions)

module.exports = {
  rolePermissions,
  validRoles
}
