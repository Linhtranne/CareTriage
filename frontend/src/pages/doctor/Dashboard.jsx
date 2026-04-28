import { Typography, Box } from '@mui/material'

export default function Dashboard() {
  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>
        Dashboard Bác sĩ
      </Typography>
      <Typography color="text.secondary">
        Chào mừng! Đây là trang tổng quan dành cho bác sĩ.
      </Typography>
    </Box>
  )
}
