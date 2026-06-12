export const CARE_PLAN_STATUS = {
  READY: 'READY',
  PENDING: 'PENDING',
} as const;

export const CARE_PLAN_ACTIONS = {
  BOOK_APPOINTMENT: 'BOOK_APPOINTMENT',
  COMPLETE_FORM: 'COMPLETE_FORM',
  REVIEW_DOCUMENTS: 'REVIEW_DOCUMENTS'
} as const;

export const MOCK_TIMELINE = {
  triage: {
    title: 'Triage Completed',
    time: 'Today, 09:41 AM'
  },
  aiPlan: {
    title: 'AI Plan Generation',
    status: 'Pending Review'
  },
  appointment: {
    title: 'Specialist Appointment',
    status: 'Scheduled'
  }
} as const;

