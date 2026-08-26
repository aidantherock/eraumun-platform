import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function ProtectedRoute({ children, requireApproved = true, requireLevel = 0 }) {
  const { user, isApproved, roleLevel, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900" />
      </div>
    )
  }

  // Not logged in
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Logged in but pending approval
  if (requireApproved && !isApproved) {
    return <Navigate to="/pending" replace />
  }

  // Insufficient role level
  if (roleLevel < requireLevel) {
    return <Navigate to="/portal" replace />
  }

  return children
}