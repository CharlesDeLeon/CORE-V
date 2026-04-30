const express = require('express')
const router = express.Router()
const authMiddleware = require('../middleware/authMiddleware')
const {
  getNotifications,
  getUnreadCount,
  markOneRead,
  markAllRead,
} = require('../controllers/notificationController')

router.use(authMiddleware)

router.get('/',            getNotifications)
router.get('/unread',      getUnreadCount)
router.patch('/:id/read',  markOneRead)
router.patch('/read-all',  markAllRead)

module.exports = router