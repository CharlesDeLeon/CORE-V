const pool = require('../config/db')

const listAdvisers = async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT user_id, name
       FROM users
       WHERE role = 'Admin'
       ORDER BY name ASC`
    )
    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

module.exports = { listAdvisers }
