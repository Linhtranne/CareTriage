import { Box, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { ShieldAlert, Info } from 'lucide-react'
import type { PatientCarePlan } from '../types/care-plan'

type SafetyChecklistProps = Readonly<{
  carePlan: PatientCarePlan
}>

export default function SafetyChecklist({ carePlan }: Readonly<SafetyChecklistProps>) {
  const { t } = useTranslation()

  return (
    <Box className="w-full flex flex-col gap-4 p-6 rounded-2xl bg-[var(--color-surface-50)] border border-[var(--color-surface-200)] shadow-[var(--shadow-card)]">
      <Box className="flex items-center gap-2 text-[var(--color-warning-600)]">
        <ShieldAlert size={20} />
        <Typography variant="h6" className="font-semibold text-[var(--color-surface-900)]">
          {t('carePlan.safetyChecklistTitle')}
        </Typography>
      </Box>
      <Box className="flex flex-col gap-3">
        {carePlan.missingInformation.length > 0 ? (
          carePlan.missingInformation.map((info, idx) => (
            <Box key={info} className="flex items-start gap-3 p-3 rounded-lg bg-[var(--color-warning-50)] border border-[var(--color-warning-200)]">
              <Info size={18} className="text-[var(--color-warning-600)] mt-0.5 flex-shrink-0" />
              <Typography variant="body2" className="text-[var(--color-surface-800)]">
                {info}
              </Typography>
            </Box>
          ))
        ) : (
          <Box className="flex items-center gap-3 p-3 rounded-lg bg-[var(--color-success-50)] border border-[var(--color-success-200)]">
            <Typography variant="body2" className="text-[var(--color-surface-800)]">
              {t('carePlan.missingInfoFallback')}
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  )
}
