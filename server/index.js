const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')

dotenv.config()

const app = express()

app.use(cors({origin: 'http://localhost:5173'}))
app.use(express.json())
app.use(express.urlencoded({ extended: true}))

//ROutes

app.use('/api/auth', require('.routes/auth.routes'))
app.use('/api/papers', require('.routes/paper.routes'))
app.use('/api/reviews', require('.routes/review.routes'))

app.get('/api', (req, res ) => {
    res.json({ message: 'CORE V API is running' })
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
})