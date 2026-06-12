import { Box, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { Sparkles, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import type { PatientCarePlan } from '../types/care-plan'
import { useNavigate } from 'react-router-dom'

type AgentNextStepCardProps = Readonly<{
  carePlan: PatientCarePlan
}>

export default function AgentNextStepCard({ carePlan }: Readonly<AgentNextStepCardProps>) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const handleAction = () => {
    if (carePlan.appointmentReady) {
      navigate('/patient/appointments/book-appointment')
    } else {
      navigate('/patient/triage')
    }
  }

  const primaryAction = carePlan.suggestedActions.length > 0 
    ? carePlan.suggestedActions[0] 
    : t('carePlan.noActionsFallback')

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Box 
        className="relative overflow-hidden w-full p-6 rounded-2xl backdrop-blur-[16px] bg-[var(--agent-surface)] border border-[var(--glass-border)] shadow-[var(--glass-shadow)] group transition-all hover:bg-[var(--glass-highlight)] cursor-pointer"
        onClick={handleAction}
      >
        {/* Decorative AI Glow */}
        <Box className="absolute -top-10 -right-10 w-32 h-32 bg-[var(--color-primary-500)]/10 rounded-full blur-2xl pointer-events-none" />
        
        <Box className="flex items-center gap-2 mb-3 text-[var(--color-primary-600)]">
          <Sparkles size={20} className="animate-pulse" />
          <Typography variant="overline" className="font-bold tracking-wider">
            {t('carePlan.nextStepTitle')}
          </Typography>
        </Box>
        
        <Typography variant="h6" className="font-semibold text-[var(--color-surface-900)] mb-2">
          {primaryAction}
        </Typography>

        {carePlan.suggestedActions.length > 1 && (
          <Typography variant="body2" className="text-[var(--color-surface-600)] mb-4">
            {carePlan.suggestedActions.slice(1).join(' • ')}
          </Typography>
        )}

        <Box className="inline-flex items-center gap-2 text-sm font-medium mt-4 transition-colors group-hover:underline" style={{ color: 'var(--color-primary-600)' }}>`n          <span>{carePlan.appointmentReady ? t('carePlan.bookAppointment') : t('carePlan.continueTriage')}</span>
          <ArrowRight size={16} />
        </Box>
      </Box>
    </motion.div>
  )
}
