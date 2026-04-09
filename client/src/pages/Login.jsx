import { useState } from 'react'
import useAuth from '../context/useAuth'

const Login = () => {
  const { login } = useAuth()
  const [role, setRole] = useState('Student')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin