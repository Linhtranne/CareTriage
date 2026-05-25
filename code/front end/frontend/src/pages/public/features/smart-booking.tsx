import { useMemo, useState, useEffect } from 'react'
import { Box, Container, Typography, Grid, Button, Paper, Avatar } from '@mui/material'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, Clock, Bell, ArrowRight, ShieldCheck, Zap, Users, BarChart3 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import Navbar from '../../../components/public/navbar'

export default function SmartBooking() {
  const { t } = useTranslation()

  const translatedPatients = useMemo(
    () => ([
      { id: 1, name: t('smart_booking_page.sim_patient_1'), status: t('smart_booking_page.sim_status_waiting'), type: t('smart_booking_page.sim_type_standard'), priority: 'normal' },
      { id: 2, name: t('smart_booking_page.sim_patient_2'), status: t('smart_booking_page.sim_status_priority'), type: t('smart_booking_page.sim_type_urgent'), priority: 'urgent' },
      { id: 3, name: t('smart_booking_page.sim_patient_3'), status: t('smart_booking_page.sim_status_waiting'), type: t('smart_booking_page.sim_type_standard'), priority: 'normal' },
    ]),
    [t]
  )
  const [queueOrder, setQueueOrder] = useState([1, 2, 3])

  const queue = useMemo(
    () => queueOrder.map(id => translatedPatients.find(item => item.id === id)).filter(Boolean),
    [queueOrder, translatedPatients]
  )

  // Simple shuffle animation to show priority shift
  useEffect(() => {
    const timer = setInterval(() => {
      setQueueOrder(prev => {
        const next = [...prev]
        const urgentId = translatedPatients.find(item => item.priority === 'urgent')?.id
        const urgentIdx = urgentId ? next.indexOf(urgentId) : -1
        if (urgentIdx > 0) {
          const [urgent] = next.splice(urgentIdx, 1)
          next.unshift(urgent)
        } else {
          const [first, ...rest] = next
          return [...rest, first]
        }
        return next
      })
    }, 5000)
    return () => clearInterval(timer)
  }, [translatedPatients])

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  }

  const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
  }

  return (
    <Box sx={{ minHeight: '100vh', background: 'background.default', color: 'text.primary', overflowX: 'hidden' }}>
      <Navbar />
      
      {/* 1. Overdrive Hero Section - Live Priority Simulation */}
      <Box sx={{ 
        pt: { xs: 20, md: 32 }, pb: { xs: 12, md: 24 }, px: 3, 
        position: 'relative', background: 'background.paper',
        borderBottom: '1px solid #e2e8f0'
      }}>
        <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1 }}>
          <Grid container spacing={8} alignItems="center">
            <Grid item xs={12} lg={6}>
              <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
                <motion.div variants={fadeUp}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                    <Box sx={{ 
                      px: 2, py: 0.5, borderRadius: '100px', background: 'rgba(8, 187, 163, 0.1)',
                      color: '#08bba3', fontSize: '0.875rem', fontWeight: 800, letterSpacing: '0.1em'
                    }}>
                      {t('smart_booking_page.hero_badge')}
                    </Box>
                    <Box sx={{ width: 40, height: 1, background: '#e2e8f0' }} />
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                      {t('smart_booking_page.hero_engine')}
                    </Typography>
                  </Box>
                </motion.div>
                
                <motion.div variants={fadeUp}>
                  <Typography variant="h1" sx={{ 
                    fontWeight: 900, mb: 4, letterSpacing: '-0.04em',
                    fontSize: { xs: '3.5rem', md: '5.5rem', lg: '7rem' },
                    lineHeight: 0.9, color: 'primary.900'
                  }}>
                    {t('smart_booking_page.hero_title_1')} <br />
                    <span style={{ color: '#08bba3' }}>{t('smart_booking_page.hero_title_2')}</span>
                  </Typography>
                </motion.div>

                <motion.div variants={fadeUp}>
                  <Typography variant="h5" sx={{ color: 'text.secondary', maxWidth: '55ch', mb: 6, lineHeight: 1.6 }}>
                    {t('smart_booking_page.hero_desc')}
                  </Typography>
                </motion.div>

                <motion.div variants={fadeUp}>
                  <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                    <Button 
                      variant="contained" 
                      size="large"
                      sx={{ 
                        background: 'primary.900', color: 'background.paper', borderRadius: '100px', px: 5, py: 2.5,
                        fontSize: '1.125rem', fontWeight: 800, textTransform: 'none',
                        '&:hover': { background: 'text.primary' }
                      }}
                    >
                      {t('smart_booking_page.hero_cta_start')}
                    </Button>
                    <Button 
                      variant="outlined" 
                      size="large"
                      endIcon={<ArrowRight size={20} />}
                      sx={{ 
                        borderColor: '#e2e8f0', color: 'text.primary', borderRadius: '100px', px: 5, py: 2.5,
                        fontSize: '1.125rem', fontWeight: 800, textTransform: 'none',
                        '&:hover': { background: 'background.default', borderColor: '#cbd5e1' }
                      }}
                    >
                      {t('smart_booking_page.hero_cta_docs')}
                    </Button>
                  </Box>
                </motion.div>
              </motion.div>
            </Grid>

            {/* Live Queue Simulation */}
            <Grid item xs={12} lg={6}>
              <Box sx={{ position: 'relative' }}>
                <Box sx={{ 
                  p: 4, background: 'background.default', borderRadius: '40px', border: '1px solid #e2e8f0',
                  boxShadow: '0 40px 80px rgba(0,0,0,0.05)', position: 'relative'
                }}>
                  <Typography variant="overline" sx={{ fontWeight: 800, color: 'text.secondary', mb: 3, display: 'block' }}>
                    {t('smart_booking_page.sim_queue_title')}
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <AnimatePresence mode="popLayout">
                      {queue.map((patient) => (
                        <motion.div
                          key={patient.id}
                          layout
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        >
                          <Paper sx={{ 
                            p: 3, borderRadius: '20px', background: 'background.paper', border: '1px solid #e2e8f0',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            boxShadow: patient.priority === 'urgent' ? '0 10px 20px rgba(244, 63, 94, 0.1)' : 'none',
                            borderColor: patient.priority === 'urgent' ? '#f43f5e' : '#e2e8f0'
                          }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Avatar sx={{ bgcolor: patient.priority === 'urgent' ? '#f43f5e' : '#08bba3', fontWeight: 800 }}>
                                {patient.name[0]}
                              </Avatar>
                              <Box>
                                <Typography variant="body1" sx={{ fontWeight: 700 }}>{patient.name}</Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                                  ID: 0402{patient.id} • <span style={{ color: patient.priority === 'urgent' ? '#f43f5e' : '#08bba3' }}>{patient.type}</span>
                                </Typography>
                              </Box>
                            </Box>
                            <Box sx={{ 
                              px: 2, py: 0.5, borderRadius: '100px', 
                              background: patient.priority === 'urgent' ? 'rgba(244, 63, 94, 0.1)' : 'rgba(8, 187, 163, 0.1)',
                              color: patient.priority === 'urgent' ? '#f43f5e' : '#08bba3',
                              fontSize: '0.75rem', fontWeight: 800
                            }}>
                              {patient.status}
                            </Box>
                          </Paper>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </Box>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* 2. Bento-lite Grid */}
      <Box sx={{ py: { xs: 12, md: 20 }, px: 3, background: 'background.default' }}>
        <Container maxWidth="xl">
          <Grid container spacing={4}>
            {/* Real-time Sync - Large Bento */}
            <Grid item xs={12} md={8}>
              <Paper sx={{ 
                p: { xs: 4, md: 8 }, height: '100%', borderRadius: '40px',
                background: 'background.paper', border: '1px solid #e2e8f0',
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                transition: 'all 0.4s ease', '&:hover': { transform: 'translateY(-10px)', borderColor: '#08bba3' }
              }}>
                <Box>
                  <Box sx={{ width: 64, height: 64, borderRadius: '20px', background: 'rgba(8, 187, 163, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#08bba3', mb: 4 }}>
                    <Calendar size={32} />
                  </Box>
                  <Typography variant="h3" sx={{ fontWeight: 900, mb: 3, letterSpacing: '-0.02em', color: 'primary.900' }}>
                    {t('smart_booking_page.feat_sync_title')}
                  </Typography>
                  <Typography variant="h6" sx={{ color: 'text.secondary', fontWeight: 400, maxWidth: '40ch', mb: 6 }}>
                    {t('smart_booking_page.feat_sync_desc')}
                  </Typography>
                </Box>
                <Grid container spacing={3}>
                  {[t('smart_booking_page.feat_sync_tag1'), t('smart_booking_page.feat_sync_tag2'), t('smart_booking_page.feat_sync_tag3')].map((tag) => (
                    <Grid item key={tag}>
                      <Box sx={{ px: 3, py: 1, borderRadius: '100px', border: '1px solid #e2e8f0', color: 'text.primary', fontWeight: 700, fontSize: '0.875rem' }}>
                        {tag}
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            </Grid>

            {/* Load Balancing - Drenched Bento */}
            <Grid item xs={12} md={4}>
              <Paper sx={{ 
                p: { xs: 4, md: 6 }, height: '100%', borderRadius: '40px',
                background: 'primary.900', color: 'background.paper',
                display: 'flex', flexDirection: 'column',
                transition: 'all 0.4s ease', '&:hover': { transform: 'translateY(-10px)', background: '#042f24' }
              }}>
                <Box sx={{ width: 64, height: 64, borderRadius: '20px', background: 'color-mix(in srgb, var(--color-surface-50) 10%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#08bba3', mb: 4 }}>
                  <BarChart3 size={32} />
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 900, mb: 3, letterSpacing: '-0.02em' }}>
                  {t('smart_booking_page.feat_priority_title')}
                </Typography>
                <Typography variant="body1" sx={{ color: 'color-mix(in srgb, var(--color-surface-50) 70%, transparent)', fontSize: '1.125rem', lineHeight: 1.6, mb: 6 }}>
                  {t('smart_booking_page.feat_priority_desc')}
                </Typography>
                <Box sx={{ mt: 'auto', pt: 4, borderTop: '1px solid color-mix(in srgb, var(--color-surface-50) 10%, transparent)' }}>
                  <Typography variant="h3" sx={{ fontWeight: 900, color: '#08bba3', mb: 1 }}>98%</Typography>
                  <Typography variant="overline" sx={{ fontWeight: 800, opacity: 0.6 }}>{t('smart_booking_page.feat_priority_label')}</Typography>
                </Box>
              </Paper>
            </Grid>

            {/* Reminders - Horizontal Bento */}
            <Grid item xs={12}>
              <Paper sx={{ 
                p: { xs: 4, md: 8 }, borderRadius: '40px',
                background: 'background.paper', border: '1px solid #e2e8f0',
                transition: 'all 0.4s ease', '&:hover': { transform: 'translateY(-10px)', borderColor: '#08bba3' }
              }}>
                <Grid container spacing={8} alignItems="center">
                  <Grid item xs={12} md={6}>
                    <Box sx={{ width: 64, height: 64, borderRadius: '20px', background: 'rgba(8, 187, 163, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#08bba3', mb: 4 }}>
                      <Bell size={32} />
                    </Box>
                    <Typography variant="h3" sx={{ fontWeight: 900, mb: 3, color: 'primary.900' }}>
                      {t('smart_booking_page.feat_reminder_title')}
                    </Typography>
                    <Typography variant="h6" sx={{ color: 'text.secondary', fontWeight: 400, maxWidth: '50ch' }}>
                      {t('smart_booking_page.feat_reminder_desc')}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ position: 'relative', width: '100%', height: '100%', minHeight: 200, display: 'flex', justifyContent: 'center' }}>
                      <motion.div
                        animate={{ y: [0, -10, 0] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <Paper sx={{ p: 3, borderRadius: '24px', background: 'text.primary', color: 'background.paper', maxWidth: 320, border: '1px solid #1e293b' }}>
                          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                            <Box sx={{ p: 1, borderRadius: '10px', background: '#08bba3' }}>
                              <Zap size={20} color='background.paper' />
                            </Box>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 800 }}>{t('smart_booking_page.alert_title')}</Typography>
                              <Typography variant="caption" sx={{ opacity: 0.6 }}>{t('smart_booking_page.alert_time')}</Typography>
                            </Box>
                          </Box>
                          <Typography variant="body2" sx={{ lineHeight: 1.5 }}>
                            {t('smart_booking_page.alert_msg')}
                          </Typography>
                        </Paper>
                      </motion.div>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* 3. Logic Visualization */}
      <Box sx={{ py: 20, px: 3, background: 'background.paper' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 12 }}>
            <Typography variant="h2" sx={{ fontWeight: 900, color: 'primary.900' }}>
              {t('smart_booking_page.process_title')}
            </Typography>
          </Box>
          <Grid container spacing={4}>
            {[
              { icon: <Users />, title: t('smart_booking_page.process_step_1_title'), desc: t('smart_booking_page.process_step_1_desc') },
              { icon: <Clock />, title: t('smart_booking_page.process_step_2_title'), desc: t('smart_booking_page.process_step_2_desc') },
              { icon: <Zap />, title: t('smart_booking_page.process_step_3_title'), desc: t('smart_booking_page.process_step_3_desc') },
              { icon: <ShieldCheck />, title: t('smart_booking_page.process_step_4_title'), desc: t('smart_booking_page.process_step_4_desc') }
            ].map((step, idx) => (
              <Grid item xs={12} sm={6} md={3} key={idx}>
                <Box sx={{ textAlign: 'center' }}>
                  <Box sx={{ 
                    width: 72, height: 72, borderRadius: '24px', background: 'background.default',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    mx: 'auto', mb: 3, color: '#08bba3', border: '1px solid #e2e8f0'
                  }}>
                    {step.icon}
                  </Box>
                  <Typography variant="h5" sx={{ fontWeight: 800, mb: 1, color: 'primary.900' }}>{step.title}</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>{step.desc}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* 4. Footer CTA */}
      <Box sx={{ py: 20, px: 3, background: 'primary.900', color: 'background.paper', overflow: 'hidden', position: 'relative' }}>
        <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h2" sx={{ fontWeight: 900, mb: 4, fontSize: { xs: '3rem', md: '5rem' }, letterSpacing: '-0.03em' }}>
              {t('smart_booking_page.footer_cta_title')}
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.7, mb: 8, fontWeight: 400, maxWidth: '60ch', mx: 'auto' }}>
              {t('smart_booking_page.footer_cta_desc')}
            </Typography>
            <Box sx={{ display: 'flex', gap: 3, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button 
                variant="contained" 
                sx={{ 
                  background: 'background.paper', color: 'primary.900', borderRadius: '100px', px: 6, py: 2.5,
                  fontSize: '1.25rem', fontWeight: 800, textTransform: 'none',
                  '&:hover': { background: 'background.default', transform: 'scale(1.05)' }
                }}
              >
                {t('smart_booking_page.footer_cta_btn_biz')}
              </Button>
              <Button 
                variant="outlined" 
                sx={{ 
                  borderColor: 'color-mix(in srgb, var(--color-surface-50) 30%, transparent)', color: 'background.paper', borderRadius: '100px', px: 6, py: 2.5,
                  fontSize: '1.25rem', fontWeight: 800, textTransform: 'none',
                  '&:hover': { borderColor: 'background.paper', background: 'color-mix(in srgb, var(--color-surface-50) 10%, transparent)' }
                }}
              >
                {t('smart_booking_page.footer_cta_btn_demo')}
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>
    </Box>
  )
}
