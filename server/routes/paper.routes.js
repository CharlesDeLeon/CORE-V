const express = require('express')
const router = express.Router()
// temporary addition
const { getMyPapers } = require('../controllers/paperController')
const authMiddleware = require('../middleware/authMiddleware')
const roleMiddleware = require('../middleware/roleMiddleware')
// temporary addition

// stubs - I'll fill these in next
router.get('/', (req, res) => res.json({ message: 'paper routes coming soon'}))

module.exports = router