import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Box, Card, CardContent, TextField, Button, Typography,
  Alert, MenuItem, CircularProgress,
} from '@mui/material'
import { MedicalServices } from '@mui/icons-material'
import useAuthStore from '../../store/authStore'

export default function Register() {
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '', confirmPassword: '', role: 'PATIENT' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const { register, isLoading } = useAuthStore()
  const navigate = useNavigate()

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp')
      return
    }
    const result = await register(form)
    if (result.success) {
      setSuccess('Đăng ký thành công! Đang chuyển đến trang đăng nhập...')
      setTimeout(() => navigate('/login'), 1500)
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
      <Card sx={{ maxWidth: 480, width: '100%' }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <MedicalServices sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
            <Typography variant="h4" sx={{ fontWeight: 700 }}>Đăng ký</Typography>
            <Typography color="text.secondary">Tạo tài khoản CareTriage</Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField id="reg-name" label="Họ và tên" name="fullName" value={form.fullName} onChange={handleChange} required fullWidth />
            <TextField id="reg-email" label="Email" name="email" type="email" value={form.email} onChange={handleChange} required fullWidth />
            <TextField id="reg-phone" label="Số điện thoại" name="phone" value={form.phone} onChange={handleChange} required fullWidth />
            <TextField id="reg-role" label="Vai trò" name="role" value={form.role} onChange={handleChange} select fullWidth>
              <MenuItem value="PATIENT">Bệnh nhân</MenuItem>
              <MenuItem value="DOCTOR">Bác sĩ</MenuItem>
            </TextField>
            <TextField id="reg-password" label="Mật khẩu" name="password" type="password" value={form.password} onChange={handleChange} required fullWidth />
            <TextField id="reg-confirm" label="Xác nhận mật khẩu" name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} required fullWidth />
            <Button type="submit" variant="contained" size="large" fullWidth disabled={isLoading} sx={{ py: 1.5, mt: 1 }}>
              {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Đăng ký'}
            </Button>
          </Box>

          <Typography sx={{ mt: 3, textAlign: 'center' }} color="text.secondary">
            Đã có tài khoản?{' '}
            <Link to="/login" style={{ color: '#08bba3', fontWeight: 600 }}>Đăng nhập</Link>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  )
}
