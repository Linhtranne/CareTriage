import { useTranslation } from 'react-i18next'
import { DOCTOR_COPY_KEYS } from '../constants/doctor-copy'
import type { DoctorTriageTicket } from '../types/triage-review'

interface ClinicalTimelineProps {
  ticket: DoctorTriageTicket | null
  className?: string
}

/**
 * Expandable conversation transcript.
 * Solid surface, no glass. Preserves compact bubble styling.
 */
export default function ClinicalTimeline({ ticket, className = '' }: ClinicalTimelineProps) {
  const { t } = useTranslation()

  if (!ticket || !ticket.conversationHistory || ticket.conversationHistory.length === 0) {
    return null;
  }

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--color-surface-800)' }}>
          {t(DOCTOR_COPY_KEYS.timeline.title)}
        </h3>
        <button 
          className="text-xs font-medium transition-colors hover:underline"
          style={{ color: 'var(--color-primary-500)' }}
        >
          {t(DOCTOR_COPY_KEYS.timeline.viewFull)}
        </button>
      </div>

      <div 
        className="rounded-xl p-4 flex flex-col gap-4 max-h-[300px] overflow-y-auto"
        style={{ background: 'var(--color-surface-50)', border: '1px solid var(--color-surface-200)' }}
      >
        {ticket.conversationHistory.map((msg) => {
          const isPatient = msg.sender === 'PATIENT';
          const label = isPatient ? t(DOCTOR_COPY_KEYS.timeline.patientLabel) : (msg.sender === 'AI' ? t(DOCTOR_COPY_KEYS.timeline.aiLabel) : t('triage_tickets.sender_staff'));
          
          return (
            <div 
              key={msg.id} 
              className={`flex gap-3 max-w-[85%] ${isPatient ? 'self-end flex-row-reverse' : ''}`}
            >
              <div 
                className="font-bold text-xs mt-1" 
                style={{ color: isPatient ? 'var(--color-surface-600)' : 'var(--color-primary-600)' }}
              >
                {label}
              </div>
              <div 
                className={`px-3 py-2 rounded-lg text-sm ${isPatient ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}
                style={{ background: isPatient ? 'var(--color-surface-100)' : 'var(--timeline-ai-bg)' }}
              >
                {msg.content}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
