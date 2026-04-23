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

const getPaperDetail = async (req, res) => {
  const { paperId } = req.params
  const userId = req.user.user_id

  try {
    const [submissionRows] = await pool.query(
      `SELECT s.submission_id, s.title, s.abstract, s.keywords, s.authors, 
              s.program, s.school_year, s.status, s.created_at, s.updated_at
       FROM submissions s
       WHERE s.submission_id = ? AND s.submitted_by = ?`,
      [paperId, userId]
    )

    if (submissionRows.length === 0) {
      return res.status(404).json({ message: 'Paper not found' })
    }

    const submission = submissionRows[0]

    const [versions] = await pool.query(
      `SELECT version_number, file_path, file_name, file_size, file_type, uploaded_at
       FROM document_versions
       WHERE submission_id = ?
       ORDER BY version_number DESC`,
      [paperId]
    )
    const [reviews] = await pool.query(
      `SELECT r.review_id, r.reviewer_id, u.name AS reviewer_name, 
              r.status_assigned, r.reviewed_at
       FROM reviews r
       JOIN users u ON u.user_id = r.reviewer_id
       WHERE r.submission_id = ?
       ORDER BY r.reviewed_at DESC`,
      [paperId]
    )

    const reviewsWithComments = await Promise.all(
      reviews.map(async (review) => {
        const [comments] = await pool.query(
          `SELECT comment_id, author_id, u.name AS author_name, comment_text, created_at
           FROM review_comments rc
           JOIN users u ON u.user_id = rc.author_id
           WHERE rc.submission_id = ? AND rc.author_id = ?
           ORDER BY rc.created_at ASC`,
          [paperId, review.reviewer_id]
        )
        return {
          ...review,
          comments
        }
      })
    )

    res.json({
      submission_id: submission.submission_id,
      title: submission.title,
      abstract: submission.abstract,
      keywords: submission.keywords,
      authors: submission.authors,
      program: submission.program,
      school_year: submission.school_year,
      status: submission.status,
      created_at: submission.created_at,
      updated_at: submission.updated_at,
      versions,
      reviews: reviewsWithComments
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

module.exports = { uploadPaper, getMyPapers, getPaperDetail }