import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

interface ProtectedRouteProps {
  children: React.ReactNode
  /** If set, only users with this role can access. Others redirect to their dashboard. */
  requireRole?: 'student' | 'professor'
}

export default function ProtectedRoute({ children, requireRole }: ProtectedRouteProps) {
  const token = useAuthStore((s) => s.token)
  const role = useAuthStore((s) => s.user?.role)
  const location = useLocation()

  if (!token) return <Navigate to="/login" replace state={{ from: location }} />
  if (requireRole === 'professor' && role !== 'professor') return <Navigate to="/classes" replace />
  if (requireRole === 'student' && role !== 'student') return <Navigate to="/instructor" replace />
  return <>{children}</>
}
