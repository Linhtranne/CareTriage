import { useTranslation } from 'react-i18next'
import { TRIAGE_COPY_KEYS, TRIAGE_FALLBACK_COPY, TRIAGE_FALLBACK_COPY_VI } from '../constants/triage-copy'
import { DESIGN_TOKENS } from '../../../constants/design-tokens'

type StepState = 'incomplete' | 'in-progress' | 'complete' | 'skipped'

interface ProgressStep {
  id: string
  label: string
  state: StepState
}

import type { TriageProgressState } from '../types/triage-session'

interface IntakeProgressRailProps {
  progressState?: TriageProgressState
  className?: string
}

/**
 * Vertical stepper for triage completeness.
 * Solid surface, no glass.
 */
export default function IntakeProgressRail({ 
  progressState, 
  className = '' 
}: IntakeProgressRailProps) {
  const { t, i18n } = useTranslation()
  const copy = i18n.language?.startsWith('vi') ? TRIAGE_FALLBACK_COPY_VI : TRIAGE_FALLBACK_COPY
  
  const getStepColor = (state: StepState) => {
    switch (state) {
      case 'complete': return DESIGN_TOKENS.colors.primary[500]
      case 'in-progress': return DESIGN_TOKENS.colors.primary[300]
      case 'skipped': return DESIGN_TOKENS.colors.surface[300]
      case 'incomplete': return DESIGN_TOKENS.colors.surface[200]
      default: return DESIGN_TOKENS.colors.surface[200]
    }
  }

  // Derive active steps from progress state
  const isSymptomsDone = progressState && progressState.missingInformation && !progressState.missingInformation.includes('symptoms');
  const isHistoryDone = progressState && progressState.missingInformation && !progressState.missingInformation.includes('medical_history');
  
  const currentSteps: ProgressStep[] = [
    { 
      id: 'symptoms', 
      label: TRIAGE_COPY_KEYS.steps.symptoms, 
      state: progressState?.intakeComplete ? 'complete' : (isSymptomsDone ? 'complete' : 'in-progress') 
    },
    { 
      id: 'history', 
      label: TRIAGE_COPY_KEYS.steps.history, 
      state: progressState?.intakeComplete ? 'complete' : (isSymptomsDone ? (isHistoryDone ? 'complete' : 'in-progress') : 'incomplete') 
    },
    { 
      id: 'details', 
      label: TRIAGE_COPY_KEYS.steps.details, 
      state: progressState?.intakeComplete ? 'complete' : (isHistoryDone ? 'in-progress' : 'incomplete') 
    },
    { 
      id: 'review', 
      label: TRIAGE_COPY_KEYS.steps.review, 
      state: progressState?.intakeComplete ? 'complete' : 'incomplete' 
    },
  ]

  return (
    <div className={`flex flex-col gap-4 rounded-2xl border p-4 ${className}`} style={{
      background: 'var(--color-surface-50)',
      borderColor: 'var(--color-surface-200)',
    }}>
      {currentSteps.map((step, index) => (
        <div key={step.id} className="flex items-start gap-3">
          <div className="flex flex-col items-center mt-1">
            {/* Step Node */}
            <div 
              className="w-3 h-3 rounded-full transition-colors duration-300"
              style={{
                backgroundColor: step.state === 'incomplete' || step.state === 'skipped' 
                  ? 'var(--color-clear)' 
                  : getStepColor(step.state),
                border: `2px solid ${getStepColor(step.state)}`,
                borderStyle: step.state === 'skipped' ? 'dashed' : 'solid'
              }}
            />
            {/* Connector Line */}
            {index < currentSteps.length - 1 && (
              <div 
                className="w-px h-8 mt-1"
                style={{ backgroundColor: 'var(--color-surface-200)' }}
              />
            )}
          </div>
          <span
            className="text-sm font-semibold leading-snug transition-colors duration-300"
            style={{ 
              color: step.state === 'in-progress' || step.state === 'complete'
                ? 'var(--color-surface-800)' 
                : 'var(--color-surface-700)',
              opacity: step.state === 'skipped' ? '0.6' : '1'
            }}
          >
            {t(step.label, copy.steps[step.id as keyof typeof copy.steps])}
          </span>
        </div>
      ))}
    </div>
  )
}
