import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Box, Card, CardContent, TextField, Button, Typography,
  InputAdornment, IconButton, CircularProgress, Fade,
} from '@mui/material'
import { Visibility, VisibilityOff, MedicalServices } from '@mui/icons-material'
import { keyframes } from '@emotion/react'
import useAuthStore from '../../store/authStore'

const shake = keyframes`
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-6px); }
  20%, 40%, 60%, 80% { transform: translateX(6px); }
`

const float = keyframes`
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-15px) rotate(5deg); }
`

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isShaking, setIsShaking] = useState(false)
  const { login, isLoading } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsShaking(false)

    const result = await login(email, password)
    if (result.success) {
      const role = useAuthStore.getState().user?.role?.toLowerCase()
      navigate(`/${role}/dashboard`)
    } else {
      setError(result.message || 'Thông tin đăng nhập không chính xác')
      setIsShaking(true)
      setTimeout(() => setIsShaking(false), 600)
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 50%, #f0fdf4 100%)',
        position: 'relative', overflow: 'hidden',
        px: 2,
      }}
    >
      {/* Animated Background SVGs */}
      <Box
        sx={{
          position: 'absolute', top: '10%', left: '10%', opacity: 0.25,
          animation: `${float} 6s ease-in-out infinite`,
        }}
      >
        <svg width="100" height="100" viewBox="0 0 24 24" fill="#059669">
          <path d="M19 10.5h-5.5V5c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v5.5H5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5h5.5V19c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-5.5H19c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5z"/>
        </svg>
      </Box>

      <Box
        sx={{
          position: 'absolute', bottom: '15%', right: '10%', opacity: 0.2,
          animation: `${float} 8s ease-in-out infinite 1s`,
        }}
      >
        <svg width="120" height="120" viewBox="0 0 24 24" fill="#059669">
          <path d="M4.5 10.5C3.67 10.5 3 11.17 3 12s.67 1.5 1.5 1.5h15c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5h-15z"/>
          <path d="M10.5 4.5C10.5 3.67 11.17 3 12 3s1.5.67 1.5 1.5v15c0 .83-.67 1.5-1.5 1.5s-1.5-.67-1.5-1.5v-15z" opacity="0.5"/>
        </svg>
      </Box>

      <Fade in timeout={1000}>
        <Card
          sx={{
            maxWidth: 440, width: '100%',
            background: 'rgba(255, 255, 255, 0.55)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.4)',
            borderRadius: 6,
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.08)',
            animation: isShaking ? `${shake} 0.6s ease-in-out` : 'none',
          }}
        >
          <CardContent sx={{ p: 5 }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Box
                sx={{
                  width: 64, height: 64, borderRadius: '50%',
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  mb: 2,
                }}
              >
                <MedicalServices sx={{ fontSize: 36, color: '#059669' }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#064e3b', mb: 0.5 }}>
                Đăng nhập
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Chào mừng trở lại CareTriage
              </Typography>
            </Box>

            {/* Error Message above Inputs */}
            {error && (
              <Typography
                variant="body2"
                sx={{
                  color: '#dc2626', fontWeight: 600, mb: 2, textAlign: 'center',
                  backgroundColor: 'rgba(220, 38, 38, 0.08)',
                  py: 1, borderRadius: 2,
                }}
              >
                ⚠️ {error}
              </Typography>
            )}

            <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <TextField
                id="login-email"
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required fullWidth
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'rgba(255, 255, 255, 0.6)',
                    '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.8)' },
                  }
                }}
              />
              <TextField
                id="login-password"
                label="Mật khẩu"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required fullWidth
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'rgba(255, 255, 255, 0.6)',
                    '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.8)' },
                  }
                }}
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
                sx={{
                  py: 1.5, mt: 1,
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  '&:hover': { background: 'linear-gradient(135deg, #059669 0%, #047857 100%)' },
                }}
              >
                {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Đăng nhập'}
              </Button>
            </Box>

            <Typography sx={{ mt: 3, textAlign: 'center' }} color="text.secondary">
              Chưa có tài khoản?{' '}
              <Link to="/register" style={{ color: '#059669', fontWeight: 600, textDecoration: 'none' }}>
                Đăng ký ngay
              </Link>
            </Typography>
          </CardContent>
        </Card>
      </Fade>
    </Box>
  )
}
