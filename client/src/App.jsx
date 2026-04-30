import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'

// Student
import StudentLayout from './pages/student/StudentLayout'
import StudentDashboard from './pages/student/StudentDashboard'
import UploadForm from './pages/student/UploadForm'
import PaperDetail from './pages/student/PaperDetail'
import ActivityHistory from './pages/student/ActivityHistory'


// Faculty
import FacultyLayout from './pages/faculty/FacultyLayout'
import FacultyDashboard from './pages/faculty/FacultyDashboard'
import AssignmentsList from './pages/faculty/AssignmentsList'
import SubmissionDetail from './pages/faculty/SubmissionDetail'

// Coordinator

// Admin
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminLayout from './pages/admin/AdminLayout'
import AuditTrail from './pages/admin/AuditTrail'
import ManageUsers from './pages/admin/ManageUsers'
import ManageStorage from './pages/admin/ManageStorage'


function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />

          <Route
            path="/student"
            element={
              <ProtectedRoute allowedRole="student">
                <StudentLayout /> 
              </ProtectedRoute>
            }
          >
            <Route index element={<StudentDashboard />} />
            <Route path="upload" element={<UploadForm />} />
            <Route path="paper/:paperId" element={<PaperDetail />} />
            <Route path="history" element={<ActivityHistory />} />
          </Route>

          <Route
            path="/faculty"
            element={
              <ProtectedRoute allowedRole="faculty">
                <FacultyLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/faculty/dashboard" replace />} />
            <Route path="dashboard" element={<FacultyDashboard />} />
            <Route path="assignments" element={<AssignmentsList />} />
            <Route path="submission/:submission_id" element={<SubmissionDetail />} />
          </Route>

          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRole={['sysadmin', 'coordinator', 'admin']}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="auditTrail" element={<AuditTrail />} />
            <Route path="manageUsers" element={<ManageUsers />} />
            <Route path="manageStorage" element={<ManageStorage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
