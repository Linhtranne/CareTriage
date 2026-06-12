import { useTranslation } from 'react-i18next'
import { DOCTOR_COPY_KEYS } from '../constants/doctor-copy'
import type { DoctorTriageTicket } from '../types/triage-review'

interface MissingInfoPanelProps {
  ticket: DoctorTriageTicket | null
  className?: string
}

/**
 * Warning panel showing gaps in patient data.
 * Solid warning treatment, never glass.
 */
export default function MissingInfoPanel({ ticket, className = '' }: MissingInfoPanelProps) {
  const { t } = useTranslation()

  if (!ticket || !ticket.missingInformation || ticket.missingInformation.length === 0) {
    return null;
  }

  return (
    <div 
      className={`rounded-xl p-4 flex gap-3 items-start border ${className}`}
      style={{
        background: 'var(--missing-info-bg)',
        borderColor: 'var(--missing-info-border)',
      }}
    >
      <div 
        className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{
          background: 'var(--urgency-warning)',
          color: 'var(--color-surface-50)',
          fontSize: '12px',
          fontWeight: 'bold',
        }}
      >
        !
      </div>
      <div>
        <h3 
          className="font-bold text-sm mb-1"
          style={{ color: 'var(--missing-info-title)' }}
        >
          {t(DOCTOR_COPY_KEYS.missingInfo.title)}
        </h3>
        <ul 
          className="text-sm list-disc list-inside"
          style={{ color: 'var(--missing-info-text)' }}
        >
          {ticket.missingInformation.map((info, idx) => (
            <li key={idx}>{info}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}
