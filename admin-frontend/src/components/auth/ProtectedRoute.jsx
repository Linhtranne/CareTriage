import { Navigate, Outlet, useLocation } from 'react-router-dom'
import useAuthStore from '../../store/authStore'

export default function ProtectedRoute({ roles }) {
  const { isAuthenticated, user } = useAuthStore()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Map user roles (extract base role names e.g. ROLE_SUPER_ADMIN -> SUPER_ADMIN)
  const userRoles = []
  if (user?.role) userRoles.push(user.role)
  if (user?.roles) userRoles.push(...user.roles)
  
  const cleanRoles = userRoles.map(r => r.replace('ROLE_', '').toUpperCase())

  if (roles && !roles.some(role => cleanRoles.includes(role.toUpperCase()))) {
    return <Navigate to="/404" replace />
  }

  return <Outlet />
}
