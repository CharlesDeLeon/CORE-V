  import { useState } from 'react'
  import useAuth from '../context/useAuth'

  const Login = () => {
    const { login } = useAuth()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    

    const handleLogin = async (e) => {
  e.preventDefault();
  setError('');
  setLoading(true);

  try {

    const response = await login(email, password);
    if (response?.user?.status === 'deactivated' || response?.user?.isActive === false) {
      // If your useAuth saves a token automatically, you may need to call a logout/clear function here
      throw new Error('DEACTIVATED_ACCOUNT');
    }

    // Success! The app will likely redirect via the AuthContext logic.

  } catch (err) {
    // 3. ERROR CATEGORIZATION
    if (err.message === 'DEACTIVATED_ACCOUNT') {
      setError('This account has been deactivated. Please contact an administrator.');
    } else if (err.response?.status === 403) {
      setError('Access denied. Your account may be disabled.');
    } else if (err.response?.status === 401) {
      setError('Invalid email or password.');
    } else {
      setError(err.response?.data?.message || 'An unexpected error occurred.');
    }
  } finally {
    setLoading(false);
  }
};

  return (
    <div style={styles.page}>

      <div style={styles.yellowSide} />
      <div style={styles.blueSide} />

      <div style={styles.welcomeWrapper}>
        <h1 style={styles.welcomeText}>Welcome,<br />Scholar!</h1>
      </div>

      <div style={styles.cardWrapper}>
        <div style={styles.card}>

          <p style={styles.cardLabel}>Sign in to CORE-V</p>

          <form onSubmit={handleLogin} style={styles.form}>
            <input
              type="email"
              placeholder="Email"
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

  cardLabel: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: '13px',
    marginBottom: '1.5rem',
    marginTop: 0,
    letterSpacing: '0.03em',
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