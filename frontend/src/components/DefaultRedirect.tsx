import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

/** Redirects to the appropriate dashboard based on role. Unauthenticated users go to login. */
export default function DefaultRedirect() {
  const token = useAuthStore((s) => s.token)
  const role = useAuthStore((s) => s.user?.role)

  if (!token) return <Navigate to="/login" replace />
  if (role === 'professor') return <Navigate to="/instructor" replace />
  return <Navigate to="/classes" replace />
}
