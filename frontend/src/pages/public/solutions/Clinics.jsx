import { 
  Box, 
  Container, 
  Typography, 
  Button, 
  Grid, 
  Paper, 
  Stack, 
  alpha
} from '@mui/material'
import { motion } from 'framer-motion'
import {
  Zap,
  ChevronRight,
  Layout,
  Heart
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import Navbar from '../../../components/public/Navbar'

export default function Clinics() {
  const { t } = useTranslation()

  // Animation Tokens
  const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
  }

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  }

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      bgcolor: '#f0fdf4', // Meadow Mist Ground
      color: '#0f172a',
      overflowX: 'hidden'
    }}>
      <Navbar />
      
      {/* 1. Asymmetric Hero: Clinical Agility */}
      <Box component="section" sx={{ 
        pt: { xs: 18, md: 28 }, 
        pb: { xs: 10, md: 20 },
        position: 'relative',
        background: 'linear-gradient(180deg, #ffffff 0%, rgba(240, 253, 244, 0.4) 100%)',
        borderBottom: '1px solid #e2e8f0'
      }}>
        <Container maxWidth="xl">
          <Grid container spacing={{ xs: 6, lg: 10 }} alignItems="center">
            <Grid item xs={12} lg={7}>
              <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
                <motion.div variants={fadeUp}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                    <Box sx={{ 
                      px: 2, py: 0.5, borderRadius: '999px', bgcolor: alpha('#08bba3', 0.1),
                      color: '#08bba3', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.15em'
                    }}>
                      {t('clinics_solution.hero_badge')}
                    </Box>
                  </Box>
                </motion.div>

                <motion.div variants={fadeUp}>
                  <Typography variant="h1" sx={{ 
                    fontWeight: 900, mb: 4, letterSpacing: '-0.04em',
                    fontSize: { xs: '3.5rem', md: '5rem', lg: '6.5rem' },
                    lineHeight: 0.9, color: '#064e3b',
                    textWrap: 'balance'
                  }}>
                    {t('clinics_solution.hero_title_1')} <br />
                    <span style={{ color: '#08bba3' }}>{t('clinics_solution.hero_title_2')}</span>
                  </Typography>
                </motion.div>

                <motion.div variants={fadeUp}>
                  <Typography variant="body1" sx={{ 
                    color: '#475569', maxWidth: '50ch', mb: 6, fontSize: '1.25rem', lineHeight: 1.6 
                  }}>
                    {t('clinics_solution.hero_desc')}
                  </Typography>
                </motion.div>

                <motion.div variants={fadeUp}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
                    <Button 
                      variant="contained" 
                      disableElevation
                      sx={{ 
                        bgcolor: '#08bba3', color: '#fff', px: 6, py: 2.5, borderRadius: '14px',
                        fontSize: '1.125rem', fontWeight: 800, textTransform: 'none',
                        transition: 'all 0.3s ease',
                        '&:hover': { bgcolor: '#039786', transform: 'translateY(-2px)', boxShadow: '0 12px 24px -10px rgba(8, 187, 163, 0.4)' }
                      }}
                    >
                      {t('clinics_solution.hero_cta_demo')}
                    </Button>
                    <Button 
                      variant="outlined" 
                      endIcon={<ChevronRight size={20} />}
                      sx={{ 
                        borderColor: '#e2e8f0', color: '#0f172a', px: 6, py: 2.5, borderRadius: '14px',
                        fontSize: '1.125rem', fontWeight: 800, textTransform: 'none',
                        '&:hover': { borderColor: '#08bba3', bgcolor: alpha('#08bba3', 0.04) }
                      }}
                    >
                      {t('clinics_solution.hero_cta_pricing')}
                    </Button>
                  </Stack>
                </motion.div>
              </motion.div>
            </Grid>

            {/* Visual Flair: Floating App Shell Preview */}
            <Grid item xs={12} lg={5}>
              <motion.div
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              >
                <Paper sx={{ 
                  p: 2, borderRadius: '32px', bgcolor: '#ffffff',
                  boxShadow: '0 40px 80px rgba(0,0,0,0.05)',
                  border: '1px solid #e2e8f0',
                  position: 'relative'
                }}>
                  <Box sx={{ p: 3, bgcolor: '#f8fafc', borderRadius: '24px' }}>
                    <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
                      <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#ff5f57' }} />
                      <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#febc2e' }} />
                      <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#28c840' }} />
                    </Box>
                    <Stack spacing={2}>
                      <Box sx={{ h: 40, bgcolor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                      <Grid container spacing={2}>
                        <Grid item xs={4}>
                          <Box sx={{ height: 120, bgcolor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                        </Grid>
                        <Grid item xs={8}>
                          <Box sx={{ height: 120, bgcolor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', p: 2 }}>
                            <Box sx={{ width: '60%', height: 10, bgcolor: '#f1f5f9', mb: 1 }} />
                            <Box sx={{ width: '40%', height: 10, bgcolor: '#f1f5f9' }} />
                          </Box>
                        </Grid>
                      </Grid>
                    </Stack>
                  </Box>
                  {/* Floating Action Badge */}
                  <Paper sx={{ 
                    position: 'absolute', bottom: -20, right: 40, p: 2, px: 3, borderRadius: '16px',
                    bgcolor: '#08bba3', color: '#fff', boxShadow: '0 12px 24px rgba(8, 187, 163, 0.3)',
                    display: 'flex', alignItems: 'center', gap: 2
                  }}>
                    <Zap size={20} />
                    <Typography variant="caption" sx={{ fontWeight: 800 }}>LIVE_SYNC_READY</Typography>
                  </Paper>
                </Paper>
              </motion.div>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* 2. Feature Bento: Clinical Power */}
      <Box sx={{ py: { xs: 12, md: 20 }, px: 3 }}>
        <Container maxWidth="xl">
          <Grid container spacing={4}>
            {/* Feature 1: Setup */}
            <Grid item xs={12} md={4}>
              <Paper sx={{ 
                p: 6, height: '100%', borderRadius: '40px', bgcolor: '#ffffff',
                border: '1px solid #e2e8f0', transition: 'all 0.3s ease',
                '&:hover': { transform: 'translateY(-8px)', borderColor: '#08bba3' }
              }}>
                <Box sx={{ width: 56, height: 56, borderRadius: '18px', bgcolor: alpha('#08bba3', 0.1), color: '#08bba3', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 4 }}>
                  <Layout size={28} />
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 900, mb: 2, color: '#064e3b' }}>
                  {t('clinics_solution.feat_setup_title')}
                </Typography>
                <Typography variant="body1" sx={{ color: '#64748b', lineHeight: 1.6 }}>
                  {t('clinics_solution.feat_setup_desc')}
                </Typography>
              </Paper>
            </Grid>

            {/* Feature 2: Automation (Larger) */}
            <Grid item xs={12} md={8}>
              <Paper sx={{ 
                p: 6, height: '100%', borderRadius: '40px', bgcolor: '#064e3b', color: '#fff',
                border: 'none', transition: 'all 0.3s ease',
                '&:hover': { transform: 'translateY(-8px)', bgcolor: '#042f24' }
              }}>
                <Grid container spacing={4} alignItems="center">
                  <Grid item xs={12} md={7}>
                    <Box sx={{ width: 56, height: 56, borderRadius: '18px', bgcolor: 'rgba(255,255,255,0.1)', color: '#08bba3', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 4 }}>
                      <Zap size={28} />
                    </Box>
                    <Typography variant="h3" sx={{ fontWeight: 900, mb: 2 }}>
                      {t('clinics_solution.feat_automation_title')}
                    </Typography>
                    <Typography variant="body1" sx={{ opacity: 0.7, fontSize: '1.125rem' }}>
                      {t('clinics_solution.feat_automation_desc')}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={5}>
                    <Box sx={{ p: 3, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: '24px', textAlign: 'center' }}>
                      <Typography variant="h2" sx={{ fontWeight: 900, color: '#08bba3' }}>-4.2h</Typography>
                      <Typography variant="caption" sx={{ opacity: 0.6, fontWeight: 700 }}>PAPERWORK / DAY</Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            {/* Feature 3: Loyalty */}
            <Grid item xs={12}>
              <Paper sx={{ 
                p: { xs: 6, md: 10 }, borderRadius: '40px', bgcolor: '#ffffff',
                border: '1px solid #e2e8f0', transition: 'all 0.3s ease',
                '&:hover': { borderColor: '#08bba3' }
              }}>
                <Grid container spacing={6} alignItems="center">
                  <Grid item xs={12} md={6}>
                    <Box sx={{ width: 56, height: 56, borderRadius: '18px', bgcolor: alpha('#08bba3', 0.1), color: '#08bba3', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 4 }}>
                      <Heart size={28} />
                    </Box>
                    <Typography variant="h3" sx={{ fontWeight: 900, mb: 2, color: '#064e3b' }}>
                      {t('clinics_solution.feat_loyalty_title')}
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#64748b', fontSize: '1.125rem' }}>
                      {t('clinics_solution.feat_loyalty_desc')}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Stack direction="row" spacing={3} justifyContent="center">
                      {[
                        { label: 'Follow-ups', val: 'Auto' },
                        { label: 'Patient Rating', val: '4.9/5' },
                        { label: 'Security', val: 'HIPAA' }
                      ].map((chip, i) => (
                        <Box key={i} sx={{ px: 3, py: 2, bgcolor: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                          <Typography variant="h6" sx={{ fontWeight: 900, color: '#08bba3' }}>{chip.val}</Typography>
                          <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 800 }}>{chip.label}</Typography>
                        </Box>
                      ))}
                    </Stack>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* 3. CTA Footer */}
      <Box sx={{ py: 20, px: 3, background: '#064e3b', color: '#fff', textAlign: 'center' }}>
        <Container maxWidth="md">
          <Typography variant="h2" sx={{ fontWeight: 900, mb: 4, fontSize: { xs: '3rem', md: '5rem' }, letterSpacing: '-0.04em' }}>
            {t('clinics_solution.footer_cta_title')}
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.7, mb: 10, fontWeight: 400 }}>
            {t('clinics_solution.footer_cta_desc')}
          </Typography>
          <Button 
            variant="contained" 
            sx={{ 
              bgcolor: '#ffffff', color: '#064e3b', px: 8, py: 2.5, borderRadius: '999px',
              fontSize: '1.25rem', fontWeight: 900, textTransform: 'none',
              '&:hover': { bgcolor: '#f1f5f9', transform: 'scale(1.05)' }
            }}
          >
            {t('clinics_solution.footer_cta_btn')}
          </Button>
        </Container>
      </Box>
    </Box>
  )
}
