import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/auth/Login'
import ProtectedRoute from './components/auth/ProtectedRoute'
import MainLayout from './components/layout/MainLayout'

import SuperAdminDashboard from './pages/super-admin/Dashboard'
import ContentManagement from './pages/content-admin/Posts'
import DefaultDashboard from './pages/Dashboard'
import AdminDashboard from './pages/admin/Dashboard'
import UserManagement from './pages/admin/UserManagement'

export default function App() {
  return (
    <BrowserRouter>
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
    </BrowserRouter>
  )
}
