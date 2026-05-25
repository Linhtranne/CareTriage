import { lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from '../components/auth/protected-route'
import MainLayout from '../layouts/main-layout'

const Login = lazy(() => import('../pages/auth/login'))
const SuperAdminDashboard = lazy(() => import('../pages/super-admin/dashboard'))
const ContentManagement = lazy(() => import('../pages/content-admin/posts'))
const DefaultDashboard = lazy(() => import('../pages/dashboard'))
const AdminDashboard = lazy(() => import('../pages/admin/dashboard'))
const UserManagement = lazy(() => import('../pages/admin/user-management'))
const DepartmentManagement = lazy(() => import('../pages/admin/department-management'))
const MedicalRecordDetail = lazy(() => import('../pages/admin/medical-record-detail'))
const MedicalRecords = lazy(() => import('../pages/admin/medical-records'))
const CMSManagement = lazy(() => import('../pages/cms-management'))

const NotFound = () => (
  <div
    style={{
      padding: '2rem',
      color: '#f8fafc',
      background: '#0f172a',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <h2>404 - Page Not Found</h2>
  </div>
)

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute roles={['SUPER_ADMIN', 'CONTENT_ADMIN', 'ADMIN']} />}>
        <Route element={<MainLayout />}>
          <Route element={<ProtectedRoute roles={['SUPER_ADMIN']} />}>
            <Route path="/super-admin/dashboard" element={<SuperAdminDashboard />} />
          </Route>

          <Route element={<ProtectedRoute roles={['CONTENT_ADMIN']} />}>
            <Route path="/content-admin/posts" element={<ContentManagement />} />
          </Route>

          <Route element={<ProtectedRoute roles={['ADMIN']} />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<UserManagement />} />
            <Route path="/admin/departments" element={<DepartmentManagement />} />
            <Route path="/admin/records" element={<MedicalRecords />} />
            <Route path="/admin/records/:id" element={<MedicalRecordDetail />} />
            <Route path="/admin/cms" element={<CMSManagement />} />
          </Route>

          <Route path="/dashboard" element={<DefaultDashboard />} />
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/404" element={<NotFound />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  )
}
