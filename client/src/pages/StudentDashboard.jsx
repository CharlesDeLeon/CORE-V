import useAuth from "../context/useAuth";

const StudentDashboard = () => {
    const { user, logout } = useAuth()
    return(
        <div>
            <h1>Welcome, {user?.name}</h1>
            <button onClick={logout}>Logout</button>
        </div>
    )
}

export default StudentDashboard