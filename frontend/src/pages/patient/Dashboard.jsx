import { Box, Button, Card, CardContent, Chip, Divider, Grid, Paper, Stack, Typography } from '@mui/material'
import { CalendarDays, ChevronRight, ClipboardList, FileText, PhoneCall, Clock, Stethoscope } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import PatientPageShell from '../../components/patient/PatientPageShell'
import useAuthStore from '../../store/authStore'
import appointmentApi from '../../api/appointmentApi'
import medicalRecordApi from '../../api/medicalRecordApi'
import triageTicketApi from '../../api/triageTicketApi'
import DashboardCard from '../../components/common/DashboardCard'
import { useEffect, useState } from 'react'

export default function Dashboard() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { user } = useAuthStore()
  
  const [appointments, setAppointments] = useState([])
  const [records, setRecords] = useState([])
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchData = async (isInitial = false) => {
    if (isInitial) setLoading(true)

    try {
      const [appRes, recRes, ticRes] = await Promise.all([
        appointmentApi.getMyAppointments(),
        medicalRecordApi.getPatientHistory(user?.id),
        triageTicketApi.listMyTickets({ size: 5 })
      ])

      setAppointments(appRes.data?.data || [])
      setRecords(recRes.data?.data || [])
      setTickets(ticRes.data?.data?.content || [])
    } catch (error) {
      console.error('Failed to fetch dashboard data', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchData()
      }
    }, 60000)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const quickActions = [
    {
      label: t('dashboard.book_appointment'),
      desc: t('dashboard.book_desc'),
      to: '/patient/appointments/book-appointment',
      icon: CalendarDays,
      bg: '#ecfdf5',
      color: '#059669'
    },
    {
      label: t('dashboard.view_appointments'),
      desc: t('dashboard.view_desc'),
      to: '/patient/appointments',
      icon: FileText,
      bg: '#eff6ff',
      color: '#2563eb'
    },
    {
      label: t('dashboard.medical_records'),
      desc: t('dashboard.records_desc'),
      to: '/patient/records',
      icon: ClipboardList,
      bg: '#fff7ed',
      color: '#c2410c'
    },
    {
      label: t('dashboard.triage_tickets'),
      desc: t('dashboard.triage_desc'),
      to: '/patient/triage-tickets',
      icon: PhoneCall,
      bg: '#f5f3ff',
      color: '#7c3aed'
    }
  ]

  const upcomingAppointment = appointments.find(a => a.status === 'CONFIRMED' || a.status === 'PENDING')

  return (
    <PatientPageShell
      title={t('dashboard.title')}
      subtitle={t('dashboard.subtitle')}
      maxWidth="lg"
      actions={
        <Button
          variant="contained"
          onClick={() => navigate('/patient/appointments/book-appointment')}
          sx={{
            borderRadius: 3,
            bgcolor: '#10b981',
            '&:hover': { bgcolor: '#059669' },
            fontWeight: 700,
            px: 3,
            py: 1.2,
            boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
          }}
        >
          {t('dashboard.book_appointment')}
        </Button>
      }
    >
      <Stack spacing={3}>
        {/* KPI / Stats Section */}
        <Grid container spacing={2.5}>
          <Grid item xs={12} sm={6} md={4}>
            <DashboardCard
              title={t('dashboard.upcoming_appointment')}
              value={upcomingAppointment ? upcomingAppointment.appointmentTime : 'None'}
              subtitle={upcomingAppointment ? upcomingAppointment.doctorName : t('dashboard.no_upcoming')}
              icon={Clock}
              color="#2563eb"
              onClick={() => navigate('/patient/appointments')}
              loading={loading}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <DashboardCard
              title={t('dashboard.medical_records')}
              value={records.length}
              subtitle={t('dashboard.total_records')}
              icon={FileText}
              color="#059669"
              onClick={() => navigate('/patient/records')}
              loading={loading}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <DashboardCard
              title={t('dashboard.active_tickets')}
              value={tickets.filter(t => t.status !== 'CLOSED' && t.status !== 'COMPLETED').length}
              subtitle={t('dashboard.triage_status')}
              icon={Stethoscope}
              color="#7c3aed"
              onClick={() => navigate('/patient/triage-tickets')}
              loading={loading}
            />
          </Grid>
        </Grid>

        {/* Quick Start / Banner */}
        <Paper
          sx={{
            p: { xs: 3, md: 4 },
            borderRadius: 4,
            border: '1px solid rgba(16, 185, 129, 0.14)',
            backgroundImage: 'linear-gradient(135deg, rgba(236, 253, 245, 0.95) 0%, rgba(255, 255, 255, 0.96) 100%)'
          }}
        >
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={3}
            justifyContent="space-between"
            alignItems={{ xs: 'flex-start', md: 'center' }}
          >
            <Box sx={{ maxWidth: 720 }}>
              <Chip
                label={t('dashboard.quick_title')}
                size="small"
                sx={{
                  mb: 2,
                  fontWeight: 800,
                  bgcolor: 'rgba(16, 185, 129, 0.12)',
                  color: '#065f46'
                }}
              />
              <Typography variant="h5" sx={{ fontWeight: 900, color: '#0f172a', mb: 1 }}>
                {t('dashboard.quick_desc')}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.75 }}>
                {t('dashboard.subtitle')}
              </Typography>
            </Box>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} sx={{ width: { xs: '100%', md: 'auto' } }}>
              <Button
                variant="contained"
                onClick={() => navigate('/patient/appointments/book-appointment')}
                sx={{
                  borderRadius: 3,
                  bgcolor: '#10b981',
                  '&:hover': { bgcolor: '#059669' },
                  fontWeight: 700,
                  px: 3,
                  py: 1.2,
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.24)',
                  width: { xs: '100%', sm: 'auto' }
                }}
              >
                {t('dashboard.book_appointment')}
              </Button>
              <Button
                variant="outlined"
                onClick={() => navigate('/patient/appointments')}
                sx={{
                  borderRadius: 3,
                  fontWeight: 700,
                  px: 3,
                  py: 1.2,
                  width: { xs: '100%', sm: 'auto' }
                }}
              >
                {t('dashboard.view_appointments')}
              </Button>
            </Stack>
          </Stack>
        </Paper>

        <Grid container spacing={3}>
          {/* Quick Actions Grid */}
          <Grid item xs={12} md={7}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
                {t('dashboard.quick_title')}
              </Typography>
              <Grid container spacing={2.5}>
                {quickActions.map((action) => {
                  const Icon = action.icon
                  return (
                    <Grid item xs={12} sm={6} key={action.to}>
                      <Card
                        onClick={() => navigate(action.to)}
                        sx={{
                          height: '100%',
                          cursor: 'pointer',
                          borderRadius: 4,
                          border: '1px solid #e2e8f0',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: '0 14px 32px rgba(16, 185, 129, 0.12)',
                            borderColor: '#10b981'
                          }
                        }}
                      >
                        <CardContent sx={{ p: 2.5 }}>
                          <Stack spacing={1.5}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <Box sx={{
                                width: 44, height: 44, borderRadius: 2,
                                bgcolor: action.bg, color: action.color,
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                              }}>
                                <Icon size={20} />
                              </Box>
                              <ChevronRight size={18} color="#94a3b8" />
                            </Box>
                            <Box>
                              <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 0.5 }}>
                                {action.label}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                                {action.desc}
                              </Typography>
                            </Box>
                          </Stack>
                        </CardContent>
                      </Card>
                    </Grid>
                  )
                })}
              </Grid>
            </Box>
          </Grid>

          {/* Recent Records / Timeline Preview */}
          <Grid item xs={12} md={5}>
            <Paper sx={{ p: 3, borderRadius: 4, border: '1px solid #e2e8f0', height: '100%' }}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
                {t('dashboard.recent_records')}
              </Typography>
              <Stack spacing={2}>
                {loading ? (
                  [1, 2, 3].map(i => <Box key={i} sx={{ height: 60, bgcolor: '#f1f5f9', borderRadius: 2, animation: 'pulse 1.5s infinite' }} />)
                ) : records.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                    {t('dashboard.no_records_yet')}
                  </Typography>
                ) : (
                  records.slice(0, 5).map((record, idx) => (
                    <Box key={record.id}>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Box sx={{ 
                          width: 8, height: 8, borderRadius: '50%', 
                          bgcolor: idx === 0 ? '#10b981' : '#cbd5e1' 
                        }} />
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                            {record.diagnosis}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(record.createdAt).toLocaleDateString()} · {record.doctorName}
                          </Typography>
                        </Box>
                        <ChevronRight size={14} color="#94a3b8" />
                      </Stack>
                      {idx < Math.min(records.length, 5) - 1 && <Divider sx={{ mt: 1.5, mb: 0.5 }} />}
                    </Box>
                  ))
                )}
                {records.length > 5 && (
                  <Button 
                    fullWidth 
                    variant="text" 
                    size="small" 
                    onClick={() => navigate('/patient/records')}
                    sx={{ fontWeight: 700, color: '#10b981' }}
                  >
                    {t('dashboard.view_all_records')}
                  </Button>
                )}
              </Stack>
            </Paper>
          </Grid>
        </Grid>

        {/* Support Footer */}
        <Paper
          sx={{
            p: { xs: 3, md: 4 },
            borderRadius: 4,
            bgcolor: '#f8fafc',
            border: '1px solid #e2e8f0'
          }}
        >
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            justifyContent="space-between"
            alignItems={{ xs: 'flex-start', md: 'center' }}
          >
            <Box sx={{ maxWidth: 720 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5 }}>
                {t('dashboard.support_title')}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                {t('dashboard.support_desc')}
              </Typography>
            </Box>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} sx={{ width: { xs: '100%', md: 'auto' } }}>
              <Button
                variant="outlined"
                startIcon={<PhoneCall size={16} />}
                onClick={() => navigate('/contact')}
                sx={{
                  borderRadius: 3,
                  fontWeight: 700,
                  px: 3,
                  py: 1.2,
                  width: { xs: '100%', sm: 'auto' }
                }}
              >
                {t('dashboard.contact_support')}
              </Button>
              <Button
                variant="contained"
                color="error"
                onClick={() => navigate('/emergency')}
                sx={{
                  borderRadius: 3,
                  fontWeight: 700,
                  px: 3,
                  py: 1.2,
                  width: { xs: '100%', sm: 'auto' }
                }}
              >
                {t('dashboard.emergency')}
              </Button>
            </Stack>
          </Stack>
        </Paper>
      </Stack>
    </PatientPageShell>
  )
}

