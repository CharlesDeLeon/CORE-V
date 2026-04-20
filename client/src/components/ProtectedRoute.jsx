import { Navigate } from 'react-router-dom'
import useAuth from '../context/useAuth'

const ProtectedRoute = ({ children, allowedRole }) => {
  const { user } = useAuth()
  const persistedUser = JSON.parse(localStorage.getItem('user') || 'null')
  const activeUser = user || persistedUser

  if (!activeUser) return <Navigate to="/login" />

  if (allowedRole) {
    const currentRole = activeUser.role?.toLowerCase()
    const requiredRole = allowedRole.toLowerCase()
    if (currentRole !== requiredRole) return <Navigate to="/login" />
  }

  return children
}

export default ProtectedRoute