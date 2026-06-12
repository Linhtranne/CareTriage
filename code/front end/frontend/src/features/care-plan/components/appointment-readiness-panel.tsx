import { Box, Typography, LinearProgress } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { CheckCircle2, Clock } from 'lucide-react'
import type { PatientCarePlan } from '../types/care-plan'
import { useNavigate } from 'react-router-dom'

type AppointmentReadinessPanelProps = Readonly<{
  carePlan: PatientCarePlan
}>

export default function AppointmentReadinessPanel({ carePlan }: Readonly<AppointmentReadinessPanelProps>) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const isReady = carePlan.appointmentReady
  const READY_PROGRESS = 100
  const PENDING_PROGRESS = 50
  const progress = isReady ? READY_PROGRESS : PENDING_PROGRESS

  return (
    <Box className="w-full flex flex-col gap-4 p-6 rounded-2xl bg-[var(--color-surface-50)] border border-[var(--color-surface-200)] shadow-[var(--shadow-card)]">
      <Box className="flex items-center justify-between">
        <Typography variant="subtitle2" className="font-semibold text-[var(--color-surface-600)] uppercase tracking-wider">
          {t('carePlan.appointmentReadinessTitle')}
        </Typography>
        <Typography variant="body2" className="font-medium" style={{ color: isReady ? 'var(--color-success)' : 'var(--color-primary-600)' }}>`n          {progress}%
        </Typography>
      </Box>
      
      <LinearProgress 
        variant="determinate" 
        value={progress} 
        className="rounded-full h-2"
        sx={{
          backgroundColor: 'var(--color-surface-200)',
          '& .MuiLinearProgress-bar': {
            backgroundColor: isReady ? 'var(--color-success)' : 'var(--color-primary-600)'
          }
        }}
      />
      
      <Box className="flex items-center gap-3 mt-2">
        {isReady ? (
          <CheckCircle2 size={20} style={{ color: 'var(--color-success)' }} />
        ) : (
          <Clock size={20} style={{ color: 'var(--color-surface-500)' }} />
        )}
        <Typography variant="body2" className="text-[var(--color-surface-700)]">
          {isReady ? t('carePlan.ready') : t('carePlan.notReady')}
        </Typography>
      </Box>

      {isReady && (
        <button 
          onClick={() => navigate('/patient/appointments/book-appointment')}
          className="mt-2 w-full py-3 px-4 rounded-xl font-bold transition-colors"
          style={{ background: 'var(--color-primary-600)', color: 'var(--color-surface-50)' }}
        >
          {t('carePlan.bookAppointment')}
        </button>
      )}
    </Box>
  )
}
