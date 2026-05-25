import { Navigate, Outlet, useLocation } from 'react-router-dom'
import useAuthStore from '../../store/auth-store'

export default function ProtectedRoute({ roles }) {
  const { isAuthenticated, user } = useAuthStore()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  const cleanRole = user?.role ? user.role.replace('ROLE_', '').toUpperCase() : null
  if (roles && !roles.includes(cleanRole)) {
    return <Navigate to="/404" replace />
  }

  return <Outlet />
}
