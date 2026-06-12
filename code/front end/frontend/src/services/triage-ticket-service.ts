import axiosClient from './http-client'
import type { DoctorTriageTicket, TicketMessage, TicketSenderRole } from '../features/doctor-review/types/triage-review'
import { normalizePatientCarePlan } from '../features/care-plan/utils/care-plan-adapter'
import type { PatientCarePlan } from '../features/care-plan/types/care-plan'

function isRecord(val: unknown): val is Record<string, unknown> {
  return typeof val === 'object' && val !== null;
}

function extractPagedContent(payload: unknown): unknown[] {
  if (!isRecord(payload)) return [];

  const nestedData = payload.data;
  if (isRecord(nestedData) && Array.isArray(nestedData.content)) {
    return nestedData.content;
  }

  if (Array.isArray(payload.content)) {
    return payload.content;
  }

  if (Array.isArray(nestedData)) {
    return nestedData;
  }

  return [];
}

function parseJsonField(val: unknown): Record<string, unknown> | null {
  if (isRecord(val)) return val;
  if (typeof val !== 'string' || val.trim().length === 0) return null;

  try {
    const parsed = JSON.parse(val);
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function getNestedValue(records: Array<Record<string, unknown> | null>, keys: string[]): unknown {
  for (const record of records) {
    if (!record) continue;
    for (const key of keys) {
      if (record[key] !== undefined && record[key] !== null) return record[key];
    }
  }
  return undefined;
}

function getStringArray(val: unknown): string[] {
  if (Array.isArray(val)) return val.map(String).filter(Boolean);
  if (typeof val !== 'string' || val.trim().length === 0) return [];

  try {
    const parsed = JSON.parse(val);
    if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
  } catch {
    return [val].filter(Boolean);
  }

  return [];
}

function normalizeSenderRole(sender: unknown): TicketSenderRole {
  const senderRaw = String(sender || 'PATIENT').toUpperCase();
  if (senderRaw === 'AI' || senderRaw === 'SYSTEM' || senderRaw === 'BOT') return 'AI';
  if (senderRaw === 'STAFF' || senderRaw === 'DOCTOR' || senderRaw === 'NURSE' || senderRaw === 'CLINICIAN') return 'STAFF';
  return 'PATIENT';
}

function normalizeTicketMessage(raw: unknown, index: number): TicketMessage | null {
  if (!isRecord(raw)) return null;

  const content = String(raw.content || raw.message || '').trim();
  if (!content) return null;

  return {
    id: String(raw.id || raw._id || `${index}`),
    sender: normalizeSenderRole(raw.sender || raw.senderType || raw.sender_type),
    content,
    createdAt: raw.createdAt || raw.created_at ? String(raw.createdAt || raw.created_at) : undefined
  };
}

export function normalizeDoctorTriageTicket(raw: unknown): DoctorTriageTicket {
  if (!isRecord(raw)) throw new Error('Invalid ticket data');

  const snapshot = parseJsonField(raw.aiAnalysisSnapshot);
  const metadata = parseJsonField(raw.metadata);
  const doctorEdits = parseJsonField(raw.doctorEditsSnapshot);
  const sourceRecords = [raw, doctorEdits, snapshot, metadata];
  
  const id = String(raw.id || raw._id || '');
  const ticketNumber = String(raw.ticketNumber || raw.ticket_number || '');
  const patientName = String(raw.requesterName || raw.patientName || raw.patient_name || '');
  const symptomSummaryValue = getNestedValue(sourceRecords, [
    'symptomSummary',
    'symptom_summary',
    'chiefComplaint',
    'chief_complaint',
    'summary',
    'description'
  ]);
  const symptomSummary = symptomSummaryValue ? String(symptomSummaryValue) : '';
  const status = String(raw.status || 'UNKNOWN');
  const createdAt = String(raw.createdAt || raw.created_at || new Date().toISOString());
  
  const suggestedDepartmentRaw = getNestedValue(sourceRecords, [
    'confirmedDepartment',
    'suggestedDepartment',
    'suggested_department',
    'departmentName',
    'department_name',
    'categoryName'
  ]);
  const suggestedDepartment = suggestedDepartmentRaw ? String(suggestedDepartmentRaw) : undefined;
  
  const missingInfoRaw = getNestedValue(sourceRecords, ['missingInformation', 'missing_information', 'missingInfo']);
  const missingInformation = getStringArray(missingInfoRaw);
  
  const conditionsRaw = getNestedValue(sourceRecords, ['possibleConditions', 'possible_conditions', 'differentialDiagnosis']);
  const possibleConditions = getStringArray(conditionsRaw);
  
  const aiSummaryRaw = getNestedValue(sourceRecords, [
    'doctorConfirmedSummary',
    'aiSummary',
    'ai_summary',
    'safe_summary',
    'safeSummary',
    'summary'
  ]);
  const aiSummary = aiSummaryRaw ? String(aiSummaryRaw) : undefined;
  
  const safeExplanationRaw = getNestedValue(sourceRecords, ['safeExplanation', 'safe_explanation', 'explanation']);
  const safeExplanation = safeExplanationRaw ? String(safeExplanationRaw) : undefined;
  
  const reasoningRaw = getNestedValue(sourceRecords, [
    'clinicalReasoningSummary',
    'clinical_reasoning_summary',
    'reasoning',
    'clinicalReasoning'
  ]);
  const clinicalReasoningSummary = reasoningRaw ? String(reasoningRaw) : undefined;

  const historyRaw = getNestedValue(sourceRecords, ['conversationHistory', 'conversation_history', 'messages']);
  const conversationHistory = Array.isArray(historyRaw)
    ? historyRaw.map(normalizeTicketMessage).filter((message): message is TicketMessage => message !== null)
    : [];

  return {
    id,
    ticketNumber,
    patientName,
    symptomSummary,
    status,
    createdAt,
    suggestedDepartment,
    missingInformation,
    possibleConditions,
    aiSummary,
    safeExplanation,
    clinicalReasoningSummary,
    conversationHistory
  };
}

export function normalizeDoctorTriageTickets(rawArray: unknown): DoctorTriageTicket[] {
  if (!Array.isArray(rawArray)) return [];
  return rawArray.map(item => {
    try {
      return normalizeDoctorTriageTicket(item);
    } catch {
      return null;
    }
  }).filter((ticket): ticket is DoctorTriageTicket => ticket !== null);
}

const triageTicketApi = {
  listPending: async (params?: Record<string, unknown>): Promise<DoctorTriageTicket[]> => {
    const res = await axiosClient.get('/api/v1/triage/tickets', { params });
    return normalizeDoctorTriageTickets(extractPagedContent(res.data));
  },
  getDetail: async (ticketId: string): Promise<DoctorTriageTicket> => {
    const res = await axiosClient.get(`/api/v1/triage/tickets/${ticketId}`);
    const data = isRecord(res.data) && isRecord(res.data.data) ? res.data.data : res.data;
    return normalizeDoctorTriageTicket(data);
  },
  getChatHistory: async (ticketId: string): Promise<TicketMessage[]> => {
    const res = await axiosClient.get(`/api/v1/triage/tickets/${ticketId}/chat-history`);
    const data = isRecord(res.data) && Array.isArray(res.data.data) ? res.data.data : res.data;
    return Array.isArray(data)
      ? data.map(normalizeTicketMessage).filter((message): message is TicketMessage => message !== null)
      : [];
  },
  listMyTickets: async (params?: Record<string, unknown>): Promise<DoctorTriageTicket[]> => {
    const res = await axiosClient.get('/api/v1/triage/tickets/me', { params });
    return normalizeDoctorTriageTickets(extractPagedContent(res.data));
  },
  getMyTicketDetail: async (ticketId: string): Promise<unknown> => {
    const res = await axiosClient.get(`/api/v1/triage/tickets/me/${ticketId}`);
    return res.data;
  },
  getMyTicketChatHistory: async (ticketId: string): Promise<TicketMessage[]> => {
    const res = await axiosClient.get(`/api/v1/triage/tickets/me/${ticketId}/chat-history`);
    const data = isRecord(res.data) && Array.isArray(res.data.data) ? res.data.data : res.data;
    return Array.isArray(data)
      ? data.map(normalizeTicketMessage).filter((message): message is TicketMessage => message !== null)
      : [];
  },
  getLatestPatientCarePlan: async (): Promise<PatientCarePlan | null> => {
    try {
      const res = await axiosClient.get('/api/v1/triage/tickets/me', {
        params: { page: 0, size: 1 }
      });
      const content = extractPagedContent(res.data);
      if (content.length > 0) {
        return normalizePatientCarePlan(content[0]);
      }
      return null;
    } catch (error: unknown) {
      const HTTP_NOT_FOUND = 404;
      if (typeof error === 'object' && error !== null && 'response' in error) {
        const response = (error as { response?: { status?: number } }).response;
        if (response?.status === HTTP_NOT_FOUND) return null;
      }
      throw error;
    }
  },
  assign: async (payload: Record<string, unknown>): Promise<unknown> => {
    const res = await axiosClient.post('/api/v1/triage/tickets/assign', payload);
    return res.data;
  },
  review: async (payload: Record<string, unknown>): Promise<unknown> => {
    const res = await axiosClient.post('/api/v1/triage/tickets/review', payload);
    return res.data;
  },
  doctorReview: async (ticketId: string, payload: Record<string, unknown>): Promise<unknown> => {
    const res = await axiosClient.post(`/api/v1/triage/tickets/${ticketId}/doctor-review`, payload);
    return res.data;
  },
}

export default triageTicketApi
