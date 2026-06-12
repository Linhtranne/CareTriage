import { Box, Container, Typography, Grid, Button } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { motion, type Variants } from 'framer-motion'

export default function VisionMission() {
  const { t } = useTranslation()

  const MOTION_EASE_STANDARD: [number, number, number, number] = [0.16, 1, 0.3, 1]
  const MOTION_DURATION_MEDIUM = 0.8

  const coreValues = [
    { num: '01', title: t('about_page.value_1_title'), desc: t('about_page.value_1_desc') },
    { num: '02', title: t('about_page.value_2_title'), desc: t('about_page.value_2_desc') },
    { num: '03', title: t('about_page.value_3_title'), desc: t('about_page.value_3_desc') },
    { num: '04', title: t('about_page.value_4_title'), desc: t('about_page.value_4_desc') },
  ]

  // Framer Motion Variants
  const fadeUp: Variants = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: MOTION_DURATION_MEDIUM, ease: MOTION_EASE_STANDARD } }
  }

  const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', background: 'background.default', overflowX: 'hidden' }}>
      
      {/* Editorial Hero Section */}
      <Box sx={{ 
        pt: { xs: 20, md: 28 }, pb: { xs: 12, md: 20 }, px: 3, 
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Abstract "Intelligent Corridor" Grid Pattern */}
        <Box sx={{ 
          position: 'absolute', top: '10%', right: '-5%', width: '40%', height: '80%',
          opacity: 0.1, zIndex: 0,
          backgroundImage: 'linear-gradient(#08bba3 1px, transparent 1px), linear-gradient(90deg, #08bba3 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(circle, black, transparent 70%)',
          transform: 'skewY(-12deg)'
        }} />

        <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1 }}>
          <Grid container spacing={4}>
            <Grid size={{ xs: 12, md: 9, lg: 8 }} >
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: MOTION_DURATION_MEDIUM, ease: MOTION_EASE_STANDARD }}
              >
                <Box sx={{ display: 'flex', gap: 4 }}>
                  {/* The "Corridor" anchor line */}
                  <motion.div 
                    initial={{ scaleY: 0 }} 
                    animate={{ scaleY: 1 }} 
                    transition={{ duration: 1, delay: 0.2, ease: MOTION_EASE_STANDARD }}
                    style={{ originY: 0 }}
                  >
                    <Box sx={{ width: 8, height: '100%', background: '#08bba3', flexShrink: 0, borderRadius: '4px' }} />
                  </motion.div>
                  
                  <Box>
                    <Typography 
                      variant="overline" 
                      sx={{ color: '#08bba3', fontWeight: 700, letterSpacing: '0.15em', display: 'block', mb: 3 }}
                    >
                      THE INTELLIGENT CORRIDOR
                    </Typography>
                    <Typography 
                      variant="h1" 
                      sx={{ 
                        fontWeight: 900, mb: 4, letterSpacing: '-0.04em',
                        fontSize: { xs: '3.5rem', md: '5.5rem', lg: '7rem' },
                        lineHeight: 0.95, color: 'primary.900'
                      }}
                    >
                      {t('about_page.hero_title')}
                    </Typography>
                    <Typography 
                      variant="h5" 
                      sx={{ 
                        color: 'text.secondary', lineHeight: 1.6, fontWeight: 400, 
                        fontSize: { xs: '1.25rem', md: '1.5rem' },
                        maxWidth: '65ch'
                      }}
                    >
                      {t('about_page.hero_subtitle')}
                    </Typography>
                  </Box>
                </Box>
              </motion.div>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Mission Section (Committed Palette: Emerald Ink) */}
      <Box sx={{ background: 'primary.900', color: 'background.default', py: { xs: 12, md: 20 }, px: 3 }}>
        <Container maxWidth="xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-10%" }}
            variants={staggerContainer}
          >
            <Grid container spacing={8} alignItems="flex-start">
              <Grid size={{ xs: 12, md: 3 }} >
                <motion.div variants={fadeUp}>
                  <Typography 
                    variant="overline" 
                    sx={{ color: '#20d6bc', fontWeight: 700, letterSpacing: '0.1em' }}
                  >
                    {t('about_page.mission_overline')}
                  </Typography>
                </motion.div>
              </Grid>
              <Grid size={{ xs: 12, md: 9 }} >
                <motion.div variants={fadeUp}>
                  <Typography 
                    variant="h2" 
                    sx={{ 
                      fontWeight: 900, fontSize: { xs: '2.5rem', md: '4rem' }, 
                      lineHeight: 1.2, letterSpacing: '-0.02em', mb: 4
                    }}
                  >
                    {t('about_page.mission_title')}
                  </Typography>
                </motion.div>
                <motion.div variants={fadeUp}>
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      fontSize: { xs: '1.25rem', md: '1.5rem' }, 
                      lineHeight: 1.8, color: '#94a3b8', maxWidth: '65ch' 
                    }}
                  >
                    {t('about_page.mission_desc')}
                  </Typography>
                </motion.div>
              </Grid>
            </Grid>
          </motion.div>
        </Container>
      </Box>

      {/* Vision Section (Cloud White) - Asymmetric Flip */}
      <Box sx={{ background: 'background.default', color: 'text.primary', py: { xs: 12, md: 24 }, px: 3 }}>
        <Container maxWidth="xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-10%" }}
            variants={staggerContainer}
          >
            <Grid container spacing={8} alignItems="center">
              <Grid size={{ xs: 12, md: 8, lg: 9 }} order={{ xs: 2, md: 1 }}>
                <motion.div variants={fadeUp}>
                  <Typography 
                    variant="h2" 
                    sx={{ 
                      fontWeight: 900, fontSize: { xs: '2.5rem', md: '4.5rem' }, 
                      lineHeight: 1, letterSpacing: '-0.04em', mb: 4
                    }}
                  >
                    {t('about_page.vision_title')}
                  </Typography>
                </motion.div>
                <motion.div variants={fadeUp}>
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      fontSize: { xs: '1.25rem', md: '1.75rem' }, 
                      lineHeight: 1.6, color: 'text.secondary', maxWidth: '65ch' 
                    }}
                  >
                    {t('about_page.vision_desc')}
                  </Typography>
                </motion.div>
              </Grid>
              <Grid size={{ xs: 12, md: 4, lg: 3 }} order={{ xs: 1, md: 2 }} sx={{ textAlign: { md: 'right' } }}>
                <motion.div variants={fadeUp}>
                  <Typography 
                    variant="overline" 
                    sx={{ color: '#08bba3', fontWeight: 800, letterSpacing: '0.2em' }}
                  >
                    {t('about_page.vision_overline')}
                  </Typography>
                </motion.div>
              </Grid>
            </Grid>
          </motion.div>
        </Container>
      </Box>

      {/* Core Values Manifesto (Meadow Mist) */}
      <Box sx={{ background: 'background.default', py: { xs: 16, md: 24 }, px: 3 }}>
        <Container maxWidth="xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-10%" }}
            variants={fadeUp}
          >
            <Typography 
              variant="h2" 
              sx={{ 
                fontWeight: 900, mb: 10, color: 'primary.900',
                fontSize: { xs: '3.5rem', md: '6rem' }, letterSpacing: '-0.04em'
              }}
            >
              {t('about_page.values_title')}
            </Typography>
          </motion.div>
          
          <Box sx={{ borderTop: '2px solid #064e3b' }}>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-10%" }}
              variants={staggerContainer}
            >
              {coreValues.map((value, index) => (
                <motion.div variants={fadeUp} key={index}>
                  <Box 
                    sx={{ 
                      borderBottom: '1px solid #e2e8f0',
                      py: { xs: 6, md: 10 },
                      px: { md: 4 },
                      mx: { md: -4 },
                      borderRadius: { md: '32px' },
                      position: 'relative',
                      overflow: 'hidden',
                      transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                      '&:hover': { 
                        background: 'background.paper',
                        boxShadow: '0 20px 40px rgba(6, 78, 59, 0.05)'
                      },
                      '&:hover .manifesto-num': { color: 'rgba(8, 187, 163, 0.2)' }
                    }}
                  >
                    <Grid container spacing={4} alignItems="center">
                      <Grid size={{ xs: 12, md: 3 }} >
                        <Typography 
                          className="manifesto-num"
                          variant="h1" 
                          sx={{ 
                            fontWeight: 900, fontSize: { xs: '4rem', md: '8rem' }, 
                            color: 'rgba(6, 78, 59, 0.05)', lineHeight: 1,
                            transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                            userSelect: 'none'
                          }}
                        >
                          {value.num}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 12, md: 4 }} >
                        <Typography 
                          variant="h4" 
                          sx={{ fontWeight: 900, color: 'primary.900', fontSize: '2.5rem', letterSpacing: '-0.02em' }}
                        >
                          {value.title}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 12, md: 5 }} >
                        <Typography 
                          variant="body1" 
                          sx={{ color: 'text.secondary', fontSize: '1.25rem', lineHeight: 1.7 }}
                        >
                          {value.desc}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                </motion.div>
              ))}
            </motion.div>
          </Box>
        </Container>
      </Box>

      {/* Footer Bridge (Living Teal) */}
      <Box sx={{ background: '#08bba3', color: 'background.paper', py: { xs: 12, md: 16 }, px: 3 }}>
        <Container maxWidth="xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <Grid container spacing={6} alignItems="center">
              <Grid size={{ xs: 12, md: 8 }} >
                <motion.div variants={fadeUp}>
                  <Typography 
                    variant="h2" 
                    sx={{ fontWeight: 900, fontSize: { xs: '3rem', md: '4.5rem' }, lineHeight: 1.1, mb: 3 }}
                  >
                    {t('about_page.footer_title')}
                  </Typography>
                </motion.div>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                <motion.div variants={fadeUp}>
                  <Button 
                    variant="contained" 
                    size="large"
                    sx={{ 
                      background: 'primary.900', color: 'background.paper', 
                      borderRadius: '100px', px: 6, py: 3, 
                      fontSize: '1.25rem', fontWeight: 800,
                      textTransform: 'none',
                      boxShadow: 'none',
                      '&:hover': {
                        background: 'text.primary',
                        boxShadow: '0 15px 35px rgba(6, 78, 59, 0.4)'
                      },
                      transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                    }}
                  >
                    {t('about_page.footer_btn')}
                  </Button>
                </motion.div>
              </Grid>
            </Grid>
          </motion.div>
        </Container>
      </Box>
    </Box>
  )
}
