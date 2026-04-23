const roleMiddleware = (...allowedRoles) => {
    return (req, res, next) => {
        const currentRole = String(req.user?.role || '').toLowerCase()
        const normalizedAllowedRoles = allowedRoles.map(role => String(role).toLowerCase())

        if (!normalizedAllowedRoles.includes(currentRole)) {
            return res.status(403).json({ message: 'Access denied: Insufficient role' })
        }
        next()
    }
}

module.exports = roleMiddleware