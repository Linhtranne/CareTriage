import { useTranslation } from 'react-i18next'
import { DOCTOR_COPY_KEYS } from '../../doctor-review/constants/doctor-copy'

type EntityCategory = 'symptom' | 'duration' | 'medication' | 'allergy' | 'vital' | 'condition'

interface EhrEntity {
  id: string
  category: EntityCategory
  valueKey: string
  isFlagged?: boolean
}

interface EhrEntityStripProps {
  entities?: EhrEntity[]
  className?: string
}

const MOCK_ENTITIES: EhrEntity[] = [
  { id: '1', category: 'symptom', valueKey: 'doctorReview.ehr.samples.chestPain', isFlagged: true },
  { id: '2', category: 'duration', valueKey: 'doctorReview.ehr.samples.duration' },
  { id: '3', category: 'symptom', valueKey: 'doctorReview.ehr.samples.breathing' },
  { id: '4', category: 'vital', valueKey: 'doctorReview.ehr.samples.bloodPressure' },
]

/**
 * Horizontal strip of extracted clinical entities.
 * Solid chips on solid surface, no glass.
 */
export default function EhrEntityStrip({ entities = MOCK_ENTITIES, className = '' }: EhrEntityStripProps) {
  const { t } = useTranslation()

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <h3 className="text-sm font-semibold" style={{ color: 'var(--color-surface-800)' }}>
        {t(DOCTOR_COPY_KEYS.ehr.title)}
      </h3>
      <div className="flex flex-wrap gap-2">
        {entities.map(entity => (
          <div 
            key={entity.id}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border"
            style={{
              background: entity.isFlagged 
                ? 'var(--ehr-flagged-bg)' 
                : 'var(--ehr-normal-bg)',
              borderColor: entity.isFlagged 
                ? 'var(--ehr-flagged-border)'
                : 'var(--ehr-normal-border)',
              color: entity.isFlagged
                ? 'var(--urgency-emergency)'
                : 'var(--color-primary-700)'
            }}
          >
            <span className="opacity-70">{t(DOCTOR_COPY_KEYS.ehr.categories[entity.category])}:</span>
            <span>{t(entity.valueKey)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
