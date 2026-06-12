import { useTranslation } from 'react-i18next'
import { AGENT_COPY_KEYS } from '../constants/agent-copy'

export type ConfidenceLevel = 'high' | 'medium' | 'low'

interface ConfidenceIndicatorProps {
  level: ConfidenceLevel
  className?: string
}

/**
 * Qualitative AI confidence display.
 * Text + icon, no percentage.
 */
export default function ConfidenceIndicator({ level, className = '' }: ConfidenceIndicatorProps) {
  const { t } = useTranslation()

  const getColor = () => {
    switch (level) {
      case 'high': return 'var(--color-success)'
      case 'medium': return 'var(--color-warning)'
      case 'low': return 'var(--color-info)'
      default: return 'var(--color-info)'
    }
  }

  return (
    <div 
      className={`inline-flex items-center gap-1.5 text-xs font-medium ${className}`}
      style={{ color: getColor() }}
    >
      <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: 'currentColor', opacity: 0.8 }} />
      {t(AGENT_COPY_KEYS.confidence[level])}
    </div>
  )
}
