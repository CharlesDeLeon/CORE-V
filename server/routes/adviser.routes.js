const express = require('express')
const router = express.Router()
const authMiddleware = require('../middleware/authMiddleware')
const roleMiddleware = require('../middleware/roleMiddleware')
const { listAdvisers } = require('../controllers/adviserController')

router.get('/', authMiddleware, roleMiddleware('Student'), listAdvisers)

module.exports = router
