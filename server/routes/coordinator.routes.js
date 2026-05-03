const express = require('express')
const router = express.Router()
const authMiddleware = require('../middleware/authMiddleware')
const roleMiddleware = require('../middleware/roleMiddleware')
const {
  getGroups, getGroupById, createGroup, updateGroup, deleteGroup,
  getGroupMembers, addGroupMember, removeGroupMember,
  getPanel, assignPanel, removeFromPanel,
  getFacultyList, getStudentList,
  getSubmissions, getSubmissionById,
  updateStage, updateStatus,
  getDashboardStats,
} = require('../controllers/coordinatorController')

// All coordinator routes require auth + coordinator role
router.use(authMiddleware)
router.use(roleMiddleware('coordinator'))

// Dashboard
router.get('/dashboard', getDashboardStats)

// Utility dropdowns
router.get('/faculty',  getFacultyList)
router.get('/students', getStudentList)

// Groups
router.get('/',              getGroups)     // note: mounted at /groups
router.get('/:id',           getGroupById)
router.post('/',             createGroup)
router.put('/:id',           updateGroup)
router.delete('/:id',        deleteGroup)

// Group members
router.get('/:id/members',              getGroupMembers)
router.post('/:id/members',             addGroupMember)
router.delete('/:id/members/:userId',   removeGroupMember)

// Panel assignments
router.get('/:id/panel',                getPanel)
router.post('/:id/panel',               assignPanel)

module.exports = router