import { Box, Container, Typography, Grid, Button } from '@mui/material'
import { motion, type Variants } from 'framer-motion'
import { 
  ShieldCheck, 
  Lock, 
  FileSearch,
  FileKey2
} from 'lucide-react'

const MOTION_EASE_STANDARD: [number, number, number, number] = [0.16, 1, 0.3, 1]
const MOTION_DURATION_MEDIUM = 0.8

// Variants
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: MOTION_DURATION_MEDIUM, ease: MOTION_EASE_STANDARD } }
}

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
}

export default function Security() {
  return (
    <Box sx={{ minHeight: '100vh', background: 'background.default', overflowX: 'hidden' }}>
      
      {/* Editorial Hero Section - Left Aligned, Typographic focus */}
      <Box sx={{ pt: { xs: 20, md: 32 }, pb: { xs: 12, md: 16 }, px: 3 }}>
        <Container maxWidth="xl">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: MOTION_DURATION_MEDIUM, ease: MOTION_EASE_STANDARD }}
          >
            <Grid container spacing={4} alignItems="center">
              <Grid size={{ xs: 12, md: 7 }} >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                  <Box sx={{ width: 40, height: 2, background: '#08bba3' }} />
                  <Typography variant="overline" sx={{ color: '#08bba3', fontWeight: 800, letterSpacing: '0.15em' }}>
                    KIáº¾N TRÃšC Báº¢O Máº¬T
                  </Typography>
                </Box>
                <Typography 
                  variant="h1" 
                  sx={{ 
                    fontWeight: 900, mb: 4, letterSpacing: '-0.04em',
                    fontSize: { xs: '3.5rem', md: '5.5rem', lg: '6.5rem' },
                    lineHeight: 1, color: 'text.primary'
                  }}
                >
                  RiÃªng tÆ°. <br />
                  <span style={{ color: 'primary.900' }}>Tuyá»‡t Ä‘á»‘i.</span>
                </Typography>
                <Typography 
                  variant="h5" 
                  sx={{ 
                    color: 'text.secondary', lineHeight: 1.6, fontWeight: 400, 
                    fontSize: { xs: '1.25rem', md: '1.5rem' },
                    maxWidth: '45ch'
                  }}
                >
                  Báº£o vá»‡ quyá»n riÃªng tÆ° vÃ  an toÃ n dá»¯ liá»‡u cá»§a ngÆ°á»i bá»‡nh báº±ng cÃ¡c tiÃªu chuáº©n cáº¥p Ä‘á»™ quÃ¢n Ä‘á»™i. Kiáº¿n trÃºc cá»‘t lÃµi dá»±a trÃªn 3 trá»¥ cá»™t vá»¯ng cháº¯c.
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 5 }} >
                {/* Hero Abstract Visual (Restrained geometry) */}
                <Box sx={{ position: 'relative', height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <motion.div 
                    animate={{ rotate: 360 }} 
                    transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                    style={{ position: 'absolute', width: 300, height: 300, border: '1px dashed #cbd5e1', borderRadius: '50%' }}
                  />
                  <motion.div 
                    animate={{ rotate: -360 }} 
                    transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                    style={{ position: 'absolute', width: 200, height: 200, border: '2px solid #08bba3', borderRadius: '50%', opacity: 0.2 }}
                  />
                  <Box sx={{ width: 120, height: 120, background: 'primary.900', borderRadius: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 20px 40px rgba(6, 78, 59, 0.2)', zIndex: 1, transform: 'rotate(15deg)' }}>
                    <ShieldCheck size={56} color='background.paper' />
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </motion.div>
        </Container>
      </Box>

      {/* Core Security Pillars (Strictly based on actual implemented features) */}
      <Box sx={{ py: { xs: 8, md: 12 }, px: 3 }}>
        <Container maxWidth="xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-10%" }}
            variants={staggerContainer}
          >
            <Grid container spacing={3}>
              
              {/* Pillar 1: AES-256 */}
              <Grid size={{ xs: 12, md: 8 }} >
                <motion.div variants={fadeUp} style={{ height: '100%' }}>
                  <Box sx={{ 
                    background: 'background.paper', borderRadius: '32px', p: { xs: 4, md: 6 }, 
                    height: '100%', border: '1px solid #e2e8f0',
                    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                    position: 'relative', overflow: 'hidden',
                    transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                    '&:hover': { borderColor: '#08bba3', boxShadow: '0 10px 30px rgba(8, 187, 163, 0.1)' }
                  }}>
                    <Box sx={{ zIndex: 1, maxWidth: '70%' }}>
                      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, px: 2, py: 1, background: 'background.default', color: '#08bba3', borderRadius: '100px', fontWeight: 700, mb: 4, fontSize: '0.875rem' }}>
                        <Lock size={16} /> Encryption
                      </Box>
                      <Typography variant="h3" sx={{ fontWeight: 900, color: 'text.primary', mb: 3, fontSize: { xs: '2rem', md: '2.5rem' }, letterSpacing: '-0.02em' }}>
                        MÃ£ hÃ³a AES-256
                      </Typography>
                      <Typography variant="body1" sx={{ color: 'text.secondary', fontSize: '1.25rem', lineHeight: 1.7 }}>
                        ToÃ n bá»™ dá»¯ liá»‡u bá»‡nh Ã¡n Ä‘Æ°á»£c mÃ£ hÃ³a Ä‘áº§u cuá»‘i tuyá»‡t Ä‘á»‘i. Tá»« kho lÆ°u trá»¯ cho Ä‘áº¿n quÃ¡ trÃ¬nh truyá»n táº£i tÃ­n hiá»‡u, thÃ´ng tin y táº¿ cá»§a ngÆ°á»i bá»‡nh luÃ´n trong tráº¡ng thÃ¡i bá»‹ "khÃ³a" hoÃ n toÃ n.
                      </Typography>
                    </Box>
                    {/* Decorative Lock */}
                    <Box sx={{ position: 'absolute', right: -20, bottom: -40, opacity: 0.03, zIndex: 0 }}>
                      <Lock size={300} />
                    </Box>
                  </Box>
                </motion.div>
              </Grid>

              {/* Pillar 2: HIPAA */}
              <Grid size={{ xs: 12, md: 4 }} >
                <motion.div variants={fadeUp} style={{ height: '100%' }}>
                  <Box sx={{ 
                    background: 'primary.900', borderRadius: '32px', p: { xs: 4, md: 6 }, 
                    height: '100%', color: 'background.paper',
                    display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
                    transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                    '&:hover': { background: '#022c22', boxShadow: '0 10px 30px rgba(6, 78, 59, 0.4)' }
                  }}>
                    <ShieldCheck size={40} color="#08bba3" style={{ marginBottom: '24px' }} />
                    <Typography variant="h4" sx={{ fontWeight: 800, mb: 2 }}>
                      TuÃ¢n thá»§ HIPAA
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#94a3b8', fontSize: '1.125rem', lineHeight: 1.6 }}>
                      Thiáº¿t láº­p quy trÃ¬nh kiá»ƒm soÃ¡t truy cáº­p cháº·t cháº½. Há»‡ thá»‘ng tuÃ¢n thá»§ nghiÃªm ngáº·t cÃ¡c Ä‘iá»u khoáº£n báº£o vá»‡ dá»¯ liá»‡u theo tiÃªu chuáº©n an toÃ n thÃ´ng tin y táº¿ cá»‘t lÃµi.
                    </Typography>
                  </Box>
                </motion.div>
              </Grid>

              {/* Pillar 3: Audit Logs */}
              <Grid size={{ xs: 12, md: 12 }} >
                <motion.div variants={fadeUp} style={{ height: '100%' }}>
                  <Box sx={{ 
                    background: 'background.paper', borderRadius: '32px', p: { xs: 4, md: 6 }, 
                    height: '100%', border: '1px solid #e2e8f0',
                    display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: { xs: 'flex-start', md: 'center' }, gap: 4,
                    transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                    '&:hover': { borderColor: '#08bba3', boxShadow: '0 10px 30px rgba(8, 187, 163, 0.1)' },
                    position: 'relative', overflow: 'hidden'
                  }}>
                    <Box sx={{ width: 80, height: 80, background: 'background.default', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, zIndex: 1 }}>
                      <FileSearch size={40} color="#08bba3" />
                    </Box>
                    <Box sx={{ zIndex: 1, flex: 1, maxWidth: { md: '50%' } }}>
                      <Typography variant="h4" sx={{ fontWeight: 800, mb: 2, color: 'text.primary' }}>
                        Audit Logs minh báº¡ch
                      </Typography>
                      <Typography variant="body1" sx={{ color: 'text.secondary', fontSize: '1.25rem', lineHeight: 1.6 }}>
                        CÆ¡ cháº¿ ghi váº¿t toÃ n bá»™ lá»‹ch sá»­ truy xuáº¥t. Báº¥t ká»³ thao tÃ¡c nÃ o cá»§a nhÃ¢n viÃªn y táº¿ trÃªn há»“ sÆ¡ bá»‡nh Ã¡n Ä‘á»u Ä‘Æ°á»£c há»‡ thá»‘ng lÆ°u trá»¯ minh báº¡ch Ä‘á»ƒ Ä‘á»‘i soÃ¡t báº¥t cá»© lÃºc nÃ o.
                      </Typography>
                    </Box>
                    
                    {/* Mock Terminal Visual to fill right side */}
                    <Box sx={{ 
                      flex: 1, height: '100%', minHeight: 140, background: 'text.primary', borderRadius: '16px', 
                      p: 3, display: { xs: 'none', md: 'flex' }, flexDirection: 'column', gap: 1.5,
                      fontFamily: 'monospace', fontSize: '0.75rem', color: '#334155', zIndex: 1
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-danger)' }} />
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-warning)' }} />
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', background: 'primary.main' }} />
                      </Box>
                      <Typography sx={{ fontFamily: 'inherit', color: 'primary.main' }}>[2026-05-11 10:14:02] Auth.SUCCESS: Token validated.</Typography>
                      <Typography sx={{ fontFamily: 'inherit', color: '#94a3b8' }}>[2026-05-11 10:14:03] DB.READ: Record ID_892 accessed by Doc_45.</Typography>
                      <Typography sx={{ fontFamily: 'inherit', color: '#94a3b8' }}>[2026-05-11 10:14:03] EVENT.LOG: Action committed to immutability ledger.</Typography>
                    </Box>
                  </Box>
                </motion.div>
              </Grid>

            </Grid>
          </motion.div>
        </Container>
      </Box>

      {/* Minimalist CTA */}
      <Box sx={{ py: { xs: 12, md: 16 }, px: 3, background: 'background.default', textAlign: 'center', borderTop: '1px solid #bbf7d0' }}>
        <Container maxWidth="md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
              <FileKey2 size={48} color="#08bba3" />
            </Box>
            <Typography variant="h2" sx={{ fontWeight: 900, mb: 3, color: 'primary.900', letterSpacing: '-0.02em', fontSize: { xs: '2rem', md: '3rem' } }}>
              TÃ i liá»‡u chuyÃªn sÃ¢u
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary', fontSize: '1.125rem', mb: 6, maxWidth: '50ch', mx: 'auto' }}>
              Truy cáº­p tÃ i liá»‡u Ä‘áº·c táº£ há»‡ thá»‘ng báº£o máº­t vÃ  quy trÃ¬nh mÃ£ hÃ³a cá»§a CareTriage dÃ nh riÃªng cho Ä‘á»™i ngÅ© ká»¹ thuáº­t.
            </Typography>
            <Button 
              variant="contained" 
              sx={{ 
                background: 'primary.900', color: 'background.paper', 
                borderRadius: '100px', px: 5, py: 2, 
                fontSize: '1rem', fontWeight: 700,
                textTransform: 'none',
                boxShadow: 'none',
                '&:hover': {
                  background: '#022c22',
                  boxShadow: '0 8px 25px rgba(6, 78, 59, 0.2)'
                },
                transition: 'all 0.3s ease'
              }}
            >
              Xem tÃ i liá»‡u ká»¹ thuáº­t
            </Button>
          </motion.div>
        </Container>
      </Box>

    </Box>
  )
}
