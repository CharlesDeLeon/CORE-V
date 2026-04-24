const express = require('express')
const router = express.Router()
const authMiddleware = require('../middleware/authMiddleware')
const roleMiddleware = require('../middleware/roleMiddleware')
const {
  getAllUsers,
  getUserDetail,
  updateUserRole,
  getRolePermissions,
  getAllRolePermissions,
  getUserStats
} = require('../controllers/adminController')

// All admin endpoints require authentication and sysadmin role
router.use(authMiddleware)
router.use(roleMiddleware('sysadmin', 'coordinator'))

// User management
router.get('/users', getAllUsers)
router.get('/users/:userId', getUserDetail)
router.patch('/users/:userId/role', roleMiddleware('sysadmin'), updateUserRole)

// Role and permissions
router.get('/roles/permissions', getAllRolePermissions)
router.get('/roles/:role/permissions', getRolePermissions)

// Statistics
router.get('/stats/users', getUserStats)

module.exports = router
