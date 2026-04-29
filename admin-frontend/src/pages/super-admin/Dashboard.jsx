import { Box, Typography, Button } from '@mui/material'
import useAuthStore from '../../store/authStore'

export default function SuperAdminDashboard() {
  const { logout, user } = useAuthStore()

  return (
    <Box sx={{ p: 4, minHeight: '100vh', bgcolor: '#0f172a', color: '#f8fafc' }}>
      <Typography variant="h3" sx={{ fontWeight: 700, mb: 2 }}>
        System Dashboard
      </Typography>
      <Typography variant="body1" sx={{ mb: 4, color: '#94a3b8' }}>
        Xin chào Super Admin {user?.fullName || ''}!
      </Typography>
      <Button variant="outlined" color="error" onClick={logout}>
        Đăng xuất
      </Button>
    </Box>
  )
}
