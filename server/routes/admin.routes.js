const express = require('express')
const router = express.Router()
const authMiddleware = require('../middleware/authMiddleware')
const roleMiddleware = require('../middleware/roleMiddleware')
const {
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
} = require('../controllers/adminController')

// All admin endpoints require authentication and sysadmin role
router.use(authMiddleware)
router.use(roleMiddleware('sysadmin', 'coordinator'))

// User management
router.get('/users', getAllUsers)
router.post('/users', roleMiddleware('sysadmin'), createUser)
router.get('/users/:userId', getUserDetail)
router.put('/users/:userId', roleMiddleware('sysadmin'), updateUser)
router.delete('/users/:userId', roleMiddleware('sysadmin'), deleteUser)
router.patch('/users/:userId/role', roleMiddleware('sysadmin'), updateUserRole)

// Role and permissions
router.get('/roles/permissions', getAllRolePermissions)
router.get('/roles/:role/permissions', getRolePermissions)

// Statistics
router.get('/stats/users', getUserStats)
router.get('/audit-logs', getAuditLogsList)
router.get('/audit-summary', getAuditLogsSummary)

module.exports = router
