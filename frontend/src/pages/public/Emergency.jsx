import React, { useState, useEffect } from 'react'
import { 
  Box, Container, Typography, Grid, Paper, Button, 
  Stack, Divider, List, ListItem, ListItemIcon, ListItemText,
  useTheme, Alpha
} from '@mui/material'
import { 
  PhoneInTalk, NearMe, AccessTime, Info, 
  HealthAndSafety, LocalHospital, Warning, Directions
} from '@mui/icons-material'


export default function Emergency() {
  const theme = useTheme()
  const [distance, setDistance] = useState(null)
  const [userLocation, setUserLocation] = useState(null)

  // Simulation of hospital location (Hanoi Medical University Hospital as example)
  const hospitalCoords = { lat: 21.0028, lng: 105.8286 }

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords
        setUserLocation({ lat: latitude, lng: longitude })
        
        // Simple Haversine distance formula
        const R = 6371 // km
        const dLat = (latitude - hospitalCoords.lat) * Math.PI / 180
        const dLon = (longitude - hospitalCoords.lng) * Math.PI / 180
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(hospitalCoords.lat * Math.PI / 180) * Math.cos(latitude * Math.PI / 180) * 
                  Math.sin(dLon/2) * Math.sin(dLon/2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
        setDistance((R * c).toFixed(1))
      })
    }
  }, [])

  const firstAidSteps = [
    { title: 'Ép tim ngoài lồng ngực (CPR)', detail: 'Nhấn mạnh và nhanh vào giữa ngực (100-120 lần/phút).' },
    { title: 'Xử lý hóc dị vật (Heimlich)', detail: 'Đứng sau nạn nhân, ôm quanh bụng và đẩy mạnh lên trên.' },
    { title: 'Cầm máu vết thương', detail: 'Sử dụng vải sạch ép trực tiếp lên vết thương và băng chặt.' },
    { title: 'Xử lý bỏng nhiệt', detail: 'Ngâm vùng bị bỏng vào nước sạch mát trong ít nhất 15-20 phút.' }
  ]

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc', pb: 10 }}>
      
      {/* Top Banner - Urgency Style */}
      <Box sx={{ 
        pt: 15, pb: 6, px: 3, bgcolor: '#991b1b', color: 'white', 
        textAlign: 'center', borderBottom: '10px solid #7f1d1d' 
      }}>
        <Container maxWidth="xl">
          <Warning sx={{ fontSize: 60, mb: 2, animation: 'pulse 1.5s infinite' }} />
          <Typography variant="h2" sx={{ fontWeight: 900, mb: 2, fontSize: { xs: '2.5rem', md: '4rem' } }}>
            HỖ TRỢ CẤP CỨU
          </Typography>
          <Typography variant="h5" sx={{ opacity: 0.9, fontWeight: 500 }}>
            Hệ thống tực trực 24/7. Phản ứng nhanh nhất vì sự sống của bạn.
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ mt: 6 }}>
        <Grid container spacing={4}>
          {/* Main Hotlines */}
          <Grid size={{ xs: 12, md: 7 }}>
            <Stack spacing={3}>
              <Paper elevation={0} sx={{ 
                p: 4, bgcolor: '#fef2f2', border: '3px solid #ef4444', 
                borderRadius: 6, textAlign: 'center' 
              }}>
                <Typography variant="h4" sx={{ fontWeight: 900, color: '#991b1b', mb: 1 }}>
                  Tổng đài Cấp cứu Toàn quốc
                </Typography>
                <Button 
                  variant="contained" 
                  href="tel:115"
                  fullWidth
                  sx={{ 
                    bgcolor: '#ef4444', color: 'white', py: 3, 
                    borderRadius: 4, fontSize: '3rem', fontWeight: 900,
                    boxShadow: '0 10px 30px rgba(239, 68, 68, 0.4)',
                    '&:hover': { bgcolor: '#dc2626' }
                  }}
                >
                  115
                </Button>
                <Typography variant="body1" sx={{ mt: 2, color: '#7f1d1d', fontWeight: 600 }}>
                  (Nhấn vào số để gọi ngay lập tức)
                </Typography>
              </Paper>

              <Paper elevation={0} sx={{ p: 4, borderRadius: 6, border: '1px solid #e2e8f0' }}>
                <Typography variant="h5" sx={{ fontWeight: 800, mb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <HealthAndSafety color="error" /> Hướng dẫn sơ cứu nhanh
                </Typography>
                <Grid container spacing={2}>
                  {firstAidSteps.map((step, index) => (
                    <Grid size={{ xs: 12 }} key={index}>
                      <Box sx={{ p: 3, bgcolor: '#f8fafc', borderRadius: 4, borderLeft: '6px solid #ef4444' }}>
                        <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5 }}>{step.title}</Typography>
                        <Typography variant="body1" color="text.secondary">{step.detail}</Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            </Stack>
          </Grid>

          {/* Location & Secondary Contacts */}
          <Grid size={{ xs: 12, md: 5 }}>
            <Stack spacing={3}>
              <Paper elevation={0} sx={{ p: 4, borderRadius: 6, bgcolor: '#1e293b', color: 'white' }}>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <NearMe color="primary" /> Cơ sở gần bạn nhất
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>Bệnh viện CareTriage Central</Typography>
                <Typography variant="body2" sx={{ opacity: 0.7, mb: 3 }}>Số 123 Giải Phóng, Hai Bà Trưng, Hà Nội</Typography>
                
                <Stack spacing={2} sx={{ mb: 4 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 2, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 3 }}>
                    <Typography>Khoảng cách:</Typography>
                    <Typography sx={{ fontWeight: 700, color: '#10b981' }}>{distance ? `${distance} km` : 'Đang định vị...'}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 2, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 3 }}>
                    <Typography>Trạng thái:</Typography>
                    <Typography sx={{ fontWeight: 700, color: '#10b981' }}>Mở cửa 24/7</Typography>
                  </Box>
                </Stack>

                <Button 
                  fullWidth variant="contained" 
                  startIcon={<Directions />}
                  href={`https://www.google.com/maps/dir/?api=1&destination=${hospitalCoords.lat},${hospitalCoords.lng}`}
                  target="_blank"
                  sx={{ py: 1.5, borderRadius: 3, fontWeight: 800, bgcolor: '#10b981' }}
                >
                  Chỉ đường qua Maps
                </Button>
              </Paper>

              <Paper elevation={0} sx={{ p: 4, borderRadius: 6, border: '1px solid #e2e8f0' }}>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 3 }}>Đường dây nóng hỗ trợ</Typography>
                <List>
                  <ListItem disableGutters>
                    <ListItemIcon><PhoneInTalk color="error" /></ListItemIcon>
                    <ListItemText primary="Hotline Cấp cứu Nội bộ" secondary="024-3852-XXXX" />
                  </ListItem>
                  <ListItem disableGutters>
                    <ListItemIcon><AccessTime color="primary" /></ListItemIcon>
                    <ListItemText primary="Tiếp nhận 24/7" secondary="Luôn sẵn sàng phục vụ" />
                  </ListItem>
                </List>
              </Paper>
            </Stack>
          </Grid>
        </Grid>
      </Container>
      
      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.7; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </Box>
  )
}
