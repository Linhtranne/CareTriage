import GlassSurface from '../../../components/base/glass-surface'
import ConfidenceIndicator from '../../agent-session/components/confidence-indicator'
import UrgencyBadge, { type UrgencyLevel } from '../../agent-session/components/urgency-badge'
import { useTranslation } from 'react-i18next'
import { DOCTOR_COPY_KEYS } from '../constants/doctor-copy'
import { AGENT_COPY_KEYS } from '../../agent-session/constants/agent-copy'
import type { DoctorTriageTicket } from '../types/triage-review'

interface AiSummaryPanelProps {
  ticket: DoctorTriageTicket | null
  isLoading?: boolean
  className?: string
}

/**
 * Signature glass panel for AI interpretation.
 * Uses glass surface to communicate provisionality.
 */
export default function AiSummaryPanel({ ticket, isLoading, className = '' }: AiSummaryPanelProps) {
  const { t } = useTranslation()

  if (isLoading) {
    return (
      <GlassSurface variant="agent" className={`p-5 flex flex-col gap-3 ${className}`}>
        <div className="h-5 w-1/3 rounded bg-[var(--color-surface-200)] animate-pulse" />
        <div className="h-16 rounded bg-[var(--color-surface-100)] animate-pulse" />
        <div className="h-10 rounded bg-[var(--color-surface-100)] animate-pulse" />
      </GlassSurface>
    );
  }

  if (!ticket) {
    return (
      <GlassSurface variant="agent" className={`p-5 flex items-center justify-center ${className}`}>
        <p className="text-sm italic" style={{ color: 'var(--color-surface-500)' }}>
          {t('doctorReview.noSelectedCase')}
        </p>
      </GlassSurface>
    );
  }

  const mapUrgency = (statusValue: string): UrgencyLevel => {
    const val = statusValue.toLowerCase();
    if (val.includes('emergency') || val.includes('critical')) return 'emergency';
    if (val.includes('urgent')) return 'urgent';
    return 'routine';
  }

  const urgency = mapUrgency(ticket.status);

  return (
    <GlassSurface variant="agent" className={`p-5 flex flex-col gap-4 ${className}`}>
      
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--color-surface-200)' }}>
        <h2 className="text-lg font-bold" style={{ color: 'var(--color-surface-800)' }}>
          {t(DOCTOR_COPY_KEYS.summary.title)}
        </h2>
        <div className="flex items-center gap-3">
          <ConfidenceIndicator level="high" />
          <UrgencyBadge level={urgency} />
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
        
        {/* Chief Complaint / AI Summary */}
        <div className="flex flex-col gap-1 md:col-span-2">
          <span className="font-semibold" style={{ color: 'var(--color-surface-700)' }}>
            {t(DOCTOR_COPY_KEYS.summary.chiefComplaint)}
          </span>
          <p style={{ color: 'var(--color-surface-800)' }}>
            {ticket.aiSummary || ticket.symptomSummary || t('doctorReview.missingSummary')}
          </p>
        </div>

        {/* Clinical Reasoning (Doctor Facing ONLY) */}
        {ticket.clinicalReasoningSummary && (
          <div className="flex flex-col gap-1 md:col-span-2">
            <span className="font-semibold" style={{ color: 'var(--color-surface-700)' }}>
              {t('doctorReview.reasoning')}
            </span>
            <p className="italic" style={{ color: 'var(--color-surface-800)' }}>
              {ticket.clinicalReasoningSummary}
            </p>
          </div>
        )}

        {/* Conditions */}
        {ticket.possibleConditions && ticket.possibleConditions.length > 0 && (
          <div className="flex flex-col gap-1">
            <span className="font-semibold" style={{ color: 'var(--color-surface-700)' }}>
              {t('doctorReview.conditions')}
            </span>
            <ul className="list-disc list-inside" style={{ color: 'var(--color-surface-800)' }}>
              {ticket.possibleConditions.map((cond, idx) => (
                <li key={idx}>{cond}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Department */}
        <div className="flex flex-col gap-1">
          <span className="font-semibold" style={{ color: 'var(--color-surface-700)' }}>
            {t(DOCTOR_COPY_KEYS.summary.aiDepartment)}
          </span>
          <p className="font-medium" style={{ color: 'var(--color-primary-600)' }}>
            {ticket.suggestedDepartment || t('doctorReview.unknownDepartment')}
          </p>
        </div>

      </div>

      <div className="text-[10px] text-right uppercase tracking-wider opacity-50 font-bold mt-2" style={{ color: 'var(--color-surface-700)' }}>
        {t(AGENT_COPY_KEYS.generatedByAi)}
      </div>

    </GlassSurface>
  )
}
