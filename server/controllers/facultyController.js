const pool = require('../config/db')

const listFaculties = async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT user_id, name
       FROM users
       WHERE role = 'Faculty'
       ORDER BY name ASC`
    )
    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

const getAssignedSubmissions = async (req, res) => {
  try {
    const facultyId = req.user.user_id
    
    const [submissions] = await pool.query(
      `SELECT 
        s.submission_id,
        s.group_id,
        s.title,
        s.abstract,
        s.keywords,
        s.authors,
        s.program,
        s.school_year,
        s.stage,
        s.status,
        s.created_at,
        s.updated_at,
        rg.group_name,
        u.name as submitted_by_name,
        COALESCE(r.status_assigned, 'pending') as review_status,
        r.review_id,
        COUNT(DISTINCT rc.comment_id) as comment_count
       FROM submissions s
       JOIN research_groups rg ON s.group_id = rg.group_id
       JOIN users u ON s.submitted_by = u.user_id
       JOIN panel_assignments pa ON rg.group_id = pa.group_id
       LEFT JOIN reviews r ON s.submission_id = r.submission_id AND r.reviewer_id = ?
       LEFT JOIN review_comments rc ON s.submission_id = rc.submission_id
       WHERE pa.faculty_id = ? AND (pa.role_in_panel = 'faculty' OR pa.role_in_panel = 'panelist')
       GROUP BY s.submission_id
       ORDER BY s.updated_at DESC`
      , [facultyId, facultyId]
    )
    
    res.json(submissions)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to load assigned submissions' })
  }
}

const addFeedbackComment = async (req, res) => {
  try {
    const { submission_id, comment_text } = req.body
    const author_id = req.user.user_id
    
    if (!submission_id || !comment_text) {
      return res.status(400).json({ message: 'Missing submission_id or comment_text' })
    }
    
    const [access] = await pool.query(
      `SELECT s.submission_id 
       FROM submissions s
       JOIN research_groups rg ON s.group_id = rg.group_id
       JOIN panel_assignments pa ON rg.group_id = pa.group_id
       WHERE s.submission_id = ? AND pa.faculty_id = ?`,
      [submission_id, author_id]
    )
    
    if (access.length === 0) {
      return res.status(403).json({ message: 'Unauthorized access' })
    }
    
    const [result] = await pool.query(
      `INSERT INTO review_comments (submission_id, author_id, comment_text)
       VALUES (?, ?, ?)`,
      [submission_id, author_id, comment_text]
    )

    // Audit log for added comment
    try {
      if (req && req.audit && typeof req.audit.log === 'function') {
        await req.audit.log({
          action: 'ADD_COMMENT',
          target_type: 'submission',
          target_id: submission_id,
          changes: { comment_id: result.insertId, comment_text }
        })
      }
    } catch (e) {
      console.error('Audit log failed for addFeedbackComment', e)
    }
    
    res.status(201).json({ 
      comment_id: result.insertId,
      message: 'Comment added successfully' 
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to add comment' })
  }
}

const submitReview = async (req, res) => {
  try {
    const { submission_id, status_assigned } = req.body
    const reviewer_id = req.user.user_id
    
    if (!submission_id || !status_assigned) {
      return res.status(400).json({ message: 'Missing submission_id or status_assigned' })
    }
    
    const validStatuses = ['approved', 'for_revision', 'rejected']
    if (!validStatuses.includes(status_assigned)) {
      return res.status(400).json({ message: 'Invalid status. Must be approved, for_revision, or rejected' })
    }
    
    const [access] = await pool.query(
      `SELECT s.submission_id 
       FROM submissions s
       JOIN research_groups rg ON s.group_id = rg.group_id
       JOIN panel_assignments pa ON rg.group_id = pa.group_id
       WHERE s.submission_id = ? AND pa.faculty_id = ?`,
      [submission_id, reviewer_id]
    )
    
    if (access.length === 0) {
      return res.status(403).json({ message: 'Unauthorized access' })
    }

    const [existingReview] = await pool.query(
      `SELECT review_id, status_assigned FROM reviews WHERE submission_id = ? AND reviewer_id = ?`,
      [submission_id, reviewer_id]
    )
    
    let reviewId
    if (existingReview.length > 0) {
      const previousStatus = existingReview[0].status_assigned
      await pool.query(
        `UPDATE reviews 
         SET status_assigned = ?, updated_at = NOW()
         WHERE submission_id = ? AND reviewer_id = ?`,
        [status_assigned, submission_id, reviewer_id]
      )
      reviewId = existingReview[0].review_id

      // Audit log for update
      try {
        if (req && req.audit && typeof req.audit.log === 'function') {
          await req.audit.log({
            action: 'UPDATE_REVIEW',
            target_type: 'review',
            target_id: reviewId,
            changes: { previous_status: previousStatus, new_status: status_assigned }
          })
        }
      } catch (e) {
        console.error('Audit log failed for submitReview (update)', e)
      }
    } else {
      // Create new review
      const [result] = await pool.query(
        `INSERT INTO reviews (submission_id, reviewer_id, status_assigned)
         VALUES (?, ?, ?)`,
        [submission_id, reviewer_id, status_assigned]
      )
      reviewId = result.insertId

      // Audit log for creation
      try {
        if (req && req.audit && typeof req.audit.log === 'function') {
          await req.audit.log({
            action: 'CREATE_REVIEW',
            target_type: 'review',
            target_id: reviewId,
            changes: { status: status_assigned, submission_id }
          })
        }
      } catch (e) {
        console.error('Audit log failed for submitReview (create)', e)
      }
    }
    
    res.json({ 
      review_id: reviewId,
      message: 'Review submitted successfully' 
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to submit review' })
  }
}

const getPanelAssignments = async (req, res) => {
  try {
    const facultyId = req.user.user_id
    
    const [assignments] = await pool.query(
      `SELECT 
        pa.assignment_id,
        pa.group_id,
        pa.role_in_panel,
        rg.group_name,
        rg.program,
        rg.school_year,
        COUNT(DISTINCT gm.user_id) as student_count,
        COUNT(DISTINCT s.submission_id) as submission_count
       FROM panel_assignments pa
       JOIN research_groups rg ON pa.group_id = rg.group_id
       LEFT JOIN group_members gm ON rg.group_id = gm.group_id
       LEFT JOIN submissions s ON rg.group_id = s.group_id
       WHERE pa.faculty_id = ?
       GROUP BY pa.assignment_id, rg.group_id
       ORDER BY rg.group_name ASC`
      , [facultyId]
    )
    
    res.json(assignments)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to load panel assignments' })
  }
}

const getSubmissionComments = async (req, res) => {
  try {
    const { submission_id } = req.params
    const facultyId = req.user.user_id
    const [access] = await pool.query(
      `SELECT s.submission_id 
       FROM submissions s
       JOIN research_groups rg ON s.group_id = rg.group_id
       JOIN panel_assignments pa ON rg.group_id = pa.group_id
       WHERE s.submission_id = ? AND pa.faculty_id = ?`,
      [submission_id, facultyId]
    )
    
    if (access.length === 0) {
      return res.status(403).json({ message: 'Unauthorized access' })
    }
    
    const [submissionData] = await pool.query(
      `SELECT 
        s.submission_id,
        s.group_id,
        s.title,
        s.abstract,
        s.keywords,
        s.authors,
        s.program,
        s.school_year,
        s.stage,
        s.status,
        s.created_at,
        s.updated_at,
        rg.group_name,
        u.name as submitted_by_name,
        COALESCE(r.status_assigned, 'pending') as review_status,
        r.review_id,
        COUNT(DISTINCT rc.comment_id) as comments_count
       FROM submissions s
       JOIN research_groups rg ON s.group_id = rg.group_id
       JOIN users u ON s.submitted_by = u.user_id
       LEFT JOIN reviews r ON s.submission_id = r.submission_id AND r.reviewer_id = ?
       LEFT JOIN review_comments rc ON s.submission_id = rc.submission_id
       WHERE s.submission_id = ?
       GROUP BY s.submission_id`,
      [facultyId, submission_id]
    )

    if (submissionData.length === 0) {
      return res.status(404).json({ message: 'Submission not found' })
    }
    
    const [comments] = await pool.query(
      `SELECT 
        rc.comment_id,
        rc.comment_text,
        rc.created_at,
        u.user_id,
        u.name as author_name
       FROM review_comments rc
       JOIN users u ON rc.author_id = u.user_id
       WHERE rc.submission_id = ?
       ORDER BY rc.created_at DESC`,
      [submission_id]
    )
    
    res.json({
      submission: submissionData[0],
      comments: comments
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to load comments' })
  }
}

module.exports = { 
  listFaculties,
  getAssignedSubmissions,
  addFeedbackComment,
  submitReview,
  getPanelAssignments,
  getSubmissionComments
}
