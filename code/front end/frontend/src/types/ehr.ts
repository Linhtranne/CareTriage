export type EhrNoteType =
  | 'ADMISSION'
  | 'PROGRESS'
  | 'DISCHARGE'
  | 'CONSULTATION'
  | 'PRESCRIPTION'
  | (string & {})

export type EhrExtractionStatus = 'COMPLETED' | 'FAILED' | 'PROCESSING' | (string & {})

export type EhrEntityType =
  | 'MEDICATION'
  | 'SYMPTOM'
  | 'CONDITION'
  | 'DOSAGE'
  | 'LAB_TEST'
  | 'PROCEDURE'
  | (string & {})

export interface EhrEntity {
  confidenceScore?: number | null
  endPosition?: number | null
  entityType: EhrEntityType
  entityValue: string
  normalizedValue?: string | null
  startPosition?: number | null
}

export interface EhrExtractionResult {
  clinicalNoteId?: number | null
  conditions?: EhrEntity[]
  createdAt?: string | null
  dosages?: EhrEntity[]
  entities?: EhrEntity[]
  extractionStatus?: EhrExtractionStatus | null
  labTests?: EhrEntity[]
  medications?: EhrEntity[]
  noteType?: EhrNoteType | null
  patientId?: number | null
  procedures?: EhrEntity[]
  rawText?: string | null
  symptoms?: EhrEntity[]
}

export interface EhrSearchResultItem {
  email?: string | null
  matchedConditions?: string[]
  matchedMedications?: string[]
  matchedSymptoms?: string[]
  patientId: number
  patientName: string
  totalNotes: number
}

export interface EhrSummaryNote {
  createdAt: string
  entityCount?: number
  extractionStatus?: EhrExtractionStatus | null
  id: number
  noteType?: EhrNoteType | null
  rawText?: string | null
}

export interface EhrPatientSummary {
  patientId: number
  patientName: string
}

export interface EhrSummaryCacheItem {
  entities: EhrEntity[]
  error: string
  loading: boolean
}
