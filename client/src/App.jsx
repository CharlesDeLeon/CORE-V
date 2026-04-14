import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import StudentLayout from './pages/student/StudentLayout'
import StudentDashboard from './pages/student/StudentDashboard'
import UploadForm from './pages/student/UploadForm'
import PaperDetail from './pages/student/PaperDetail'
import AdminDashboard from './pages/admin/AdminDashboard'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />

          {/* Student layout wraps all student pages */}
          <Route
            path="/student"
            element={
              <ProtectedRoute allowedRole="Student">
                <StudentLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<StudentDashboard />} />
            <Route path="upload" element={<UploadForm />} />
            <Route path="paper/:paperId" element={<PaperDetail />} />
          </Route>

          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRole="Admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App