const pool = require('../config/db')
const bcrypt = require('bcryptjs')
const jwt =  require('jsonwebtoken')

const login = async (req, res) => {
    const { email, password } = req.body

    if (!email || !password) {
        return res.status(400).json({ message: 'All fields are required' })
    }

    try {
        const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email])

        if (rows.length === 0) {
            return res.status(401).json({ message: 'Invalid Credentials' })
        }

        const user = rows[0]
        const isMatch = await bcrypt.compare(password, user.password)

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid Credentials' })
        }

        const token = jwt.sign(
            { user_id: user.user_id, name: user.name, role: user.role},
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        )

        res.json({
            token,
            user: {
                user_id: user.user_id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        })
    } catch (err) {
        console.error(err)
        res.status(500).json({ message: 'Server Error'})
    }
}

module.exports = { login }