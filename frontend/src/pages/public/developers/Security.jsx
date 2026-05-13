import { Box, Container, Typography, Grid, Button } from '@mui/material'
import { motion } from 'framer-motion'
import { 
  ShieldCheck, 
  Lock, 
  FileSearch,
  FileKey2
} from 'lucide-react'

// Variants
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
}

export default function Security() {
  return (
    <Box sx={{ minHeight: '100vh', background: '#f8fafc', overflowX: 'hidden' }}>
      
      {/* Editorial Hero Section - Left Aligned, Typographic focus */}
      <Box sx={{ pt: { xs: 20, md: 32 }, pb: { xs: 12, md: 16 }, px: 3 }}>
        <Container maxWidth="xl">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <Grid container spacing={4} alignItems="center">
              <Grid item xs={12} md={7}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                  <Box sx={{ width: 40, height: 2, background: '#08bba3' }} />
                  <Typography variant="overline" sx={{ color: '#08bba3', fontWeight: 800, letterSpacing: '0.15em' }}>
                    KIẾN TRÚC BẢO MẬT
                  </Typography>
                </Box>
                <Typography 
                  variant="h1" 
                  sx={{ 
                    fontWeight: 900, mb: 4, letterSpacing: '-0.04em',
                    fontSize: { xs: '3.5rem', md: '5.5rem', lg: '6.5rem' },
                    lineHeight: 1, color: '#0f172a'
                  }}
                >
                  Riêng tư. <br />
                  <span style={{ color: '#064e3b' }}>Tuyệt đối.</span>
                </Typography>
                <Typography 
                  variant="h5" 
                  sx={{ 
                    color: '#64748b', lineHeight: 1.6, fontWeight: 400, 
                    fontSize: { xs: '1.25rem', md: '1.5rem' },
                    maxWidth: '45ch'
                  }}
                >
                  Bảo vệ quyền riêng tư và an toàn dữ liệu của người bệnh bằng các tiêu chuẩn cấp độ quân đội. Kiến trúc cốt lõi dựa trên 3 trụ cột vững chắc.
                </Typography>
              </Grid>
              <Grid item xs={12} md={5}>
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
                  <Box sx={{ width: 120, height: 120, background: '#064e3b', borderRadius: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 20px 40px rgba(6, 78, 59, 0.2)', zIndex: 1, transform: 'rotate(15deg)' }}>
                    <ShieldCheck size={56} color="#ffffff" />
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
              <Grid item xs={12} md={8}>
                <motion.div variants={fadeUp} style={{ height: '100%' }}>
                  <Box sx={{ 
                    background: '#ffffff', borderRadius: '32px', p: { xs: 4, md: 6 }, 
                    height: '100%', border: '1px solid #e2e8f0',
                    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                    position: 'relative', overflow: 'hidden',
                    transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                    '&:hover': { borderColor: '#08bba3', boxShadow: '0 10px 30px rgba(8, 187, 163, 0.1)' }
                  }}>
                    <Box sx={{ zIndex: 1, maxWidth: '70%' }}>
                      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, px: 2, py: 1, background: '#f0fdf4', color: '#08bba3', borderRadius: '100px', fontWeight: 700, mb: 4, fontSize: '0.875rem' }}>
                        <Lock size={16} /> Encryption
                      </Box>
                      <Typography variant="h3" sx={{ fontWeight: 900, color: '#0f172a', mb: 3, fontSize: { xs: '2rem', md: '2.5rem' }, letterSpacing: '-0.02em' }}>
                        Mã hóa AES-256
                      </Typography>
                      <Typography variant="body1" sx={{ color: '#64748b', fontSize: '1.25rem', lineHeight: 1.7 }}>
                        Toàn bộ dữ liệu bệnh án được mã hóa đầu cuối tuyệt đối. Từ kho lưu trữ cho đến quá trình truyền tải tín hiệu, thông tin y tế của người bệnh luôn trong trạng thái bị "khóa" hoàn toàn.
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
              <Grid item xs={12} md={4}>
                <motion.div variants={fadeUp} style={{ height: '100%' }}>
                  <Box sx={{ 
                    background: '#064e3b', borderRadius: '32px', p: { xs: 4, md: 6 }, 
                    height: '100%', color: '#ffffff',
                    display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
                    transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                    '&:hover': { background: '#022c22', boxShadow: '0 10px 30px rgba(6, 78, 59, 0.4)' }
                  }}>
                    <ShieldCheck size={40} color="#08bba3" style={{ marginBottom: '24px' }} />
                    <Typography variant="h4" sx={{ fontWeight: 800, mb: 2 }}>
                      Tuân thủ HIPAA
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#94a3b8', fontSize: '1.125rem', lineHeight: 1.6 }}>
                      Thiết lập quy trình kiểm soát truy cập chặt chẽ. Hệ thống tuân thủ nghiêm ngặt các điều khoản bảo vệ dữ liệu theo tiêu chuẩn an toàn thông tin y tế cốt lõi.
                    </Typography>
                  </Box>
                </motion.div>
              </Grid>

              {/* Pillar 3: Audit Logs */}
              <Grid item xs={12} md={12}>
                <motion.div variants={fadeUp} style={{ height: '100%' }}>
                  <Box sx={{ 
                    background: '#ffffff', borderRadius: '32px', p: { xs: 4, md: 6 }, 
                    height: '100%', border: '1px solid #e2e8f0',
                    display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: { xs: 'flex-start', md: 'center' }, gap: 4,
                    transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                    '&:hover': { borderColor: '#08bba3', boxShadow: '0 10px 30px rgba(8, 187, 163, 0.1)' },
                    position: 'relative', overflow: 'hidden'
                  }}>
                    <Box sx={{ width: 80, height: 80, background: '#f0fdf4', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, zIndex: 1 }}>
                      <FileSearch size={40} color="#08bba3" />
                    </Box>
                    <Box sx={{ zIndex: 1, flex: 1, maxWidth: { md: '50%' } }}>
                      <Typography variant="h4" sx={{ fontWeight: 800, mb: 2, color: '#0f172a' }}>
                        Audit Logs minh bạch
                      </Typography>
                      <Typography variant="body1" sx={{ color: '#64748b', fontSize: '1.25rem', lineHeight: 1.6 }}>
                        Cơ chế ghi vết toàn bộ lịch sử truy xuất. Bất kỳ thao tác nào của nhân viên y tế trên hồ sơ bệnh án đều được hệ thống lưu trữ minh bạch để đối soát bất cứ lúc nào.
                      </Typography>
                    </Box>
                    
                    {/* Mock Terminal Visual to fill right side */}
                    <Box sx={{ 
                      flex: 1, height: '100%', minHeight: 140, background: '#0f172a', borderRadius: '16px', 
                      p: 3, display: { xs: 'none', md: 'flex' }, flexDirection: 'column', gap: 1.5,
                      fontFamily: 'monospace', fontSize: '0.75rem', color: '#334155', zIndex: 1
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} />
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b' }} />
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
                      </Box>
                      <Typography sx={{ fontFamily: 'inherit', color: '#10b981' }}>[2026-05-11 10:14:02] Auth.SUCCESS: Token validated.</Typography>
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
      <Box sx={{ py: { xs: 12, md: 16 }, px: 3, background: '#f0fdf4', textAlign: 'center', borderTop: '1px solid #bbf7d0' }}>
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
            <Typography variant="h2" sx={{ fontWeight: 900, mb: 3, color: '#064e3b', letterSpacing: '-0.02em', fontSize: { xs: '2rem', md: '3rem' } }}>
              Tài liệu chuyên sâu
            </Typography>
            <Typography variant="body1" sx={{ color: '#4b5563', fontSize: '1.125rem', mb: 6, maxWidth: '50ch', mx: 'auto' }}>
              Truy cập tài liệu đặc tả hệ thống bảo mật và quy trình mã hóa của CareTriage dành riêng cho đội ngũ kỹ thuật.
            </Typography>
            <Button 
              variant="contained" 
              sx={{ 
                background: '#064e3b', color: '#ffffff', 
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
              Xem tài liệu kỹ thuật
            </Button>
          </motion.div>
        </Container>
      </Box>

    </Box>
  )
}
