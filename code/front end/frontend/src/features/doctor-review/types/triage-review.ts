export type TicketSenderRole = 'PATIENT' | 'AI' | 'STAFF';

export interface TicketMessage {
  id: string;
  sender: TicketSenderRole;
  content: string;
  createdAt?: string;
}

export interface DoctorTriageTicket {
  id: string;
  ticketNumber: string;
  patientName: string;
  symptomSummary: string;
  status: string;
  createdAt: string;
  suggestedDepartment?: string;
  missingInformation: string[];
  possibleConditions: string[];
  aiSummary?: string;
  safeExplanation?: string;
  clinicalReasoningSummary?: string;
  conversationHistory: TicketMessage[];
}
