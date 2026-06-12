import { Box, Typography, Button } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { Activity, AlertTriangle } from 'lucide-react'

export default function DoctorCommandHeader() {
  const { t } = useTranslation()

  return (
    <Box className="sticky top-0 z-10 w-full flex items-center justify-between p-4 bg-[var(--color-surface-50)] border-b border-[var(--color-surface-200)] shadow-sm">
      <Box className="flex items-center gap-4">
        <Typography variant="h6" className="font-bold text-[var(--color-surface-900)]">
          {t('doctorWorkbench.title')}
        </Typography>
        <Box className="px-3 py-1 rounded-full bg-[var(--color-danger)]/10 text-[var(--color-danger)] flex items-center gap-2">
          <AlertTriangle size={16} />
          <Typography variant="caption" className="font-bold uppercase tracking-widest">
            {t('doctorWorkbench.commandHeader.urgency')}
          </Typography>
        </Box>
      </Box>

      <Box className="flex items-center gap-4">
        <Box className="flex items-center gap-2 text-[var(--color-surface-600)]">
          <Activity size={18} />
          <Typography variant="body2" className="font-medium">
            {t('doctorWorkbench.commandHeader.vitals')} {t('common.not_provided')}
          </Typography>
        </Box>
        <Button variant="contained" color="primary" disableElevation className="rounded-[var(--radius-button)] px-6">
          {t('doctorWorkbench.handoffActions')}
        </Button>
      </Box>
    </Box>
  )
}
