import { Box, Typography, Grid } from '@mui/material'

export default function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        background: 'rgba(255, 255, 255, 0.4)',
        backdropFilter: 'blur(20px)',
        color: '#1e293b',
        py: 6, px: { xs: 3, md: 6 },
        mt: 8, borderTop: '1px solid rgba(16, 185, 129, 0.1)',
      }}
    >
      <Grid container spacing={4} sx={{ maxWidth: 1536, mx: 'auto' }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Typography variant="h5" sx={{ fontWeight: 900, color: '#064e3b', mb: 2 }}>
            CareTriage
          </Typography>
          <Typography variant="body2" sx={{ color: '#4b5563', lineHeight: 1.6 }}>
            Ứng dụng Trí tuệ nhân tạo nâng cao trải nghiệm y khoa thông minh cho người Việt.
          </Typography>
        </Grid>

        <Grid size={{ xs: 6, md: 4 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#064e3b', mb: 2 }}>
            Tính năng chính
          </Typography>
          <Typography variant="body2" sx={{ color: '#4b5563', mb: 1, cursor: 'pointer', '&:hover': { color: '#10b981' } }}>
            Triage Sơ chẩn
          </Typography>
          <Typography variant="body2" sx={{ color: '#4b5563', mb: 1, cursor: 'pointer', '&:hover': { color: '#10b981' } }}>
            Trích xuất Bệnh án
          </Typography>
        </Grid>

        <Grid size={{ xs: 6, md: 4 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#064e3b', mb: 2 }}>
            Liên hệ hỗ trợ
          </Typography>
          <Typography variant="body2" sx={{ color: '#4b5563', mb: 1 }}>
            Email: info@caretriage.vn
          </Typography>
          <Typography variant="body2" sx={{ color: '#4b5563' }}>
            Hotline: 1900-XXXX
          </Typography>
        </Grid>
      </Grid>

      <Box sx={{ textAlign: 'center', mt: 6, pt: 3, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <Typography variant="caption" sx={{ color: '#64748b' }}>
          © {new Date().getFullYear()} CareTriage. All rights reserved.
        </Typography>
      </Box>
    </Box>
  )
}
