import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  Box, Container, Grid, Typography, Avatar, Chip,
  Button, Divider, Skeleton,
  useTheme, alpha, Stack, IconButton, Paper, Tab, Tabs
} from '@mui/material'
import {
  Stethoscope, Clock, Heart, Share2,
  ChevronLeft, Calendar, ChevronRight,
  ShieldCheck, CheckCircle2
} from 'lucide-react'
import { motion } from 'framer-motion'
import publicApi from '../../api/publicApi'
import { format, addDays, isSameDay } from 'date-fns'
import { vi } from 'date-fns/locale'

const MotionBox = motion(Box)

export default function DoctorDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const theme = useTheme()
  const [doctor, setDoctor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [activeTab, setActiveTab] = useState(0)
  const [slots, setSlots] = useState([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [errorSlots, setErrorSlots] = useState('')

  // Generate next 7 days for schedule
  const dates = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i))

  useEffect(() => {
    const fetchDoctor = async () => {
      setLoading(true)
      try {
        const res = await publicApi.getDoctorById(id)
        setDoctor(res.data.data)
        // SEO: Update page title and meta
        document.title = `${res.data.data.fullName} - CareTriage`
        const metaDesc = document.querySelector('meta[name="description"]')
        if (metaDesc) {
          metaDesc.setAttribute('content', `Thông tin chi tiết và đặt lịch khám với Bác sĩ ${res.data.data.fullName}. Chuyên khoa ${res.data.data.specialization}.`)
        }
      } catch (error) {
        console.error('Error fetching doctor detail:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchDoctor()
  }, [id])

  useEffect(() => {
    const fetchSlots = async () => {
      if (!id || !selectedDate) return
      setLoadingSlots(true)
      setErrorSlots('')
      try {
        const dateStr = format(selectedDate, 'yyyy-MM-dd')
        const res = await publicApi.getDoctorSlots(id, dateStr)
        setSlots(res.data.data || [])
      } catch (error) {
        console.error('Error fetching slots:', error)
        setErrorSlots('Không thể tải lịch khám. Vui lòng thử lại.')
      } finally {
        setLoadingSlots(false)
      }
    }
    fetchSlots()
  }, [id, selectedDate])

  const handleBooking = () => {
    if (!selectedSlot) return
    navigate('/patient/appointments/book-appointment', { 
      state: { 
        doctorId: doctor.id,
        doctor: doctor,
        date: selectedDate,
        slot: selectedSlot
      } 
    })
  }

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 15 }}>
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 8 }}>
            <Skeleton variant="rectangular" height={400} sx={{ borderRadius: '32px', mb: 4 }} />
            <Skeleton variant="rectangular" height={200} sx={{ borderRadius: '32px' }} />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Skeleton variant="rectangular" height={500} sx={{ borderRadius: '32px' }} />
          </Grid>
        </Grid>
      </Container>
    )
  }

  if (!doctor) {
    return (
      <Container maxWidth="sm" sx={{ py: 20, textAlign: 'center' }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 2 }}>Oops! Bác sĩ không tồn tại</Typography>
        <Button variant="contained" onClick={() => navigate('/doctors')}>Quay lại danh sách</Button>
      </Container>
    )
  }

  return (
    <MotionBox 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      sx={{ 
        py: { xs: 5, md: 10 }, 
        bgcolor: '#f8fafc', 
        minHeight: '100vh',
        background: `radial-gradient(circle at 0% 0%, ${alpha(theme.palette.primary.main, 0.03)} 0%, transparent 50%), 
                     radial-gradient(circle at 100% 100%, ${alpha(theme.palette.secondary.main, 0.03)} 0%, transparent 50%)`
      }}
    >
      <Container maxWidth="lg">
        {/* Navigation */}
        <Button 
          startIcon={<ChevronLeft size={18} />}
          onClick={() => navigate('/doctors')}
          sx={{ mb: 4, fontWeight: 700, color: 'text.secondary', textTransform: 'none' }}
        >
          Quay lại danh sách
        </Button>

        <Grid container spacing={4}>
          {/* Left Column: Profile & Info */}
          <Grid size={{ xs: 12, md: 8 }}>
            <MotionBox
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              sx={{ 
                p: { xs: 3, md: 5 }, 
                borderRadius: '32px', 
                bgcolor: 'background.paper', 
                boxShadow: '0 20px 60px rgba(0,0,0,0.05)',
                mb: 4,
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 4, alignItems: { xs: 'center', sm: 'flex-start' } }}>
                <Avatar
                  src={doctor.avatarUrl}
                  sx={{ 
                    width: 160, 
                    height: 160, 
                    borderRadius: '40px', 
                    border: '4px solid #fff',
                    boxShadow: '0 12px 32px rgba(0,0,0,0.1)'
                  }}
                />
                <Box sx={{ flex: 1, textAlign: { xs: 'center', sm: 'left' } }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Typography variant="h3" sx={{ fontWeight: 900, color: 'text.primary', mb: 1, letterSpacing: '-0.02em' }}>
                        {doctor.fullName}
                      </Typography>
                      <Typography variant="h6" color="primary.main" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1, justifyContent: { xs: 'center', sm: 'flex-start' } }}>
                        <Stethoscope size={20} />
                        {doctor.specialization}
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={1} sx={{ display: { xs: 'none', sm: 'flex' } }}>
                      <IconButton sx={{ bgcolor: alpha(theme.palette.error.main, 0.05), color: 'error.main' }}>
                        <Heart size={20} />
                      </IconButton>
                      <IconButton sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05), color: 'primary.main' }}>
                        <Share2 size={20} />
                      </IconButton>
                    </Stack>
                  </Box>

                  <Box sx={{ mt: 3, display: 'flex', flexWrap: 'wrap', gap: 3, justifyContent: { xs: 'center', sm: 'flex-start' } }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h5" sx={{ fontWeight: 900 }}>{doctor.experienceYears}+</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>Năm kinh nghiệm</Typography>
                    </Box>
                    <Divider orientation="vertical" flexItem sx={{ my: 1 }} />
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h5" sx={{ fontWeight: 900 }}>4.9</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>Xếp hạng</Typography>
                    </Box>
                    <Divider orientation="vertical" flexItem sx={{ my: 1 }} />
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h5" sx={{ fontWeight: 900 }}>1.2k</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>Bệnh nhân</Typography>
                    </Box>
                  </Box>

                  <Box sx={{ mt: 3, display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: { xs: 'center', sm: 'flex-start' } }}>
                    {doctor.departments?.map(dept => (
                      <Chip 
                        key={dept.id} 
                        label={dept.name} 
                        sx={{ 
                          borderRadius: '10px', 
                          fontWeight: 700,
                          bgcolor: alpha(theme.palette.primary.main, 0.08),
                          color: 'primary.main',
                          border: '1px solid',
                          borderColor: alpha(theme.palette.primary.main, 0.1)
                        }} 
                      />
                    ))}
                  </Box>
                </Box>
              </Box>
            </MotionBox>

            <Paper sx={{ borderRadius: '32px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.05)' }}>
                <Tabs 
                value={activeTab} 
                onChange={(_, v) => setActiveTab(v)}
                variant="fullWidth"
                sx={{ 
                  bgcolor: alpha(theme.palette.background.paper, 0.8),
                  backdropFilter: 'blur(10px)',
                  borderBottom: '1px solid',
                  borderColor: alpha(theme.palette.divider, 0.1),
                  '& .MuiTabs-indicator': { height: 4, borderRadius: '4px 4px 0 0' }
                }}
              >
                <Tab label="Giới thiệu" sx={{ fontWeight: 800, textTransform: 'none', py: 3 }} />
                <Tab label="Kinh nghiệm" sx={{ fontWeight: 800, textTransform: 'none', py: 3 }} />
                <Tab label="Đánh giá" sx={{ fontWeight: 800, textTransform: 'none', py: 3 }} />
              </Tabs>
              <Box sx={{ p: { xs: 3, md: 5 } }}>
                {activeTab === 0 && (
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>Về bác sĩ</Typography>
                    <Typography variant="body1" sx={{ color: 'text.secondary', lineHeight: 1.7, letterSpacing: '0.01em' }}>
                      {doctor.bio || 'Thông tin giới thiệu về bác sĩ đang được cập nhật...'}
                    </Typography>
                    <Box sx={{ mt: 4, display: 'flex', gap: 2, alignItems: 'center' }}>
                      <CheckCircle2 color={theme.palette.success.main} size={20} />
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>Thành viên Hiệp hội Y khoa Quốc tế</Typography>
                    </Box>
                  </Box>
                )}
              </Box>
            </Paper>
          </Grid>

          {/* Right Column: Schedule & Booking */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper sx={{ 
              p: 4, 
              borderRadius: '32px', 
              boxShadow: '0 20px 60px rgba(0,0,0,0.08)',
              position: { md: 'sticky' },
              top: 100,
              border: '1px solid',
              borderColor: alpha(theme.palette.divider, 0.08)
            }}>
              <Box sx={{ mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                  <Calendar size={20} color={theme.palette.primary.main} />
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>Lịch khám</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                  Chọn ngày và giờ phù hợp để đặt lịch
                </Typography>
              </Box>

              {/* Date Selector */}
              <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', mb: 4, pb: 1, '&::-webkit-scrollbar': { display: 'none' } }}>
                {dates.map((date, idx) => {
                  const isSelected = isSameDay(date, selectedDate)
                  return (
                    <Box
                      key={idx}
                      onClick={() => setSelectedDate(date)}
                      sx={{ 
                        minWidth: 70, 
                        p: 1.5, 
                        borderRadius: '16px', 
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        bgcolor: isSelected ? 'primary.main' : alpha(theme.palette.background.default, 0.5),
                        color: isSelected ? '#fff' : 'text.primary',
                        border: '1px solid',
                        borderColor: isSelected ? 'primary.main' : alpha(theme.palette.divider, 0.1),
                        '&:hover': { bgcolor: isSelected ? 'primary.main' : alpha(theme.palette.primary.main, 0.05) }
                      }}
                    >
                      <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', opacity: isSelected ? 0.8 : 0.6 }}>
                        {format(date, 'EEE', { locale: vi })}
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 900 }}>
                        {format(date, 'dd')}
                      </Typography>
                    </Box>
                  )
                })}
              </Box>

              {/* Time Slots */}
              <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Clock size={16} /> Khung giờ trống
              </Typography>
              
              {loadingSlots ? (
                <Grid container spacing={1.5} sx={{ mb: 4 }}>
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Grid size={{ xs: 4 }} key={i}>
                      <Skeleton variant="rectangular" height={45} sx={{ borderRadius: '12px' }} />
                    </Grid>
                  ))}
                </Grid>
              ) : errorSlots ? (
                <Typography variant="body2" color="error" sx={{ mb: 4, textAlign: 'center' }}>
                  {errorSlots}
                </Typography>
              ) : slots.length > 0 ? (
                <Grid container spacing={1.5} sx={{ mb: 4 }}>
                  {slots.map((slot, idx) => (
                    <Grid size={{ xs: 4 }} key={idx}>
                      <Button
                        fullWidth
                        disabled={!slot.available}
                        variant={selectedSlot?.startTime === slot.startTime ? "contained" : "outlined"}
                        onClick={() => setSelectedSlot(slot)}
                        sx={{ 
                          borderRadius: '12px', 
                          py: 1.5, 
                          fontWeight: 700,
                          textTransform: 'none',
                          borderColor: selectedSlot?.startTime === slot.startTime ? 'primary.main' : alpha(theme.palette.divider, 0.1),
                          color: !slot.available ? 'text.disabled' : (selectedSlot?.startTime === slot.startTime ? '#fff' : 'text.primary'),
                          bgcolor: !slot.available ? alpha(theme.palette.action.disabledBackground, 0.05) : (selectedSlot?.startTime === slot.startTime ? 'primary.main' : 'transparent'),
                          '&:hover': { bgcolor: selectedSlot?.startTime === slot.startTime ? 'primary.dark' : alpha(theme.palette.primary.main, 0.05), borderColor: 'primary.main' }
                        }}
                      >
                        {slot.startTime.substring(0, 5)}
                      </Button>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 4, textAlign: 'center', py: 2, bgcolor: alpha(theme.palette.action.hover, 0.05), borderRadius: '12px' }}>
                  Bác sĩ không có lịch vào ngày này.
                </Typography>
              )}

              <Box sx={{ 
                p: 2.5, 
                borderRadius: '20px', 
                bgcolor: alpha(theme.palette.success.main, 0.03), 
                border: '1px solid',
                borderColor: alpha(theme.palette.success.main, 0.1),
                mb: 4 
              }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>Giá khám tham khảo</Typography>
                  <Typography variant="h6" color="success.main" sx={{ fontWeight: 900 }}>500.000đ</Typography>
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontWeight: 500 }}>
                  <ShieldCheck size={14} /> Bảo hiểm hỗ trợ tới 80%
                </Typography>
              </Box>

              <Button
                fullWidth
                variant="contained"
                size="large"
                disabled={!selectedSlot}
                onClick={handleBooking}
                endIcon={<ChevronRight size={20} />}
                sx={{ 
                  borderRadius: '16px', 
                  py: 2, 
                  fontWeight: 800,
                  fontSize: '1.1rem',
                  boxShadow: '0 12px 32px rgba(8, 187, 163, 0.25)',
                  textTransform: 'none'
                }}
              >
                Đặt lịch hẹn ngay
              </Button>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </MotionBox>
  )
}
