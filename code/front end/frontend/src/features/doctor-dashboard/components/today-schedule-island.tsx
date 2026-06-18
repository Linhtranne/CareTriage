import { Box, Typography, Stack, Button, CircularProgress, Chip, IconButton, Avatar } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { ArrowForward } from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

export interface AppointmentPreviewItem {
  id: number | string
  patientName?: string
  appointmentTime?: string
  reason?: string
  status?: string
  patientAvatar?: string
}

interface TodayScheduleIslandProps {
  appointments: AppointmentPreviewItem[]
  loading: boolean
}

export default function TodayScheduleIsland({ appointments, loading }: Readonly<TodayScheduleIslandProps>) {
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
          {t('dashboard.doctor.today_schedule', 'Lịch khám hôm nay')}
        </Typography>
        <IconButton
          onClick={() => navigate('/doctor/appointments')}
          sx={{ color: 'var(--color-primary-600)', bgcolor: alpha('#08bba3', 0.1), '&:hover': { bgcolor: alpha('#08bba3', 0.2) } }}
        >
          <ArrowForward fontSize="small" />
        </IconButton>
      </Stack>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
          <CircularProgress size={32} thickness={5} sx={{ color: 'var(--color-primary-600)' }} />
        </Box>
      ) : appointments.length === 0 ? (
        <Box sx={{ py: 10, textAlign: 'center' }}>
          <Typography sx={{ color: 'var(--color-surface-500)', fontWeight: 700 }}>
            {t('dashboard.doctor.no_appointments', 'Không có lịch hẹn nào hôm nay')}
          </Typography>
        </Box>
      ) : (
        <Stack spacing={2}>
          {appointments.map((appt, idx) => (
            <motion.div
              key={appt.id}
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
                  borderColor: 'var(--color-primary-600)'
                }
              }}>
                <Avatar
                  src={appt.patientAvatar ?? undefined}
                  sx={{
                    width: 52,
                    height: 52,
                    borderRadius: 3,
                    bgcolor: alpha('#08bba3', 0.1),
                    color: 'var(--color-primary-600)',
                    fontWeight: 900
                  }}
                >
                  {appt.patientName ? appt.patientName.charAt(0).toUpperCase() : '?'}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontWeight: 800, color: 'var(--color-surface-900)' }}>
                    {appt.patientName || t('common.patient', 'Bệnh nhân')}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'var(--color-surface-600)', fontWeight: 700 }}>
                    {appt.appointmentTime?.substring(0, 5) || '00:00'} &bull; {appt.reason || t('common.no_reason', 'Không rõ lý do')}
                  </Typography>
                </Box>
                <Chip
                  size="small"
                  label={appt.status || 'PENDING'}
                  variant="outlined"
                  sx={{ fontWeight: 900, borderRadius: 2, borderColor: alpha('#08bba3', 0.2), color: 'var(--color-primary-600)' }}
                />
              </Box>
            </motion.div>
          ))}
          <Button
            fullWidth
            variant="outlined"
            onClick={() => navigate('/doctor/appointments')}
            sx={{ mt: 2, borderRadius: 3, py: 1.5, fontWeight: 800, borderColor: alpha('#08bba3', 0.3), color: 'var(--color-primary-600)', textTransform: 'none' }}
          >
            {t('dashboard.doctor.view_all_appointments', 'Xem tất cả lịch hẹn')}
          </Button>
        </Stack>
      )}
    </Box>
  )
}
