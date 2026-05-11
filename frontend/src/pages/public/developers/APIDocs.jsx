import React from 'react'
import { Box, Container, Typography, Grid, Button, Paper } from '@mui/material'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { 
  Network, 
  ShieldCheck, 
  ArrowRightLeft, 
  Database,
  Lock,
  Workflow,
  Server
} from 'lucide-react'

// Variants
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}

export default function APIDocs() {
  const { t } = useTranslation()

  const features = [
    {
      icon: <Network size={32} color="#08bba3" strokeWidth={1.5} />,
      title: t('api_docs.feat_1_title'),
      desc: t('api_docs.feat_1_desc')
    },
    {
      icon: <ShieldCheck size={32} color="#08bba3" strokeWidth={1.5} />,
      title: t('api_docs.feat_2_title'),
      desc: t('api_docs.feat_2_desc')
    },
    {
      icon: <Workflow size={32} color="#08bba3" strokeWidth={1.5} />,
      title: t('api_docs.feat_3_title'),
      desc: t('api_docs.feat_3_desc')
    },
    {
      icon: <Server size={32} color="#08bba3" strokeWidth={1.5} />,
      title: t('api_docs.feat_4_title'),
      desc: t('api_docs.feat_4_desc')
    }
  ]

  return (
    <Box sx={{ minHeight: '100vh', background: '#ffffff', overflowX: 'hidden' }}>
      
      {/* Editorial Hero Section (Restrained) */}
      <Box sx={{ 
        pt: { xs: 20, md: 28 }, pb: { xs: 12, md: 20 }, px: 3, 
        background: '#f0fdf4', 
        borderBottom: '1px solid #e2e8f0',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Abstract Background Pattern */}
        <Box sx={{ 
          position: 'absolute', inset: 0, opacity: 0.4, zIndex: 0,
          backgroundImage: 'radial-gradient(#08bba3 0.5px, transparent 0.5px)',
          backgroundSize: '24px 24px'
        }} />

        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <Grid container spacing={4} justifyContent="center" textAlign="center">
              <Grid item xs={12} md={10}>
                <Typography 
                  variant="overline" 
                  sx={{ color: '#08bba3', fontWeight: 700, letterSpacing: '0.1em', display: 'block', mb: 3 }}
                >
                  {t('api_docs.hero_overline')}
                </Typography>
                <Typography 
                  variant="h1" 
                  sx={{ 
                    fontWeight: 900, mb: 4, letterSpacing: '-0.03em',
                    fontSize: { xs: '3rem', md: '4.5rem', lg: '5.5rem' },
                    lineHeight: 1.1, color: '#064e3b'
                  }}
                >
                  {t('api_docs.hero_title_1')} <br />
                  {t('api_docs.hero_title_2')}
                </Typography>
                <Typography 
                  variant="h5" 
                  sx={{ 
                    color: '#4b5563', lineHeight: 1.7, fontWeight: 400, 
                    fontSize: { xs: '1.125rem', md: '1.35rem' },
                    maxWidth: '60ch', mx: 'auto'
                  }}
                >
                  {t('api_docs.hero_desc')}
                </Typography>
              </Grid>
            </Grid>
          </motion.div>
        </Container>
      </Box>

      {/* Visual Data Flow Section */}
      <Box sx={{ py: { xs: 12, md: 20 }, px: 3 }}>
        <Container maxWidth="xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-10%" }}
            variants={staggerContainer}
          >
            <Grid container spacing={8} alignItems="center">
              <Grid item xs={12} md={5}>
                <motion.div variants={fadeUp}>
                  <Typography variant="h2" sx={{ fontWeight: 900, mb: 3, color: '#0f172a', letterSpacing: '-0.02em', fontSize: { xs: '2.5rem', md: '3.5rem' } }}>
                    {t('api_docs.flow_title')}
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#64748b', fontSize: '1.25rem', lineHeight: 1.8, mb: 4 }}>
                    {t('api_docs.flow_desc')}
                  </Typography>
                </motion.div>
              </Grid>
              
              <Grid item xs={12} md={7}>
                <motion.div variants={fadeUp}>
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    gap: 3,
                    p: { xs: 4, md: 6 },
                    background: '#f8fafc',
                    borderRadius: '24px',
                    border: '1px solid #e2e8f0'
                  }}>
                    {/* Hospital System */}
                    <Box sx={{ textAlign: 'center', flex: 1 }}>
                      <Box sx={{ width: 80, height: 80, mx: 'auto', background: '#ffffff', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0', mb: 2, boxShadow: '0 10px 30px rgba(0,0,0,0.03)' }}>
                        <Database size={32} color="#0f172a" />
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a' }}>{t('api_docs.hospital_sys')}</Typography>
                      <Typography variant="body2" sx={{ color: '#64748b' }}>{t('api_docs.hospital_sub')}</Typography>
                    </Box>

                    {/* Animated Arrow/Data Stream */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#08bba3', gap: 1 }}>
                      <motion.div
                        animate={{ x: [-5, 5, -5] }}
                        transition={{ duration: 3, repeat: Infinity, ease: [0.16, 1, 0.3, 1] }}
                      >
                        <ArrowRightLeft size={32} />
                      </motion.div>
                      
                      {/* Pulse Data Line */}
                      <Box sx={{ width: 120, height: 4, background: 'rgba(8, 187, 163, 0.1)', position: 'relative', overflow: 'hidden', borderRadius: '4px' }}>
                        <motion.div
                          animate={{ x: ['-100%', '250%'] }}
                          transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                          style={{
                            position: 'absolute',
                            top: 0, left: 0, width: '40%', height: '100%',
                            background: 'linear-gradient(90deg, transparent, #08bba3, transparent)'
                          }}
                        />
                        <motion.div
                          animate={{ x: ['-150%', '300%'] }}
                          transition={{ duration: 1.2, repeat: Infinity, ease: "linear", delay: 0.6 }}
                          style={{
                            position: 'absolute',
                            top: 0, left: 0, width: '40%', height: '100%',
                            background: 'linear-gradient(90deg, transparent, #08bba3, transparent)'
                          }}
                        />
                      </Box>
                    </Box>

                    {/* CareTriage AI */}
                    <Box sx={{ textAlign: 'center', flex: 1 }}>
                      <Box sx={{ position: 'relative', width: 80, height: 80, mx: 'auto', mb: 2 }}>
                        {/* Processing Pulse Ring */}
                        <motion.div
                          animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0, 0.6] }}
                          transition={{ duration: 3, repeat: Infinity, ease: [0.16, 1, 0.3, 1] }}
                          style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'rgba(8, 187, 163, 0.3)',
                            borderRadius: '20px',
                            zIndex: 0
                          }}
                        />
                        <Box sx={{ position: 'relative', width: '100%', height: '100%', background: '#064e3b', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 30px rgba(6, 78, 59, 0.2)', zIndex: 1 }}>
                          <Network size={32} color="#ffffff" />
                        </Box>
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#064e3b' }}>{t('api_docs.ai_sys')}</Typography>
                      <Typography variant="body2" sx={{ color: '#08bba3' }}>{t('api_docs.ai_sub')}</Typography>
                    </Box>
                  </Box>
                </motion.div>
              </Grid>
            </Grid>
          </motion.div>
        </Container>
      </Box>

      {/* Features Grid - Staggered Bento-lite Layout */}
      <Box sx={{ background: '#f8fafc', py: { xs: 12, md: 20 }, px: 3 }}>
        <Container maxWidth="xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-10%" }}
            variants={staggerContainer}
          >
            <Grid container spacing={4}>
              {features.map((feat, index) => (
                <Grid 
                  item 
                  xs={12} 
                  md={index % 4 === 0 || index % 4 === 3 ? 7 : 5} 
                  key={index}
                >
                  <motion.div variants={fadeUp} style={{ height: '100%' }}>
                    <Box sx={{ 
                      p: { xs: 4, md: 6 }, 
                      background: '#ffffff', 
                      borderRadius: '32px', 
                      border: '1px solid #e2e8f0',
                      height: '100%',
                      transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                      '&:hover': { 
                        borderColor: '#08bba3',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.04)' 
                      }
                    }}>
                      <Box sx={{ 
                        width: 64, height: 64, 
                        background: '#f0fdf4', 
                        borderRadius: '16px', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', 
                        mb: 4 
                      }}>
                        {feat.icon}
                      </Box>
                      <Typography variant="h4" sx={{ fontWeight: 800, mb: 2, color: '#0f172a', letterSpacing: '-0.02em' }}>
                        {feat.title}
                      </Typography>
                      <Typography variant="body1" sx={{ color: '#64748b', fontSize: '1.25rem', lineHeight: 1.7 }}>
                        {feat.desc}
                      </Typography>
                    </Box>
                  </motion.div>
                </Grid>
              ))}
            </Grid>
          </motion.div>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box sx={{ background: '#064e3b', color: '#ffffff', py: { xs: 12, md: 16 }, px: 3, textAlign: 'center' }}>
        <Container maxWidth="md">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            <Typography variant="h2" sx={{ fontWeight: 900, mb: 3, letterSpacing: '-0.02em', fontSize: { xs: '2.5rem', md: '3.5rem' } }}>
              {t('api_docs.cta_title')}
            </Typography>
            <Typography variant="body1" sx={{ color: '#94a3b8', fontSize: '1.25rem', mb: 6, maxWidth: '50ch', mx: 'auto' }}>
              {t('api_docs.cta_desc')}
            </Typography>
            <Button 
              variant="contained" 
              sx={{ 
                background: '#08bba3', color: '#ffffff', 
                borderRadius: '100px', px: 6, py: 2, 
                fontSize: '1.125rem', fontWeight: 700,
                textTransform: 'none',
                boxShadow: 'none',
                '&:hover': {
                  background: '#20d6bc',
                  boxShadow: '0 8px 25px rgba(8, 187, 163, 0.4)'
                },
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
            >
              {t('api_docs.cta_btn')}
            </Button>
          </motion.div>
        </Container>
      </Box>

    </Box>
  )
}
