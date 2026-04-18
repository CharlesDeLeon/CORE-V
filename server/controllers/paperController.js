const pool = require('../config/db')

const uploadPaper = async (req, res) => {
  const { title, authors, program, year } = req.body

  if (!title || !authors || !program || !year) {
    return res.status(400).json({ message: 'All fields are required' })
  }

  if (!req.file) {
    return res.status(400).json({ message: 'File is required' })
  }

  try {
    const [versionRows] = await pool.query(
      'SELECT COALESCE(MAX(version), 0) AS latestVersion FROM research_papers WHERE user_id = ? AND title = ?',
      [req.user.user_id, title]
    )

    const version = Number(versionRows[0]?.latestVersion || 0) + 1

    await pool.query(
      `INSERT INTO research_papers
      (user_id, title, authors, program, year, file_path, version)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.user.user_id, title, authors, program, year, req.file.path, version]
    )

    res.status(201).json({
      message: 'Paper uploaded successfully',
      version
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

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

module.exports = { uploadPaper, getMyPapers }