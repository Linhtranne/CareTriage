import { useTranslation } from 'react-i18next'
import { DOCTOR_COPY_KEYS } from '../constants/doctor-copy'
import UrgencyBadge, { type UrgencyLevel } from '../../agent-session/components/urgency-badge'
import type { DoctorTriageTicket } from '../types/triage-review'
import { formatDistanceToNow } from 'date-fns'

interface PatientSessionQueueProps {
  tickets: DoctorTriageTicket[]
  selectedTicketId: string | null
  onSelect: (id: string) => void
  isLoading?: boolean
  error?: string | null
  onRefresh?: () => void
  className?: string
}

/**
 * Sortable/filterable patient session queue.
 * Solid list, no glass.
 */
export default function PatientSessionQueue({ 
  tickets,
  selectedTicketId,
  onSelect,
  isLoading,
  error,
  onRefresh,
  className = '' 
}: PatientSessionQueueProps) {
  const { t } = useTranslation()

  const mapUrgency = (urgencyValue?: string): UrgencyLevel => {
    const val = (urgencyValue || '').toLowerCase();
    if (val.includes('emergency') || val.includes('critical')) return 'emergency';
    if (val.includes('urgent')) return 'urgent';
    return 'routine';
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      
      {/* Header & Filters */}
      <div className="p-4 border-b flex flex-col gap-3" style={{ borderColor: 'var(--color-surface-200)' }}>
        <div className="flex items-center justify-between">
          <h2 className="font-bold" style={{ color: 'var(--color-surface-800)' }}>
            {t(DOCTOR_COPY_KEYS.queue.title)}
          </h2>
          {onRefresh && (
            <button 
              onClick={onRefresh}
              disabled={isLoading}
              className="text-xs font-medium px-2 py-1 rounded transition-colors disabled:opacity-50"
              style={{ color: 'var(--color-primary-600)', background: 'var(--color-primary-50)' }}
            >
              {t('doctorReview.refresh')}
            </button>
          )}
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {Object.entries(DOCTOR_COPY_KEYS.queue.filters).map(([key, labelKey]) => (
            <button
              key={key}
              className="whitespace-nowrap px-3 py-1 rounded-full text-xs font-medium transition-colors"
              style={{
                background: key === 'all' ? 'var(--color-surface-800)' : 'var(--color-clear)',
                color: key === 'all' ? 'var(--color-surface-50)' : 'var(--color-surface-700)',
                border: key !== 'all' ? '1px solid var(--color-surface-200)' : '1px solid var(--color-clear)'
              }}
            >
              {t(labelKey)}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && tickets.length === 0 && (
          <div className="p-8 text-center text-sm" style={{ color: 'var(--color-surface-500)' }}>
            <div className="animate-pulse flex flex-col gap-4">
              {(() => {
                const SKELETON_COUNT = 3;
                return [...Array(SKELETON_COUNT)].map((_, i) => (
                  <div key={i} className="h-16 rounded bg-[var(--color-surface-200)]" />
                ));
              })()}
            </div>
            <p className="mt-4">{t('doctorReview.loadingQueue')}</p>
          </div>
        )}

        {error && tickets.length === 0 && (
          <div className="p-8 text-center text-sm flex flex-col gap-2" style={{ color: 'var(--urgency-emergency)' }}>
            <p>{error}</p>
            {onRefresh && (
              <button onClick={onRefresh} className="underline text-xs">{t('doctorReview.retry')}</button>
            )}
          </div>
        )}

        {!isLoading && !error && tickets.length === 0 && (
          <div className="p-8 text-center text-sm italic" style={{ color: 'var(--color-surface-500)' }}>
            {t('doctorReview.emptyQueue')}
          </div>
        )}

        {tickets.map((item) => {
          const isActive = item.id === selectedTicketId;
          const urgency = mapUrgency(item.status); // or from some other field depending on real data mapping
          let timeAgo: string;
          try {
            timeAgo = formatDistanceToNow(new Date(item.createdAt), { addSuffix: true });
          } catch {
            timeAgo = t('common.not_provided');
          }

          return (
            <div 
              key={item.id}
              onClick={() => onSelect(item.id)}
              className="p-4 border-b cursor-pointer transition-colors"
              style={{ 
                borderColor: 'var(--color-surface-200)',
                background: isActive ? 'var(--queue-active-bg)' : 'var(--color-clear)',
                boxShadow: isActive ? 'inset 0 0 0 1px var(--color-primary-500)' : 'none'
              }}
            >
              <div className="flex items-start justify-between mb-2">
                <span className="font-bold text-sm truncate" style={{ color: 'var(--color-surface-800)' }}>
                  {item.patientName || t('doctorReview.unknownPatient')}
                </span>
                <UrgencyBadge level={urgency} />
              </div>
              <p className="text-xs truncate mb-1" style={{ color: 'var(--color-surface-700)' }}>
                {item.symptomSummary || t('doctorReview.missingSummary')}
              </p>
              <div className="text-[10px] uppercase font-bold" style={{ color: 'var(--color-surface-600)' }}>
                {timeAgo}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
