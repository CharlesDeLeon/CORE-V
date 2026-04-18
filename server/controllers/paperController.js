const pool = require('../config/db')

const uploadPaper = async (req, res) => {
  const { title, authors, program, year, adviser_id } = req.body
  const userId = req.user.user_id

  if (!title || !authors || !program || !year || !adviser_id) {
    return res.status(400).json({ message: 'All fields including Adviser are required' })
  }
  if (!req.file) {
    return res.status(400).json({ message: 'File is required' })
  }

  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()

    const [existingPaper] = await connection.query(
      'SELECT paper_id FROM research_papers WHERE user_id = ? AND title = ?',
      [userId, title]
    )

    let paperId
    if (existingPaper.length > 0) {
      paperId = existingPaper[0].paper_id 
    } else {
      const [paperResult] = await connection.query(
        `INSERT INTO research_papers (user_id, title, authors, program, year, adviser_id) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, title, authors, program, year, adviser_id]
      )
      paperId = paperResult.insertId
    }

    const [versionRows] = await connection.query(
      'SELECT COALESCE(MAX(version_number), 0) AS latestVersion FROM versions WHERE paper_id = ?',
      [paperId]
    )
    const nextVersion = Number(versionRows[0].latestVersion) + 1

    await connection.query(
      `INSERT INTO versions (paper_id, file_path, version_number, uploader_id)
       VALUES (?, ?, ?, ?)`,
      [paperId, req.file.path, nextVersion, userId]
    )

    await connection.commit()
    res.status(201).json({ 
      message: 'Version uploaded successfully', 
      version: nextVersion,
      paperId: paperId 
    })

  } catch (err) {
    await connection.rollback()
    console.error(err)
    res.status(500).json({ message: 'Server error during upload' })
  } finally {
    connection.release()
  }
}

const getMyPapers = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT rp.*, v.file_path, v.version_number, v.created_at as uploaded_at
       FROM research_papers rp
       LEFT JOIN versions v ON rp.paper_id = v.paper_id
       WHERE rp.user_id = ?
       AND v.version_number = (SELECT MAX(version_number) FROM versions WHERE paper_id = rp.paper_id)
       ORDER BY rp.created_at DESC`,
      [req.user.user_id]
    )
    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

module.exports = { uploadPaper, getMyPapers }