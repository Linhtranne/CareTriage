import { useTranslation } from 'react-i18next'
import { AGENT_COPY_KEYS, AGENT_FALLBACK_COPY, AGENT_FALLBACK_COPY_VI } from '../../features/agent-session/constants/agent-copy'

/**
 * Persistent safety/disclaimer footer for triage pages.
 * Solid surface, never glass.
 */
export default function TrustFooter() {
  const { t, i18n } = useTranslation()
  const copy = i18n.language?.startsWith('vi') ? AGENT_FALLBACK_COPY_VI : AGENT_FALLBACK_COPY

  return (
    <footer
      className="flex items-center justify-center gap-4 px-4 py-3 text-center"
      style={{
        background: 'var(--color-surface-100)',
        borderTop: '1px solid var(--color-surface-200)',
        color: 'var(--color-surface-700)',
        fontSize: '0.6875rem',
        fontWeight: 500,
      }}
    >
      <span>{t(AGENT_COPY_KEYS.trustDisclaimer, copy.trustDisclaimer)}</span>
      <span
        aria-hidden="true"
        className="h-3 w-px"
        style={{ background: 'var(--color-surface-200)' }}
      />
      <span>{t(AGENT_COPY_KEYS.dataPrivacy, copy.dataPrivacy)}</span>
    </footer>
  )
}
