export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  id?: number;
  turnId?: string;
}

export type TriageOrbState = 'collecting' | 'analyzing' | 'ready' | 'emergency';
export type TriageUrgencyLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY';

export interface TriageProgressState {
  intakeComplete: boolean;
  redFlagDetected: boolean;
  urgencyLevel: TriageUrgencyLevel;
  missingInformation: string[];
  suggestedDepartment?: string;
  departmentCode?: string;
}
