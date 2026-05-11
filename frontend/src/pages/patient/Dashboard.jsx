import { Box, Button, Card, CardContent, Chip, Grid, Paper, Stack, Typography } from '@mui/material'
import { CalendarDays, ChevronRight, ClipboardList, FileText, PhoneCall } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import PatientPageShell from '../../components/patient/PatientPageShell'

export default function Dashboard() {
  const navigate = useNavigate()
  const { t } = useTranslation()

  const actions = [
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

  const handleCardKeyDown = (event, to) => {
    if (event.target !== event.currentTarget) return
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      navigate(to)
    }
  }

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
            width: 'auto',
            minWidth: 0,
            alignSelf: 'flex-end'
          }}
        >
          {t('dashboard.book_appointment')}
        </Button>
      }
    >
      <Stack spacing={3}>
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

        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5 }}>
            {t('dashboard.quick_title')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('dashboard.quick_desc')}
          </Typography>
          <Grid container spacing={2.5} sx={{ mt: 0.5 }}>
            {actions.map((action) => {
              const Icon = action.icon

              return (
                <Grid item xs={12} sm={6} key={action.to}>
                  <Card
                    role="button"
                    tabIndex={0}
                    aria-label={action.label}
                    onClick={() => navigate(action.to)}
                    onKeyDown={(event) => handleCardKeyDown(event, action.to)}
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
                      },
                      '&:focus-visible': {
                        outline: 'none',
                        boxShadow: '0 0 0 4px rgba(16, 185, 129, 0.16)',
                        borderColor: '#10b981'
                      }
                    }}
                  >
                    <CardContent sx={{ p: 2.5 }}>
                      <Stack spacing={1.5}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Box
                            sx={{
                              width: 44,
                              height: 44,
                              borderRadius: 2,
                              bgcolor: action.bg,
                              color: action.color,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
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
