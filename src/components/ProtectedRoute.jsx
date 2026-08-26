import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, requireApproved = true, requireLevel = 0 }) {
  const { user, isApproved, isPending, roleLevel, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e3a6e]" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (requireApproved && !isApproved) {
    return <Navigate to="/pending" replace />
  }

  if (roleLevel < requireLevel) {
    return <Navigate to="/portal" replace />
  }

  return children
}