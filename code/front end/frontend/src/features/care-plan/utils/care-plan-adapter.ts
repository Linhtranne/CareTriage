import type { PatientCarePlan } from '../types/care-plan'

function isRecord(val: unknown): val is Record<string, unknown> {
  return typeof val === 'object' && val !== null;
}

function parseJsonField(val: unknown): Record<string, unknown> | null {
  if (isRecord(val)) return val;
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      if (isRecord(parsed)) return parsed;
    } catch {
      // ignore
    }
  }
  return null;
}

function getStringArray(val: unknown): string[] {
  if (Array.isArray(val)) {
    return val.map(String).filter(Boolean);
  }
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
    } catch {
      // fallback
    }
  }
  return [];
}

export function normalizePatientCarePlan(raw: unknown): PatientCarePlan {
  if (!isRecord(raw)) throw new Error('Invalid triage ticket data');

  const ticketId = raw.id ? String(raw.id) : undefined;
  
  // Try to find urgency
  let rawUrgency = String(raw.confirmedUrgency || raw.status || 'UNKNOWN').toUpperCase();
  if (rawUrgency.includes('EMERGENCY') || rawUrgency.includes('CRITICAL')) rawUrgency = 'EMERGENCY';
  else if (rawUrgency.includes('HIGH') || rawUrgency.includes('URGENT')) rawUrgency = 'HIGH';
  else if (rawUrgency.includes('MEDIUM') || rawUrgency.includes('MODERATE')) rawUrgency = 'MEDIUM';
  else if (rawUrgency.includes('LOW') || rawUrgency.includes('ROUTINE')) rawUrgency = 'LOW';
  else rawUrgency = 'UNKNOWN';

  // Find department
  const suggestedDepartment = raw.confirmedDepartment ? String(raw.confirmedDepartment) : 
    (raw.categoryName ? String(raw.categoryName) : undefined);

  // Parse complex fields
  const snapshot = parseJsonField(raw.aiAnalysisSnapshot);
  const metadata = parseJsonField(raw.metadata);

  // Extract values
  let summary = '';
  if (raw.doctorConfirmedSummary) summary = String(raw.doctorConfirmedSummary);
  else if (snapshot && snapshot.symptom_summary) summary = String(snapshot.symptom_summary);
  else if (metadata && metadata.summary) summary = String(metadata.summary);
  else if (raw.description) summary = String(raw.description);

  let missingInformation: string[] = [];
  if (raw.missingInformation) missingInformation = getStringArray(raw.missingInformation);
  else if (snapshot && snapshot.missing_information) missingInformation = getStringArray(snapshot.missing_information);
  else if (metadata && metadata.missingInformation) missingInformation = getStringArray(metadata.missingInformation);

  let possibleConditions: string[] = [];
  if (raw.possibleConditions) possibleConditions = getStringArray(raw.possibleConditions);
  else if (snapshot && snapshot.possible_conditions) possibleConditions = getStringArray(snapshot.possible_conditions);
  else if (metadata && metadata.possibleConditions) possibleConditions = getStringArray(metadata.possibleConditions);

  let suggestedActions: string[] = [];
  if (raw.suggestedActions) suggestedActions = getStringArray(raw.suggestedActions);
  else if (snapshot && snapshot.suggested_actions) suggestedActions = getStringArray(snapshot.suggested_actions);
  else if (metadata && metadata.suggestedActions) suggestedActions = getStringArray(metadata.suggestedActions);

  // Readiness
  const isEmergency = rawUrgency === 'EMERGENCY';
  const intakeComplete = isEmergency || missingInformation.length === 0;
  const appointmentReady = intakeComplete && !isEmergency;

  return {
    ticketId,
    urgencyLevel: rawUrgency as PatientCarePlan['urgencyLevel'],
    suggestedDepartment,
    summary,
    missingInformation,
    suggestedActions,
    possibleConditions,
    intakeComplete,
    appointmentReady,
    createdAt: raw.createdAt ? String(raw.createdAt) : undefined
  };
}
