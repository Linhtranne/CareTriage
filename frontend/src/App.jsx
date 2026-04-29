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

// Detailed feature pages
import AITriage from './pages/public/features/AITriage'
import EHREngine from './pages/public/features/EHREngine'
import SmartBooking from './pages/public/features/SmartBooking'
import Hospitals from './pages/public/solutions/Hospitals'
import Clinics from './pages/public/solutions/Clinics'
import Individuals from './pages/public/solutions/Individuals'
import APIDocs from './pages/public/developers/APIDocs'
import Security from './pages/public/developers/Security'
import Terms from './pages/public/Terms'

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route path="/features/ai-triage" element={<AITriage />} />
        <Route path="/features/ehr-engine" element={<EHREngine />} />
        <Route path="/features/smart-booking" element={<SmartBooking />} />
        <Route path="/solutions/hospitals" element={<Hospitals />} />
        <Route path="/solutions/clinics" element={<Clinics />} />
        <Route path="/solutions/individuals" element={<Individuals />} />
        <Route path="/developers/api-docs" element={<APIDocs />} />
        <Route path="/developers/security" element={<Security />} />
        <Route path="/terms" element={<Terms />} />
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
