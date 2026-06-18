export type MedicineUnit = 'Viên' | 'Gói' | 'Chai' | 'Ống' | 'Tuýp'

export interface MedicalRecordMedicineForm {
  dosage: string
  name: string
  quantity: number
  unit: MedicineUnit
}

export interface CreateMedicalRecordFormValues {
  diagnosis: string
  followUpDate?: string | null
  medicines: MedicalRecordMedicineForm[]
  notes: string
  symptoms: string
  treatmentPlan: string
}

export interface CreateMedicalRecordPayload {
  appointmentId: number
  diagnosis: string
  followUpDate?: string | null
  notes: string
  prescription: string
  symptoms: string
  treatmentPlan: string
}
