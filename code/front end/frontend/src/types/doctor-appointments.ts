export type AppointmentStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW'
  | (string & {})

export interface DoctorAppointment {
  appointmentDate: string
  appointmentTime?: string | null
  id: number
  notes?: string | null
  patientAvatar?: string | null
  patientName: string
  patientPhone?: string | null
  reason?: string | null
  status: AppointmentStatus
  triageTicketId?: string | null
  triagePriority?: string | null
}

export interface DoctorAppointmentsResponse {
  data?: {
    data?: DoctorAppointment[]
  } | DoctorAppointment[]
}

export interface AppointmentStatusPayload {
  notes: string
  status: AppointmentStatus
}

export interface SnackbarState {
  message: string
  open: boolean
  severity: 'error' | 'success'
}
