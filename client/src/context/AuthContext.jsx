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

  const login = async (email, password, role) => {
    const data = await loginService(email, password, role)
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
    setUser(data.user)

    if (data.user.role === 'Student') {
      navigate('/student')
    } else {
      navigate('/admin')
    }
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