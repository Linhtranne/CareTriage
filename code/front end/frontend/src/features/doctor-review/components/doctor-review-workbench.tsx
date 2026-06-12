import { type ReactNode } from 'react'
import { LAYOUT } from '../../../constants/layout-constants'

interface DoctorReviewWorkbenchProps {
  children: ReactNode
  className?: string
}

/**
 * Main doctor review layout container.
 * Constrains width and handles vertical scrolling of the workbench.
 */
export default function DoctorReviewWorkbench({ children, className = '' }: DoctorReviewWorkbenchProps) {
  return (
    <div 
      className={`flex flex-col h-full mx-auto w-full relative ${className}`}
      style={{ maxWidth: LAYOUT.doctorReview.workbenchMaxWidth }}
    >
      <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8 flex flex-col gap-6 scroll-smooth">
        {children}
      </div>
    </div>
  )
}
