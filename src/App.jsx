import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'

// Auth pages
import Login from './pages/public/Login'
import Register from './pages/public/Register'
import ResetPassword from './pages/public/ResetPassword'
import UpdatePassword from './pages/public/UpdatePassword'
import Pending from './pages/public/Pending'

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public auth routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/update-password" element={<UpdatePassword />} />
        <Route path="/pending" element={<Pending />} />

        {/* Portal routes (protected) */}
        <Route path="/portal" element={
          <ProtectedRoute>
            <div>Portal Home — coming soon</div>
          </ProtectedRoute>
        } />

        {/* Admin routes (eboard+ only) */}
        <Route path="/admin" element={
          <ProtectedRoute requireLevel={80}>
            <div>Admin Panel — coming soon</div>
          </ProtectedRoute>
        } />

        {/* Public site */}
        <Route path="/" element={<div>Public Site — coming soon</div>} />

        {/* 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}

export default App