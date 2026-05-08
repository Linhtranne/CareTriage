import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Box, Container, Grid, Typography, TextField, 
  Card, CardContent, Avatar, Chip, Button, 
  InputAdornment, FormControl, InputLabel, Select, MenuItem,
  Pagination, Skeleton, useTheme, alpha, Fade,
  IconButton, Tooltip, Paper, Divider, Stack
} from '@mui/material'
import { 
  Search, Filter, MapPin, GraduationCap, 
  Stethoscope, Calendar, ArrowRight, X,
  ChevronRight, Star, Heart, Award, Clock
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import publicApi from '../../api/publicApi'

const MotionCard = motion(Card)

const DoctorCard = ({ doctor }) => {
  const theme = useTheme()
  const navigate = useNavigate()
  
  return (
    <MotionCard
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -8, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
      onClick={() => navigate(`/doctors/${doctor.id}`)}
      sx={{ 
        height: '100%', 
        borderRadius: '24px',
        cursor: 'pointer',
        border: '1px solid',
        borderColor: alpha(theme.palette.divider, 0.08),
        overflow: 'hidden',
        position: 'relative',
        bgcolor: 'background.paper',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Box sx={{ p: 3, pb: 0, display: 'flex', alignItems: 'flex-start', gap: 2.5 }}>
        <Avatar
          src={doctor.avatarUrl}
          sx={{ 
            width: 90, 
            height: 90, 
            borderRadius: '20px',
            boxShadow: '0 8px 16px rgba(0,0,0,0.08)',
            border: '3px solid #fff'
          }}
        >
          {doctor.fullName.charAt(0)}
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1.2, mb: 0.5 }}>
                {doctor.fullName}
              </Typography>
              <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Stethoscope size={14} />
                {doctor.specialization}
              </Typography>
            </Box>
            <IconButton size="small" sx={{ color: alpha(theme.palette.error.main, 0.6) }}>
              <Heart size={18} />
            </IconButton>
          </Box>
          <Box sx={{ mt: 1.5, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {doctor.departments?.map((dept) => (
              <Chip 
                key={dept.id} 
                label={dept.name} 
                size="small" 
                sx={{ 
                  borderRadius: '8px', 
                  fontSize: '0.7rem',
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

      <CardContent sx={{ p: 3, flex: 1 }}>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
              <Clock size={16} color={theme.palette.primary.main} />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {doctor.experienceYears} năm KN
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
              <Award size={16} color={theme.palette.warning.main} />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                4.9 (120+)
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
              <MapPin size={16} color={theme.palette.info.main} />
              <Typography variant="body2" sx={{ 
                fontWeight: 500,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {doctor.hospitalName || 'Hệ thống CareTriage'}
              </Typography>
            </Box>
          </Grid>
        </Grid>

        <Box sx={{ 
          mt: 3, 
          p: 2, 
          borderRadius: '16px', 
          bgcolor: alpha(theme.palette.background.default, 0.5),
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
              Giá khám từ
            </Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary' }}>
              500.000đ
            </Typography>
          </Box>
          <Button 
            variant="contained" 
            endIcon={<ChevronRight size={16} />}
            sx={{ 
              borderRadius: '12px',
              textTransform: 'none',
              fontWeight: 700,
              boxShadow: '0 4px 12px rgba(8, 187, 163, 0.2)'
            }}
          >
            Đặt lịch
          </Button>
        </Box>
      </CardContent>
    </MotionCard>
  )
}

export default function DoctorList() {
  const theme = useTheme()
  const [doctors, setDoctors] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    departmentId: '',
    search: '',
    page: 0,
    size: 9
  })
  const [totalPages, setTotalPages] = useState(0)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [deptRes, docRes] = await Promise.all([
        publicApi.getDepartments({ status: 'ACTIVE' }),
        publicApi.getDoctors({
          departmentId: filters.departmentId || undefined,
          search: filters.search || undefined,
          page: filters.page,
          size: filters.size
        })
      ])
      setDepartments(deptRes.data.data.content || deptRes.data.data) // Support both wrapped and unwrapped
      setDoctors(docRes.data.data.content)
      setTotalPages(docRes.data.data.totalPages)
    } catch (error) {
      console.error('Error fetching doctors:', error)
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value, page: 0 }))
  }

  const resetFilters = () => {
    setFilters({
      departmentId: '',
      search: '',
      page: 0,
      size: 9
    })
  }

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', pb: 10 }}>
      {/* Hero Header */}
      <Box sx={{ 
        bgcolor: alpha(theme.palette.primary.main, 0.03), 
        pt: 15, 
        pb: 10,
        borderBottom: '1px solid',
        borderColor: alpha(theme.palette.divider, 0.08)
      }}>
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={7}>
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
              >
                <Chip 
                  label="CareTriage Doctors" 
                  color="primary" 
                  size="small" 
                  sx={{ fontWeight: 800, mb: 2, borderRadius: '8px' }} 
                />
                <Typography variant="h2" sx={{ fontWeight: 900, mb: 2, letterSpacing: '-0.02em' }}>
                  Tìm kiếm <Typography component="span" variant="inherit" color="primary.main">Bác sĩ</Typography> phù hợp
                </Typography>
                <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 500, mb: 4, lineHeight: 1.6, maxWidth: 500 }}>
                  Kết nối với hàng nghìn bác sĩ chuyên khoa giỏi nhất. Chăm sóc sức khỏe của bạn và gia đình một cách tốt nhất.
                </Typography>
              </motion.div>
            </Grid>
            <Grid item xs={12} md={5}>
              <Paper sx={{ 
                p: 1, 
                borderRadius: '24px', 
                boxShadow: '0 20px 50px rgba(0,0,0,0.05)',
                bgcolor: 'background.paper'
              }}>
                <TextField
                  fullWidth
                  placeholder="Tìm theo tên bác sĩ..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search size={20} color={theme.palette.primary.main} />
                      </InputAdornment>
                    ),
                    sx: { 
                      borderRadius: '20px', 
                      '& fieldset': { border: 'none' },
                      bgcolor: alpha(theme.palette.background.default, 0.5),
                      height: '60px',
                      fontSize: '1.1rem',
                      fontWeight: 500
                    }
                  }}
                />
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ mt: -5 }}>
        <Grid container spacing={4}>
          {/* Filters Sidebar */}
          <Grid item xs={12} md={3}>
            <Paper sx={{ 
              p: 3, 
              borderRadius: '24px', 
              boxShadow: '0 10px 30px rgba(0,0,0,0.03)',
              position: { md: 'sticky' },
              top: 100
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <Filter size={20} color={theme.palette.primary.main} />
                <Typography variant="h6" sx={{ fontWeight: 800 }}>Bộ lọc</Typography>
              </Box>

              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: 'text.secondary' }}>
                Chuyên khoa
              </Typography>
              <Stack spacing={1}>
                <Button
                  variant={filters.departmentId === '' ? 'contained' : 'text'}
                  onClick={() => handleFilterChange('departmentId', '')}
                  sx={{ 
                    justifyContent: 'flex-start', 
                    borderRadius: '12px', 
                    textTransform: 'none',
                    fontWeight: filters.departmentId === '' ? 800 : 500,
                    px: 2
                  }}
                >
                  Tất cả chuyên khoa
                </Button>
                {departments.map((dept) => (
                  <Button
                    key={dept.id}
                    variant={filters.departmentId === dept.id ? 'contained' : 'text'}
                    onClick={() => handleFilterChange('departmentId', dept.id)}
                    sx={{ 
                      justifyContent: 'flex-start', 
                      borderRadius: '12px', 
                      textTransform: 'none',
                      fontWeight: filters.departmentId === dept.id ? 800 : 500,
                      px: 2
                    }}
                  >
                    {dept.name}
                  </Button>
                ))}
              </Stack>

              <Divider sx={{ my: 3 }} />

              <Button
                fullWidth
                variant="outlined"
                startIcon={<X size={16} />}
                onClick={resetFilters}
                sx={{ 
                  borderRadius: '12px', 
                  textTransform: 'none', 
                  fontWeight: 700,
                  color: 'text.secondary',
                  borderColor: 'divider'
                }}
              >
                Xóa bộ lọc
              </Button>
            </Paper>
          </Grid>

          {/* Results Area */}
          <Grid item xs={12} md={9}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="body1" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                {loading ? 'Đang tìm kiếm...' : `Tìm thấy ${doctors.length} bác sĩ phù hợp`}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <Select
                    value="popular"
                    sx={{ borderRadius: '10px', fontWeight: 600, fontSize: '0.875rem' }}
                  >
                    <MenuItem value="popular">Phổ biến</MenuItem>
                    <MenuItem value="rating">Đánh giá cao</MenuItem>
                    <MenuItem value="newest">Mới nhất</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Box>

            <AnimatePresence mode="wait">
              {loading ? (
                <Grid container spacing={3}>
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Grid item xs={12} sm={6} key={i}>
                      <Skeleton variant="rectangular" height={280} sx={{ borderRadius: '24px' }} />
                    </Grid>
                  ))}
                </Grid>
              ) : doctors.length > 0 ? (
                <Grid container spacing={3}>
                  {doctors.map((doctor) => (
                    <Grid item xs={12} sm={6} key={doctor.id}>
                      <DoctorCard doctor={doctor} />
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Fade in>
                  <Box sx={{ 
                    py: 10, 
                    textAlign: 'center', 
                    bgcolor: 'background.paper', 
                    borderRadius: '24px',
                    border: '1px dashed',
                    borderColor: 'divider'
                  }}>
                    <Box sx={{ mb: 2, color: 'text.disabled' }}>
                      <Search size={64} />
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
                      Không tìm thấy bác sĩ nào
                    </Typography>
                    <Typography color="text.secondary" sx={{ mb: 3 }}>
                      Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm của bạn.
                    </Typography>
                    <Button 
                      variant="contained" 
                      onClick={resetFilters}
                      sx={{ borderRadius: '12px', px: 4 }}
                    >
                      Xóa tất cả bộ lọc
                    </Button>
                  </Box>
                </Fade>
              )}
            </AnimatePresence>

            {totalPages > 1 && (
              <Box sx={{ mt: 6, display: 'flex', justifyContent: 'center' }}>
                <Pagination 
                  count={totalPages} 
                  page={filters.page + 1} 
                  onChange={(_, p) => handleFilterChange('page', p - 1)}
                  color="primary"
                  size="large"
                  sx={{
                    '& .MuiPaginationItem-root': {
                      borderRadius: '12px',
                      fontWeight: 800
                    }
                  }}
                />
              </Box>
            )}
          </Grid>
        </Grid>
      </Container>
    </Box>
  )
}
