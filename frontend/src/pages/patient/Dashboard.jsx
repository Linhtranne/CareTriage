import { Box, Button, Card, CardContent, Chip, Divider, Grid, Paper, Stack, Typography, alpha } from '@mui/material'
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
      maxWidth={false}
      transparent={true}
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
      <Box sx={{ mt: -2 }}>
        <Stack spacing={4}>
          {/* KPI / Stats Section */}
          <Grid container spacing={3}>
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
                color="#10b981"
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

          <Grid container spacing={5}>
            {/* Quick Actions Grid */}
            <Grid item xs={12} lg={7}>
              <Box>
                <Typography 
                  variant="h4" 
                  sx={{ 
                    fontWeight: 950, 
                    mb: 4, 
                    color: 'oklch(20% 0.05 250)', 
                    letterSpacing: '-0.04em',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2
                  }}
                >
                  {t('dashboard.quick_title')}
                </Typography>
                <Grid container spacing={3}>
                  {quickActions.map((action) => {
                    const Icon = action.icon
                    return (
                      <Grid item xs={12} sm={6} key={action.to}>
                        <Box
                          onClick={() => navigate(action.to)}
                          sx={{
                            p: 3,
                            height: '100%',
                            cursor: 'pointer',
                            borderRadius: 5,
                            border: '1px solid oklch(95% 0.01 250)',
                            bgcolor: 'white',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
                            transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 2.5,
                            '&:hover': {
                              transform: 'translateY(-6px)',
                              borderColor: action.color,
                              boxShadow: `0 20px 40px ${alpha(action.color, 0.08)}`,
                              '& .action-icon-box': { 
                                bgcolor: action.color, 
                                color: 'white',
                                transform: 'scale(1.05)' 
                              },
                              '& .action-chevron': { transform: 'translateX(4px)', color: action.color }
                            }
                          }}
                        >
                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Box className="action-icon-box" sx={{
                              width: 52, height: 52, borderRadius: '16px',
                              bgcolor: alpha(action.color, 0.1), color: action.color,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              transition: 'all 0.4s'
                            }}>
                              <Icon size={24} />
                            </Box>
                            <ChevronRight className="action-chevron" size={20} color="oklch(70% 0.02 250)" style={{ transition: 'all 0.3s' }} />
                          </Stack>
                          <Box>
                            <Typography variant="h6" sx={{ fontWeight: 700, color: 'oklch(20% 0.05 250)', mb: 0.5, letterSpacing: '-0.02em' }}>
                              {action.label}
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'oklch(50% 0.02 250)', fontWeight: 500, lineHeight: 1.5 }}>
                              {action.desc}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                    )
                  })}
                </Grid>
              </Box>
            </Grid>
            
            {/* Recent Records / Timeline Preview */}
            <Grid item xs={12} lg={5}>
              <Box sx={{ 
                p: 4, 
                borderRadius: 6, 
                bgcolor: 'white',
                border: '1px solid oklch(92% 0.02 250)',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
                height: '100%'
              }}>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 4, color: 'oklch(20% 0.05 250)', letterSpacing: '-0.02em' }}>
                  {t('dashboard.recent_records')}
                </Typography>
                <Stack spacing={0}>
                  {loading ? (
                    [1, 2, 3, 4].map(i => <Box key={i} sx={{ height: 80, mb: 2, bgcolor: 'oklch(96% 0.01 250)', borderRadius: 3, animation: 'pulse 1.5s infinite' }} />)
                  ) : records.length === 0 ? (
                    <Box sx={{ py: 8, textAlign: 'center' }}>
                      <FileText size={48} color="oklch(80% 0.02 250)" strokeWidth={1} style={{ marginBottom: 16 }} />
                      <Typography variant="body1" sx={{ color: 'oklch(60% 0.02 250)', fontWeight: 600 }}>
                        {t('dashboard.no_records_yet')}
                      </Typography>
                    </Box>
                  ) : (
                    records.slice(0, 5).map((record, idx) => (
                      <Box 
                        key={record.id} 
                        onClick={() => navigate(`/patient/records/${record.id}`)} 
                        sx={{ 
                          cursor: 'pointer', 
                          py: 2.5, 
                          position: 'relative',
                          '&:hover': { 
                            '& .record-title': { color: '#10b981' },
                            '& .record-dot': { transform: 'scale(1.3)', borderColor: '#10b981' }
                          },
                          '&::before': {
                            content: '""',
                            position: 'absolute',
                            left: 11,
                            top: idx === 0 ? '50%' : 0,
                            bottom: idx === Math.min(records.length, 5) - 1 ? '50%' : 0,
                            width: 2,
                            bgcolor: 'oklch(95% 0.01 250)',
                            display: idx === 0 && records.length === 1 ? 'none' : 'block'
                          }
                        }}
                      >
                        <Stack direction="row" spacing={3} alignItems="center">
                          <Box 
                            className="record-dot"
                            sx={{ 
                              width: 24, height: 24, borderRadius: '50%', 
                              bgcolor: 'white',
                              border: '3px solid oklch(92% 0.02 250)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              zIndex: 1,
                              transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                            }} 
                          >
                             <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: idx === 0 ? '#10b981' : 'oklch(85% 0.01 250)' }} />
                          </Box>

                          <Box sx={{ flex: 1 }}>
                            <Typography className="record-title" variant="h6" sx={{ fontWeight: 700, color: 'oklch(20% 0.05 250)', transition: 'color 0.3s', mb: 0.2, fontSize: '1rem' }}>
                              {record.diagnosis}
                            </Typography>
                            <Stack direction="row" spacing={1.5} alignItems="center">
                              <Typography variant="body2" sx={{ fontWeight: 600, color: 'oklch(50% 0.02 250)' }}>
                                {record.doctorName}
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'oklch(80% 0.01 250)', fontWeight: 800 }}>
                                •
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'oklch(50% 0.02 250)', fontWeight: 600 }}>
                                {new Date(record.createdAt).toLocaleDateString()}
                              </Typography>
                            </Stack>
                          </Box>
                          <ChevronRight size={18} color="oklch(80% 0.01 250)" />
                        </Stack>
                      </Box>
                    ))
                  )}
                  {records.length > 5 && (
                    <Button 
                      fullWidth 
                      variant="text" 
                      onClick={() => navigate('/patient/records')}
                      sx={{ 
                        mt: 2, 
                        fontWeight: 700, 
                        color: '#10b981',
                        fontSize: '0.875rem',
                        py: 1.5,
                        borderRadius: 3,
                        textTransform: 'none',
                        '&:hover': { 
                          bgcolor: alpha('#10b981', 0.05),
                        }
                      }}
                    >
                      {t('dashboard.view_all_records')}
                    </Button>
                  )}
                </Stack>
              </Box>
            </Grid>
          </Grid>

          {/* Support Footer */}
          <Box
            sx={{
              p: 6,
              borderRadius: 8,
              bgcolor: 'oklch(98% 0.01 250)',
              border: '1px solid oklch(94% 0.02 250)'
            }}
          >
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={4}
              justifyContent="space-between"
              alignItems={{ xs: 'flex-start', md: 'center' }}
            >
              <Box sx={{ maxWidth: 800 }}>
                <Typography variant="h5" sx={{ fontWeight: 950, mb: 1.5, color: 'oklch(20% 0.05 250)', letterSpacing: '-0.02em' }}>
                  {t('dashboard.support_title')}
                </Typography>
                <Typography variant="body1" sx={{ color: 'oklch(50% 0.02 250)', lineHeight: 1.7, fontWeight: 500 }}>
                  {t('dashboard.support_desc')}
                </Typography>
              </Box>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ width: { xs: '100%', md: 'auto' } }}>
                <Button
                  variant="outlined"
                  startIcon={<PhoneCall size={18} />}
                  onClick={() => navigate('/contact')}
                  sx={{
                    borderRadius: 4,
                    fontWeight: 900,
                    px: 4,
                    py: 1.5,
                    borderWidth: 2,
                    borderColor: 'oklch(20% 0.05 250)',
                    color: 'oklch(20% 0.05 250)',
                    '&:hover': { borderWidth: 2, bgcolor: 'oklch(96% 0.01 250)' },
                    width: { xs: '100%', sm: 'auto' }
                  }}
                >
                  {t('dashboard.contact_support')}
                </Button>
                <Button
                  variant="contained"
                  onClick={() => navigate('/emergency')}
                  sx={{
                    borderRadius: 4,
                    fontWeight: 950,
                    px: 4,
                    py: 1.5,
                    bgcolor: 'oklch(60% 0.15 20)',
                    color: 'white',
                    boxShadow: '0 10px 30px oklch(60% 0.15 20 / 0.3)',
                    '&:hover': { bgcolor: 'oklch(55% 0.15 20)' },
                    width: { xs: '100%', sm: 'auto' }
                  }}
                >
                  {t('dashboard.emergency')}
                </Button>
              </Stack>
            </Stack>
          </Box>
        </Stack>
      </Box>
    </PatientPageShell>
  )
}

