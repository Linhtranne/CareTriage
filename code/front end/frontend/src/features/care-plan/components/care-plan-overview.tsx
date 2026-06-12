import { Box, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { FileText } from 'lucide-react'
import type { PatientCarePlan } from '../types/care-plan'
import UrgencyBadge, { UrgencyLevel } from '../../agent-session/components/urgency-badge'

type CarePlanOverviewProps = Readonly<{
  carePlan: PatientCarePlan
}>

export default function CarePlanOverview({ carePlan }: Readonly<CarePlanOverviewProps>) {
  const { t } = useTranslation()

  return (
    <Box className="w-full flex flex-col gap-4 p-6 rounded-2xl bg-[var(--color-surface-50)] border border-[var(--color-surface-200)] shadow-[var(--shadow-card)]">
      <Box className="flex items-center justify-between">
        <Box className="flex items-center gap-3">
          <Box className="p-2 bg-[var(--color-surface-100)] rounded-lg text-[var(--color-primary-600)]">
            <FileText size={24} />
          </Box>
          <Typography variant="h5" className="font-semibold text-[var(--color-surface-900)]">
            {t('carePlan.overviewTitle')}
          </Typography>
        </Box>
        <UrgencyBadge level={carePlan.urgencyLevel.toLowerCase() as UrgencyLevel} />
      </Box>
      
      <Box className="flex flex-col gap-2 mt-2">
        <Typography variant="subtitle2" className="text-[var(--color-surface-500)] uppercase tracking-wider">
          {t('carePlan.departmentLabel')}
        </Typography>
        <Typography variant="body1" className="font-semibold text-[var(--color-primary-600)]">
          {carePlan.suggestedDepartment || t('carePlan.unknownDepartment')}
        </Typography>
      </Box>

      <Box className="flex flex-col gap-2">
        <Typography variant="subtitle2" className="text-[var(--color-surface-500)] uppercase tracking-wider">
          {t('carePlan.summaryLabel')}
        </Typography>
        <Typography variant="body1" className="text-[var(--color-surface-700)] leading-relaxed">
          {carePlan.summary || t('doctorReview.missingSummary')}
        </Typography>
      </Box>
    </Box>
  )
}
