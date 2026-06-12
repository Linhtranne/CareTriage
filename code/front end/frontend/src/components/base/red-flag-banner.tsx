import { type ReactNode } from 'react'

interface RedFlagBannerProps {
  children: ReactNode
  className?: string
}

/**
 * Solid emergency/red-flag warning banner.
 * NEVER glass. Uses --urgency-emergency for background tint.
 * Breaks glass intentionally for clinical safety.
 */
export default function RedFlagBanner({ children, className = '' }: RedFlagBannerProps) {
  return (
    <div
      role="alert"
      className={`flex items-center gap-3 px-4 py-3 ${className}`}
      style={{
        background: 'var(--alert-flag-bg)',
        borderBottom: '1px solid var(--alert-flag-border)',
        color: 'var(--urgency-emergency)',
        fontWeight: 600,
        fontSize: '0.8125rem',
      }}
    >
      {children}
    </div>
  )
}
