import { type ReactNode } from 'react'
import { LAYOUT } from '../../constants/layout-constants'

type GlassVariant = 'default' | 'agent' | 'elevated'

interface GlassSurfaceProps {
  variant?: GlassVariant
  children: ReactNode
  className?: string
}

const BLUR_DESKTOP = `${LAYOUT.glass.blurDesktop}px`

/**
 * Reusable glass container primitive.
 * Uses CSS custom properties from global.css — no hardcoded colors.
 *
 * Glass = AI interpretation layer (provisional, translucent).
 * Do NOT use for raw patient data, action bars, or emergency surfaces.
 *
 * Falls back to a solid surface token when backdrop-filter is unsupported
 * via the @supports query in the companion CSS below.
 */
export default function GlassSurface({
  variant = 'default',
  children,
  className = '',
}: GlassSurfaceProps) {
  return (
    <div
      className={`glass-surface glass-surface--${variant} ${className}`}
      style={{
        background: 'var(--glass-surface)',
        backdropFilter: `blur(${BLUR_DESKTOP})`,
        WebkitBackdropFilter: `blur(${BLUR_DESKTOP})`,
        border: '1px solid var(--glass-border)',
        boxShadow: 'var(--glass-shadow)',
        borderRadius: 'var(--radius-card)',
      }}
    >
      {children}
    </div>
  )
}
