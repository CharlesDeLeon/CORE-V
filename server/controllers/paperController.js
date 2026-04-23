const pool = require('../config/db')

const uploadPaper = async (req, res) => {
  const { title, authors, program, year, school_year, abstract, keywords } = req.body
  const userId = req.user.user_id
  const effectiveSchoolYear = school_year || (year ? `${year}-${Number(year) + 1}` : '')

  if (!title || !authors || !program || !effectiveSchoolYear) {
    return res.status(400).json({ message: 'All required fields are missing' })
  }
  if (!req.file) {
    return res.status(400).json({ message: 'File is required' })
  }

  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()

    const [existingGroupRows] = await connection.query(
      `SELECT rg.group_id
       FROM research_groups rg
       LEFT JOIN group_members gm ON gm.group_id = rg.group_id AND gm.user_id = ?
       WHERE rg.created_by = ? OR gm.user_id = ?
       ORDER BY rg.group_id ASC
       LIMIT 1`,
      [userId, userId, userId]
    )

    let groupId
    if (existingGroupRows.length > 0) {
      groupId = existingGroupRows[0].group_id
    } else {
      const [groupResult] = await connection.query(
        `INSERT INTO research_groups (group_name, program, school_year, created_by)
         VALUES (?, ?, ?, ?)`,
        [`${title} Group`, program, effectiveSchoolYear, userId]
      )
      groupId = groupResult.insertId

      await connection.query(
        'INSERT INTO group_members (group_id, user_id) VALUES (?, ?)',
        [groupId, userId]
      )
    }

    const [existingSubmissionRows] = await connection.query(
      `SELECT submission_id
       FROM submissions
       WHERE group_id = ? AND title = ?
       ORDER BY submission_id DESC
       LIMIT 1`,
      [groupId, title]
    )

    let submissionId
    if (existingSubmissionRows.length > 0) {
      submissionId = existingSubmissionRows[0].submission_id
    } else {
      const [submissionResult] = await connection.query(
        `INSERT INTO submissions
          (group_id, title, abstract, keywords, authors, program, school_year, submitted_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          groupId,
          title,
          abstract || null,
          keywords || null,
          authors,
          program,
          effectiveSchoolYear,
          userId
        ]
      )
      submissionId = submissionResult.insertId
    }

    const [versionRows] = await connection.query(
      'SELECT COALESCE(MAX(version_number), 0) AS latestVersion FROM document_versions WHERE submission_id = ?',
      [submissionId]
    )
    const nextVersion = Number(versionRows[0].latestVersion) + 1

    await connection.query(
      `INSERT INTO document_versions (submission_id, file_path, file_name, file_size, file_type, version_number, uploaded_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [submissionId, req.file.path, req.file.originalname, req.file.size || null, req.file.mimetype || null, nextVersion, userId]
    )

    await connection.commit()
    res.status(201).json({ 
      message: 'Version uploaded successfully', 
      version: nextVersion,
      paperId: submissionId
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
      `SELECT
          s.submission_id AS paper_id,
          s.title,
          s.authors,
          s.program,
          s.status,
          s.created_at,
          dv.file_path,
          dv.version_number,
          dv.uploaded_at
       FROM submissions s
       LEFT JOIN document_versions dv ON dv.submission_id = s.submission_id
       WHERE s.submitted_by = ?
       AND (
         dv.version_number IS NULL OR
         dv.version_number = (
           SELECT MAX(version_number)
           FROM document_versions
           WHERE submission_id = s.submission_id
         )
       )
       ORDER BY s.created_at DESC`,
      [req.user.user_id]
    )
    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

module.exports = { uploadPaper, getMyPapers }