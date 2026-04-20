import { createContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login as loginService } from '../services/authService'

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem('user')) || null
  )
  const navigate = useNavigate()

  const login = async (email, password) => {
    const data = await loginService(email, password)
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
    setUser(data.user)

    const role = data.user?.role?.toLowerCase()

    if (role === 'student') navigate('/student')
    else if (role === 'faculty') navigate('/faculty/dashboard')
    else if (role === 'coordinator') navigate('/coordinator/dashboard')
    else if (role === 'sysadmin' || role === 'admin') navigate('/admin')
    else navigate('/login')
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    navigate('/login')
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}