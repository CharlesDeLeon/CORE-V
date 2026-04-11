import useAuth from '../context/useAuth'

const AdminDashboard = () => {
  const { user, logout } = useAuth()
  return (
    <div>
      <h1>Admin Panel — {user?.name}</h1>
      <button onClick={logout}>Logout</button>
    </div>
  )
}

export default AdminDashboard