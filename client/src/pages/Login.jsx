import { useState } from 'react'
import useAuth from '../context/useAuth'

const Login = () => {
  const { login } = useAuth()
  const [role, setRole] = useState('Student')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(email, password, role)
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>

        <div style={styles.logo}>
          <div style={styles.logoIcon}>
            <svg width="18" height="18" fill="white" viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div>
            <div style={styles.logoText}>CORE V</div>
            <div style={styles.logoSub}>Research Paper Submission System</div>
          </div>
        </div>

        <h2 style={styles.heading}>Sign in</h2>
        <p style={styles.subtitle}>Choose your role to continue</p>

        <div style={styles.roleGroup}>
          <button
            style={{ ...styles.roleBtn, ...(role === 'Student' ? styles.roleBtnActive : {}) }}
            onClick={() => setRole('Student')}
            type="button"
          >
            Student
          </button>
          <button
            style={{ ...styles.roleBtn, ...(role === 'Admin' ? styles.roleBtnActive : {}) }}
            onClick={() => setRole('Admin')}
            type="button"
          >
            Admin
          </button>
        </div>

        <form onSubmit={handleLogin}>
          <div style={styles.field}>
            <label style={styles.label}>Email address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@school.edu.ph"
              style={styles.input}
              required
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={styles.input}
              required
            />
          </div>

          {error && <div style={styles.error}>{error}</div>}

          <button type="submit" style={styles.submitBtn} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    padding: '1rem',
  },
  card: {
    background: 'white',
    border: '1px solid #e5e5e5',
    borderRadius: '12px',
    padding: '2rem 2.25rem',
    width: '100%',
    maxWidth: '400px',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '1.75rem',
  },
  logoIcon: {
    width: '36px',
    height: '36px',
    background: '#534AB7',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: '18px',
    fontWeight: '500',
  },
  logoSub: {
    fontSize: '12px',
    color: '#888',
    marginTop: '1px',
  },
  heading: {
    fontSize: '18px',
    fontWeight: '500',
    marginBottom: '.25rem',
  },
  subtitle: {
    fontSize: '14px',
    color: '#888',
    marginBottom: '1.25rem',
  },
  roleGroup: {
    display: 'flex',
    gap: '8px',
    marginBottom: '1.25rem',
  },
  roleBtn: {
    flex: 1,
    padding: '8px 0',
    fontSize: '13px',
    border: '1px solid #e5e5e5',
    borderRadius: '8px',
    background: 'white',
    cursor: 'pointer',
    color: '#888',
  },
  roleBtnActive: {
    background: '#EEEDFE',
    borderColor: '#534AB7',
    color: '#3C3489',
    fontWeight: '500',
  },
  field: {
    marginBottom: '1rem',
  },
  label: {
    display: 'block',
    fontSize: '13px',
    color: '#666',
    marginBottom: '6px',
  },
  input: {
    width: '100%',
    padding: '0 12px',
    height: '38px',
    fontSize: '14px',
    border: '1px solid #e5e5e5',
    borderRadius: '8px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  error: {
    fontSize: '13px',
    color: '#c0392b',
    background: '#fdf0ed',
    border: '1px solid #f5c6c0',
    borderRadius: '8px',
    padding: '8px 12px',
    marginBottom: '1rem',
  },
  submitBtn: {
    width: '100%',
    height: '38px',
    background: '#534AB7',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    marginTop: '.25rem',
  },
}

export default Login