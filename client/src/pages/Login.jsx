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

      {/* diagonal split background */}
      <div style={styles.yellowSide} />
      <div style={styles.blueSide} />

      {/* welcome text — left side */}
      <div style={styles.welcomeWrapper}>
        <h1 style={styles.welcomeText}>Welcome,<br />Scholar!</h1>
      </div>

      {/* glass card — right side */}
      <div style={styles.cardWrapper}>
        <div style={styles.card}>

          <div style={styles.roleGroup}>
            <button
              type="button"
              style={{ ...styles.roleBtn, ...(role === 'Student' ? styles.roleBtnActive : {}) }}
              onClick={() => setRole('Student')}
            >
              Student
            </button>
            <button
              type="button"
              style={{ ...styles.roleBtn, ...(role === 'Admin' ? styles.roleBtnActive : {}) }}
              onClick={() => setRole('Admin')}
            >
              Admin
            </button>
          </div>

          <form onSubmit={handleLogin} style={styles.form}>
            <input
              type="email"
              placeholder="User"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              required
            />

            {error && <div style={styles.error}>{error}</div>}

            <div style={styles.btnRow}>
              <button type="submit" style={styles.loginBtn} disabled={loading}>
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </div>
          </form>

        </div>
      </div>

    </div>
  )
}

const styles = {
  page: {
    position: 'relative',
    width: '100vw',
    height: '100vh',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    fontFamily: 'sans-serif',
  },

  // diagonal split — yellow triangle (top-left)
  yellowSide: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: '#FFBE4F',
    clipPath: 'polygon(0 0, 58% 0, 38% 100%, 0 100%)',
    zIndex: 0,
  },

  // blue side fills the rest
  blueSide: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'linear-gradient(135deg, #3B4BC8 0%, #2C3A9E 100%)',
    zIndex: -1,
  },

  welcomeWrapper: {
    position: 'relative',
    zIndex: 1,
    flex: 1,
    paddingLeft: '5%',
  },

  welcomeText: {
    fontSize: 'clamp(2rem, 4vw, 3.5rem)',
    fontWeight: '800',
    color: 'white',
    lineHeight: 1.2,
    textShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },

  cardWrapper: {
    position: 'relative',
    zIndex: 1,
    width: '38%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: '4%',
  },

  // glassmorphism card
  card: {
    width: '100%',
    maxWidth: '360px',
    background: 'rgba(255, 255, 255, 0.12)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid rgba(255, 255, 255, 0.25)',
    borderRadius: '20px',
    padding: '2.5rem 2rem',
  },

  roleGroup: {
    display: 'flex',
    gap: '8px',
    marginBottom: '1.5rem',
  },

  roleBtn: {
    flex: 1,
    padding: '8px 0',
    fontSize: '13px',
    border: '1px solid rgba(255,255,255,0.3)',
    borderRadius: '8px',
    background: 'transparent',
    color: 'rgba(255,255,255,0.7)',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },

  roleBtnActive: {
    background: 'rgba(255,255,255,0.2)',
    color: 'white',
    fontWeight: '600',
    border: '1px solid rgba(255,255,255,0.6)',
  },

  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },

  input: {
    width: '100%',
    padding: '14px 16px',
    fontSize: '14px',
    border: 'none',
    borderRadius: '10px',
    background: 'rgba(220, 220, 220, 0.75)',
    color: '#333',
    outline: 'none',
    boxSizing: 'border-box',
  },

  error: {
    fontSize: '13px',
    color: '#ffe0e0',
    background: 'rgba(255,80,80,0.2)',
    border: '1px solid rgba(255,80,80,0.3)',
    borderRadius: '8px',
    padding: '8px 12px',
  },

  btnRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: '0.5rem',
  },

  loginBtn: {
    padding: '12px 32px',
    fontSize: '14px',
    fontWeight: '600',
    background: '#FFBE4F',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
  },
}

export default Login