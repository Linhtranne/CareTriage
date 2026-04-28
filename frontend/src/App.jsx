import { Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from './components/layout/MainLayout'
import PublicLayout from './components/layout/PublicLayout'
import Landing from './pages/public/Landing'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import PatientDashboard from './pages/patient/Dashboard'
import DoctorDashboard from './pages/doctor/Dashboard'
import AdminDashboard from './pages/admin/Dashboard'
import ProtectedRoute from './components/auth/ProtectedRoute'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      {/* Patient routes */}
      <Route element={<ProtectedRoute roles={['PATIENT']} />}>
        <Route element={<MainLayout />}>
          <Route path="/patient/dashboard" element={<PatientDashboard />} />
        </Route>
      </Route>

      {/* Doctor routes */}
      <Route element={<ProtectedRoute roles={['DOCTOR']} />}>
        <Route element={<MainLayout />}>
          <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
        </Route>
      </Route>

      {/* Admin routes */}
      <Route element={<ProtectedRoute roles={['ADMIN']} />}>
        <Route element={<MainLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
        </Route>
      </Route>

      <Route path="/404" element={<NotFound />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  )
}
