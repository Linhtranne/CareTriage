import React, { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { CircularProgress, Box } from '@mui/material'
import MainLayout from './components/layout/MainLayout'
import PublicLayout from './components/layout/PublicLayout'
import ProtectedRoute from './components/auth/ProtectedRoute'

const Landing = lazy(() => import('./pages/public/Landing'))
const Login = lazy(() => import('./pages/auth/Login'))
const Register = lazy(() => import('./pages/auth/Register'))
const PatientDashboard = lazy(() => import('./pages/patient/Dashboard'))
const BookAppointment = lazy(() => import('./pages/patient/BookAppointment'))
const MyAppointments = lazy(() => import('./pages/patient/MyAppointments'))
const MedicalHistory = lazy(() => import('./pages/patient/MedicalHistory'))
const DoctorDashboard = lazy(() => import('./pages/doctor/Dashboard'))
const DoctorAppointments = lazy(() => import('./pages/doctor/DoctorAppointments'))
const TriageTicketInbox = lazy(() => import('./pages/doctor/TriageTicketInbox'))
const PatientTriageTickets = lazy(() => import('./pages/patient/TriageTickets'))
const CreateMedicalRecord = lazy(() => import('./pages/doctor/CreateMedicalRecord'))
const Profile = lazy(() => import('./pages/shared/Profile'))
const NotFound = lazy(() => import('./pages/NotFound'))

// Detailed feature pages
const AITriage = lazy(() => import('./pages/public/features/AITriage'))
const EHREngine = lazy(() => import('./pages/public/features/EHREngine'))
const SmartBooking = lazy(() => import('./pages/public/features/SmartBooking'))
const Hospitals = lazy(() => import('./pages/public/solutions/Hospitals'))
const Clinics = lazy(() => import('./pages/public/solutions/Clinics'))
const Individuals = lazy(() => import('./pages/public/solutions/Individuals'))
const APIDocs = lazy(() => import('./pages/public/developers/APIDocs'))
const Security = lazy(() => import('./pages/public/developers/Security'))
const Terms = lazy(() => import('./pages/public/Terms'))
const DoctorList = lazy(() => import('./pages/public/DoctorList'))
const DoctorDetail = lazy(() => import('./pages/public/DoctorDetail'))

const FallbackLoader = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f8fafc' }}>
    <CircularProgress size={60} sx={{ color: '#10b981' }} />
  </Box>
)

export default function App() {
  return (
    <Suspense fallback={<FallbackLoader />}>
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
        <Route path="/doctors" element={<DoctorList />} />
        <Route path="/doctors/:id" element={<DoctorDetail />} />
      </Route>

      {/* Shared Authenticated routes */}
      <Route element={<ProtectedRoute roles={['PATIENT', 'DOCTOR']} />}>
        <Route element={<MainLayout />}>
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Route>

      {/* Patient routes */}
      <Route element={<ProtectedRoute roles={['PATIENT']} />}>
        <Route element={<MainLayout />}>
          <Route path="/patient/dashboard" element={<PatientDashboard />} />
          <Route path="/patient/book-appointment" element={<BookAppointment />} />
          <Route path="/patient/appointments" element={<MyAppointments />} />
          <Route path="/patient/records" element={<MedicalHistory />} />
          <Route path="/patient/triage-tickets" element={<PatientTriageTickets />} />
        </Route>
      </Route>

      {/* Doctor routes */}
      <Route element={<ProtectedRoute roles={['DOCTOR']} />}>
        <Route element={<MainLayout />}>
          <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
          <Route path="/doctor/appointments" element={<DoctorAppointments />} />
          <Route path="/doctor/triage-tickets" element={<TriageTicketInbox />} />
          <Route path="/doctor/medical-records/create/:appointmentId" element={<CreateMedicalRecord />} />
        </Route>
      </Route>

      <Route path="/404" element={<NotFound />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
    </Suspense>
  )
}
