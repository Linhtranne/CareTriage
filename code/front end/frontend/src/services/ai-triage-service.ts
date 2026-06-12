import axiosClient from './http-client';
import type { ChatMessage, TriageUrgencyLevel } from '../features/triage/types/triage-session';

export interface TriageAnalyzeRequest {
  session_id: string;
  patient_metadata?: {
    age?: number;
    gender?: string;
    medical_history?: string[];
  };
  current_message: string;
  conversation_history: ChatMessage[];
  require_rag?: boolean;
}

export interface TriageAnalyzeResponse {
  status: 'success' | 'error';
  data?: {
    reply_text: string;
    triage_state: {
      intake_complete: boolean;
      red_flag_detected: boolean;
      urgency_level: TriageUrgencyLevel;
      missing_information: string[];
      suggested_department?: string;
      department_code?: string;
    };
    telemetry?: {
      trace_id?: string;
      tokens_used?: number;
    };
  };
  message?: string;
}

export const analyzeTriageMessage = async (payload: TriageAnalyzeRequest): Promise<TriageAnalyzeResponse> => {
  const response = await axiosClient.post<TriageAnalyzeResponse>('/api/triage/analyze', payload);
  return response.data;
};
