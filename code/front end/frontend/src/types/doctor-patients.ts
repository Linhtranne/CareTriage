export type DoctorPatientRelationshipSource =
  | 'ALL'
  | 'APPOINTMENT'
  | 'MEDICAL_RECORD'
  | 'TRIAGE_TICKET'

export type DoctorPatientTicketStatus =
  | 'ALL'
  | 'NEW'
  | 'IN_TRIAGE'
  | 'TRIAGED'
  | 'CLOSED'
  | 'REJECTED'

export type DoctorPatientKpiFilter = 'ALL' | 'UPCOMING' | 'RECORDS' | 'TRIAGE'

export interface DoctorPatientListItem {
  age?: number | null
  avatarUrl?: string | null
  email?: string | null
  fullName: string
  gender?: 'FEMALE' | 'MALE' | 'OTHER' | string | null
  lastInteractionAt?: string | null
  latestTicketStatus?: string | null
  nextAppointmentDate?: string | null
  patientId: number
  relationshipSources?: string[]
}

export interface DoctorPatientAppointmentSummary {
  appointmentDate: string
  appointmentTime?: string | null
  departmentName?: string | null
  id: number
  notes?: string | null
  reason?: string | null
  status: string
}

export interface DoctorPatientMedicalRecordSummary {
  createdAt: string
  diagnosis?: string | null
  id: number
  notes?: string | null
  symptoms?: string | null
}

export interface DoctorPatientTriageTicketSummary {
  createdAt: string
  id: number
  note?: string | null
  status: string
  submittedSymptoms?: string | null
}

export interface DoctorPatientDetail {
  activeTriageTickets: number
  address?: string | null
  allergies?: string | null
  avatarUrl?: string | null
  bloodType?: string | null
  chronicConditions?: string | null
  completedAppointments: number
  dateOfBirth?: string | null
  email?: string | null
  emergencyContactName?: string | null
  emergencyContactPhone?: string | null
  fullName: string
  gender?: 'FEMALE' | 'MALE' | 'OTHER' | string | null
  insuranceNumber?: string | null
  patientId: number
  phone?: string | null
  recentAppointments?: DoctorPatientAppointmentSummary[]
  recentMedicalRecords?: DoctorPatientMedicalRecordSummary[]
  recentTriageTickets?: DoctorPatientTriageTicketSummary[]
  totalAppointments: number
  totalMedicalRecords: number
  totalTriageTickets: number
}

export interface DoctorPatientsPageResponse {
  data?: {
    data?: {
      content?: DoctorPatientListItem[]
      totalElements?: number
    }
  }
}

export interface DoctorPatientDetailResponse {
  data?: {
    data?: DoctorPatientDetail
  }
}
