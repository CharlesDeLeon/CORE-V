const express = require('express')
const router = express.Router()
const path = require('path')
const fs = require('fs')
const multer = require('multer')
const { uploadPaper, getMyPapers } = require('../controllers/paperController')
const authMiddleware = require('../middleware/authMiddleware')
const roleMiddleware = require('../middleware/roleMiddleware')

const uploadsDir = path.join(__dirname, '..', 'uploads')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const safeName = `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`
    cb(null, safeName)
  }
})

const fileFilter = (_req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]

  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error('Only PDF, DOC, and DOCX files are allowed'))
  }

  cb(null, true)
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 }
})

router.get('/', (req, res) => res.json({ message: 'paper routes ready' }))
router.get('/my', authMiddleware, roleMiddleware('Student'), getMyPapers)
router.post(
  '/upload',
  authMiddleware,
  roleMiddleware('Student'),
  upload.single('file'),
  uploadPaper
)

module.exports = router