import { useEffect, useState } from 'react'
import {
  Box, Container, Typography, Grid, Paper, Stack, Button,
  Avatar, CircularProgress, Divider, Breadcrumbs, Link,
  List, ListItem, ListItemIcon, ListItemText, Skeleton
} from '@mui/material'
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom'
import { 
  LocalHospital, ArrowRight, Star, 
  Phone, AccessTime, LocationOn 
} from '@mui/icons-material'
import publicApi from '../../api/publicApi'

export default function DepartmentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [department, setDepartment] = useState(null)
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [deptRes, docRes] = await Promise.all([
          publicApi.getDepartmentById(id),
          publicApi.getDoctors({ departmentId: id, page: 0, size: 20 })
        ])
        setDepartment(deptRes.data?.data)
        setDoctors(docRes.data?.data?.content || [])
      } catch (error) {
        console.error("Failed to fetch department details", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id])

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc', pb: 10 }}>
        <Box
          sx={{
            pt: 15,
            pb: 8,
            px: 3,
            background: 'linear-gradient(135deg, #064e3b 0%, #065f46 100%)',
            color: 'white'
          }}
        >
          <Container maxWidth="xl">
            <Skeleton variant="text" width={220} height={30} sx={{ bgcolor: 'rgba(255,255,255,0.25)', mb: 2 }} />
            <Skeleton variant="text" width="55%" height={72} sx={{ bgcolor: 'rgba(255,255,255,0.3)', mb: 2 }} />
            <Skeleton variant="text" width="40%" height={38} sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} />
          </Container>
        </Box>
        <Container maxWidth="xl" sx={{ mt: 6 }}>
          <Grid container spacing={4}>
            <Grid size={{ xs: 12, md: 8 }}>
              <Skeleton variant="rectangular" height={260} sx={{ borderRadius: 5, mb: 3 }} />
              <Skeleton variant="rectangular" height={220} sx={{ borderRadius: 5 }} />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Paper sx={{ p: 4, borderRadius: 6, textAlign: 'center' }}>
                <CircularProgress size={32} sx={{ mb: 2 }} />
                <Typography color="text.secondary">Đang tải thông tin chuyên khoa...</Typography>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>
    )
  }

  if (!department) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography>Không tìm thấy thông tin chuyên khoa.</Typography>
        <Button onClick={() => navigate('/')}>Quay lại trang chủ</Button>
      </Box>
    )
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc', pb: 10 }}>
      
      {/* Header Section */}
      <Box sx={{ 
        pt: 15, pb: 8, px: 3, 
        background: 'linear-gradient(135deg, #064e3b 0%, #065f46 100%)',
        color: 'white'
      }}>
        <Container maxWidth="xl">
          <Breadcrumbs aria-label="breadcrumb" sx={{ color: 'rgba(255,255,255,0.7)', mb: 3 }}>
            <Link component={RouterLink} to="/" sx={{ color: 'inherit', textDecoration: 'none' }}>Trang chủ</Link>
            <Link component={RouterLink} to="/doctors" sx={{ color: 'inherit', textDecoration: 'none' }}>Đội ngũ bác sĩ</Link>
            <Typography sx={{ color: 'white' }}>{department.name}</Typography>
          </Breadcrumbs>
          <Grid container spacing={4} alignItems="center">
            <Grid size={{ xs: 12, md: 8 }}>
              <Typography variant="h2" sx={{ fontWeight: 900, mb: 2 }}>{department.name}</Typography>
              <Typography variant="h5" sx={{ opacity: 0.9, fontWeight: 400, fontStyle: 'italic' }}>
                {department.description || 'Đồng hành cùng người bệnh với đội ngũ chuyên môn sâu và quy trình điều trị an toàn.'}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }} sx={{ textAlign: { md: 'right' } }}>
              <Box sx={{ 
                p: 3, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 4, 
                backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)' 
              }}>
                <LocalHospital sx={{ fontSize: 60, mb: 1, color: '#10b981' }} />
                <Typography variant="h6">Chuyên khoa mũi nhọn</Typography>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Main Content Area */}
      <Container maxWidth="xl" sx={{ mt: 6 }}>
        <Grid container spacing={5}>
          {/* Content Column */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Paper elevation={0} sx={{ p: { xs: 3, md: 5 }, borderRadius: 6, mb: 4 }}>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#064e3b', mb: 3 }}>Giới thiệu chuyên khoa</Typography>
              <Typography variant="body1" sx={{ color: '#4b5563', lineHeight: 1.8, fontSize: '1.1rem', mb: 4 }}>
                {department.description || 'Đang cập nhật thông tin mô tả chi tiết cho chuyên khoa này.'}
              </Typography>
              <Typography variant="body1" sx={{ color: '#4b5563', lineHeight: 1.8, fontSize: '1.1rem' }}>
                Tại đây, chúng tôi quy tụ đội ngũ chuyên gia hàng đầu với nhiều năm kinh nghiệm lâm sàng. Hệ thống trang thiết bị hiện đại đạt chuẩn quốc tế giúp chẩn đoán và điều trị chính xác, hiệu quả nhất cho người bệnh.
              </Typography>
            </Paper>

            <Typography variant="h4" sx={{ fontWeight: 800, color: '#064e3b', mb: 3, mt: 6 }}>Đội ngũ bác sĩ thuộc khoa</Typography>
            <Grid container spacing={3}>
              {doctors.length > 0 ? doctors.map((doc) => (
                <Grid size={{ xs: 12, sm: 6 }} key={doc.id}>
                  <Paper sx={{ 
                    p: 3, borderRadius: 5, border: '1px solid #e2e8f0',
                    transition: '0.3s', '&:hover': { boxShadow: 4, transform: 'translateY(-5px)' }
                  }}>
                    <Stack direction="row" spacing={2.5} alignItems="center">
                      <Avatar src={doc.avatarUrl} sx={{ width: 80, height: 80, border: '3px solid #f1f5f9' }} />
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>BS. {doc.fullName}</Typography>
                        <Typography variant="body2" color="primary.main" sx={{ fontWeight: 600, mb: 1 }}>{doc.specialization || 'Chuyên gia cao cấp'}</Typography>
                        <Stack direction="row" spacing={0.5} sx={{ color: '#f59e0b' }}>
                          <Star fontSize="small" /><Star fontSize="small" /><Star fontSize="small" /><Star fontSize="small" /><Star fontSize="small" />
                        </Stack>
                      </Box>
                    </Stack>
                    <Divider sx={{ my: 2 }} />
                    <Button 
                      fullWidth variant="outlined" 
                      endIcon={<ArrowRight />}
                      onClick={() => navigate(`/doctors/${doc.id}`)}
                      sx={{ borderRadius: 2, fontWeight: 700 }}
                    >
                      Xem chi tiết
                    </Button>
                  </Paper>
                </Grid>
              )) : (
                <Grid size={{ xs: 12 }}>
                  <Typography color="text.secondary">Chưa có danh sách bác sĩ cập nhật cho khoa này.</Typography>
                </Grid>
              )}
            </Grid>
          </Grid>

          {/* Sidebar Column */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Stack spacing={4}>
              {/* Quick Booking */}
              <Paper sx={{ p: 4, borderRadius: 6, bgcolor: '#064e3b', color: 'white' }}>
                <Typography variant="h5" sx={{ fontWeight: 800, mb: 2 }}>Đặt lịch ngay</Typography>
                <Typography variant="body2" sx={{ opacity: 0.8, mb: 3 }}>Bệnh nhân vui lòng đặt lịch trước để được ưu tiên phục vụ và giảm thời gian chờ đợi.</Typography>
                <Button 
                  fullWidth variant="contained" 
                  onClick={() => navigate('/register')}
                  sx={{ 
                    bgcolor: '#10b981', color: 'white', py: 1.5, borderRadius: 3, 
                    fontWeight: 800, '&:hover': { bgcolor: '#059669' } 
                  }}
                >
                  Đăng ký khám ngay
                </Button>
              </Paper>

              {/* Contact Info */}
              <Paper sx={{ p: 4, borderRadius: 6 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 3 }}>Thông tin liên hệ khoa</Typography>
                <List spacing={2}>
                  <ListItem disableGutters>
                    <ListItemIcon><Phone sx={{ color: '#059669' }} /></ListItemIcon>
                    <ListItemText primary="Hotline khoa" secondary="1900-XXXX-01" />
                  </ListItem>
                  <ListItem disableGutters>
                    <ListItemIcon><AccessTime sx={{ color: '#059669' }} /></ListItemIcon>
                    <ListItemText primary="Giờ làm việc" secondary="Thứ 2 - Thứ 7 (7:30 - 17:30)" />
                  </ListItem>
                  <ListItem disableGutters>
                    <ListItemIcon><LocationOn sx={{ color: '#059669' }} /></ListItemIcon>
                    <ListItemText primary="Vị trí" secondary="Tầng 3, Khu nhà B" />
                  </ListItem>
                </List>
              </Paper>
            </Stack>
          </Grid>
        </Grid>
      </Container>
    </Box>
  )
}
