import { Box, Typography, Grid } from '@mui/material'

export default function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        background: 'color-mix(in srgb, var(--color-surface-50) 40%, transparent)',
        backdropFilter: 'blur(20px)',
        color: 'text.primary',
        py: 6, px: { xs: 3, md: 6 },
        mt: 8, borderTop: '1px solid color-mix(in srgb, var(--color-primary-500) 10%, transparent)',
      }}
    >
      <Grid container spacing={4} sx={{ maxWidth: 1536, mx: 'auto' }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Typography variant="h5" sx={{ fontWeight: 900, color: 'primary.900', mb: 2 }}>
            CareTriage
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
            Ứng dụng Trí tuệ nhân tạo nâng cao trải nghiệm y khoa thông minh cho người Việt.
          </Typography>
        </Grid>

        <Grid size={{ xs: 6, md: 4 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.900', mb: 2 }}>
            Tính năng chính
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1, cursor: 'pointer', '&:hover': { color: 'primary.main' } }}>
            Triage Sơ chẩn
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1, cursor: 'pointer', '&:hover': { color: 'primary.main' } }}>
            Trích xuất Bệnh án
          </Typography>
        </Grid>

        <Grid size={{ xs: 6, md: 4 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.900', mb: 2 }}>
            Liên hệ hỗ trợ
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
            Email: info@caretriage.vn
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Hotline: 1900-XXXX
          </Typography>
        </Grid>
      </Grid>

      <Box sx={{ textAlign: 'center', mt: 6, pt: 3, borderTop: '1px solid color-mix(in srgb, var(--color-surface-50) 5%, transparent)' }}>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          © {new Date().getFullYear()} CareTriage. All rights reserved.
        </Typography>
      </Box>
    </Box>
  )
}
