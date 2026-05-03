const db = require('../config/db')

// ─────────────────────────────────────────────
// GROUPS
// ─────────────────────────────────────────────

// GET /api/coordinator/groups
const getGroups = async (req, res) => {
  try {
    const { search, program, school_year } = req.query

    let sql = `
      SELECT
        rg.group_id,
        rg.group_name,
        rg.program,
        rg.school_year,
        rg.created_at,
        COUNT(DISTINCT gm.user_id)      AS member_count,
        COUNT(DISTINCT s.submission_id) AS submission_count
      FROM research_groups rg
      LEFT JOIN group_members gm ON rg.group_id = gm.group_id
      LEFT JOIN submissions   s  ON rg.group_id = s.group_id
      WHERE 1=1
    `
    const params = []

    if (search) {
      sql += ` AND rg.group_name LIKE ?`
      params.push(`%${search}%`)
    }
    if (program) {
      sql += ` AND rg.program = ?`
      params.push(program)
    }
    if (school_year) {
      sql += ` AND rg.school_year = ?`
      params.push(school_year)
    }

    sql += ` GROUP BY rg.group_id ORDER BY rg.created_at DESC`

    const [rows] = await db.query(sql, params)
    res.json({ data: rows })
  } catch (err) {
    console.error('getGroups error:', err)
    res.status(500).json({ message: 'Failed to fetch groups' })
  }
}

// GET /api/coordinator/groups/:id
const getGroupById = async (req, res) => {
  try {
    const { id } = req.params

    const [[group]] = await db.query(
      `SELECT * FROM research_groups WHERE group_id = ?`, [id]
    )
    if (!group) return res.status(404).json({ message: 'Group not found' })

    const [members] = await db.query(
      `SELECT u.user_id, u.name, u.email, u.program, gm.joined_at
       FROM group_members gm
       JOIN users u ON gm.user_id = u.user_id
       WHERE gm.group_id = ?`, [id]
    )

    const [submissions] = await db.query(
      `SELECT submission_id, title, stage, status, created_at
       FROM submissions WHERE group_id = ?
       ORDER BY created_at DESC`, [id]
    )

    const [panel] = await db.query(
      `SELECT pa.assignment_id, pa.role_in_panel, pa.assigned_at,
              u.user_id, u.name, u.email
       FROM panel_assignments pa
       JOIN users u ON pa.faculty_id = u.user_id
       WHERE pa.group_id = ?`, [id]
    )

    res.json({ data: { ...group, members, submissions, panel } })
  } catch (err) {
    console.error('getGroupById error:', err)
    res.status(500).json({ message: 'Failed to fetch group' })
  }
}

// POST /api/coordinator/groups
const createGroup = async (req, res) => {
  try {
    const { group_name, program, school_year } = req.body
    const created_by = req.user.user_id  // ✅ FIXED: was req.user.id

    if (!group_name) return res.status(400).json({ message: 'Group name is required' })

    const [result] = await db.query(
      `INSERT INTO research_groups (group_name, program, school_year, created_by)
       VALUES (?, ?, ?, ?)`,
      [group_name, program || null, school_year || null, created_by]
    )
    res.status(201).json({ message: 'Group created', group_id: result.insertId })
  } catch (err) {
    console.error('createGroup error:', err)
    res.status(500).json({ message: 'Failed to create group' })
  }
}

// PUT /api/coordinator/groups/:id
const updateGroup = async (req, res) => {
  try {
    const { id } = req.params
    const { group_name, program, school_year } = req.body

    const [result] = await db.query(
      `UPDATE research_groups SET group_name = ?, program = ?, school_year = ?
       WHERE group_id = ?`,
      [group_name, program || null, school_year || null, id]
    )
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Group not found' })
    res.json({ message: 'Group updated' })
  } catch (err) {
    console.error('updateGroup error:', err)
    res.status(500).json({ message: 'Failed to update group' })
  }
}

// DELETE /api/coordinator/groups/:id
const deleteGroup = async (req, res) => {
  try {
    const { id } = req.params
    const [result] = await db.query(
      `DELETE FROM research_groups WHERE group_id = ?`, [id]
    )
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Group not found' })
    res.json({ message: 'Group deleted' })
  } catch (err) {
    console.error('deleteGroup error:', err)
    res.status(500).json({ message: 'Failed to delete group' })
  }
}

// ─────────────────────────────────────────────
// GROUP MEMBERS
// ─────────────────────────────────────────────

// GET /api/coordinator/groups/:id/members
const getGroupMembers = async (req, res) => {
  try {
    const { id } = req.params
    const [rows] = await db.query(
      `SELECT u.user_id, u.name, u.email, u.program, gm.joined_at
       FROM group_members gm
       JOIN users u ON gm.user_id = u.user_id
       WHERE gm.group_id = ?`, [id]
    )
    res.json({ data: rows })
  } catch (err) {
    console.error('getGroupMembers error:', err)
    res.status(500).json({ message: 'Failed to fetch members' })
  }
}

// POST /api/coordinator/groups/:id/members
const addGroupMember = async (req, res) => {
  try {
    const { id } = req.params
    const { user_id } = req.body

    if (!user_id) return res.status(400).json({ message: 'user_id is required' })

    // Verify the user exists and is a student
    const [[user]] = await db.query(
      `SELECT user_id, role FROM users WHERE user_id = ? AND role = 'student' AND is_active = 1`,
      [user_id]
    )
    if (!user) return res.status(404).json({ message: 'Active student not found' })

    await db.query(
      `INSERT INTO group_members (group_id, user_id) VALUES (?, ?)`,
      [id, user_id]
    )
    res.status(201).json({ message: 'Member added' })
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Student is already in this group' })
    }
    console.error('addGroupMember error:', err)
    res.status(500).json({ message: 'Failed to add member' })
  }
}

// DELETE /api/coordinator/groups/:id/members/:userId
const removeGroupMember = async (req, res) => {
  try {
    const { id, userId } = req.params
    const [result] = await db.query(
      `DELETE FROM group_members WHERE group_id = ? AND user_id = ?`, [id, userId]
    )
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Member not found' })
    res.json({ message: 'Member removed' })
  } catch (err) {
    console.error('removeGroupMember error:', err)
    res.status(500).json({ message: 'Failed to remove member' })
  }
}

// ─────────────────────────────────────────────
// PANEL ASSIGNMENTS
// ─────────────────────────────────────────────

// GET /api/coordinator/groups/:id/panel
const getPanel = async (req, res) => {
  try {
    const { id } = req.params
    const [rows] = await db.query(
      `SELECT pa.assignment_id, pa.role_in_panel, pa.assigned_at,
              u.user_id, u.name, u.email
       FROM panel_assignments pa
       JOIN users u ON pa.faculty_id = u.user_id
       WHERE pa.group_id = ?`, [id]
    )
    res.json({ data: rows })
  } catch (err) {
    console.error('getPanel error:', err)
    res.status(500).json({ message: 'Failed to fetch panel' })
  }
}

// POST /api/coordinator/groups/:id/panel
const assignPanel = async (req, res) => {
  try {
    const { id } = req.params
    const { faculty_id, role_in_panel } = req.body
    const assigned_by = req.user.user_id  // ✅ FIXED: was req.user.id

    if (!faculty_id || !role_in_panel) {
      return res.status(400).json({ message: 'faculty_id and role_in_panel are required' })
    }
    if (!['adviser', 'panelist'].includes(role_in_panel)) {
      return res.status(400).json({ message: 'role_in_panel must be adviser or panelist' })
    }

    // Verify faculty exists
    const [[faculty]] = await db.query(
      `SELECT user_id FROM users WHERE user_id = ? AND role = 'faculty' AND is_active = 1`,
      [faculty_id]
    )
    if (!faculty) return res.status(404).json({ message: 'Active faculty not found' })

    await db.query(
      `INSERT INTO panel_assignments (group_id, faculty_id, role_in_panel, assigned_by)
       VALUES (?, ?, ?, ?)`,
      [id, faculty_id, role_in_panel, assigned_by]
    )

    // Notify the faculty member
    await db.query(
      `INSERT INTO notifications (user_id, type, message)
       VALUES (?, 'assignment', ?)`,
      [faculty_id, `You have been assigned as ${role_in_panel} for a research group.`]
    )

    res.status(201).json({ message: 'Faculty assigned to panel' })
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Faculty already assigned to this panel with that role' })
    }
    console.error('assignPanel error:', err)
    res.status(500).json({ message: 'Failed to assign panel' })
  }
}

// DELETE /api/coordinator/panel/:assignmentId
const removeFromPanel = async (req, res) => {
  try {
    const { assignmentId } = req.params
    const [result] = await db.query(
      `DELETE FROM panel_assignments WHERE assignment_id = ?`, [assignmentId]
    )
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Assignment not found' })
    res.json({ message: 'Removed from panel' })
  } catch (err) {
    console.error('removeFromPanel error:', err)
    res.status(500).json({ message: 'Failed to remove from panel' })
  }
}

// GET /api/coordinator/faculty  (for dropdowns)
const getFacultyList = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT user_id, name, email FROM users
       WHERE LOWER(role) = 'faculty' AND is_active = 1
       ORDER BY name ASC`
    )
    res.json({ data: rows })
  } catch (err) {
    console.error('getFacultyList error:', err)
    res.status(500).json({ message: 'Failed to fetch faculty' })
  }
}

// GET /api/coordinator/students  (for dropdowns)
const getStudentList = async (req, res) => {
  try {
    const { search } = req.query
    let sql = `SELECT user_id, name, email, program FROM users WHERE role = 'student' AND is_active = 1`
    const params = []
    if (search) {
      sql += ` AND (name LIKE ? OR email LIKE ?)`
      params.push(`%${search}%`, `%${search}%`)
    }
    sql += ` ORDER BY name ASC`
    const [rows] = await db.query(sql, params)
    res.json({ data: rows })
  } catch (err) {
    console.error('getStudentList error:', err)
    res.status(500).json({ message: 'Failed to fetch students' })
  }
}

// ─────────────────────────────────────────────
// SUBMISSIONS / WORKFLOW
// ─────────────────────────────────────────────

// GET /api/coordinator/submissions
const getSubmissions = async (req, res) => {
  try {
    const { stage, status, program, search, page = 1, limit = 25 } = req.query
    const offset = (page - 1) * limit

    let sql = `
      SELECT
        s.submission_id, s.title, s.stage, s.status,
        s.program, s.school_year, s.created_at, s.updated_at,
        rg.group_name, rg.group_id,
        u.name AS submitted_by_name,
        COUNT(DISTINCT dv.version_id) AS version_count
      FROM submissions s
      JOIN research_groups rg ON s.group_id = rg.group_id
      JOIN users u ON s.submitted_by = u.user_id
      LEFT JOIN document_versions dv ON s.submission_id = dv.submission_id
      WHERE 1=1
    `
    const params = []

    if (stage)   { sql += ` AND s.stage = ?`;   params.push(stage) }
    if (status)  { sql += ` AND s.status = ?`;  params.push(status) }
    if (program) { sql += ` AND s.program = ?`; params.push(program) }
    if (search)  { sql += ` AND (s.title LIKE ? OR s.authors LIKE ?)`; params.push(`%${search}%`, `%${search}%`) }

    sql += ` GROUP BY s.submission_id ORDER BY s.updated_at DESC LIMIT ? OFFSET ?`
    params.push(Number(limit), Number(offset))

    const [rows] = await db.query(sql, params)

    // Get total count
    let countSql = `SELECT COUNT(*) AS total FROM submissions s WHERE 1=1`
    const countParams = []
    if (stage)   { countSql += ` AND s.stage = ?`;   countParams.push(stage) }
    if (status)  { countSql += ` AND s.status = ?`;  countParams.push(status) }
    if (program) { countSql += ` AND s.program = ?`; countParams.push(program) }
    if (search)  { countSql += ` AND (s.title LIKE ? OR s.authors LIKE ?)`; countParams.push(`%${search}%`, `%${search}%`) }

    const [[{ total }]] = await db.query(countSql, countParams)

    res.json({ data: rows, pagination: { total, page: Number(page), limit: Number(limit) } })
  } catch (err) {
    console.error('getSubmissions error:', err)
    res.status(500).json({ message: 'Failed to fetch submissions' })
  }
}

// GET /api/coordinator/submissions/:id
const getSubmissionById = async (req, res) => {
  try {
    const { id } = req.params

    const [[submission]] = await db.query(
      `SELECT s.*, rg.group_name, u.name AS submitted_by_name
       FROM submissions s
       JOIN research_groups rg ON s.group_id = rg.group_id
       JOIN users u ON s.submitted_by = u.user_id
       WHERE s.submission_id = ?`, [id]
    )
    if (!submission) return res.status(404).json({ message: 'Submission not found' })

    const [versions] = await db.query(
      `SELECT dv.*, u.name AS uploaded_by_name
       FROM document_versions dv
       JOIN users u ON dv.uploaded_by = u.user_id
       WHERE dv.submission_id = ?
       ORDER BY dv.version_number DESC`, [id]
    )

    const [reviews] = await db.query(
      `SELECT r.*, u.name AS reviewer_name
       FROM reviews r
       JOIN users u ON r.reviewer_id = u.user_id
       WHERE r.submission_id = ?`, [id]
    )

    const [comments] = await db.query(
      `SELECT rc.*, u.name AS author_name
       FROM review_comments rc
       JOIN users u ON rc.author_id = u.user_id
       WHERE rc.submission_id = ?
       ORDER BY rc.created_at ASC`, [id]
    )

    const [panel] = await db.query(
      `SELECT pa.role_in_panel, u.name, u.email
       FROM panel_assignments pa
       JOIN users u ON pa.faculty_id = u.user_id
       WHERE pa.group_id = ?`, [submission.group_id]
    )

    res.json({ data: { ...submission, versions, reviews, comments, panel } })
  } catch (err) {
    console.error('getSubmissionById error:', err)
    res.status(500).json({ message: 'Failed to fetch submission' })
  }
}

// PATCH /api/coordinator/submissions/:id/stage
const updateStage = async (req, res) => {
  try {
    const { id } = req.params
    const { stage } = req.body

    const validStages = ['proposal', 'defense', 'final_submission']
    if (!validStages.includes(stage)) {
      return res.status(400).json({ message: 'Invalid stage value' })
    }

    const [[submission]] = await db.query(
      `SELECT submission_id, stage, status, group_id, title FROM submissions WHERE submission_id = ?`, [id]
    )
    if (!submission) return res.status(404).json({ message: 'Submission not found' })

    const stageOrder = { proposal: 0, defense: 1, final_submission: 2 }
    if (stageOrder[stage] <= stageOrder[submission.stage]) {
      return res.status(400).json({ message: `Cannot move backwards from ${submission.stage} to ${stage}` })
    }

    await db.query(
      `UPDATE submissions SET stage = ?, status = 'submitted', updated_at = NOW()
       WHERE submission_id = ?`,
      [stage, id]
    )

    const [members] = await db.query(
      `SELECT user_id FROM group_members WHERE group_id = ?`, [submission.group_id]
    )
    if (members.length > 0) {
      const notifValues = members.map(m => [
        m.user_id, id, 'status_change',
        `Your paper "${submission.title}" has advanced to the ${stage.replace('_', ' ')} stage.`
      ])
      await db.query(
        `INSERT INTO notifications (user_id, submission_id, type, message) VALUES ?`,
        [notifValues]
      )
    }

    res.json({ message: `Stage updated to ${stage}` })
  } catch (err) {
    console.error('updateStage error:', err)
    res.status(500).json({ message: 'Failed to update stage' })
  }
}

// PATCH /api/coordinator/submissions/:id/status
const updateStatus = async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body

    const validStatuses = ['submitted', 'under_review', 'needs_revision', 'approved', 'rejected', 'published']
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' })
    }

    const [[submission]] = await db.query(
      `SELECT submission_id, group_id, title FROM submissions WHERE submission_id = ?`, [id]
    )
    if (!submission) return res.status(404).json({ message: 'Submission not found' })

    const isPublished = status === 'published' ? 1 : 0

    await db.query(
      `UPDATE submissions SET status = ?, is_published = ?, updated_at = NOW()
       WHERE submission_id = ?`,
      [status, isPublished, id]
    )

    const [members] = await db.query(
      `SELECT user_id FROM group_members WHERE group_id = ?`, [submission.group_id]
    )
    if (members.length > 0) {
      const notifValues = members.map(m => [
        m.user_id, id, 'status_change',
        `Your paper "${submission.title}" status has been updated to: ${status.replace('_', ' ')}.`
      ])
      await db.query(
        `INSERT INTO notifications (user_id, submission_id, type, message) VALUES ?`,
        [notifValues]
      )
    }

    res.json({ message: `Status updated to ${status}` })
  } catch (err) {
    console.error('updateStatus error:', err)
    res.status(500).json({ message: 'Failed to update status' })
  }
}

// GET /api/coordinator/dashboard
const getDashboardStats = async (req, res) => {
  try {
    const [[{ total_groups }]]      = await db.query(`SELECT COUNT(*) AS total_groups FROM research_groups`)
    const [[{ total_submissions }]] = await db.query(`SELECT COUNT(*) AS total_submissions FROM submissions`)
    const [[{ pending_review }]]    = await db.query(`SELECT COUNT(*) AS pending_review FROM submissions WHERE status = 'submitted'`)
    const [[{ published }]]         = await db.query(`SELECT COUNT(*) AS published FROM submissions WHERE is_published = 1`)

    const [by_stage] = await db.query(
      `SELECT stage, COUNT(*) AS count FROM submissions GROUP BY stage`
    )
    const [by_status] = await db.query(
      `SELECT status, COUNT(*) AS count FROM submissions GROUP BY status`
    )
    const [recent] = await db.query(
      `SELECT s.submission_id, s.title, s.stage, s.status, s.updated_at, rg.group_name
       FROM submissions s
       JOIN research_groups rg ON s.group_id = rg.group_id
       ORDER BY s.updated_at DESC LIMIT 5`
    )

    res.json({
      data: {
        total_groups,
        total_submissions,
        pending_review,
        published,
        by_stage,
        by_status,
        recent_activity: recent,
      }
    })
  } catch (err) {
    console.error('getDashboardStats error:', err)
    res.status(500).json({ message: 'Failed to fetch dashboard stats' })
  }
}

module.exports = {
  getGroups, getGroupById, createGroup, updateGroup, deleteGroup,
  getGroupMembers, addGroupMember, removeGroupMember,
  getPanel, assignPanel, removeFromPanel,
  getFacultyList, getStudentList,
  getSubmissions, getSubmissionById,
  updateStage, updateStatus,
  getDashboardStats,
}
