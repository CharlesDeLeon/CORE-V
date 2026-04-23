const express = require('express')
const router = express.Router()
const authMiddleware = require('../middleware/authMiddleware')
const roleMiddleware = require('../middleware/roleMiddleware')
const { 
  listAdvisers,
  getAssignedSubmissions,
  addFeedbackComment,
  submitReview,
  getPanelAssignments,
  getSubmissionComments
} = require('../controllers/adviserController')

router.get('/list', authMiddleware, roleMiddleware('student'), listAdvisers)
router.get('/submissions', authMiddleware, roleMiddleware('faculty'), getAssignedSubmissions)
router.get('/assignments', authMiddleware, roleMiddleware('faculty'), getPanelAssignments)
router.get('/submissions/:submission_id/comments', authMiddleware, roleMiddleware('faculty'), getSubmissionComments)

router.post('/submissions/:submission_id/comment', authMiddleware, roleMiddleware('faculty'), addFeedbackComment)
router.post('/submissions/:submission_id/review', authMiddleware, roleMiddleware('faculty'), submitReview)

module.exports = router
