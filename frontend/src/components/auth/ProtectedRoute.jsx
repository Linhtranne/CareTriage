import { Navigate, Outlet, useLocation } from 'react-router-dom'
import useAuthStore from '../../store/authStore'

export default function ProtectedRoute({ roles }) {
  const { isAuthenticated, user } = useAuthStore()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (roles && !roles.includes(user?.role)) {
    return <Navigate to="/404" replace />
  }

  return <Outlet />
}
