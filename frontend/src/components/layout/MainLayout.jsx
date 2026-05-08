import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  AppBar, Toolbar, Typography, IconButton, List, ListItemButton,
  ListItemIcon, ListItemText, Box, Avatar, Menu, MenuItem, Divider,
  Button, Tooltip, Badge, Chip,
} from '@mui/material'
import {
  Dashboard, CalendarMonth, Chat, Assignment,
  Person, MedicalServices, Logout, Settings,
  NotificationsNone, Menu as MenuIcon,
} from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import useAuthStore from '../../store/authStore'
import ChatWidget from '../chat/ChatWidget'

const DRAWER_WIDTH = 260
const COLLAPSED_WIDTH = 68

const menuByRole = {
  PATIENT: [
    { textKey: 'sidebar.dashboard', icon: <Dashboard />, path: '/patient/dashboard' },
    { textKey: 'sidebar.appointments', icon: <CalendarMonth />, path: '/patient/appointments' },
    { textKey: 'sidebar.ai_triage', icon: <Chat />, path: '/patient/triage' },
    { textKey: 'sidebar.records', icon: <Assignment />, path: '/patient/records' },
    { text: 'Kết quả triage', icon: <MedicalServices />, path: '/patient/triage-tickets' },
  ],
  DOCTOR: [
    { textKey: 'sidebar.dashboard', icon: <Dashboard />, path: '/doctor/dashboard' },
    { textKey: 'sidebar.appointments', icon: <CalendarMonth />, path: '/doctor/appointments' },
    { textKey: 'sidebar.tickets', icon: <MedicalServices />, path: '/doctor/tickets' },
    { textKey: 'sidebar.patients', icon: <Person />, path: '/doctor/patients' },
  ],
}

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [anchorEl, setAnchorEl] = useState(null)
  const { t, i18n } = useTranslation()
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  const rawMenu = menuByRole[user?.role] || []
  const menu = rawMenu.map(navItem => ({ ...navItem, text: navItem.text || t(navItem.textKey) }))

  const handleLogout = () => { logout(); navigate('/login') }
  const sidebarWidth = collapsed ? COLLAPSED_WIDTH : DRAWER_WIDTH

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f0fdf4' }}>

      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <Box
        sx={{
          width: sidebarWidth,
          flexShrink: 0,
          position: 'fixed',
          top: 0, left: 0,
          height: '100vh',
          zIndex: 1200,
          transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'hidden',
          background: 'rgba(255, 255, 255, 0.72)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderRight: '1px solid rgba(16, 185, 129, 0.12)',
          boxShadow: '4px 0 24px rgba(0, 0, 0, 0.06)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* ── Logo ────────────────────────────────────────────────── */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: collapsed ? 0 : 2,
            py: 1.5,
            minHeight: 64,
            borderBottom: '1px solid rgba(16, 185, 129, 0.08)',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flex: collapsed ? 1 : 'none',
              overflow: 'hidden',
            }}
          >
            <Box
              component="img"
              src={collapsed ? "/gemini-svg.svg" : "/gemini-svg (1).svg"}
              alt="CareTriage"
              sx={{
                height: 36,
                width: 'auto',
                maxWidth: collapsed ? 36 : 160,
                objectFit: 'contain',
                objectPosition: 'left center',
                transition: 'all 0.3s ease',
              }}
            />
          </Box>
        </Box>

        {/* ── User Card ───────────────────────────────────────────── */}
        {!collapsed && (
          <Box
            sx={{
              mx: 1.5,
              my: 1.5,
              p: 1.5,
              borderRadius: '12px',
              bgcolor: 'rgba(16, 185, 129, 0.06)',
              border: '1px solid rgba(16, 185, 129, 0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: 1.2,
              transition: 'all 0.2s',
            }}
          >
            <Avatar
              src={user?.avatarUrl}
              sx={{
                width: 34, height: 34,
                bgcolor: '#10b981',
                fontWeight: 800,
                fontSize: '0.85rem',
                flexShrink: 0,
              }}
            >
              {user?.fullName?.[0] || 'U'}
            </Avatar>
            <Box sx={{ overflow: 'hidden', flex: 1 }}>
              <Typography
                noWrap
                sx={{ fontWeight: 700, fontSize: '0.82rem', color: 'text.primary', lineHeight: 1.3 }}
              >
                {user?.fullName}
              </Typography>
              <Chip
                label={t(`roles.${user?.role}`, user?.role)}
                size="small"
                sx={{
                  height: 16,
                  fontSize: '0.6rem',
                  fontWeight: 700,
                  bgcolor: 'rgba(16,185,129,0.12)',
                  color: '#059669',
                  border: 'none',
                  '& .MuiChip-label': { px: 0.8 },
                }}
              />
            </Box>
          </Box>
        )}

        {/* Collapsed avatar */}
        {collapsed && (
          <Tooltip title={user?.fullName} placement="right">
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 1.5 }}>
              <Avatar
                src={user?.avatarUrl}
                sx={{
                  width: 34, height: 34,
                  bgcolor: '#10b981',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  border: '2px solid rgba(16,185,129,0.2)',
                }}
              >
                {user?.fullName?.[0] || 'U'}
              </Avatar>
            </Box>
          </Tooltip>
        )}

        {/* ── Nav Items ───────────────────────────────────────────── */}
        <List sx={{ px: 1, flexGrow: 1, pt: 0.5 }}>
          {menu.map((navItem) => {
            const isActive = location.pathname === navItem.path
            return (
              <Tooltip key={navItem.path} title={collapsed ? navItem.text : ''} placement="right" arrow>
                <ListItemButton
                  onClick={() => navigate(navItem.path)}
                  sx={{
                    borderRadius: '10px',
                    mb: 0.5,
                    py: 1,
                    px: collapsed ? 0 : 1.2,
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    transition: 'all 0.2s ease',
                    ...(isActive ? {
                      bgcolor: 'rgba(16,185,129,0.12)',
                      '& .MuiListItemIcon-root': { color: '#059669' },
                      '&:hover': { bgcolor: 'rgba(16,185,129,0.16)' },
                    } : {
                      '&:hover': { bgcolor: 'rgba(16,185,129,0.06)' },
                    }),
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: collapsed ? 'auto' : 36,
                      color: isActive ? '#059669' : 'text.disabled',
                      transition: 'color 0.2s',
                      '& svg': { fontSize: 20 },
                    }}
                  >
                    {navItem.icon}
                  </ListItemIcon>
                  {!collapsed && (
                    <ListItemText
                      primary={navItem.text}
                      slotProps={{
                        primary: {
                          sx: {
                            fontSize: '0.875rem',
                            fontWeight: isActive ? 700 : 500,
                            color: isActive ? '#059669' : 'text.secondary',
                          }
                        }
                      }}
                    />
                  )}
                </ListItemButton>
              </Tooltip>
            )
          })}
        </List>

        {/* ── Bottom ──────────────────────────────────────────────── */}
        <Box sx={{ px: 1, pb: 1.5, pt: 1, borderTop: '1px solid rgba(16,185,129,0.08)' }}>
          <Tooltip title={collapsed ? "Mở rộng" : "Thu nhỏ"} placement="right">
            <ListItemButton
              onClick={() => setCollapsed(!collapsed)}
              sx={{
                borderRadius: '10px', py: 1,
                justifyContent: collapsed ? 'center' : 'flex-start',
                px: collapsed ? 0 : 1.2,
                '&:hover': { bgcolor: 'rgba(16,185,129,0.06)' },
              }}
            >
              <ListItemIcon sx={{ minWidth: collapsed ? 'auto' : 36, color: 'text.disabled', '& svg': { fontSize: 20 } }}>
                <MenuIcon />
              </ListItemIcon>
              {!collapsed && (
                <ListItemText
                  primary={collapsed ? "Mở rộng" : "Thu nhỏ"}
                  slotProps={{ primary: { sx: { fontSize: '0.875rem', fontWeight: 500, color: 'text.secondary' } } }}
                />
              )}
            </ListItemButton>
          </Tooltip>
        </Box>
      </Box>

      {/* ── Main Content ────────────────────────────────────────── */}
      <Box
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          ml: `${sidebarWidth}px`,
          transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          minHeight: '100vh',
        }}
      >
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            background: 'rgba(255, 255, 255, 0.75)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(16, 185, 129, 0.1)',
            color: 'text.primary',
            boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
          }}
        >
          <Toolbar sx={{ justifyContent: 'space-between', minHeight: 60, px: { xs: 2, md: 3 } }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.8rem' }}>
              {menu.find(m => location.pathname.startsWith(m.path))?.text || 'Dashboard'}
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Button
                variant="outlined"
                size="small"
                onClick={() => i18n.changeLanguage(i18n.language === 'vi' ? 'en' : 'vi')}
                sx={{
                  borderRadius: '8px',
                  borderColor: 'rgba(16,185,129,0.3)',
                  color: 'primary.main',
                  fontWeight: 700,
                  fontSize: '0.72rem',
                  minWidth: 38,
                  px: 1,
                  '&:hover': { borderColor: 'primary.main', bgcolor: 'rgba(16,185,129,0.05)' },
                }}
              >
                {i18n.language?.startsWith('vi') ? 'EN' : 'VI'}
              </Button>
              <Tooltip title="Thông báo">
                <IconButton size="small" sx={{ color: 'text.secondary' }}>
                  <Badge badgeContent={0} color="error">
                    <NotificationsNone sx={{ fontSize: 20 }} />
                  </Badge>
                </IconButton>
              </Tooltip>

              <Avatar
                src={user?.avatarUrl}
                onClick={(e) => setAnchorEl(e.currentTarget)}
                sx={{
                  width: 32, height: 32,
                  bgcolor: 'primary.main',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  border: '2px solid rgba(16,185,129,0.2)',
                  transition: 'all 0.2s',
                  '&:hover': { borderColor: 'primary.main' },
                }}
              >
                {user?.fullName?.[0] || 'U'}
              </Avatar>

              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
                slotProps={{
                  paper: {
                    sx: {
                      mt: 1, borderRadius: '12px',
                      boxShadow: '0 12px 32px rgba(0,0,0,0.1)',
                      border: '1px solid rgba(16,185,129,0.1)',
                      minWidth: 190,
                    }
                  }
                }}
              >
                <Box sx={{ px: 2, py: 1.5 }}>
                  <Typography sx={{ fontWeight: 800, fontSize: '0.875rem' }}>{user?.fullName}</Typography>
                  <Typography variant="caption" color="text.secondary">{user?.email}</Typography>
                </Box>
                <Divider />
                <MenuItem onClick={() => { setAnchorEl(null); navigate('/profile') }} sx={{ py: 1.1, fontSize: '0.875rem' }}>
                  <ListItemIcon><Person fontSize="small" /></ListItemIcon>
                  {t('sidebar.profile')}
                </MenuItem>
                <MenuItem onClick={handleLogout} sx={{ py: 1.1, color: 'error.main', fontSize: '0.875rem' }}>
                  <ListItemIcon><Logout fontSize="small" sx={{ color: 'error.main' }} /></ListItemIcon>
                  {t('sidebar.logout')}
                </MenuItem>
              </Menu>
            </Box>
          </Toolbar>
        </AppBar>

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: { xs: 2, md: 3 },
            background: 'linear-gradient(135deg, #f0fdf4 0%, #f8fafc 60%, #f1f5f9 100%)',
            minHeight: 'calc(100vh - 60px)',
          }}
        >
          <Outlet />
        </Box>
      </Box>
      <ChatWidget />
    </Box>
  )
}
