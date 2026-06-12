import { Box, Typography, Avatar } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { User } from 'lucide-react'
import type { DoctorTriageTicket } from '../../doctor-review/types/triage-review'

type ActiveCaseStripProps = Readonly<{
  ticket: DoctorTriageTicket | null;
}>

export default function ActiveCaseStrip({ ticket }: Readonly<ActiveCaseStripProps>) {
  const { t } = useTranslation()

  if (!ticket) {
    return (
      <Box className="w-full flex items-center justify-center p-4 rounded-xl bg-[var(--color-surface-100)] border border-[var(--color-surface-200)]">
        <Typography variant="body2" className="italic text-[var(--color-surface-500)]">
          {t('doctorReview.noSelectedCase')}
        </Typography>
      </Box>
    )
  }

  const isCritical = ticket.status.toLowerCase().includes('emergency') || ticket.status.toLowerCase().includes('critical');
  const isUrgent = ticket.status.toLowerCase().includes('urgent');

  let statusColor = 'var(--color-info)';
  if (isCritical) statusColor = 'var(--color-danger)';
  else if (isUrgent) statusColor = 'var(--color-warning)';
  const displayId = ticket.ticketNumber || ticket.id;

  return (
    <Box className="w-full flex items-center justify-between p-4 rounded-xl bg-[var(--color-surface-100)] border border-[var(--color-surface-200)]">
      <Box className="flex items-center gap-4">
        <Avatar className="w-12 h-12" style={{ backgroundColor: 'var(--color-primary-600)', color: 'var(--color-surface-50)' }}>`n          <User size={24} />
        </Avatar>
        <Box>
          <Typography variant="subtitle1" className="font-semibold text-[var(--color-surface-900)]">
            {ticket.patientName || t('doctorReview.unknownPatient')}
          </Typography>
          <Typography variant="body2" className="text-[var(--color-surface-600)]">
            {displayId} {t('doctorWorkbench.activeCase')}
          </Typography>
        </Box>
      </Box>
      <Box className="text-right max-w-sm">
        <Typography variant="caption" className="uppercase font-bold tracking-wider block mb-1" style={{ color: statusColor }}>`n          {ticket.status}
        </Typography>
        <Typography variant="body2" className="font-medium text-[var(--color-surface-800)] truncate">
          {ticket.symptomSummary || t('doctorReview.missingSummary')}
        </Typography>
      </Box>
    </Box>
  )
}
