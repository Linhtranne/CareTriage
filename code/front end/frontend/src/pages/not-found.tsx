import { Box, Typography, Button } from '@mui/material'
import { useNavigate } from 'react-router-dom'

export default function NotFound() {
  const navigate = useNavigate()
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <Typography variant="h1" sx={{ fontSize: '6rem', fontWeight: 800, color: 'primary.main' }}>404</Typography>
      <Typography variant="h5" sx={{ mb: 3 }}>Trang không tồn tại</Typography>
      <Button variant="contained" onClick={() => navigate('/')}>Về trang chủ</Button>
    </Box>
  )
}
