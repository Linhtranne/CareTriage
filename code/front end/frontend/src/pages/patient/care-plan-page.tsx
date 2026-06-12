import { Box, Container, Typography, Skeleton } from '@mui/material'
import { motion } from 'framer-motion'
import { LAYOUT } from '../../constants/layout-constants'
import CarePlanOverview from '../../features/care-plan/components/care-plan-overview'
import AgentNextStepCard from '../../features/care-plan/components/agent-next-step-card'
import SafetyChecklist from '../../features/care-plan/components/safety-checklist'
import AppointmentReadinessPanel from '../../features/care-plan/components/appointment-readiness-panel'
import CareTimelinePreview from '../../features/care-plan/components/care-timeline-preview'
import { useCarePlan } from '../../features/care-plan/hooks/use-care-plan'
import { useTranslation } from 'react-i18next'
import { AlertTriangle, RefreshCw, FileQuestion } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function CarePlanPage() {
  const { carePlan, isLoading, error, refresh } = useCarePlan()
  const { t } = useTranslation()
  const navigate = useNavigate()

  if (isLoading) {
    return (
      <Box className="min-h-screen bg-[var(--color-surface-100)] pt-8 pb-16">
        <Container maxWidth={false} sx={{ maxWidth: LAYOUT.carePlan.maxWidth }}>
          <Box className="flex flex-col gap-6">
            <Skeleton variant="rounded" height={160} className="w-full rounded-2xl bg-[var(--color-surface-200)]" />
            <Skeleton variant="rounded" height={120} className="w-full rounded-2xl bg-[var(--color-surface-200)]" />
            <Box className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Skeleton variant="rounded" height={200} className="w-full rounded-2xl bg-[var(--color-surface-200)]" />
              <Skeleton variant="rounded" height={300} className="w-full rounded-2xl bg-[var(--color-surface-200)]" />
            </Box>
          </Box>
        </Container>
      </Box>
    )
  }

  if (error) {
    return (
      <Box className="min-h-screen bg-[var(--color-surface-100)] pt-8 pb-16 flex items-center justify-center">
        <Container maxWidth={false} sx={{ maxWidth: LAYOUT.carePlan.maxWidth }}>
          <Box className="p-8 rounded-2xl bg-[var(--color-surface-50)] border border-[var(--color-danger-200)] text-center flex flex-col items-center gap-4 shadow-sm">
            <AlertTriangle size={48} className="text-[var(--color-danger-500)]" />
            <Typography variant="h6" className="font-bold text-[var(--color-surface-900)]">
              {t('carePlan.errorTitle')}
            </Typography>
            <Typography variant="body1" className="text-[var(--color-surface-600)] max-w-md mx-auto">
              {t(error)}
            </Typography>
            <button 
              onClick={refresh}
              className="mt-4 px-6 py-2 rounded-xl bg-[var(--color-surface-200)] text-[var(--color-surface-800)] font-semibold flex items-center gap-2 hover:bg-[var(--color-surface-300)] transition-colors"
            >
              <RefreshCw size={18} />
              {t('carePlan.retry')}
            </button>
          </Box>
        </Container>
      </Box>
    )
  }

  if (!carePlan) {
    return (
      <Box className="min-h-screen bg-[var(--color-surface-100)] pt-8 pb-16 flex items-center justify-center">
        <Container maxWidth={false} sx={{ maxWidth: LAYOUT.carePlan.maxWidth }}>
          <Box className="p-10 rounded-2xl bg-[var(--color-surface-50)] border border-[var(--color-surface-200)] text-center flex flex-col items-center gap-4 shadow-sm">
            <FileQuestion size={48} className="text-[var(--color-surface-400)] mb-2" />
            <Typography variant="h5" className="font-bold text-[var(--color-surface-900)]">
              {t('carePlan.emptyTitle')}
            </Typography>
            <Typography variant="body1" className="text-[var(--color-surface-600)] max-w-md mx-auto">
              {t('carePlan.emptyDescription')}
            </Typography>
            <button 
              onClick={() => navigate('/patient/triage')}
              className="mt-6 px-8 py-3 rounded-xl bg-[var(--color-primary-600)] font-bold shadow-md hover:opacity-90 transition-opacity"
              style={{ color: 'var(--color-surface-50)' }}
            >
              {t('carePlan.emptyCta')}
            </button>
          </Box>
        </Container>
      </Box>
    )
  }

  const isEmergency = carePlan.urgencyLevel === 'EMERGENCY'

  return (
    <Box className="min-h-screen bg-[var(--color-surface-100)] pt-8 pb-16">
      <Container maxWidth={false} sx={{ maxWidth: LAYOUT.carePlan.maxWidth }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col gap-6"
        >
          {isEmergency ? (
            <Box 
              className="w-full p-8 rounded-2xl bg-[var(--color-danger-500)] shadow-lg flex flex-col items-center text-center gap-4"
              style={{ color: 'var(--color-surface-50)' }}
            >
              <AlertTriangle size={64} className="animate-pulse" />
              <Typography variant="h4" className="font-bold">
                {t('carePlan.emergencyTitle')}
              </Typography>
              <Typography variant="h6" className="max-w-2xl opacity-90">
                {t('carePlan.emergencyAction')}
              </Typography>
            </Box>
          ) : (
            <>
              {/* Header Overview */}
              <CarePlanOverview carePlan={carePlan} />

              {/* AI Recommended Next Step (Liquid Glass) */}
              <AgentNextStepCard carePlan={carePlan} />

              <Box className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column: Safety & Prep */}
                <Box className="flex flex-col gap-6">
                  <SafetyChecklist carePlan={carePlan} />
                  <AppointmentReadinessPanel carePlan={carePlan} />
                </Box>

                {/* Right Column: Timeline */}
                <Box className="flex flex-col gap-6">
                  <CareTimelinePreview carePlan={carePlan} />
                </Box>
              </Box>
            </>
          )}
        </motion.div>
      </Container>
    </Box>
  )
}
