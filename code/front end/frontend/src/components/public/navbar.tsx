import { Box, Typography, Button, Grid, Avatar, Menu, MenuItem, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, IconButton } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { 
  Description, Psychology, EventAvailable, LocalHospital, MedicalServices, Person, Code, Security 
} from '@mui/icons-material'
import { keyframes } from '@emotion/react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import useAuthStore from '../../store/auth-store'
import axiosClient from '../../services/http-client'

const pulse = keyframes`
  0%, 100% { opacity: 0.6; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.03); }
`

const menuHeights = { products: 160, solutions: 160, developers: 240 }
const menuIndices = { products: 0, solutions: 1, developers: 2 }

const menuData = {
  products: {
    title: 'Sản phẩm',
    items: [
      { label: 'AI Triage', desc: 'Phân luồng chuyên khoa tự động bằng AI', icon: <Psychology />, route: '/features/ai-triage' },
      { label: 'EHR Engine', desc: 'Số hóa & Trích xuất bệnh án thông minh', icon: <Description />, route: '/features/ehr-engine' },
      { label: 'Smart Booking', desc: 'Tối ưu hóa thời gian và lịch khám', icon: <EventAvailable />, route: '/features/smart-booking' }
    ]
  },
  solutions: {
    title: 'Giải pháp',
    items: [
      { label: 'Bệnh viện lớn', desc: 'Giảm tải phòng tiếp đón, tối ưu quy trình', icon: <LocalHospital />, route: '/solutions/hospitals' },
      { label: 'Phòng khám tư', desc: 'Quản lý bệnh án tinh gọn, hiệu quả', icon: <MedicalServices />, route: '/solutions/clinics' },
      { label: 'Cá nhân', desc: 'Tự theo dõi và quản lý sức khỏe', icon: <Person />, route: '/solutions/individuals' }
    ]
  },
  developers: {
    title: 'Hệ thống',
    items: [
      { label: 'Tài liệu API', desc: 'Tích hợp chuẩn dữ liệu HL7/FHIR', icon: <Code />, route: '/developers/api-docs' },
      { label: 'Bảo mật & Tin cậy', desc: 'Mã hóa dữ liệu đạt chuẩn HIPAA', icon: <Security />, route: '/developers/security' },
      { label: 'Điều khoản & Dịch vụ', desc: 'Cam kết an toàn thông tin y tế', icon: <Description />, route: '/terms' }
    ]
  }
}

export default function Navbar() {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const { isAuthenticated, user, logout, refreshToken } = useAuthStore()
  const [scrolled, setScrolled] = useState(false)
  const [navHovered, setNavHovered] = useState(false)
  const [activeMenu, setActiveMenu] = useState(null)
  const [anchorEl, setAnchorEl] = useState(null)
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false)

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget)
  }
  
  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleLogoutConfirm = async () => {
    setLogoutDialogOpen(false)
    handleMenuClose()
    try {
      if (refreshToken) {
        await axiosClient.post('/api/auth/logout', { refreshToken })
      }
    } catch (e) {
      console.error('Server-side logout error', e)
    }
    logout()
    navigate('/login')
  }

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true)
      } else {
        setScrolled(false)
      }
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const [tMenuData, setTMenuData] = useState(menuData)

  useEffect(() => {
    if (!i18n.language || i18n.language.startsWith('vi')) {
      return
    }
    
    let isMounted = true

    const translateText = async (text) => {
      try {
        const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=vi&tl=en&dt=t&q=${encodeURIComponent(text)}`)
        const data = await res.json()
        return data[0].map(item => item[0]).join('')
      } catch {
        return text
      }
    }

    const performTranslation = async () => {
      const translated = {}
      for (const key of Object.keys(menuData)) {
        translated[key] = {
          title: await translateText(menuData[key].title),
          items: await Promise.all(
            menuData[key].items.map(async (item) => ({
              ...item,
              label: await translateText(item.label),
              desc: await translateText(item.desc)
            }))
          )
        }
      }
      if (isMounted) {
        setTMenuData(translated)
      }
    }

    performTranslation()
    return () => { isMounted = false }
  }, [i18n.language])

  const isVi = !i18n.language || i18n.language.startsWith('vi')
  const displayMenuData = isVi ? menuData : tMenuData

  return (
    <>
      {/* Invisible Sentinel Box for Hover Capture */}
      <Box 
        sx={{ 
          position: 'fixed', top: 0, left: 0, width: '100%', height: '25px', zIndex: 9 
        }}
        onMouseEnter={() => setNavHovered(true)}
      />

      {/* Sticky Navbar */}
      <Box
        component="nav"
        onMouseEnter={() => setNavHovered(true)}
        onMouseLeave={() => { setNavHovered(false); setActiveMenu(null); }}
        sx={{
          backgroundColor: scrolled ? 'color-mix(in srgb, var(--color-surface-50) 85%, transparent)' : 'color-mix(in srgb, var(--color-surface-50) 50%, transparent)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid color-mix(in srgb, var(--color-primary-500) 10%, transparent)',
          boxShadow: scrolled ? '0 10px 30px rgba(0, 0, 0, 0.03)' : 'none',
          position: 'fixed', top: 0, zIndex: 10,
          transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          width: '100%',
          transform: scrolled && !navHovered ? 'translateY(-105%)' : 'translateY(0)',
          opacity: scrolled && !navHovered ? 0 : 1,
        }}
      >
        <Box sx={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          px: { xs: 2, md: 6 },
          py: scrolled ? 1.5 : 3,
          maxWidth: 1536,
          mx: 'auto',
          position: 'relative'
        }}>
          <Box 
            sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer' }}
            onClick={() => navigate('/')}
          >
            <Box
              component="img"
              src="/gemini-svg (1).svg"
              sx={{
                height: 45, width: 'auto',
                animation: `${pulse} 3s ease-in-out infinite`,
              }}
            />
          </Box>

          {/* Navigation Links */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 4 }}>
            {[
              { label: t('about_page.hero_title'), route: '/about' },
              { label: t('doctor_list.hero_title_1'), route: '/doctors' },
              { label: displayMenuData.products.title, key: 'products' },
              { label: displayMenuData.solutions.title, key: 'solutions' },
              { label: displayMenuData.developers.title, key: 'developers' }
            ].map((item) => (
              <Typography
                key={item.key || item.route}
                variant="body1"
                onMouseEnter={() => item.key && setActiveMenu(item.key)}
                onClick={() => item.route && navigate(item.route)}
                sx={{
                  fontWeight: 700,
                  color: activeMenu === item.key ? 'primary.dark' : 'text.secondary',
                  cursor: 'pointer',
                  transition: 'color 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  '&:hover': { color: 'primary.dark' }
                }}
              >
                {item.label}
                {item.key && (
                  <Box component="span" sx={{ fontSize: '0.6rem', transform: activeMenu === item.key ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>
                    ▼
                  </Box>
                )}
              </Typography>
            ))}
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Button
              variant="contained"
              size="small"
              onClick={() => navigate('/emergency')}
              sx={{ 
                bgcolor: 'var(--color-danger)', 
                color: 'background.paper', 
                fontWeight: 900,
                px: 2,
                '&:hover': { bgcolor: '#dc2626' },
                animation: `${pulse} 2s infinite`
              }}
            >
              CẤP CỨU
            </Button>
            
            <Button
              variant="outlined"
              size="small"
              onClick={() => i18n.changeLanguage(i18n.language === 'vi' ? 'en' : 'vi')}
              sx={{ 
                borderColor: 'color-mix(in srgb, var(--color-primary-500) 30%, transparent)', 
                color: 'primary.dark', 
                fontWeight: 700,
                px: 2
              }}
            >
              {i18n.language && i18n.language.startsWith('vi') ? 'EN' : 'VI'}
            </Button>
            
            {!isAuthenticated ? (
              <>
                <Button
                  variant="text" onClick={() => navigate('/login')}
                  sx={{ color: '#374151', fontWeight: 700, '&:hover': { color: 'primary.dark' } }}
                >
                  {t('nav.login')}
                </Button>
                <Button
                  variant="contained" onClick={() => navigate('/register')}
                  sx={{
                    background: 'linear-gradient(135deg, var(--color-primary-500) 0%, var(--color-primary-600) 100%)',
                    boxShadow: '0 4px 12px color-mix(in srgb, var(--color-primary-500) 25%, transparent)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, var(--color-primary-600) 0%, #047857 100%)',
                      transform: 'scale(1.05)',
                    },
                    transition: 'all 0.2s',
                  }}
                >
                  {t('nav.register')}
                </Button>
              </>
            ) : (
              <IconButton onClick={handleMenuOpen} sx={{ p: 0 }}>
                <Avatar 
                  sx={{ 
                    background: 'linear-gradient(135deg, var(--color-primary-500) 0%, var(--color-primary-600) 100%)',
                    fontWeight: 600
                  }}
                >
                  {(user?.fullName || user?.username || 'U')[0].toUpperCase()}
                </Avatar>
              </IconButton>
            )}
          </Box>

          {/* ================= SINGLE CONTAINER MEGA MENU ================= */}
          <Box
            sx={{
              position: 'absolute',
              top: '100%',
              left: 0,
              width: '100%',
              height: activeMenu ? menuHeights[activeMenu] : 0,
              background: 'color-mix(in srgb, var(--color-surface-50) 95%, transparent)',
              backdropFilter: 'blur(16px)',
              border: '1px solid color-mix(in srgb, var(--color-primary-500) 15%, transparent)',
              borderRadius: '0 0 16px 16px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.05)',
              opacity: activeMenu ? 1 : 0,
              visibility: activeMenu ? 'visible' : 'hidden',
              overflow: 'hidden',
              transition: 'height 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease, visibility 0.3s',
              zIndex: 8,
              pointerEvents: activeMenu ? 'auto' : 'none'
            }}
          >
            {Object.keys(displayMenuData).map((key) => (
              <Box
                key={key}
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  p: 4,
                  opacity: activeMenu === key ? 1 : 0,
                  pointerEvents: activeMenu === key ? 'auto' : 'none',
                  visibility: activeMenu === key ? 'visible' : 'hidden',
                  transform: activeMenu ? (menuIndices[key] === menuIndices[activeMenu] ? 'translateX(0)' : (menuIndices[key] < menuIndices[activeMenu] ? 'translateX(-30px)' : 'translateX(30px)')) : 'translateX(0)',
                  transition: 'transform 0.35s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.25s ease-out, visibility 0.35s'
                }}
              >
                <Grid container spacing={4}>
                  {displayMenuData[key].items.map((subItem, idx) => (
                    <Grid size={{ xs: 12, md: 4 }} key={idx}>
                      <Box
                        onClick={() => {
                          setActiveMenu(null)
                          navigate(subItem.route)
                        }}
                        sx={{
                          display: 'flex',
                          gap: 2.5,
                          p: 2.5,
                          borderRadius: 3,
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            background: 'color-mix(in srgb, var(--color-primary-500) 6%, transparent)',
                            transform: 'translateY(-4px)',
                            '& .icon-box': { background: 'color-mix(in srgb, var(--color-primary-500) 20%, transparent)', color: 'primary.800' }
                          }
                        }}
                      >
                        <Box
                          className="icon-box"
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 48,
                            height: 48,
                            borderRadius: '12px',
                            background: 'color-mix(in srgb, var(--color-primary-500) 10%, transparent)',
                            color: 'primary.dark',
                            transition: 'all 0.3s ease',
                            flexShrink: 0
                          }}
                        >
                          {subItem.icon}
                        </Box>
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.900', mb: 0.5 }}>
                            {subItem.label}
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.5 }}>
                            {subItem.desc}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
      {/* Avatar Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              width: 200,
              borderRadius: '12px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
              border: '1px solid rgba(0,0,0,0.05)'
            }
          }
        }}
      >
        <MenuItem disabled sx={{ fontWeight: 600, color: '#111827' }}>
          {user?.fullName || user?.username || t('common.unknown')}
        </MenuItem>
        <MenuItem onClick={() => { handleMenuClose(); navigate('/profile'); }} sx={{ color: '#374151' }}>
          {t('sidebar.profile')}
        </MenuItem>
        <MenuItem 
          onClick={() => { handleMenuClose(); setLogoutDialogOpen(true); }}
          sx={{ color: 'var(--color-danger)', fontWeight: 600 }}
        >
          Đăng xuất
        </MenuItem>
      </Menu>

      {/* Logout Confirmation Dialog */}
      <Dialog
        open={logoutDialogOpen}
        onClose={() => setLogoutDialogOpen(false)}
        slotProps={{
          paper: {
            sx: {
              borderRadius: '16px',
              padding: 2,
              maxWidth: '400px'
            }
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: '#1f2937' }}>
          {t('auth.logout_confirm')}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: 'text.secondary' }}>
            {t('auth.logout_desc')}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'flex-end', gap: 1, mt: 1 }}>
          <Button 
            onClick={() => setLogoutDialogOpen(false)}
            sx={{ color: '#6b7280', fontWeight: 600 }}
          >
            Hủy
          </Button>
          <Button 
            onClick={handleLogoutConfirm}
            variant="contained"
            color="error"
            sx={{ 
              fontWeight: 600, 
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)'
            }}
          >
            Đăng xuất
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
