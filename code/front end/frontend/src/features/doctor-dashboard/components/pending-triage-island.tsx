import { Box, Typography, Stack, Button, CircularProgress, Chip, IconButton } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { ArrowForward, Assignment } from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

export interface TriageTicketPreviewItem {
  id: number | string
  patientName?: string
  ticketNumber?: string
  priority?: string
  status?: string
}

interface PendingTriageIslandProps {
  tickets: TriageTicketPreviewItem[]
  loading: boolean
}

export default function PendingTriageIsland({ tickets, loading }: Readonly<PendingTriageIslandProps>) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <Box sx={{
      p: 4,
      borderRadius: 8,
      bgcolor: 'oklch(100% 0 0 / 0.02)',
      border: '1px solid var(--glass-border, oklch(100% 0 0 / 0.05))',
      backdropFilter: 'blur(20px)',
      height: '100%'
    }}>
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 4 }} >
        <Typography variant="h5" sx={{ fontWeight: 950, color: 'var(--color-surface-900)', letterSpacing: '-0.02em' }}>
          {t('dashboard.doctor.pending_triage')}
        </Typography>
        <IconButton
          onClick={() => navigate('/doctor/triage-tickets')}
          sx={{ color: 'var(--color-info-600)', bgcolor: alpha('#2563eb', 0.1), '&:hover': { bgcolor: alpha('#2563eb', 0.2) } }}
        >
          <ArrowForward fontSize="small" />
        </IconButton>
      </Stack>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
          <CircularProgress size={32} thickness={5} sx={{ color: 'var(--color-info-600)' }} />
        </Box>
      ) : tickets.length === 0 ? (
        <Box sx={{ py: 10, textAlign: 'center' }}>
          <Typography sx={{ color: 'var(--color-surface-500)', fontWeight: 700 }}>
            {t('dashboard.doctor.no_tickets')}
          </Typography>
        </Box>
      ) : (
        <Stack spacing={2}>
          {tickets.map((ticket, idx) => (
            <motion.div
              key={ticket.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1, type: 'spring', stiffness: 300, damping: 25 }}
            >
              <Box sx={{
                p: 2.5,
                borderRadius: 5,
                border: '1px solid var(--color-surface-200)',
                bgcolor: 'var(--color-surface-50)',
                display: 'flex',
                alignItems: 'center',
                gap: 3,
                transition: 'all 0.3s',
                '&:hover': {
                  transform: 'translateX(12px)',
                  boxShadow: 'var(--shadow-card)',
                  borderColor: 'var(--color-info-600)'
                }
              }}>
                <Box sx={{
                  width: 52,
                  height: 52,
                  borderRadius: 3,
                  bgcolor: alpha('#2563eb', 0.1), // Info color base
                  color: 'var(--color-info-600)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1rem',
                  fontWeight: 900
                }}>
                  <Assignment fontSize="small" />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontWeight: 800, color: 'var(--color-surface-900)' }}>
                    {ticket.patientName || t('common.patient')}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'var(--color-surface-600)', fontWeight: 700 }}>
                    {ticket.ticketNumber} &bull; {ticket.priority || 'MEDIUM'}
                  </Typography>
                </Box>
                <Chip
                  size="small"
                  label={ticket.status || 'NEW'}
                  variant="outlined"
                  sx={{ fontWeight: 900, borderRadius: 2, borderColor: alpha('#2563eb', 0.2), color: 'var(--color-info-600)' }}
                />
              </Box>
            </motion.div>
          ))}
          <Button
            fullWidth
            variant="outlined"
            onClick={() => navigate('/doctor/triage-tickets')}
            sx={{ mt: 2, borderRadius: 3, py: 1.5, fontWeight: 800, borderColor: alpha('#2563eb', 0.3), color: 'var(--color-info-600)', textTransform: 'none' }}
          >
            {t('dashboard.doctor.view_all_tickets', 'Xem tất cả phiếu phân loại')}
          </Button>
        </Stack>
      )}
    </Box>
  )
}
