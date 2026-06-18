import { lazy } from 'react'
import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import MainLayout from '../layouts/main-layout'
import PublicLayout from '../layouts/public-layout'
import ProtectedRoute from '../components/auth/protected-route'

const Landing = lazy(() => import('../pages/public/landing'))
const Login = lazy(() => import('../pages/auth/login'))
const Register = lazy(() => import('../pages/auth/register'))
const PatientDashboard = lazy(() => import('../pages/patient/dashboard'))
const BookAppointment = lazy(() => import('../pages/patient/book-appointment'))
const MyAppointments = lazy(() => import('../pages/patient/my-appointments'))
const MedicalHistory = lazy(() => import('../pages/patient/medical-history'))
const MedicalRecordDetail = lazy(() => import('../pages/patient/medical-record-detail'))
const DoctorDashboard = lazy(() => import('../pages/doctor/dashboard'))
const DoctorAppointments = lazy(() => import('../pages/doctor/doctor-appointments'))
const TriageTicketInbox = lazy(() => import('../pages/doctor/triage-ticket-inbox'))

const TriagePage = lazy(() => import('../pages/patient/triage-page'))
const EHRUpload = lazy(() => import('../pages/doctor/ehr-upload'))
const EHRResult = lazy(() => import('../pages/doctor/ehr-result'))
const EHRSearch = lazy(() => import('../pages/doctor/ehr-search'))
const EHRSummary = lazy(() => import('../pages/doctor/ehr-summary'))
const CreateMedicalRecord = lazy(() => import('../pages/doctor/create-medical-record'))
const DoctorPatients = lazy(() => import('../pages/doctor/doctor-patients'))
const ReviewPage = lazy(() => import('../pages/doctor/review-page'))
const Profile = lazy(() => import('../pages/shared/profile'))
const CarePlanPage = lazy(() => import('../pages/patient/care-plan-page'))
const WorkbenchPage = lazy(() => import('../pages/doctor/workbench-page'))
const VisionMission = lazy(() => import('../pages/public/vision-mission'))
const DepartmentDetail = lazy(() => import('../pages/public/department-detail'))
const Emergency = lazy(() => import('../pages/public/emergency'))
const Contact = lazy(() => import('../pages/public/contact'))
const NotFound = lazy(() => import('../pages/not-found'))
const AITriage = lazy(() => import('../pages/public/features/ai-triage'))
const EHREngine = lazy(() => import('../pages/public/features/ehr-engine'))
const SmartBooking = lazy(() => import('../pages/public/features/smart-booking'))
const Hospitals = lazy(() => import('../pages/public/solutions/hospitals'))
const Clinics = lazy(() => import('../pages/public/solutions/clinics'))
const Individuals = lazy(() => import('../pages/public/solutions/individuals'))
const APIDocs = lazy(() => import('../pages/public/developers/api-docs'))
const Security = lazy(() => import('../pages/public/developers/security'))
const Terms = lazy(() => import('../pages/public/terms'))
const DoctorList = lazy(() => import('../pages/public/doctor-list'))
const DoctorDetail = lazy(() => import('../pages/public/doctor-detail'))

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/about" element={<VisionMission />} />
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
        <Route path="/departments/:id" element={<DepartmentDetail />} />
        <Route path="/emergency" element={<Emergency />} />
        <Route path="/contact" element={<Contact />} />
      </Route>

      <Route element={<ProtectedRoute roles={['PATIENT', 'DOCTOR']} />}>
        <Route element={<MainLayout />}>
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={['PATIENT']} />}>
        <Route element={<MainLayout />}>
          <Route path="/patient/dashboard" element={<PatientDashboard />} />
          <Route path="/patient/appointments" element={<Outlet />}>
            <Route index element={<MyAppointments />} />
            <Route path="book-appointment" element={<BookAppointment />} />
          </Route>
          <Route
            path="/patient/book-appointment"
            element={<Navigate to="/patient/appointments/book-appointment" replace />}
          />
          <Route path="/patient/records" element={<MedicalHistory />} />
          <Route path="/patient/records/:id" element={<MedicalRecordDetail />} />
          <Route path="/patient/triage" element={<TriagePage />} />
          <Route path="/patient/care-plan" element={<CarePlanPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={['DOCTOR']} />}>
        <Route element={<MainLayout />}>
          <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
          <Route path="/doctor/patients" element={<DoctorPatients />} />
          <Route path="/doctor/appointments" element={<DoctorAppointments />} />
          <Route path="/doctor/triage-tickets" element={<TriageTicketInbox />} />
          <Route path="/doctor/review" element={<ReviewPage />} />
          <Route path="/doctor/medical-records/create/:appointmentId" element={<CreateMedicalRecord />} />
          <Route path="/doctor/ehr/upload" element={<EHRUpload />} />
          <Route path="/doctor/ehr/result/:noteId" element={<EHRResult />} />
          <Route path="/doctor/ehr/search" element={<EHRSearch />} />
          <Route path="/doctor/ehr/summary/:patientId" element={<EHRSummary />} />
          <Route path="/doctor/workbench" element={<WorkbenchPage />} />
        </Route>
      </Route>

      <Route path="/404" element={<NotFound />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  )
}
