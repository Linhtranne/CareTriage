import { Box, Container, Typography, Grid, Button, Paper } from '@mui/material'
import { motion } from 'framer-motion'
import { FileText, Database, Share2, ArrowRight, ShieldCheck, Search, Clock, Zap } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import Navbar from '../../../components/public/Navbar'

export default function EHREngine() {
  const { t, i18n } = useTranslation()
  const isEn = i18n.language === 'en'

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  }

  const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
  }

  return (
    <Box sx={{ minHeight: '100vh', background: '#ffffff', color: '#0f172a', overflowX: 'hidden' }}>
      <Navbar />
      
      {/* 1. Overdrive Hero Section - Asymmetric Extraction Visual */}
      <Box sx={{ 
        pt: { xs: 20, md: 32 }, pb: { xs: 12, md: 24 }, px: 3, 
        position: 'relative', background: 'radial-gradient(circle at 70% 30%, rgba(8, 187, 163, 0.05) 0%, transparent 50%)',
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
                      {t('ehr_engine_page.hero_badge')}
                    </Box>
                    <Box sx={{ width: 40, height: 1, background: '#e2e8f0' }} />
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748b' }}>
                      {t('ehr_engine_page.hero_engine')}
                    </Typography>
                  </Box>
                </motion.div>
                
                <motion.div variants={fadeUp}>
                  <Typography variant="h1" sx={{ 
                    fontWeight: 900, mb: 4, letterSpacing: '-0.04em',
                    fontSize: { xs: '3.5rem', md: '5.5rem', lg: '7rem' },
                    lineHeight: 0.9, color: '#064e3b'
                  }}>
                    {t('ehr_engine_page.hero_title_1')} <br />
                    <span style={{ color: '#08bba3' }}>{t('ehr_engine_page.hero_title_2')}</span>
                  </Typography>
                </motion.div>

                <motion.div variants={fadeUp}>
                  <Typography variant="h5" sx={{ color: '#4b5563', maxWidth: '55ch', mb: 6, lineHeight: 1.6 }}>
                    {t('ehr_engine_page.hero_desc')}
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
                      {t('ehr_engine_page.hero_cta_start')}
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
                      {t('ehr_engine_page.hero_cta_docs')}
                    </Button>
                  </Box>
                </motion.div>
              </motion.div>
            </Grid>

            {/* Live Scanning Simulation Mockup */}
            <Grid item xs={12} lg={6}>
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              >
                <Paper sx={{ 
                  p: 4, borderRadius: '40px', background: '#ffffff', border: '1px solid #e2e8f0',
                  boxShadow: '0 40px 80px rgba(0,0,0,0.05)', position: 'relative', overflow: 'hidden'
                }}>
                  <motion.div
                    animate={{ top: ['0%', '100%', '0%'] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    style={{
                      position: 'absolute', left: 0, width: '100%', height: '2px',
                      background: 'linear-gradient(90deg, transparent, #08bba3, transparent)',
                      zIndex: 10, pointerEvents: 'none'
                    }}
                  />
                  <Box sx={{ position: 'relative', zIndex: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
                      <Typography variant="overline" sx={{ fontWeight: 800, color: '#08bba3' }}>{t('ehr_engine_page.sim_live_analysis')}</Typography>
                      <Typography variant="overline" sx={{ fontWeight: 800, color: '#64748b' }}>{t('ehr_engine_page.sim_source')}</Typography>
                    </Box>
                    <Box sx={{ p: 4, background: '#f8fafc', borderRadius: '20px', border: '1px solid #e2e8f0', mb: 4 }}>
                      <Typography variant="body2" sx={{ color: '#064e3b', fontFamily: 'serif', lineHeight: 1.8, fontStyle: 'italic' }}>
                        {isEn ? (
                          <>
                            "Patient reports <span style={{ background: 'rgba(8, 187, 163, 0.2)', borderBottom: '2px solid #08bba3' }}>{t('ehr_engine_page.sim_highlight_cough')}</span> for 3 days. 
                            Prescribed <span style={{ background: 'rgba(244, 63, 94, 0.2)', borderBottom: '2px solid #f43f5e' }}>{t('ehr_engine_page.sim_highlight_amox')}</span> 
                            twice daily. Blood pressure <span style={{ background: 'rgba(59, 130, 246, 0.2)', borderBottom: '2px solid #3b82f6' }}>{t('ehr_engine_page.sim_highlight_bp')}</span>."
                          </>
                        ) : (
                          <>
                            {t('ehr_engine_page.sim_note_prefix')}
                            <span style={{ background: 'rgba(8, 187, 163, 0.2)', borderBottom: '2px solid #08bba3' }}>{t('ehr_engine_page.sim_note_cough')}</span>
                            {t('ehr_engine_page.sim_note_mid')}
                            <span style={{ background: 'rgba(244, 63, 94, 0.2)', borderBottom: '2px solid #f43f5e' }}>{t('ehr_engine_page.sim_note_amox')}</span>
                            {t('ehr_engine_page.sim_note_post')}
                            <span style={{ background: 'rgba(59, 130, 246, 0.2)', borderBottom: '2px solid #3b82f6' }}>{t('ehr_engine_page.sim_note_bp')}</span>
                            {t('ehr_engine_page.sim_note_end')}
                          </>
                        )}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                      {[
                        { label: t('ehr_engine_page.sim_tag_drug'), value: t('ehr_engine_page.sim_val_amox'), color: '#f43f5e' },
                        { label: t('ehr_engine_page.sim_tag_dosage'), value: t('ehr_engine_page.sim_val_500mg'), color: '#f43f5e' },
                        { label: t('ehr_engine_page.sim_tag_symptom'), value: t('ehr_engine_page.sim_val_cough'), color: '#08bba3' },
                        { label: t('ehr_engine_page.sim_tag_vitals'), value: t('ehr_engine_page.sim_val_bp'), color: '#3b82f6' },
                      ].map((tag, idx) => (
                        <motion.div 
                          key={idx}
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 1 + idx * 0.2 }}
                        >
                          <Box sx={{ p: 2, borderRadius: '12px', background: '#ffffff', border: `1px solid ${tag.color}33`, display: 'flex', flexDirection: 'column' }}>
                            <Typography variant="caption" sx={{ color: tag.color, fontWeight: 800 }}>{tag.label}</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a' }}>{tag.value}</Typography>
                          </Box>
                        </motion.div>
                      ))}
                    </Box>
                  </Box>
                </Paper>
              </motion.div>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* 2. Bento-lite High-Throughput Grid */}
      <Box sx={{ py: { xs: 12, md: 20 }, px: 3, background: '#f8fafc' }}>
        <Container maxWidth="xl">
          <Grid container spacing={4}>
            {/* NER Detection - Large Bento */}
            <Grid item xs={12} md={8}>
              <Paper sx={{ 
                p: { xs: 4, md: 8 }, height: '100%', borderRadius: '40px',
                background: '#ffffff', border: '1px solid #e2e8f0',
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                transition: 'all 0.4s ease', '&:hover': { transform: 'translateY(-10px)', borderColor: '#08bba3' }
              }}>
                <Box>
                  <Box sx={{ width: 64, height: 64, borderRadius: '20px', background: 'rgba(8, 187, 163, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#08bba3', mb: 4 }}>
                    <Search size={32} />
                  </Box>
                  <Typography variant="h3" sx={{ fontWeight: 900, mb: 3, letterSpacing: '-0.02em', color: '#064e3b' }}>
                    {t('ehr_engine_page.feat_ner_title')}
                  </Typography>
                  <Typography variant="h6" sx={{ color: '#64748b', fontWeight: 400, maxWidth: '40ch', mb: 6 }}>
                    {t('ehr_engine_page.feat_ner_desc')}
                  </Typography>
                </Box>
                <Grid container spacing={3}>
                  {[t('ehr_engine_page.feat_ner_tag1'), t('ehr_engine_page.feat_ner_tag2'), t('ehr_engine_page.feat_ner_tag3')].map((tag) => (
                    <Grid item key={tag}>
                      <Box sx={{ px: 3, py: 1, borderRadius: '100px', border: '1px solid #e2e8f0', color: '#0f172a', fontWeight: 700, fontSize: '0.875rem' }}>
                        {tag}
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            </Grid>

            {/* Standards - Drenched Bento */}
            <Grid item xs={12} md={4}>
              <Paper sx={{ 
                p: { xs: 4, md: 6 }, height: '100%', borderRadius: '40px',
                background: '#064e3b', color: '#ffffff',
                display: 'flex', flexDirection: 'column',
                transition: 'all 0.4s ease', '&:hover': { transform: 'translateY(-10px)', background: '#042f24' }
              }}>
                <Box sx={{ width: 64, height: 64, borderRadius: '20px', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#08bba3', mb: 4 }}>
                  <Share2 size={32} />
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 900, mb: 3, letterSpacing: '-0.02em' }}>
                  {t('ehr_engine_page.feat_standard_title')}
                </Typography>
                <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.125rem', lineHeight: 1.6, mb: 6 }}>
                  {t('ehr_engine_page.feat_standard_desc')}
                </Typography>
                <Box sx={{ mt: 'auto', pt: 4, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                    <ShieldCheck size={24} color="#08bba3" />
                    <Typography variant="h4" sx={{ fontWeight: 900, color: '#ffffff' }}>HL7 / FHIR</Typography>
                  </Box>
                  <Typography variant="overline" sx={{ fontWeight: 800, opacity: 0.6 }}>{t('ehr_engine_page.feat_standard_compliance')}</Typography>
                </Box>
              </Paper>
            </Grid>

            {/* Patient Timeline - Horizontal Horizontal */}
            <Grid item xs={12}>
              <Paper sx={{ 
                p: { xs: 4, md: 8 }, borderRadius: '40px',
                background: '#ffffff', border: '1px solid #e2e8f0',
                transition: 'all 0.4s ease', '&:hover': { transform: 'translateY(-10px)', borderColor: '#08bba3' }
              }}>
                <Grid container spacing={8} alignItems="center">
                  <Grid item xs={12} md={5}>
                    <Box sx={{ width: 64, height: 64, borderRadius: '20px', background: 'rgba(8, 187, 163, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#08bba3', mb: 4 }}>
                      <Clock size={32} />
                    </Box>
                    <Typography variant="h3" sx={{ fontWeight: 900, mb: 3, color: '#064e3b' }}>
                      {t('ehr_engine_page.feat_timeline_title')}
                    </Typography>
                    <Typography variant="h6" sx={{ color: '#64748b', fontWeight: 400, maxWidth: '50ch' }}>
                      {t('ehr_engine_page.feat_timeline_desc')}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={7}>
                    <Box sx={{ p: 4, background: '#f8fafc', borderRadius: '32px', border: '1px solid #e2e8f0' }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {[
                          { date: '12 May 2026', event: 'Gastroscopy', clinic: 'GI Center' },
                          { date: '15 Jan 2026', event: 'Chest X-Ray', clinic: 'Radiology' },
                          { date: '02 Dec 2025', event: 'Initial Consultation', clinic: 'General Medicine' }
                        ].map((item, idx) => (
                          <Box key={idx} sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                            <Box sx={{ width: 80 }}>
                              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 800 }}>{item.date}</Typography>
                            </Box>
                            <Box sx={{ width: 2, height: 40, background: '#e2e8f0', position: 'relative' }}>
                              <Box sx={{ position: 'absolute', top: 0, left: -4, width: 10, height: 10, borderRadius: '50%', background: idx === 0 ? '#08bba3' : '#cbd5e1' }} />
                            </Box>
                            <Box>
                              <Typography variant="body1" sx={{ fontWeight: 700, color: '#064e3b' }}>{item.event}</Typography>
                              <Typography variant="caption" sx={{ color: '#94a3b8' }}>{item.clinic}</Typography>
                            </Box>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* 3. Extraction Process Visual */}
      <Box sx={{ py: 20, px: 3, background: '#ffffff' }}>
        <Container maxWidth="xl">
          <Box sx={{ textAlign: 'center', mb: 12 }}>
            <Typography variant="overline" sx={{ color: '#08bba3', fontWeight: 800, letterSpacing: '0.3em' }}>
              HOW IT WORKS
            </Typography>
            <Typography variant="h2" sx={{ fontWeight: 900, mt: 2, color: '#064e3b' }}>
              {t('ehr_engine_page.process_title')}
            </Typography>
          </Box>

          <Grid container spacing={4} justifyContent="center">
            {[
              { icon: <FileText />, title: t('ehr_engine_page.process_step_1_title'), desc: t('ehr_engine_page.process_step_1_desc') },
              { icon: <Database />, title: t('ehr_engine_page.process_step_2_title'), desc: t('ehr_engine_page.process_step_2_desc') },
              { icon: <ShieldCheck />, title: t('ehr_engine_page.process_step_3_title'), desc: t('ehr_engine_page.process_step_3_desc') },
              { icon: <Zap />, title: t('ehr_engine_page.process_step_4_title'), desc: t('ehr_engine_page.process_step_4_desc') },
            ].map((step, idx) => (
              <Grid item xs={12} sm={6} md={3} key={idx}>
                <Box sx={{ textAlign: 'center', position: 'relative' }}>
                  <Box sx={{ 
                    width: 80, height: 80, borderRadius: '50%', background: '#f8fafc',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    mx: 'auto', mb: 3, color: '#064e3b', border: '2px solid #e2e8f0',
                    transition: 'all 0.3s ease', '&:hover': { borderColor: '#08bba3', background: '#ffffff', color: '#08bba3' }
                  }}>
                    {step.icon}
                  </Box>
                  <Typography variant="h5" sx={{ fontWeight: 800, mb: 1, color: '#064e3b' }}>{step.title}</Typography>
                  <Typography variant="body2" sx={{ color: '#64748b', maxWidth: '20ch', mx: 'auto' }}>{step.desc}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* 4. Footer CTA */}
      <Box sx={{ py: 20, px: 3, background: '#064e3b', color: '#ffffff', overflow: 'hidden', position: 'relative' }}>
        <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h2" sx={{ fontWeight: 900, mb: 4, fontSize: { xs: '3rem', md: '5rem' }, letterSpacing: '-0.03em' }}>
              {t('ehr_engine_page.footer_cta_title')}
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.7, mb: 8, fontWeight: 400, maxWidth: '60ch', mx: 'auto' }}>
              {t('ehr_engine_page.footer_cta_desc')}
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
                {t('ehr_engine_page.footer_cta_btn_demo')}
              </Button>
              <Button 
                variant="outlined" 
                sx={{ 
                  borderColor: 'rgba(255,255,255,0.3)', color: '#ffffff', borderRadius: '100px', px: 6, py: 2.5,
                  fontSize: '1.25rem', fontWeight: 800, textTransform: 'none',
                  '&:hover': { borderColor: '#ffffff', background: 'rgba(255,255,255,0.1)' }
                }}
              >
                {t('ehr_engine_page.footer_cta_btn_contact')}
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>
    </Box>
  )
}
