export interface PatientCarePlan {
  ticketId?: string
  urgencyLevel: 'EMERGENCY' | 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN'
  suggestedDepartment?: string
  departmentCode?: string
  summary: string
  missingInformation: string[]
  suggestedActions: string[]
  possibleConditions: string[]
  intakeComplete: boolean
  appointmentReady: boolean
  createdAt?: string
}
