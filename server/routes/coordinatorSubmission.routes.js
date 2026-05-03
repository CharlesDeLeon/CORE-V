
const express = require('express')
const router = express.Router()
const authMiddleware = require('../middleware/authMiddleware')
const roleMiddleware = require('../middleware/roleMiddleware')
const {
  getSubmissions, getSubmissionById, updateStage, updateStatus,
  removeFromPanel, getDashboardStats, getFacultyList, getStudentList,
} = require('../controllers/coordinatorController')

router.use(authMiddleware)
router.use(roleMiddleware('coordinator'))

// Submissions
router.get('/',           getSubmissions)
router.get('/:id',        getSubmissionById)
router.patch('/:id/stage',  updateStage)
router.patch('/:id/status', updateStatus)

// Panel removal (lives at /api/coordinator/panel/:assignmentId)
router.delete('/:assignmentId', removeFromPanel)

module.exports = router