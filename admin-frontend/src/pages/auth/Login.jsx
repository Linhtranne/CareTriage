import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Box, Card, CardContent, TextField, Button, Typography,
  IconButton, InputAdornment, CircularProgress
} from '@mui/material'
import { Visibility, VisibilityOff } from '@mui/icons-material'
import useAuthStore, { getHighestPriorityLandingPage } from '../../store/authStore'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  
  const { login, isLoading, isAuthenticated, user } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (isAuthenticated && user) {
      const targetPath = getHighestPriorityLandingPage(user.roles || [])
      navigate(targetPath, { replace: true })
    }
  }, [isAuthenticated, user, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!email.trim()) {
      setError('Email/Tên đăng nhập không được để trống')
      return
    }
    if (!password.trim()) {
      setError('Mật khẩu không được để trống')
      return
    }

    const result = await login(email, password)
    if (result.success) {
      const highestRoles = useAuthStore.getState().user?.roles || []
      const from = location.state?.from?.pathname || getHighestPriorityLandingPage(highestRoles)
      navigate(from, { replace: true })
    } else {
      setError(result.message || 'Thông tin đăng nhập không chính xác')
    }
  }

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
      p: 2
    }}>
      <Card sx={{ maxWidth: 400, width: '100%', borderRadius: 3, boxShadow: 5, backgroundColor: '#1e293b', border: '1px solid #334155' }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" sx={{ color: '#f8fafc', fontWeight: 700, mb: 1, textAlign: 'center' }}>
            ADMIN PORTAL
          </Typography>
          <Typography variant="body2" sx={{ color: '#94a3b8', mb: 3, textAlign: 'center' }}>
            Hệ thống quản trị CareTriage
          </Typography>

          {error && (
            <Typography variant="body2" sx={{ color: '#f87171', mb: 2, textAlign: 'center', fontWeight: 600, bgcolor: 'rgba(248, 113, 113, 0.1)', py: 1, borderRadius: 1 }}>
              {error}
            </Typography>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField
              label="EMAIL"
              variant="outlined"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
              slotProps={{
                input: { sx: { color: '#f8fafc', bgcolor: '#0f172a' } },
                inputLabel: { sx: { color: '#94a3b8' } }
              }}
            />
            <TextField
              label="MẬT KHẨU"
              type={showPassword ? 'text' : 'password'}
              variant="outlined"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              slotProps={{
                input: {
                  sx: { color: '#f8fafc', bgcolor: '#0f172a' },
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" sx={{ color: '#94a3b8' }}>
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                },
                inputLabel: { sx: { color: '#94a3b8' } }
              }}
            />

            <Button
              type="submit"
              variant="contained"
              disabled={isLoading}
              sx={{
                mt: 1,
                py: 1.5,
                fontWeight: 700,
                bgcolor: '#38bdf8',
                color: '#0f172a',
                '&:hover': { bgcolor: '#0ea5e9' }
              }}
            >
              {isLoading ? <CircularProgress size={24} sx={{ color: '#0f172a' }} /> : 'ĐĂNG NHẬP'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}
