import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { CircularProgress, Box } from '@mui/material'
import ProtectedRoute from './components/auth/ProtectedRoute'
import MainLayout from './components/layout/MainLayout'

const Login = lazy(() => import('./pages/auth/Login'))
const SuperAdminDashboard = lazy(() => import('./pages/super-admin/Dashboard'))
const ContentManagement = lazy(() => import('./pages/content-admin/Posts'))
const DefaultDashboard = lazy(() => import('./pages/Dashboard'))
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'))
const UserManagement = lazy(() => import('./pages/admin/UserManagement'))
const DepartmentManagement = lazy(() => import('./pages/admin/DepartmentManagement'))
const MedicalRecordDetail = lazy(() => import('./pages/admin/MedicalRecordDetail'))
const MedicalRecords = lazy(() => import('./pages/admin/MedicalRecords'))
const CMSManagement = lazy(() => import('./pages/CMSManagement'))

const FallbackLoader = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#0f172a' }}>
    <CircularProgress size={60} sx={{ color: '#10b981' }} />
  </Box>
)

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<FallbackLoader />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Layout wrapped routes */}
        <Route element={<ProtectedRoute roles={['SUPER_ADMIN', 'CONTENT_ADMIN', 'ADMIN']} />}>
          <Route element={<MainLayout />}>
            
            {/* Super Admin Route */}
            <Route element={<ProtectedRoute roles={['SUPER_ADMIN']} />}>
              <Route path="/super-admin/dashboard" element={<SuperAdminDashboard />} />
            </Route>

            {/* Content Admin Route */}
            <Route element={<ProtectedRoute roles={['CONTENT_ADMIN']} />}>
              <Route path="/content-admin/posts" element={<ContentManagement />} />
            </Route>

            {/* Admin Routes */}
            <Route element={<ProtectedRoute roles={['ADMIN']} />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<UserManagement />} />
              <Route path="/admin/departments" element={<DepartmentManagement />} />
              <Route path="/admin/records" element={<MedicalRecords />} />
              <Route path="/admin/records/:id" element={<MedicalRecordDetail />} />
              <Route path="/admin/cms" element={<CMSManagement />} />
            </Route>

            {/* Fallback route */}
            <Route path="/dashboard" element={<DefaultDashboard />} />
            
          </Route>
        </Route>

        {/* Redirect root to login or specific dashboard */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* 404 Handling */}
        <Route path="/404" element={
          <div style={{ padding: '2rem', color: '#f8fafc', background: '#0f172a', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <h2>404 - Page Not Found</h2>
          </div>
        } />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
