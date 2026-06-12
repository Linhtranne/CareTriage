import { Box, Button } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { Check, X, ArrowUpRight } from 'lucide-react'

export default function HandoffActions() {
  const { t } = useTranslation()

  return (
    <Box className="w-full flex gap-3 p-6 rounded-2xl bg-[var(--color-surface-50)] border border-[var(--color-surface-200)] shadow-[var(--shadow-card)]">
      <Button 
        variant="contained" 
        color="success" 
        disableElevation
        className="flex-1 rounded-[var(--radius-button)] py-3"
        startIcon={<Check size={18} />}
      >
        {t('doctorWorkbench.handoff.approve')}
      </Button>
      <Button 
        variant="outlined" 
        color="inherit" 
        className="flex-1 rounded-[var(--radius-button)] py-3 border-[var(--color-surface-300)] text-[var(--color-surface-700)]"
        startIcon={<X size={18} />}
      >
        {t('doctorWorkbench.handoff.reject')}
      </Button>
      <Button 
        variant="outlined" 
        color="warning" 
        className="flex-1 rounded-[var(--radius-button)] py-3 border-[var(--color-warning)] text-[var(--color-warning)]"
        startIcon={<ArrowUpRight size={18} />}
      >
        {t('doctorWorkbench.handoff.escalate')}
      </Button>
    </Box>
  )
}
