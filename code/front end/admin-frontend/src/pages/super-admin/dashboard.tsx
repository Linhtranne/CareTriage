import { Box, Typography, Button } from '@mui/material'
import { useTranslation } from 'react-i18next'
import useAuthStore from '../../store/auth-store'

export default function SuperAdminDashboard() {
  const { logout, user } = useAuthStore()
  const { t } = useTranslation()

  return (
    <Box sx={{ p: 4, minHeight: '100vh', bgcolor: 'background.default', color: 'text.primary' }}>
      <Typography variant="h3" sx={{ fontWeight: 700, mb: 2 }}>
        {t('superAdmin.title', 'System Dashboard')}
      </Typography>
      <Typography variant="body1" sx={{ mb: 4, color: 'text.secondary' }}>
        {t('common.hello', 'Xin chào')} {t('role.superAdmin', 'Super Admin')} {user?.fullName ?? ''}!
      </Typography>
      <Button variant="outlined" color="error" onClick={logout}>
        {t('common.logout', 'Đăng xuất')}
      </Button>
    </Box>
  )
}
