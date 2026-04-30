const db = require('../config/db')

const getNotifications = async (req, res) => {
  try {
    const userId = req.user.user_id
    const [rows] = await db.query(
      `SELECT
         notification_id,
         submission_id,
         type,
         message,
         is_read,
         created_at
       FROM notifications
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [userId]
    )
    res.json({ data: rows })
  } catch (err) {
    console.error('getNotifications error:', err)
    res.status(500).json({ message: 'Failed to fetch notifications' })
  }
}

// GET /api/notifications/unread
// Returns only the unread count — used for the sidebar badge
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.user_id
    const [[{ count }]] = await db.query(
      `SELECT COUNT(*) AS count
       FROM notifications
       WHERE user_id = ? AND is_read = 0`,
      [userId]
    )
    res.json({ count })
  } catch (err) {
    console.error('getUnreadCount error:', err)
    res.status(500).json({ message: 'Failed to fetch unread count' })
  }
}

// PATCH /api/notifications/:id/read
// Marks a single notification as read — only if it belongs to this user
const markOneRead = async (req, res) => {
  try {
    const userId = req.user.user_id
    const notifId = req.params.id
    const [result] = await db.query(
      `UPDATE notifications
       SET is_read = 1
       WHERE notification_id = ? AND user_id = ?`,
      [notifId, userId]
    )
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Notification not found' })
    }
    res.json({ message: 'Marked as read' })
  } catch (err) {
    console.error('markOneRead error:', err)
    res.status(500).json({ message: 'Failed to mark notification as read' })
  }
}

// PATCH /api/notifications/read-all
// Marks ALL unread notifications for this user as read
const markAllRead = async (req, res) => {
  try {
    const userId = req.user.user_id
    await db.query(
      `UPDATE notifications
       SET is_read = 1
       WHERE user_id = ? AND is_read = 0`,
      [userId]
    )
    res.json({ message: 'All notifications marked as read' })
  } catch (err) {
    console.error('markAllRead error:', err)
    res.status(500).json({ message: 'Failed to mark all as read' })
  }
}

module.exports = { getNotifications, getUnreadCount, markOneRead, markAllRead }