import { Box, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { Clock } from 'lucide-react'
import type { DoctorTriageTicket } from '../../doctor-review/types/triage-review'
import { formatDistanceToNow } from 'date-fns'

type ClinicalPriorityBoardProps = Readonly<{
  tickets: DoctorTriageTicket[]
  selectedTicketId: string | null
  onSelect: (id: string) => void
  isLoading?: boolean
  error?: string | null
}>

export default function ClinicalPriorityBoard({ 
  tickets, 
  selectedTicketId, 
  onSelect,
  isLoading,
  error
}: Readonly<ClinicalPriorityBoardProps>) {
  const { t } = useTranslation()

  const getStatusStyles = (statusValue: string, isActive: boolean) => {
    const val = statusValue.toLowerCase();
    let baseColor = 'var(--color-info)';
    let bgHover = 'var(--color-surface-200)';
    let bgBase = 'var(--color-surface-100)';
    let borderBase = 'var(--color-surface-200)';

    if (val.includes('emergency') || val.includes('critical')) {
      baseColor = 'var(--color-danger)';
      bgBase = 'var(--danger-soft)';
      bgHover = 'var(--danger-soft-hover)';
      borderBase = 'var(--danger-border)';
    } else if (val.includes('urgent')) {
      baseColor = 'var(--color-warning)';
      bgBase = 'var(--warning-soft)';
      bgHover = 'var(--warning-soft-hover)';
      borderBase = 'var(--warning-border)';
    }

    if (isActive) {
      bgBase = bgHover;
      borderBase = baseColor;
    }

    return { baseColor, bgBase, bgHover, borderBase };
  }

  return (
    <Box className="w-full h-full flex flex-col gap-4 p-6 rounded-2xl bg-[var(--color-surface-50)] border border-[var(--color-surface-200)] shadow-[var(--shadow-card)]">
      <Typography variant="h6" className="font-semibold text-[var(--color-surface-900)] mb-2">
        {t('doctorWorkbench.priorityBoard')}
      </Typography>

      <Box className="flex flex-col gap-3">
        {isLoading && tickets.length === 0 && (
          <Typography variant="body2" className="text-center italic" style={{ color: 'var(--color-surface-500)' }}>`n            {t('doctorReview.loadingQueue')}
          </Typography>
        )}

        {error && tickets.length === 0 && (
          <Typography variant="body2" className="text-center" style={{ color: 'var(--urgency-emergency)' }}>`n            {error}
          </Typography>
        )}

        {!isLoading && !error && tickets.length === 0 && (
          <Typography variant="body2" className="text-center italic" style={{ color: 'var(--color-surface-500)' }}>`n            {t('doctorReview.emptyQueue')}
          </Typography>
        )}

        {tickets.map(ticket => {
          const isActive = ticket.id === selectedTicketId;
          const { baseColor, bgBase, borderBase } = getStatusStyles(ticket.status, isActive);
          let timeAgo: string;
          try {
            timeAgo = formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true });
          } catch {
            timeAgo = t('common.not_provided');
          }

          return (
            <Box 
              key={ticket.id}
              onClick={() => onSelect(ticket.id)}
              className="p-4 rounded-xl flex flex-col gap-2 transition-colors cursor-pointer"
              style={{
                background: bgBase,
                border: `1px solid ${borderBase}`,
                boxShadow: isActive ? `inset 0 0 0 1px ${baseColor}` : 'none'
              }}
            >
              <Box className="flex justify-between items-center">
                <Typography variant="subtitle2" className="font-bold uppercase tracking-wider" style={{ color: baseColor }}>`n                  {ticket.status}
                </Typography>
                <Box className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-surface-500)' }}>`n                  <Clock size={12} /> {timeAgo}
                </Box>
              </Box>
              <Typography variant="body2" className="font-medium" style={{ color: 'var(--color-surface-900)' }}>`n                {ticket.patientName || t('doctorReview.unknownPatient')}
              </Typography>
            </Box>
          )
        })}
      </Box>
    </Box>
  )
}
