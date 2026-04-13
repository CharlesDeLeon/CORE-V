const pool = require('../config/db')

const getMyPapers = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM research_papers WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.user_id]
    )
    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

module.exports = { getMyPapers }