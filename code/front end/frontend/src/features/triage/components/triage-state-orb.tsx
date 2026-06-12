import { useTranslation } from 'react-i18next'
import { TRIAGE_COPY_KEYS, TRIAGE_FALLBACK_COPY, TRIAGE_FALLBACK_COPY_VI } from '../constants/triage-copy'
import { LAYOUT } from '../../../constants/layout-constants'
import { DESIGN_TOKENS } from '../../../constants/design-tokens'

type OrbState = 'collecting' | 'analyzing' | 'ready' | 'emergency'

interface TriageStateOrbProps {
  state?: OrbState
  className?: string
}

/**
 * Circular AI processing state indicator.
 * Uses semantic tokens for state colors. Not decorative.
 */
export default function TriageStateOrb({ state = 'collecting', className = '' }: TriageStateOrbProps) {
  const { t, i18n } = useTranslation()
  const copy = i18n.language?.startsWith('vi') ? TRIAGE_FALLBACK_COPY_VI : TRIAGE_FALLBACK_COPY

  const getOrbColor = () => {
    switch (state) {
      case 'collecting': return DESIGN_TOKENS.colors.primary[200]
      case 'analyzing': return DESIGN_TOKENS.colors.primary[400]
      case 'ready': return DESIGN_TOKENS.colors.semantic.success
      case 'emergency': return DESIGN_TOKENS.urgency.emergency
      default: return DESIGN_TOKENS.colors.primary[200]
    }
  }

  return (
    <div
      className={`flex flex-col items-center gap-3 rounded-2xl border p-4 ${className}`}
      style={{
        background: 'var(--agent-surface)',
        borderColor: 'var(--glass-border)',
        boxShadow: 'var(--glass-shadow)',
      }}
    >
      {/* Orb Container (Glass background behind orb as per brief) */}
      <div 
        className="relative rounded-full flex items-center justify-center"
        style={{
          width: LAYOUT.triage.orbSizeDesktop,
          height: LAYOUT.triage.orbSizeDesktop,
          background: 'var(--glass-surface)',
          backdropFilter: 'blur(12px)',
          border: '1px solid var(--orb-border)'
        }}
      >
        {/* The solid orb */}
        <div 
          className="rounded-full transition-colors duration-500"
          style={{
            width: '60%',
            height: '60%',
            backgroundColor: getOrbColor(),
            boxShadow: `var(--orb-${state}-glow)`
          }}
        />
      </div>
      <span 
        className="text-xs font-extrabold uppercase tracking-wider text-center"
        style={{ color: 'var(--color-surface-700)' }}
      >
        {t(TRIAGE_COPY_KEYS.orbState[state], copy.orbState[state])}
      </span>
    </div>
  )
}
