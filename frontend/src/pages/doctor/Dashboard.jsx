import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Grid,
  Paper,
  Stack,
  Button,
  CircularProgress,
  Alert,
  Chip,
  Divider,
  alpha,
} from '@mui/material'
import { Refresh, ArrowForward, Schedule, Assignment, PendingActions, PlayArrow } from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import appointmentApi from '../../api/appointmentApi'
import triageTicketApi from '../../api/triageTicketApi'
import DashboardCard from '../../components/common/DashboardCard'

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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDashboardData(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        loadDashboardData()
      }
    }, 60000)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    <Box>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5, letterSpacing: '-0.02em' }}>
            {t('dashboard.doctor.title')}
          </Typography>
          <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
            {new Date().toLocaleDateString(i18n.language === 'vi' ? 'vi-VN' : 'en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={refreshing ? <CircularProgress size={16} color="inherit" /> : <Refresh />}
          onClick={() => loadDashboardData()}
          disabled={loading || refreshing}
          sx={{ borderRadius: 2.5, px: 2, fontWeight: 700 }}
        >
          {t('common.refresh')}
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <DashboardCard
            title={t('dashboard.doctor.total_today')}
            value={stats.totalToday}
            icon={Schedule}
            color="#2563eb"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <DashboardCard
            title={t('dashboard.doctor.waiting')}
            value={stats.waiting}
            icon={PendingActions}
            color="#f59e0b"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <DashboardCard
            title={t('dashboard.doctor.in_progress')}
            value={stats.inProgress}
            icon={PlayArrow}
            color="#10b981"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <DashboardCard
            title={t('dashboard.doctor.pending_tickets')}
            value={stats.pendingTicketTotal}
            icon={Assignment}
            color="#7c3aed"
            loading={loading}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 4, border: '1px solid #e2e8f0', height: '100%', bgcolor: '#ffffff' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                {t('dashboard.doctor.today_schedule')}
              </Typography>
              <Button 
                endIcon={<ArrowForward size={18} />} 
                onClick={() => navigate('/doctor/appointments')}
                sx={{ fontWeight: 700, borderRadius: 2 }}
              >
                {t('common.view_all')}
              </Button>
            </Stack>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress size={32} thickness={5} sx={{ color: '#10b981' }} />
              </Box>
            ) : appointmentPreview.length === 0 ? (
              <Box sx={{ py: 6, textAlign: 'center' }}>
                <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
                  {t('dashboard.doctor.no_appointments')}
                </Typography>
              </Box>
            ) : (
              <Stack spacing={2}>
                {appointmentPreview.map((item, idx) => (
                  <Box key={item.id}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
                      <Box sx={{ flex: 1 }}>
                        <Typography sx={{ fontWeight: 700, mb: 0.25 }}>
                          {item.patientName || t('common.patient')}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                          {item.appointmentTime} • {item.departmentName || t('common.no_dept')}
                        </Typography>
                      </Box>
                      <Chip 
                        size="small" 
                        label={statusLabel(item.status, t)} 
                        color={statusColor(item.status)}
                        sx={{ fontWeight: 800, borderRadius: 1.5 }}
                      />
                    </Stack>
                    {idx < appointmentPreview.length - 1 && <Divider sx={{ mt: 2 }} />}
                  </Box>
                ))}
              </Stack>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 4, border: '1px solid #e2e8f0', height: '100%', bgcolor: '#ffffff' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                {t('dashboard.doctor.pending_triage')}
              </Typography>
              <Button 
                endIcon={<ArrowForward size={18} />} 
                onClick={() => navigate('/doctor/triage-tickets')}
                sx={{ fontWeight: 700, borderRadius: 2 }}
              >
                {t('common.view_all')}
              </Button>
            </Stack>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress size={32} thickness={5} sx={{ color: '#7c3aed' }} />
              </Box>
            ) : ticketPreview.length === 0 ? (
              <Box sx={{ py: 6, textAlign: 'center' }}>
                <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
                  {t('dashboard.doctor.no_tickets')}
                </Typography>
              </Box>
            ) : (
              <Stack spacing={2}>
                {ticketPreview.map((ticket, idx) => (
                  <Box key={ticket.id}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
                      <Box sx={{ flex: 1 }}>
                        <Typography sx={{ fontWeight: 700, mb: 0.25 }}>
                          {ticket.patientName || t('common.patient')}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                          {ticket.ticketNumber} • {ticket.priority || 'MEDIUM'}
                        </Typography>
                      </Box>
                      <Chip 
                        size="small" 
                        label={ticket.status || 'NEW'} 
                        variant="outlined"
                        sx={{ fontWeight: 800, borderRadius: 1.5, borderColor: alpha('#7c3aed', 0.3), color: '#7c3aed' }}
                      />
                    </Stack>
                    {idx < ticketPreview.length - 1 && <Divider sx={{ mt: 2 }} />}
                  </Box>
                ))}
              </Stack>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}

