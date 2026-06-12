export interface ChatMessageDTO {
  id: number;
  sessionId: number;
  content: string;
  senderType: 'USER' | 'AI' | 'SYSTEM';
  metadata?: string;
  createdAt: string;
  status: 'SENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
  turnId?: string;
}

export interface ChatSessionDTO {
  id: number;
  userId: number;
  sessionType: 'TRIAGE' | 'CONSULTATION';
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  title: string;
  lastMessageContent?: string;
  lastMessageTime?: string;
  aiSummary?: string;
  suggestedDepartment?: string;
  urgencyLevel?: string;
  createdAt: string;
}

export interface TriageTicketPreview {
  ticketNumber: string;
  status: string;
  priority: string;
  severity: string;
  title: string;
  description: string;
}

export interface CompletionResult {
  recommendation_ready: boolean;
  intake_complete: boolean;
  missing_information: string[];
  reply: string;
  triage_result?: {
    suggested_department_name?: string;
    suggested_department_code?: string;
    summary?: string;
    urgency_level?: string;
  };
  ticket?: TriageTicketPreview;
}

export interface ChatAttachmentDTO {
  id: number;
  sessionId: number;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
  extractionStatus: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
}
