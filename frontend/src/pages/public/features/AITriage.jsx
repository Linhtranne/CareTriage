import React from 'react'
import { Box, Container, Typography, Grid, Button, Paper } from '@mui/material'
import { motion } from 'framer-motion'
import { Brain, Activity, Zap, ArrowRight, ShieldCheck, Terminal, Heart } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import Navbar from '../../../components/public/Navbar'

export default function AITriage() {
  const { t } = useTranslation()

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  }

  const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
  }

  return (
    <Box sx={{ minHeight: '100vh', background: '#f8fafc', color: '#0f172a', overflowX: 'hidden' }}>
      <Navbar />
      
      {/* 1. Overdrive Hero Section */}
      <Box sx={{ 
        pt: { xs: 20, md: 32 }, pb: { xs: 12, md: 24 }, px: 3, 
        position: 'relative', background: '#ffffff',
        borderBottom: '1px solid #e2e8f0'
      }}>
        <Box sx={{ 
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
          overflow: 'hidden', pointerEvents: 'none', zIndex: 0
        }}>
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.05, 0.1, 0.05]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            style={{
              position: 'absolute', top: '-20%', left: '50%',
              width: '800px', height: '800px', borderRadius: '50%',
              background: 'radial-gradient(circle, #08bba3 0%, transparent 70%)',
              filter: 'blur(100px)', transform: 'translateX(-50%)'
            }}
          />
        </Box>

        <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1 }}>
          <Grid container spacing={8} alignItems="center">
            <Grid item xs={12} lg={7}>
              <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
                <motion.div variants={fadeUp}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                    <Box sx={{ 
                      px: 2, py: 0.5, borderRadius: '100px', background: 'rgba(8, 187, 163, 0.1)',
                      color: '#08bba3', fontSize: '0.875rem', fontWeight: 800, letterSpacing: '0.1em'
                    }}>
                      {t('ai_triage_page.hero_badge')}
                    </Box>
                    <Box sx={{ width: 40, height: 1, background: '#e2e8f0' }} />
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748b' }}>
                      {t('ai_triage_page.hero_engine')}
                    </Typography>
                  </Box>
                </motion.div>
                
                <motion.div variants={fadeUp}>
                  <Typography variant="h1" sx={{ 
                    fontWeight: 900, mb: 4, letterSpacing: '-0.04em',
                    fontSize: { xs: '3.5rem', md: '5.5rem', lg: '7rem' },
                    lineHeight: 0.9, color: '#064e3b'
                  }}>
                    {t('ai_triage_page.hero_title_1')} <br />
                    <span style={{ color: '#08bba3' }}>{t('ai_triage_page.hero_title_2')}</span>
                  </Typography>
                </motion.div>

                <motion.div variants={fadeUp}>
                  <Typography variant="h5" sx={{ color: '#4b5563', maxWidth: '55ch', mb: 6, lineHeight: 1.6 }}>
                    {t('ai_triage_page.hero_desc')}
                  </Typography>
                </motion.div>

                <motion.div variants={fadeUp}>
                  <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                    <Button 
                      variant="contained" 
                      size="large"
                      sx={{ 
                        background: '#064e3b', color: '#ffffff', borderRadius: '100px', px: 5, py: 2.5,
                        fontSize: '1.125rem', fontWeight: 800, textTransform: 'none',
                        '&:hover': { background: '#0f172a' }
                      }}
                    >
                      {t('ai_triage_page.hero_cta_start')}
                    </Button>
                    <Button 
                      variant="outlined" 
                      size="large"
                      endIcon={<ArrowRight size={20} />}
                      sx={{ 
                        borderColor: '#e2e8f0', color: '#0f172a', borderRadius: '100px', px: 5, py: 2.5,
                        fontSize: '1.125rem', fontWeight: 800, textTransform: 'none',
                        '&:hover': { background: '#f8fafc', borderColor: '#cbd5e1' }
                      }}
                    >
                      {t('ai_triage_page.hero_cta_docs')}
                    </Button>
                  </Box>
                </motion.div>
              </motion.div>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* 2. Bento-lite High-Throughput Grid */}
      <Box sx={{ py: { xs: 12, md: 20 }, px: 3, background: '#f8fafc' }}>
        <Container maxWidth="xl">
          <Grid container spacing={4}>
            <Grid item xs={12} md={8}>
              <Paper sx={{ 
                p: { xs: 4, md: 8 }, height: '100%', borderRadius: '40px',
                background: '#ffffff', border: '1px solid #e2e8f0',
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                transition: 'all 0.4s ease', '&:hover': { transform: 'translateY(-10px)', borderColor: '#08bba3' }
              }}>
                <Box>
                  <Box sx={{ width: 64, height: 64, borderRadius: '20px', background: 'rgba(8, 187, 163, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#08bba3', mb: 4 }}>
                    <Brain size={32} />
                  </Box>
                  <Typography variant="h3" sx={{ fontWeight: 900, mb: 3, letterSpacing: '-0.02em', color: '#064e3b' }}>
                    {t('ai_triage_page.feat_class_title')}
                  </Typography>
                  <Typography variant="h6" sx={{ color: '#64748b', fontWeight: 400, maxWidth: '40ch', mb: 6 }}>
                    {t('ai_triage_page.feat_class_desc')}
                  </Typography>
                </Box>
                <Grid container spacing={3}>
                  {[t('ai_triage_page.feat_class_tag1'), t('ai_triage_page.feat_class_tag2'), t('ai_triage_page.feat_class_tag3')].map((tag) => (
                    <Grid item key={tag}>
                      <Box sx={{ px: 3, py: 1, borderRadius: '100px', border: '1px solid #e2e8f0', color: '#0f172a', fontWeight: 700, fontSize: '0.875rem' }}>
                        {tag}
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            </Grid>

            <Grid item xs={12} md={4}>
              <Paper sx={{ 
                p: { xs: 4, md: 6 }, height: '100%', borderRadius: '40px',
                background: '#064e3b', color: '#ffffff',
                display: 'flex', flexDirection: 'column',
                transition: 'all 0.4s ease', '&:hover': { transform: 'translateY(-10px)', background: '#042f24' }
              }}>
                <Box sx={{ width: 64, height: 64, borderRadius: '20px', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#08bba3', mb: 4 }}>
                  <Activity size={32} className="animate-pulse" />
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 900, mb: 3, letterSpacing: '-0.02em' }}>
                  {t('ai_triage_page.feat_emergency_title')}
                </Typography>
                <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.125rem', lineHeight: 1.6, mb: 6 }}>
                  {t('ai_triage_page.feat_emergency_desc')}
                </Typography>
                <Box sx={{ mt: 'auto', pt: 4, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                  <Typography variant="h2" sx={{ fontWeight: 900, color: '#08bba3', mb: 1 }}>{"<"} 200ms</Typography>
                  <Typography variant="overline" sx={{ fontWeight: 800, opacity: 0.6 }}>{t('ai_triage_page.feat_emergency_latency')}</Typography>
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12}>
              <Paper sx={{ 
                p: { xs: 4, md: 8 }, borderRadius: '40px',
                background: '#ffffff', border: '1px solid #e2e8f0',
                transition: 'all 0.4s ease', '&:hover': { transform: 'translateY(-10px)', borderColor: '#08bba3' }
              }}>
                <Grid container spacing={8} alignItems="center">
                  <Grid item xs={12} md={6}>
                    <Box sx={{ width: 64, height: 64, borderRadius: '20px', background: 'rgba(8, 187, 163, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#08bba3', mb: 4 }}>
                      <Zap size={32} />
                    </Box>
                    <Typography variant="h3" sx={{ fontWeight: 900, mb: 3, color: '#064e3b' }}>
                      {t('ai_triage_page.feat_deep_title')}
                    </Typography>
                    <Typography variant="h6" sx={{ color: '#64748b', fontWeight: 400, maxWidth: '50ch' }}>
                      {t('ai_triage_page.feat_deep_desc')}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ p: 4, background: '#0f172a', borderRadius: '24px', border: '1px solid #1e293b', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
                      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                        <Box sx={{ width: 12, height: 12, borderRadius: '50%', background: '#ff5f57' }} />
                        <Box sx={{ width: 12, height: 12, borderRadius: '50%', background: '#febc2e' }} />
                        <Box sx={{ width: 12, height: 12, borderRadius: '50%', background: '#28c840' }} />
                      </Box>
                      <Box sx={{ fontFamily: 'monospace', color: '#94a3b8', fontSize: '0.875rem', minHeight: '140px' }}>
                        <motion.div
                          initial={{ opacity: 0 }}
                          whileInView={{ opacity: 1 }}
                          transition={{ duration: 0.5 }}
                        >
                          <code style={{ display: 'block', marginBottom: '8px', color: '#08bba3' }}>POST /api/v4/triage/analyze</code>
                          <motion.div
                            initial={{ width: 0 }}
                            whileInView={{ width: '100%' }}
                            transition={{ duration: 2, ease: "linear" }}
                            style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}
                          >
                            <code style={{ color: '#08bba3' }}>{'{'} "symptoms": "Đau ngực, khó thở" {'}'}</code>
                          </motion.div>
                          <motion.div
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            transition={{ delay: 2, duration: 0.5 }}
                          >
                            <code style={{ display: 'block', marginTop: '16px', color: '#facc15' }}>{'>'} ANALYZING_NEURAL_CORE...</code>
                            <code style={{ display: 'block', color: '#4ade80', fontWeight: 800, marginTop: '8px' }}>RESULT: EMERGENCY_RED (0.18s)</code>
                          </motion.div>
                        </motion.div>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* 3. Decision Logic Visual Section - Typeset & Centered */}
      <Box sx={{ py: { xs: 16, md: 24 }, px: 3, background: '#ffffff' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 16 }}>
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <Typography variant="overline" sx={{ color: '#08bba3', fontWeight: 800, letterSpacing: '0.3em' }}>
                {t('ai_triage_page.how_it_works_overline')}
              </Typography>
              <Typography variant="h2" sx={{ 
                fontWeight: 900, mt: 3, color: '#064e3b',
                fontSize: { xs: '2.5rem', md: '4.5rem' }, letterSpacing: '-0.03em',
                lineHeight: 1.1
              }}>
                {t('ai_triage_page.how_it_works_title')}
              </Typography>
            </motion.div>
          </Box>

          <Box sx={{ 
            display: 'flex', 
            flexWrap: 'wrap',
            justifyContent: 'center', 
            alignItems: 'flex-start',
            gap: { xs: 8, md: 0 },
            width: '100%',
            maxWidth: '1200px',
            mx: 'auto'
          }}>
            {[
              { icon: <Terminal size={28} />, title: t('ai_triage_page.step_1_title'), desc: t('ai_triage_page.step_1_desc') },
              { icon: <ShieldCheck size={28} />, title: t('ai_triage_page.step_2_title'), desc: t('ai_triage_page.step_2_desc') },
              { icon: <Brain size={28} />, title: t('ai_triage_page.step_3_title'), desc: t('ai_triage_page.step_3_desc') },
              { icon: <Heart size={28} />, title: t('ai_triage_page.step_4_title'), desc: t('ai_triage_page.step_4_desc') },
            ].map((step, idx) => (
              <Box 
                key={idx}
                sx={{ 
                  width: { xs: '100%', sm: '50%', md: '25%' },
                  px: 2
                }}
              >
                <motion.div 
                  variants={fadeUp} 
                  initial="hidden" 
                  whileInView="visible" 
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Box sx={{ 
                    textAlign: 'center', 
                    position: 'relative', 
                    zIndex: 2
                  }}>
                    {/* The Connector Line - Animated Pulse Flow */}
                    {idx < 3 && (
                      <Box sx={{ 
                        display: { xs: 'none', md: 'block' },
                        position: 'absolute', 
                        top: 40, 
                        left: 'calc(50% + 55px)', 
                        width: 'calc(100% - 110px)', 
                        height: 2,
                        zIndex: 1
                      }}>
                        <Box sx={{ 
                          width: '100%', height: '100%', 
                          borderTop: '2px dashed #e2e8f0',
                          position: 'relative',
                          overflow: 'hidden'
                        }}>
                          <motion.div
                            animate={{ x: ['-100%', '100%'] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "linear", delay: idx * 0.4 }}
                            style={{
                              position: 'absolute', top: 0, left: 0,
                              width: '40px', height: '2px',
                              background: 'linear-gradient(90deg, transparent, #08bba3, transparent)'
                            }}
                          />
                        </Box>
                      </Box>
                    )}

                    <Box sx={{ 
                      width: 80, height: 80, borderRadius: '50%', background: '#ffffff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      mx: 'auto', mb: 4, color: '#064e3b', border: '2px solid #e2e8f0',
                      transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                      position: 'relative',
                      zIndex: 3,
                      '&:hover': { 
                        borderColor: '#08bba3', 
                        transform: 'scale(1.1) rotate(5deg)',
                        boxShadow: '0 10px 30px rgba(8, 187, 163, 0.15)',
                        color: '#08bba3' 
                      }
                    }}>
                      <motion.div
                        animate={{ 
                          scale: [1, 1.1, 1],
                        }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: idx * 0.5 }}
                      >
                        {step.icon}
                      </motion.div>
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 900, mb: 2, color: '#064e3b', fontSize: '1.4rem', letterSpacing: '-0.02em' }}>
                      {step.title}
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#64748b', fontSize: '1rem', lineHeight: 1.6, maxWidth: '20ch', mx: 'auto' }}>
                      {step.desc}
                    </Typography>
                  </Box>
                </motion.div>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      {/* 4. Overdrive Footer CTA */}
      <Box sx={{ py: 20, px: 3, background: '#064e3b', color: '#ffffff', overflow: 'hidden', position: 'relative' }}>
        <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h2" sx={{ fontWeight: 900, mb: 4, fontSize: { xs: '3rem', md: '5rem' }, letterSpacing: '-0.03em' }}>
              {t('ai_triage_page.footer_cta_title')}
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.7, mb: 8, fontWeight: 400, maxWidth: '60ch', mx: 'auto' }}>
              {t('ai_triage_page.footer_cta_desc')}
            </Typography>
            <Box sx={{ display: 'flex', gap: 3, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button 
                variant="contained" 
                sx={{ 
                  background: '#ffffff', color: '#064e3b', borderRadius: '100px', px: 6, py: 2.5,
                  fontSize: '1.25rem', fontWeight: 800, textTransform: 'none',
                  '&:hover': { background: '#f8fafc', transform: 'scale(1.05)' }
                }}
              >
                {t('ai_triage_page.footer_cta_btn_biz')}
              </Button>
              <Button 
                variant="outlined" 
                sx={{ 
                  borderColor: 'rgba(255,255,255,0.3)', color: '#ffffff', borderRadius: '100px', px: 6, py: 2.5,
                  fontSize: '1.25rem', fontWeight: 800, textTransform: 'none',
                  '&:hover': { borderColor: '#ffffff', background: 'rgba(255,255,255,0.1)' }
                }}
              >
                {t('ai_triage_page.footer_cta_btn_contact')}
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>
    </Box>
  )
}
