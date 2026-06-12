import { useTranslation } from 'react-i18next'
import { AGENT_COPY_KEYS } from '../constants/agent-copy'

export type UrgencyLevel = 'emergency' | 'urgent' | 'soon' | 'routine'

interface UrgencyBadgeProps {
  level: UrgencyLevel
  className?: string
}

/**
 * Small badge showing urgency level with semantic color.
 * Solid chip, not glass.
 */
export default function UrgencyBadge({ level, className = '' }: UrgencyBadgeProps) {
  const { t } = useTranslation()

  const getColor = () => {
    switch (level) {
      case 'emergency': return 'var(--urgency-emergency)'
      case 'urgent': return 'var(--urgency-warning)'
      case 'soon': return 'var(--urgency-warning)' // Or another distinct color if specified later
      case 'routine': return 'var(--urgency-routine)'
      default: return 'var(--urgency-routine)'
    }
  }

  const getBgColor = () => {
    switch (level) {
      case 'emergency': return 'var(--urgency-emergency-bg)'
      case 'urgent': return 'var(--urgency-warning-bg)'
      case 'soon': return 'var(--urgency-warning-bg)'
      case 'routine': return 'var(--urgency-routine-bg)'
      default: return 'var(--urgency-routine-bg)'
    }
  }

  return (
    <div 
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider ${className}`}
      style={{ 
        color: getColor(),
        backgroundColor: getBgColor()
      }}
    >
      <div 
        className="w-1.5 h-1.5 rounded-full" 
        style={{ backgroundColor: 'currentColor' }}
      />
      {t(AGENT_COPY_KEYS.urgency[level])}
    </div>
  )
}
