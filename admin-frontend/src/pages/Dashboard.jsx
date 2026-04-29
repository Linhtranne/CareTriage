import { Box, Typography, Button, Alert } from '@mui/material'
import useAuthStore from '../store/authStore'

export default function DefaultDashboard() {
  const { logout, user } = useAuthStore()

  return (
    <Box sx={{ p: 4, minHeight: '100vh', bgcolor: '#0f172a', color: '#f8fafc' }}>
      <Alert severity="info" sx={{ mb: 4 }}>
        Vai trò của bạn chưa được cấu hình trang đích mặc định.
      </Alert>
      <Typography variant="h3" sx={{ fontWeight: 700, mb: 2 }}>
        Default Dashboard
      </Typography>
      <Typography variant="body1" sx={{ mb: 4, color: '#94a3b8' }}>
        Xin chào {user?.fullName || ''}!
      </Typography>
      <Button variant="outlined" color="error" onClick={logout}>
        Đăng xuất
      </Button>
    </Box>
  )
}
