import { Box, Typography, Button, Alert } from '@mui/material'
import { useTranslation } from 'react-i18next'
import useAuthStore from '../store/auth-store'

export default function DefaultDashboard() {
  const { logout, user } = useAuthStore()
  const { t } = useTranslation()

  return (
    <Box sx={{ p: 4, minHeight: '100vh', bgcolor: 'background.default', color: 'text.primary' }}>
      <Alert severity="info" sx={{ mb: 4 }}>
        {t('common.unconfiguredRole', 'Vai trò của bạn chưa được cấu hình trang đích mặc định.')}
      </Alert>
      <Typography variant="h3" sx={{ fontWeight: 700, mb: 2 }}>
        {t('common.defaultDashboard', 'Default Dashboard')}
      </Typography>
      <Typography variant="body1" sx={{ mb: 4, color: 'text.secondary' }}>
        {t('common.hello', 'Xin chào')} {user?.fullName ?? ''}!
      </Typography>
      <Button variant="outlined" color="error" onClick={logout}>
        {t('common.logout', 'Đăng xuất')}
      </Button>
    </Box>
  )
}
