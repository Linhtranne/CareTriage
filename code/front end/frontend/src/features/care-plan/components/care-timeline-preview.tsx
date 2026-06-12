import { Box, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { Clock } from 'lucide-react'
import type { PatientCarePlan } from '../types/care-plan'

type CareTimelinePreviewProps = Readonly<{
  carePlan: PatientCarePlan
}>

export default function CareTimelinePreview({ carePlan }: Readonly<CareTimelinePreviewProps>) {
  const { t } = useTranslation()

  const formattedDate = carePlan.createdAt 
    ? new Date(carePlan.createdAt).toLocaleString() 
    : t('common.unknown')

  return (
    <Box className="w-full flex flex-col gap-4 p-6 rounded-2xl bg-[var(--color-surface-50)] border border-[var(--color-surface-200)] shadow-[var(--shadow-card)]">
      <Box className="flex items-center gap-2 text-[var(--color-surface-600)] mb-2">
        <Clock size={20} />
        <Typography variant="subtitle2" className="font-semibold uppercase tracking-wider">
          {t('carePlan.timeline')}
        </Typography>
      </Box>

      {/* Timeline Steps */}
      <Box className="relative border-l-2 border-[var(--color-surface-200)] ml-3 pl-6 pb-6">
        <Box className="absolute w-3 h-3 bg-[var(--color-success)] rounded-full -left-[7px] top-1" />
        <Typography variant="body2" className="font-medium text-[var(--color-surface-900)]">
          {t('carePlan.timelineTriageComplete')}
        </Typography>
        <Typography variant="caption" className="text-[var(--color-surface-500)]">
          {formattedDate}
        </Typography>
      </Box>
      <Box className="relative border-l-2 border-[var(--color-surface-200)] ml-3 pl-6 pb-6">
        <Box className="absolute w-3 h-3 bg-[var(--color-primary-600)] rounded-full -left-[7px] top-1" />
        <Typography variant="body2" className="font-medium text-[var(--color-surface-900)]">
          {t('carePlan.timelineGenerated')}
        </Typography>
        <Typography variant="caption" className="text-[var(--color-surface-500)]">
          {carePlan.intakeComplete ? t('carePlan.ready') : t('carePlan.notReady')}
        </Typography>
      </Box>
      <Box className="relative ml-3 pl-6">
        <Box 
          className="absolute w-3 h-3 rounded-full -left-[7px] top-1" 
          style={{ background: carePlan.appointmentReady ? 'var(--color-success)' : 'var(--color-surface-300)' }}
        />
        <Typography 
          variant="body2" 
          className="font-medium"
          style={{ color: carePlan.appointmentReady ? 'var(--color-surface-900)' : 'var(--color-surface-500)' }}
        >
          {t('carePlan.timelineAppointment')}
        </Typography>
        <Typography variant="caption" className="text-[var(--color-surface-400)]">
          {carePlan.appointmentReady ? t('carePlan.ready') : t('carePlan.notReady')}
        </Typography>
      </Box>
    </Box>
  )
}
