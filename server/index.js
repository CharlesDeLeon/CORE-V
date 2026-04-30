const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const path = require('path')

dotenv.config()

console.log('DB_USER:', process.env.DB_USER)
console.log('DB_PASSWORD:', process.env.DB_PASSWORD)
console.log('DB_NAME:', process.env.DB_NAME)

const app = express()

app.use(cors({origin: 'http://localhost:5173'}))
app.use(express.json())
app.use(express.urlencoded({ extended: true}))
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// Audit middleware to expose req.audit and correlation/request ids
app.use(require('./middleware/auditMiddleware'))

app.use('/api/auth', require('./routes/auth.routes'))
app.use('/api/faculty', require('./routes/faculty.routes'))
app.use('/api/papers', require('./routes/paper.routes'))
app.use('/api/reviews', require('./routes/review.routes'))
app.use('/api/admin', require('./routes/admin.routes'))
app.use('/api/notifications', require('./routes/notification.routes'))

app.get('/api', (req, res ) => {
    res.json({ message: 'CORE V API is running' })
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
})
