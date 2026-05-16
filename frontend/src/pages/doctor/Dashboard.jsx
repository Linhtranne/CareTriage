import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Grid,
  Stack,
  Button,
  CircularProgress,
  Alert,
  Chip,
  Divider,
  IconButton,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { Refresh, ArrowForward, Schedule, Assignment, PendingActions, PlayArrow } from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import appointmentApi from '../../api/appointmentApi'
import triageTicketApi from '../../api/triageTicketApi'
import DashboardCard from '../../components/common/DashboardCard'
import PatientPageShell from '../../components/patient/PatientPageShell'
import { motion } from 'framer-motion'

function statusLabel(status, t) {
  switch (status) {
    case 'PENDING':
      return t('appointments.status.PENDING')
    case 'CONFIRMED':
      return t('appointments.status.CONFIRMED')
    case 'CHECKED_IN':
      return t('appointments.status.CHECKED_IN')
    case 'IN_PROGRESS':
      return t('appointments.status.IN_PROGRESS')
    case 'COMPLETED':
      return t('appointments.status.COMPLETED')
    case 'CANCELLED':
      return t('appointments.status.CANCELLED')
    default:
      return status || t('common.unknown')
  }
}

function statusColor(status) {
  switch (status) {
    case 'PENDING':
      return 'warning'
    case 'CONFIRMED':
      return 'info'
    case 'IN_PROGRESS':
      return 'success'
    case 'COMPLETED':
      return 'default'
    case 'CANCELLED':
      return 'error'
    default:
      return 'default'
  }
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const [appointments, setAppointments] = useState([])
  const [pendingTickets, setPendingTickets] = useState([])
  const [pendingTicketTotal, setPendingTicketTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const loadDashboardData = async (isInitial = false) => {
    if (isInitial) setLoading(true)
    else setRefreshing(true)

    setError('')
    try {
      const [appointmentRes, ticketRes] = await Promise.all([
        appointmentApi.getDoctorTodayAppointments(),
        triageTicketApi.listPending({ page: 0, size: 10 }),
      ])

      const todayAppointments = appointmentRes?.data?.data || []
      const ticketPage = ticketRes?.data?.data
      const ticketContent = ticketPage?.content || []

      setAppointments(todayAppointments)
      setPendingTickets(ticketContent)
      setPendingTicketTotal(ticketPage?.totalElements ?? ticketContent.length)
    } catch {
      setError(t('dashboard.doctor.error_load'))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadDashboardData(true)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        loadDashboardData()
      }
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  const stats = useMemo(() => {
    const totalToday = appointments.length
    const waiting = appointments.filter(
      (a) => a.status === 'PENDING' || a.status === 'CONFIRMED'
    ).length
    const inProgress = appointments.filter((a) => a.status === 'IN_PROGRESS').length

    return {
      totalToday,
      waiting,
      inProgress,
      pendingTicketTotal,
    }
  }, [appointments, pendingTicketTotal])

  const appointmentPreview = appointments.slice(0, 5)
  const ticketPreview = pendingTickets.slice(0, 5)

  return (
    <PatientPageShell
      title={t('dashboard.doctor.title')}
      subtitle={new Date().toLocaleDateString(i18n.language === 'vi' ? 'vi-VN' : 'en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })}
      maxWidth={false}
      transparent={true}
      badge="Khu vực bác sĩ"
      actions={
        <Button
          variant="outlined"
          startIcon={refreshing ? <CircularProgress size={16} color="inherit" /> : <Refresh />}
          onClick={() => loadDashboardData()}
          disabled={loading || refreshing}
          sx={{ borderRadius: 3, px: 2.5, fontWeight: 700, textTransform: 'none' }}
        >
          {t('common.refresh')}
        </Button>
      }
    >
      <Box sx={{ mt: -2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={4} sx={{ mb: 10, width: '100%' }} alignItems="stretch">
          {[
            { title: t('dashboard.doctor.total_today'), value: stats.totalToday, icon: Schedule, color: '#2563eb' },
            { title: t('dashboard.doctor.waiting'), value: stats.waiting, icon: PendingActions, color: '#f59e0b' },
            { title: t('dashboard.doctor.in_progress'), value: stats.inProgress, icon: PlayArrow, color: '#10b981' },
            { title: t('dashboard.doctor.pending_tickets'), value: stats.pendingTicketTotal, icon: Assignment, color: '#7c3aed' },
          ].map((stat, idx) => (
            <Grid item xs={12} sm={6} md={3} key={idx} sx={{ display: 'flex', flexGrow: 1 }}>
              <DashboardCard
                title={stat.title}
                value={stat.value}
                icon={stat.icon}
                color={stat.color}
                loading={loading}
              />
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={6}>
          {/* Today's Schedule Island */}
          <Grid item xs={12} lg={7}>
            <Box sx={{
              p: 4,
              borderRadius: 8,
              bgcolor: 'oklch(100% 0 0 / 0.02)',
              border: '1px solid oklch(100% 0 0 / 0.05)',
              backdropFilter: 'blur(20px)',
              height: '100%'
            }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
                <Typography variant="h5" sx={{ fontWeight: 950, color: 'oklch(20% 0.05 250)', letterSpacing: '-0.03em' }}>
                  {t('dashboard.doctor.today_schedule')}
                </Typography>
                <Button
                  variant="text"
                  endIcon={<ArrowForward size={18} />}
                  onClick={() => navigate('/doctor/appointments')}
                  sx={{ fontWeight: 800, color: '#10b981', textTransform: 'none', borderRadius: 2 }}
                >
                  {t('common.view_all')}
                </Button>
              </Stack>

              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
                  <CircularProgress size={40} thickness={5} sx={{ color: '#10b981' }} />
                </Box>
              ) : appointmentPreview.length === 0 ? (
                <Box sx={{
                  py: 10,
                  textAlign: 'center',
                  borderRadius: 6,
                  border: '1px dashed oklch(90% 0.02 250)',
                  bgcolor: 'oklch(100% 0 0 / 0.01)'
                }}>
                  <Typography sx={{ color: 'oklch(50% 0.02 250)', fontWeight: 700 }}>
                    {t('dashboard.doctor.no_appointments')}
                  </Typography>
                </Box>
              ) : (
                <Stack spacing={2}>
                  {appointmentPreview.map((item, idx) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1, type: 'spring', stiffness: 300, damping: 25 }}
                    >
                      <Box sx={{
                        p: 2.5,
                        borderRadius: 5,
                        border: '1px solid oklch(100% 0 0 / 0.05)',
                        bgcolor: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 3,
                        transition: 'all 0.3s',
                        '&:hover': {
                          transform: 'translateX(12px)',
                          boxShadow: '0 20px 40px oklch(20% 0.05 250 / 0.04)',
                          borderColor: '#10b981'
                        }
                      }}>
                        <Box sx={{
                          width: 52,
                          height: 52,
                          borderRadius: 3,
                          bgcolor: alpha('#10b981', 0.1),
                          color: '#10b981',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1rem',
                          fontWeight: 900
                        }}>
                          <Schedule size={20} />
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography sx={{ fontWeight: 800, color: 'oklch(20% 0.05 250)' }}>
                            {item.patientName || t('common.patient')}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'oklch(50% 0.02 250)', fontWeight: 700 }}>
                            {item.appointmentTime} • {item.departmentName || t('common.no_dept')}
                          </Typography>
                        </Box>
                        <Chip
                          size="small"
                          label={statusLabel(item.status, t)}
                          color={statusColor(item.status)}
                          sx={{ fontWeight: 900, borderRadius: 2 }}
                        />
                      </Box>
                    </motion.div>
                  ))}
                </Stack>
              )}
            </Box>
          </Grid>

          {/* Pending Triage Island */}
          <Grid item xs={12} lg={5}>
            <Box sx={{
              p: 4,
              borderRadius: 8,
              bgcolor: 'oklch(100% 0 0 / 0.02)',
              border: '1px solid oklch(100% 0 0 / 0.05)',
              backdropFilter: 'blur(20px)',
              height: '100%'
            }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
                <Typography variant="h5" sx={{ fontWeight: 950, color: 'oklch(20% 0.05 250)', letterSpacing: '-0.02em' }}>
                  {t('dashboard.doctor.pending_triage')}
                </Typography>
                <IconButton
                  onClick={() => navigate('/doctor/triage-tickets')}
                  sx={{ color: '#7c3aed', bgcolor: alpha('#7c3aed', 0.1), '&:hover': { bgcolor: alpha('#7c3aed', 0.2) } }}
                >
                  <ArrowForward size={20} />
                </IconButton>
              </Stack>

              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
                  <CircularProgress size={32} thickness={5} sx={{ color: '#7c3aed' }} />
                </Box>
              ) : ticketPreview.length === 0 ? (
                <Box sx={{ py: 10, textAlign: 'center' }}>
                  <Typography sx={{ color: 'oklch(60% 0.02 250)', fontWeight: 700 }}>
                    {t('dashboard.doctor.no_tickets')}
                  </Typography>
                </Box>
              ) : (
                <Stack spacing={2}>
                  {ticketPreview.map((ticket, idx) => (
                    <motion.div
                      key={ticket.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1, type: 'spring', stiffness: 300, damping: 25 }}
                    >
                      <Box sx={{
                        p: 2.5,
                        borderRadius: 5,
                        border: '1px solid oklch(100% 0 0 / 0.05)',
                        bgcolor: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 3,
                        transition: 'all 0.3s',
                        '&:hover': {
                          transform: 'translateX(12px)',
                          boxShadow: '0 20px 40px oklch(20% 0.05 250 / 0.04)',
                          borderColor: '#7c3aed'
                        }
                      }}>
                        <Box sx={{
                          width: 52,
                          height: 52,
                          borderRadius: 3,
                          bgcolor: alpha('#7c3aed', 0.1),
                          color: '#7c3aed',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1rem',
                          fontWeight: 900
                        }}>
                          <Assignment size={20} />
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography sx={{ fontWeight: 800, color: 'oklch(20% 0.05 250)' }}>
                            {ticket.patientName || t('common.patient')}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'oklch(50% 0.02 250)', fontWeight: 700 }}>
                            {ticket.ticketNumber} • {ticket.priority || 'MEDIUM'}
                          </Typography>
                        </Box>
                        <Chip
                          size="small"
                          label={ticket.status || 'NEW'}
                          variant="outlined"
                          sx={{ fontWeight: 900, borderRadius: 2, borderColor: alpha('#7c3aed', 0.2), color: '#7c3aed' }}
                        />
                      </Box>
                    </motion.div>
                  ))}
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => navigate('/doctor/triage-tickets')}
                    sx={{ mt: 2, borderRadius: 3, py: 1.5, fontWeight: 800, borderColor: alpha('#7c3aed', 0.3), color: '#7c3aed', textTransform: 'none' }}
                  >
                    Xem tất cả phiếu phân loại
                  </Button>
                </Stack>
              )}
            </Box>
          </Grid>
        </Grid>
      </Box>
    </PatientPageShell>
  )
}
