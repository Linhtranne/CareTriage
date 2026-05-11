import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Box, Container, Grid, Typography, TextField, 
  Avatar, Button, FormControl, Select, MenuItem,
  Pagination, Skeleton, Chip, InputAdornment
} from '@mui/material'
import { 
  Search, MapPin, Stethoscope, Clock, Award, X
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import publicApi from '../../api/publicApi'
import { useTranslation } from 'react-i18next'

// Variants
const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } }
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
}

// Custom Loading Skeleton Row
const SkeletonRow = () => (
  <Box sx={{ 
    display: 'flex', flexDirection: { xs: 'column', md: 'row' }, 
    gap: { xs: 4, md: 6 }, py: { xs: 6, md: 8 }, 
    borderBottom: '1px solid #e2e8f0' 
  }}>
    <Skeleton variant="rectangular" sx={{ width: { xs: 100, md: 160 }, height: { xs: 100, md: 160 }, borderRadius: '32px' }} />
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <Skeleton variant="text" width="40%" height={60} sx={{ mb: 1 }} />
      <Skeleton variant="text" width="20%" height={30} sx={{ mb: 3 }} />
      <Box sx={{ display: 'flex', gap: 3, mb: 2 }}>
        <Skeleton variant="text" width={100} height={24} />
        <Skeleton variant="text" width={100} height={24} />
      </Box>
      <Skeleton variant="text" width="90%" height={24} />
    </Box>
    <Box sx={{ width: { xs: '100%', md: '280px' }, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-end', gap: 2 }}>
      <Skeleton variant="text" width={80} height={20} />
      <Skeleton variant="text" width={140} height={40} />
      <Skeleton variant="rectangular" width="100%" height={56} sx={{ borderRadius: '100px' }} />
    </Box>
  </Box>
)

const DoctorRow = ({ doctor }) => {
  const navigate = useNavigate()
  const { t } = useTranslation()
  
  return (
    <motion.div variants={fadeUp} layout>
      <Box 
        onClick={() => navigate(`/doctors/${doctor.id}`)}
        sx={{ 
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: { xs: 4, md: 6 },
          py: { xs: 6, md: 8 },
          px: { md: 4 },
          mx: { md: -4 },
          borderRadius: { md: '32px' },
          borderBottom: '1px solid #e2e8f0',
          cursor: 'pointer',
          transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          '&:hover': { 
            background: '#f8fafc',
            borderColor: '#08bba3',
            boxShadow: '0 20px 40px rgba(0,0,0,0.02)'
          }
        }}
      >
        {/* Left: Avatar Cluster */}
        <Box sx={{ flexShrink: 0, alignSelf: { xs: 'flex-start', md: 'center' }, position: 'relative' }}>
          <Avatar
            src={doctor.avatarUrl}
            sx={{ 
              width: { xs: 120, md: 160 }, 
              height: { xs: 120, md: 160 }, 
              borderRadius: '32px', 
              border: '1px solid #e2e8f0',
              boxShadow: '0 8px 24px rgba(0,0,0,0.05)'
            }}
          >
            {doctor.fullName.charAt(0)}
          </Avatar>
        </Box>

        {/* Center: Editorial Details */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Box sx={{ mb: 1 }}>
            <Typography 
              variant="h3" 
              sx={{ 
                fontWeight: 900, color: '#0f172a', 
                fontSize: { xs: '2rem', md: '3rem' }, 
                lineHeight: 1, mb: 1,
                letterSpacing: '-0.03em'
              }}
            >
              {doctor.fullName}
            </Typography>
            <Typography variant="h6" sx={{ color: '#08bba3', fontWeight: 700, fontSize: '1.125rem' }}>
              {doctor.specialization}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4, mb: 3, mt: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, color: '#64748b' }}>
              <Clock size={20} />
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {doctor.experienceYears} {t('doctor_list.years_experience')}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, color: '#64748b' }}>
              <Award size={20} />
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {t('doctor_list.reviews')}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, color: '#94a3b8' }}>
            <MapPin size={20} style={{ marginTop: '2px', flexShrink: 0 }} />
            <Typography variant="body1" sx={{ fontWeight: 400, maxWidth: '65ch', fontSize: '1.125rem' }}>
              {doctor.hospitalName || t('doctor_list.default_hospital')}
            </Typography>
          </Box>

          {/* Departments - Clean Pills */}
          <Box sx={{ mt: 3, display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
            {doctor.departments?.map((dept) => (
              <Box 
                key={dept.id} 
                sx={{ 
                  px: 2.5, py: 0.75, 
                  background: '#ffffff', color: '#64748b',
                  fontSize: '0.813rem', fontWeight: 700,
                  borderRadius: '100px',
                  border: '1px solid #e2e8f0',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }} 
              >
                {dept.name}
              </Box>
            ))}
          </Box>
        </Box>

        {/* Right: Modern Booking Action */}
        <Box sx={{ 
          flexShrink: 0, 
          width: { xs: '100%', md: '300px' },
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: { xs: 'flex-start', md: 'flex-end' },
          justifyContent: 'center',
          gap: 3,
          pl: { md: 4 }
        }}>
          <Box sx={{ textAlign: { xs: 'left', md: 'right' } }}>
            <Typography variant="overline" sx={{ color: '#94a3b8', fontWeight: 700, letterSpacing: '0.15em', display: 'block', mb: 0.5 }}>
              {t('doctor_list.consultation_fee')}
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 900, color: '#064e3b' }}>
              {t('doctor_list.price_mock')}
            </Typography>
          </Box>
          <Button 
            variant="contained" 
            sx={{ 
              background: '#0f172a', color: '#ffffff',
              borderRadius: '100px', 
              px: 5, py: 2, 
              fontSize: '1rem', fontWeight: 800,
              textTransform: 'none',
              boxShadow: 'none',
              width: '100%',
              height: '56px',
              '&:hover': {
                background: '#08bba3',
                boxShadow: '0 12px 30px rgba(8, 187, 163, 0.3)'
              },
              transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/doctors/${doctor.id}`)
            }}
          >
            {t('doctor_list.book_appointment')}
          </Button>
        </Box>
      </Box>
    </motion.div>
  )
}

export default function DoctorList() {
  const [doctors, setDoctors] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    departmentId: '',
    search: '',
    page: 0,
    size: 10
  })
  const [totalPages, setTotalPages] = useState(0)
  const { t } = useTranslation()

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
      setDepartments(deptRes.data.data.content || deptRes.data.data) 
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
      size: 10
    })
  }

  return (
    <Box sx={{ bgcolor: '#ffffff', minHeight: '100vh' }}>
      
      {/* Restrained Hero Header (Meadow Mist) */}
      <Box sx={{ background: '#f0fdf4', pt: { xs: 16, md: 24 }, pb: { xs: 12, md: 16 }, px: 3, borderBottom: '1px solid #e2e8f0' }}>
        <Container maxWidth="xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <Grid container>
              <Grid item xs={12} md={9} lg={8}>
                <Typography variant="overline" sx={{ color: '#08bba3', fontWeight: 700, letterSpacing: '0.1em', display: 'block', mb: 2 }}>
                  {t('doctor_list.hero_overline')}
                </Typography>
                <Typography variant="h1" sx={{ fontWeight: 900, mb: 3, letterSpacing: '-0.03em', fontSize: { xs: '3rem', md: '5rem' }, color: '#064e3b', lineHeight: 1.1 }}>
                  {t('doctor_list.hero_title_1')} <br />
                  {t('doctor_list.hero_title_2')}
                </Typography>
                <Typography variant="body1" sx={{ color: '#4b5563', fontSize: '1.25rem', maxWidth: '55ch', lineHeight: 1.7 }}>
                  {t('doctor_list.hero_desc')}
                </Typography>
              </Grid>
            </Grid>
          </motion.div>
        </Container>
      </Box>

      {/* Unified Filter Bar - Search First Layout */}
      <Box sx={{ borderBottom: '1px solid #e2e8f0', background: '#ffffff', py: 4 }}>
        <Container maxWidth="xl">
          <Grid container spacing={3} alignItems="center">
            {/* 1. Primary Search Box */}
            <Grid item xs={12} lg={4}>
              <TextField
                fullWidth
                placeholder={t('doctor_list.search_placeholder')}
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search size={22} color="#08bba3" strokeWidth={2.5} />
                    </InputAdornment>
                  ),
                  sx: { 
                    height: '56px',
                    borderRadius: '100px',
                    background: '#f8fafc',
                    fontSize: '1rem',
                    fontWeight: 500,
                    color: '#0f172a',
                    paddingLeft: '12px',
                    '& fieldset': {
                      borderColor: '#e2e8f0',
                      transition: 'all 0.3s ease'
                    },
                    '&:hover fieldset': {
                      borderColor: '#cbd5e1'
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#08bba3',
                      borderWidth: '2px',
                      boxShadow: '0 0 0 4px rgba(8, 187, 163, 0.15)'
                    }
                  }
                }}
              />
            </Grid>

            {/* 2. Department Chips - Secondary Filter */}
            <Grid item xs={12} lg={4}>
              <Box sx={{ 
                display: 'flex', 
                flexWrap: 'nowrap', 
                overflowX: 'auto', 
                gap: 1.5, 
                height: '56px',
                alignItems: 'center',
                '&::-webkit-scrollbar': { display: 'none' },
                msOverflowStyle: 'none',
                scrollbarWidth: 'none',
              }}>
                <Chip
                  label={t('doctor_list.all_departments')}
                  onClick={() => handleFilterChange('departmentId', '')}
                  sx={{ 
                    borderRadius: '100px', 
                    fontWeight: 700,
                    height: '56px', px: 2,
                    cursor: 'pointer',
                    border: '1px solid',
                    borderColor: filters.departmentId === '' ? '#08bba3' : '#e2e8f0',
                    background: filters.departmentId === '' ? 'rgba(8, 187, 163, 0.1)' : '#ffffff',
                    color: filters.departmentId === '' ? '#064e3b' : '#64748b',
                    '&:hover': { background: filters.departmentId === '' ? 'rgba(8, 187, 163, 0.15)' : '#f8fafc' }
                  }}
                />
                {departments.map((dept) => (
                  <Chip
                    key={dept.id}
                    label={dept.name}
                    onClick={() => handleFilterChange('departmentId', dept.id)}
                    sx={{ 
                      borderRadius: '100px', 
                      fontWeight: 600,
                      height: '56px', px: 2,
                      cursor: 'pointer',
                      border: '1px solid',
                      borderColor: filters.departmentId === dept.id ? '#08bba3' : '#e2e8f0',
                      background: filters.departmentId === dept.id ? 'rgba(8, 187, 163, 0.1)' : '#ffffff',
                      color: filters.departmentId === dept.id ? '#064e3b' : '#64748b',
                      '&:hover': { background: filters.departmentId === dept.id ? 'rgba(8, 187, 163, 0.15)' : '#f8fafc' }
                    }}
                  />
                ))}
              </Box>
            </Grid>
            
            {/* 3. Actions: Sort & Reset */}
            <Grid item xs={12} lg={4}>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', justifyContent: { xs: 'flex-start', lg: 'flex-end' } }}>
                <Select
                  value="popular"
                  sx={{ 
                    fontWeight: 700, 
                    color: '#0f172a',
                    background: '#ffffff',
                    borderRadius: '100px',
                    height: '56px',
                    minWidth: '160px',
                    '& fieldset': { borderColor: '#e2e8f0' },
                    '&:hover fieldset': { borderColor: '#cbd5e1' },
                    '&.Mui-focused fieldset': { borderColor: '#08bba3' }
                  }}
                >
                  <MenuItem value="popular">{t('doctor_list.sort_popular')}</MenuItem>
                  <MenuItem value="rating">{t('doctor_list.sort_rating')}</MenuItem>
                  <MenuItem value="newest">{t('doctor_list.sort_newest')}</MenuItem>
                </Select>
                {(filters.departmentId || filters.search) && (
                  <Button
                    onClick={resetFilters}
                    sx={{ 
                      minWidth: '56px', height: '56px', borderRadius: '50%', 
                      color: '#64748b', border: '1px solid #e2e8f0',
                      '&:hover': { background: '#f1f5f9', color: '#0f172a', borderColor: '#cbd5e1' }
                    }}
                  >
                    <X size={20} />
                  </Button>
                )}
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Main Content List */}
      <Container maxWidth="xl" sx={{ pt: 4, pb: 16 }}>
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {[1, 2, 3, 4].map((i) => (
                <SkeletonRow key={i} />
              ))}
            </motion.div>
          ) : doctors.length > 0 ? (
            <motion.div
              key="list"
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
            >
              {doctors.map((doctor) => (
                <DoctorRow key={doctor.id} doctor={doctor} />
              ))}
            </motion.div>
          ) : (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Box sx={{ 
                py: 20, 
                textAlign: 'center', 
                borderBottom: '1px solid #e2e8f0'
              }}>
                <Typography variant="h3" sx={{ fontWeight: 900, mb: 2, color: '#0f172a' }}>
                  {t('doctor_list.no_doctors_title')}
                </Typography>
                <Typography color="#64748b" sx={{ mb: 4, fontSize: '1.25rem' }}>
                  {t('doctor_list.no_doctors_desc')}
                </Typography>
                <Button 
                  variant="outlined" 
                  onClick={resetFilters}
                  sx={{ 
                    borderRadius: '12px', px: 4, py: 1.5, 
                    borderColor: '#0f172a', color: '#0f172a', 
                    fontWeight: 700, textTransform: 'none',
                    borderWidth: '2px',
                    '&:hover': { borderWidth: '2px', background: '#0f172a', color: '#ffffff' }
                  }}
                >
                  {t('doctor_list.clear_all_filters')}
                </Button>
              </Box>
            </motion.div>
          )}
        </AnimatePresence>

        {totalPages > 1 && (
          <Box sx={{ mt: 10, display: 'flex', justifyContent: 'center' }}>
            <Pagination 
              count={totalPages} 
              page={filters.page + 1} 
              onChange={(_, p) => handleFilterChange('page', p - 1)}
              size="large"
              sx={{
                '& .MuiPaginationItem-root': {
                  borderRadius: '100px',
                  width: '56px',
                  height: '56px',
                  fontWeight: 800,
                  fontSize: '1.125rem',
                  border: '1px solid #e2e8f0',
                  background: '#ffffff',
                  color: '#0f172a',
                  transition: 'all 0.3s ease',
                  '&.Mui-selected': {
                    background: '#0f172a',
                    color: '#ffffff',
                    borderColor: '#0f172a',
                    '&:hover': { background: '#08bba3', borderColor: '#08bba3' }
                  },
                  '&:hover': {
                    background: '#f8fafc',
                    borderColor: '#cbd5e1'
                  }
                }
              }}
            />
          </Box>
        )}
      </Container>
    </Box>
  )
}
