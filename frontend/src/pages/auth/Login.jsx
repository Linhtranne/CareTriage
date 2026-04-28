import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Box, Card, CardContent, TextField, Button, Typography,
  Alert, InputAdornment, IconButton, CircularProgress,
} from '@mui/material'
import { Visibility, VisibilityOff, MedicalServices } from '@mui/icons-material'
import useAuthStore from '../../store/authStore'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const { login, isLoading } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const result = await login(email, password)
    if (result.success) {
      const role = useAuthStore.getState().user?.role?.toLowerCase()
      navigate(`/${role}/dashboard`)
    } else {
      setError(result.message)
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(135deg, #effefa 0%, #c8fff1 50%, #f8fafc 100%)',
        p: 2,
      }}
    >
      <Card sx={{ maxWidth: 440, width: '100%' }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <MedicalServices sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
            <Typography variant="h4" sx={{ fontWeight: 700 }}>Đăng nhập</Typography>
            <Typography color="text.secondary">Chào mừng trở lại CareTriage</Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField
              id="login-email"
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required fullWidth autoFocus
            />
            <TextField
              id="login-password"
              label="Mật khẩu"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required fullWidth
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Button
              type="submit" variant="contained" size="large" fullWidth
              disabled={isLoading}
              sx={{ py: 1.5 }}
            >
              {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Đăng nhập'}
            </Button>
          </Box>

          <Typography sx={{ mt: 3, textAlign: 'center' }} color="text.secondary">
            Chưa có tài khoản?{' '}
            <Link to="/register" style={{ color: '#08bba3', fontWeight: 600 }}>
              Đăng ký ngay
            </Link>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  )
}
