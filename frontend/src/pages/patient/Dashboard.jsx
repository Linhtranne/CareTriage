import { Typography, Box } from '@mui/material'

export default function Dashboard() {
  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>
        Dashboard Bệnh nhân
      </Typography>
      <Typography color="text.secondary">
        Chào mừng! Đây là trang tổng quan dành cho bệnh nhân. Các tính năng sẽ được phát triển ở Sprint tiếp theo.
      </Typography>
    </Box>
  )
}
