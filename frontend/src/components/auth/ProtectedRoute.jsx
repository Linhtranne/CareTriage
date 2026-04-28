import { Navigate, Outlet } from 'react-router-dom'
import useAuthStore from '../../store/authStore'

export default function ProtectedRoute({ roles }) {
  const { isAuthenticated, user } = useAuthStore()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (roles && !roles.includes(user?.role)) {
    return <Navigate to="/404" replace />
  }

  return <Outlet />
}
