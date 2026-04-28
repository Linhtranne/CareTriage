import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Box, Card, CardContent, TextField, Button, Typography,
  MenuItem, CircularProgress, Fade,
} from '@mui/material'
import { MedicalServices } from '@mui/icons-material'
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

export default function Register() {
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '', confirmPassword: '', role: 'PATIENT' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isShaking, setIsShaking] = useState(false)
  const { register, isLoading } = useAuthStore()
  const navigate = useNavigate()

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsShaking(false)

    if (form.password !== form.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp')
      setIsShaking(true)
      setTimeout(() => setIsShaking(false), 600)
      return
    }

    const result = await register(form)
    if (result.success) {
      setSuccess('Đăng ký thành công! Đang chuyển đến trang đăng nhập...')
      setTimeout(() => navigate('/login'), 1500)
    } else {
      setError(result.message || 'Đăng ký thất bại')
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
        p: 2,
      }}
    >
      {/* Animated Background SVGs */}
      <Box
        sx={{
          position: 'absolute', top: '15%', right: '15%', opacity: 0.2,
          animation: `${float} 7s ease-in-out infinite`,
        }}
      >
        <svg width="120" height="120" viewBox="0 0 24 24" fill="#059669">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
        </svg>
      </Box>

      <Box
        sx={{
          position: 'absolute', bottom: '10%', left: '15%', opacity: 0.25,
          animation: `${float} 5s ease-in-out infinite 0.5s`,
        }}
      >
        <svg width="90" height="90" viewBox="0 0 24 24" fill="#059669">
          <path d="M19.5 9.5c-1.03 0-1.94.52-2.5 1.31-.56-.79-1.47-1.31-2.5-1.31-1.66 0-3 1.34-3 3 0 .9.39 1.7.99 2.28L17 19l4.01-4.22c.6-.58.99-1.38.99-2.28 0-1.66-1.34-3-3-3z"/>
        </svg>
      </Box>

      <Fade in timeout={1000}>
        <Card
          sx={{
            maxWidth: 480, width: '100%',
            background: 'rgba(255, 255, 255, 0.55)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.4)',
            borderRadius: 6,
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.08)',
            animation: isShaking ? `${shake} 0.6s ease-in-out` : 'none',
          }}
        >
          <CardContent sx={{ p: 4.5 }}>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
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
                Đăng ký
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Tạo tài khoản CareTriage
              </Typography>
            </Box>

            {/* Validation Error above Inputs */}
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

            {/* Success message */}
            {success && (
              <Typography
                variant="body2"
                sx={{
                  color: '#059669', fontWeight: 600, mb: 2, textAlign: 'center',
                  backgroundColor: 'rgba(5, 150, 105, 0.08)',
                  py: 1, borderRadius: 2,
                }}
              >
                🎉 {success}
              </Typography>
            )}

            <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <TextField
                id="reg-name" label="Họ và tên" name="fullName"
                value={form.fullName} onChange={handleChange} required fullWidth
                sx={{ '& .MuiOutlinedInput-root': { backgroundColor: 'rgba(255, 255, 255, 0.6)' } }}
              />
              <TextField
                id="reg-email" label="Email" name="email" type="email"
                value={form.email} onChange={handleChange} required fullWidth
                sx={{ '& .MuiOutlinedInput-root': { backgroundColor: 'rgba(255, 255, 255, 0.6)' } }}
              />
              <TextField
                id="reg-phone" label="Số điện thoại" name="phone"
                value={form.phone} onChange={handleChange} required fullWidth
                sx={{ '& .MuiOutlinedInput-root': { backgroundColor: 'rgba(255, 255, 255, 0.6)' } }}
              />
              <TextField
                id="reg-role" label="Vai trò" name="role"
                value={form.role} onChange={handleChange} select fullWidth
                sx={{ '& .MuiOutlinedInput-root': { backgroundColor: 'rgba(255, 255, 255, 0.6)' } }}
              >
                <MenuItem value="PATIENT">Bệnh nhân</MenuItem>
                <MenuItem value="DOCTOR">Bác sĩ</MenuItem>
              </TextField>
              <TextField
                id="reg-password" label="Mật khẩu" name="password" type="password"
                value={form.password} onChange={handleChange} required fullWidth
                sx={{ '& .MuiOutlinedInput-root': { backgroundColor: 'rgba(255, 255, 255, 0.6)' } }}
              />
              <TextField
                id="reg-confirm" label="Xác nhận mật khẩu" name="confirmPassword" type="password"
                value={form.confirmPassword} onChange={handleChange} required fullWidth
                sx={{ '& .MuiOutlinedInput-root': { backgroundColor: 'rgba(255, 255, 255, 0.6)' } }}
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
                {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Đăng ký'}
              </Button>
            </Box>

            <Typography sx={{ mt: 3, textAlign: 'center' }} color="text.secondary">
              Đã có tài khoản?{' '}
              <Link to="/login" style={{ color: '#059669', fontWeight: 600, textDecoration: 'none' }}>
                Đăng nhập
              </Link>
            </Typography>
          </CardContent>
        </Card>
      </Fade>
    </Box>
  )
}
