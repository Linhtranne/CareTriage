import { useState } from 'react'
import { 
  Box, Container, Typography, Grid, Paper, TextField, 
  Button, Stack, Alert, Snackbar, CircularProgress,
  IconButton, Divider
} from '@mui/material'
import {
  Send, Phone, Email, LocationOn, Security,
  Facebook, Twitter, LinkedIn, Instagram
} from '@mui/icons-material'
import contactApi from '../../api/contactApi'

export default function Contact() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isRobot, setIsRobot] = useState(true)

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (isRobot) {
      setError('Vui lòng xác nhận bạn không phải là robot.')
      return
    }
    
    setLoading(true)
    setError('')
    try {
      await contactApi.submit(formData)
      setSuccess(true)
      setFormData({ fullName: '', email: '', phone: '', subject: '', message: '' })
      setIsRobot(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Gửi yêu cầu thất bại. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc', pb: 10 }}>
      
      {/* Header */}
      <Box sx={{ 
        pt: 18, pb: 10, px: 3, textAlign: 'center', 
        background: 'linear-gradient(135deg, #064e3b 0%, #065f46 100%)',
        color: 'white'
      }}>
        <Container maxWidth="xl">
          <Typography variant="h2" sx={{ fontWeight: 900, mb: 2 }}>Liên hệ với chúng tôi</Typography>
          <Typography variant="h6" sx={{ opacity: 0.8, fontWeight: 400 }}>
            Bạn có thắc mắc? Chúng tôi luôn sẵn lòng lắng nghe và hỗ trợ bạn.
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ mt: -6, position: 'relative', zIndex: 2 }}>
        <Grid container spacing={4}>
          {/* Info Side */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Stack spacing={3}>
              <Paper elevation={0} sx={{ p: 4, borderRadius: 6, boxShadow: '0 10px 40px rgba(0,0,0,0.05)' }}>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#064e3b', mb: 4 }}>Thông tin liên hệ</Typography>
                <Stack spacing={4}>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Box sx={{ p: 1.5, bgcolor: 'primary.light', color: 'primary.main', borderRadius: 2, display: 'flex' }}>
                      <LocationOn />
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Địa chỉ</Typography>
                      <Typography variant="body2" color="text.secondary">Số 123 Giải Phóng, Hai Bà Trưng, Hà Nội</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Box sx={{ p: 1.5, bgcolor: 'primary.light', color: 'primary.main', borderRadius: 2, display: 'flex' }}>
                      <Phone />
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Điện thoại</Typography>
                      <Typography variant="body2" color="text.secondary">1900-XXXX-01</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Box sx={{ p: 1.5, bgcolor: 'primary.light', color: 'primary.main', borderRadius: 2, display: 'flex' }}>
                      <Email />
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Email</Typography>
                      <Typography variant="body2" color="text.secondary">support@caretriage.vn</Typography>
                    </Box>
                  </Box>
                </Stack>

                <Divider sx={{ my: 4 }} />
                
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>Theo dõi chúng tôi</Typography>
                <Stack direction="row" spacing={1}>
                  {[Facebook, Twitter, LinkedIn, Instagram].map((Icon, i) => (
                    <IconButton key={i} sx={{ bgcolor: '#f1f5f9', color: '#064e3b', '&:hover': { bgcolor: 'primary.main', color: 'white' } }}>
                      <Icon />
                    </IconButton>
                  ))}
                </Stack>
              </Paper>
            </Stack>
          </Grid>

          {/* Form Side */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Paper elevation={0} sx={{ p: { xs: 4, md: 6 }, borderRadius: 6, boxShadow: '0 20px 60px rgba(0,0,0,0.05)' }}>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#064e3b', mb: 4 }}>Gửi tin nhắn cho chúng tôi</Typography>
              
              <form onSubmit={handleSubmit}>
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField 
                      fullWidth label="Họ và tên" name="fullName" required 
                      value={formData.fullName} onChange={handleChange}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField 
                      fullWidth label="Địa chỉ Email" name="email" type="email" required 
                      value={formData.email} onChange={handleChange}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField 
                      fullWidth label="Số điện thoại" name="phone" 
                      value={formData.phone} onChange={handleChange}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField 
                      fullWidth label="Chủ đề" name="subject" required 
                      value={formData.subject} onChange={handleChange}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <TextField 
                      fullWidth label="Nội dung tin nhắn" name="message" required 
                      multiline rows={5}
                      value={formData.message} onChange={handleChange}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Box sx={{ 
                      p: 2, bgcolor: '#f8fafc', borderRadius: 3, 
                      display: 'flex', alignItems: 'center', gap: 2,
                      border: '1px solid #e2e8f0'
                    }}>
                      <input 
                        type="checkbox" id="nocaptcha" 
                        checked={!isRobot} 
                        onChange={() => setIsRobot(!isRobot)} 
                        style={{ width: 20, height: 20, cursor: 'pointer' }}
                      />
                      <label htmlFor="nocaptcha" style={{ cursor: 'pointer', fontWeight: 600, color: '#475569' }}>
                        Tôi không phải là robot
                      </label>
                      <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', opacity: 0.5 }}>
                        <Security sx={{ mr: 0.5 }} />
                        <Typography variant="caption">CareTriage Security</Typography>
                      </Box>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}
                    <Button 
                      type="submit" variant="contained" size="large" 
                      fullWidth disabled={loading}
                      endIcon={loading ? <CircularProgress size={20} /> : <Send />}
                      sx={{ 
                        py: 2, borderRadius: 3, fontWeight: 800,
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        boxShadow: '0 10px 25px rgba(16, 185, 129, 0.25)',
                      }}
                    >
                      {loading ? 'Đang gửi...' : 'Gửi yêu cầu ngay'}
                    </Button>
                  </Grid>
                </Grid>
              </form>
            </Paper>
          </Grid>
        </Grid>
      </Container>

      <Snackbar 
        open={success} 
        autoHideDuration={6000} 
        onClose={() => setSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSuccess(false)} severity="success" sx={{ width: '100%', borderRadius: 3 }}>
          Cảm ơn bạn! Yêu cầu của bạn đã được gửi thành công. Chúng tôi sẽ phản hồi sớm nhất có thể.
        </Alert>
      </Snackbar>
    </Box>
  )
}
