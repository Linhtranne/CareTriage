import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  AppBar, Toolbar, Typography, IconButton, List, ListItemButton,
  ListItemIcon, ListItemText, Box, Avatar, Menu, MenuItem, Divider,
  Button, Tooltip, Badge, Chip,
} from '@mui/material'
import {
  Dashboard, CalendarMonth, Chat, Assignment,
  Person, MedicalServices, Logout,
  NotificationsNone, Menu as MenuIcon,
} from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import useAuthStore from '../../store/authStore'
import NotificationBell from './NotificationBell'
import ChatWidget from '../chat/ChatWidget'

import { Brain, Search } from 'lucide-react'

const DRAWER_WIDTH = 260
const COLLAPSED_WIDTH = 84 // Slightly wider for floating feel
const ISLAND_MARGIN = 24

const menuByRole = {
  PATIENT: [
    { textKey: 'sidebar.dashboard', icon: <Dashboard />, path: '/patient/dashboard' },
    { textKey: 'sidebar.appointments', icon: <CalendarMonth />, path: '/patient/appointments' },
    { textKey: 'sidebar.ai_triage', icon: <Chat />, path: '/patient/triage' },
    { textKey: 'sidebar.records', icon: <Assignment />, path: '/patient/records' },
    { textKey: 'sidebar.priority_classification', icon: <MedicalServices />, path: '/patient/triage-tickets' }
  ],
  DOCTOR: [
    { textKey: 'sidebar.dashboard', icon: <Dashboard />, path: '/doctor/dashboard' },
    { textKey: 'sidebar.appointments', icon: <CalendarMonth />, path: '/doctor/appointments' },
    { textKey: 'sidebar.tickets', icon: <MedicalServices />, path: '/doctor/triage-tickets' },
    { textKey: 'sidebar.patients', icon: <Person />, path: '/doctor/patients' },
    { textKey: 'sidebar.ehr_extract', icon: <Brain size={20} />, path: '/doctor/ehr/upload' },
    { textKey: 'sidebar.ehr_search', icon: <Search size={20} />, path: '/doctor/ehr/search' },
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
    <Box sx={{ 
      display: 'flex', 
      minHeight: '100vh', 
      bgcolor: '#f8fafc',
      backgroundImage: 'radial-gradient(at 0% 0%, oklch(96% 0.05 160 / 0.3) 0, transparent 50%), radial-gradient(at 100% 100%, oklch(92% 0.02 250 / 0.2) 0, transparent 50%)',
    }}>

      {/* ── Floating Sidebar Island ────────────────────────────────── */}
      <Box
        component={motion.div}
        initial={false}
        animate={{ width: sidebarWidth }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        sx={{
          position: 'fixed',
          top: ISLAND_MARGIN,
          left: ISLAND_MARGIN,
          bottom: ISLAND_MARGIN,
          zIndex: 1200,
          borderRadius: '32px',
          background: 'oklch(100% 0 0 / 0.1)',
          backdropFilter: 'blur(50px) saturate(1.8)',
          border: '1px solid oklch(100% 0 0 / 0.15)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 8px 32px oklch(0% 0 0 / 0.05)',
          overflow: 'hidden',
        }}
      >
        {/* Logo Section */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: 80,
            px: 2,
            mb: 2
          }}
        >
          <Box
            component="img"
            src={collapsed ? "/gemini-svg.svg" : "/gemini-svg (1).svg"}
            alt="CareTriage"
            sx={{
              height: 32,
              width: 'auto',
              maxWidth: collapsed ? 32 : 140,
              objectFit: 'contain',
              transition: 'all 0.3s ease',
            }}
          />
        </Box>

        {/* Navigation Items */}
        <List sx={{ px: 1.5, flexGrow: 1 }}>
          {menu.map((navItem, index) => {
            const isActive = location.pathname === navItem.path
            return (
              <ListItemButton
                key={navItem.path}
                component={motion.div}
                whileHover={{ scale: 1.02, x: 4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(navItem.path)}
                sx={{
                  borderRadius: '16px',
                  mb: 1,
                  py: 1.5,
                  px: collapsed ? 0 : 2,
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  bgcolor: isActive ? 'oklch(65% 0.15 160 / 0.1)' : 'transparent',
                  color: isActive ? 'oklch(55% 0.18 160)' : 'oklch(40% 0.02 250)',
                  transition: 'background-color 0.3s',
                  '&:hover': {
                    bgcolor: isActive ? 'oklch(65% 0.15 160 / 0.15)' : 'oklch(100% 0 0 / 0.3)',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: collapsed ? 'auto' : 40,
                    color: 'inherit',
                    '& svg': { fontSize: 22 },
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
                          fontSize: '0.9rem',
                          fontWeight: isActive ? 700 : 600,
                          letterSpacing: '-0.01em'
                        }
                      }
                    }}
                  />
                )}
              </ListItemButton>
            )
          })}
        </List>

        {/* Bottom Actions */}
        <Box sx={{ p: 2, borderTop: '1px solid oklch(100% 0 0 / 0.05)' }}>
          <IconButton
            onClick={() => setCollapsed(!collapsed)}
            sx={{
              width: '100%',
              borderRadius: '16px',
              bgcolor: 'oklch(100% 0 0 / 0.2)',
              color: 'oklch(40% 0.02 250)',
              '&:hover': { bgcolor: 'oklch(100% 0 0 / 0.4)' }
            }}
          >
            <MenuIcon sx={{ transform: collapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }} />
          </IconButton>
        </Box>
      </Box>

      {/* ── Main Content Container ────────────────────────────────── */}
      <Box
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          ml: `${sidebarWidth + ISLAND_MARGIN * 2}px`,
          mr: ISLAND_MARGIN,
          transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          minHeight: '100vh',
          pt: 12, // Space for top island + breathing room
        }}
      >
        {/* ── Floating Top Utility Island ───────────────────────────── */}
        <Box
          component={motion.div}
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', delay: 0.2 }}
          sx={{
            position: 'fixed',
            top: ISLAND_MARGIN,
            left: `${sidebarWidth + ISLAND_MARGIN * 2}px`,
            right: ISLAND_MARGIN,
            zIndex: 1100,
            height: 64,
            borderRadius: '24px',
            background: 'oklch(100% 0 0 / 0.1)',
            backdropFilter: 'blur(40px)',
            border: '1px solid oklch(100% 0 0 / 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 3,
            boxShadow: '0 4px 20px oklch(0% 0 0 / 0.02)',
            transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 700, color: 'oklch(40% 0.02 250)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {menu.find(m => location.pathname.startsWith(m.path))?.text || 'Dashboard'}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              variant="text"
              size="small"
              onClick={() => i18n.changeLanguage(i18n.language === 'vi' ? 'en' : 'vi')}
              sx={{
                borderRadius: '12px',
                color: 'oklch(55% 0.18 160)',
                fontWeight: 800,
                fontSize: '0.75rem',
                minWidth: 44,
                '&:hover': { bgcolor: 'oklch(100% 0 0 / 0.3)' },
              }}
            >
              {i18n.language?.startsWith('vi') ? 'EN' : 'VI'}
            </Button>
            
            <NotificationBell />

            <Divider orientation="vertical" flexItem sx={{ height: 24, alignSelf: 'center', borderColor: 'oklch(0% 0 0 / 0.05)' }} />

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer' }} onClick={(e) => setAnchorEl(e.currentTarget)}>
              <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
                <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: 'oklch(20% 0.05 250)' }}>{user?.fullName}</Typography>
                <Typography variant="caption" sx={{ color: 'oklch(55% 0.18 160)', fontWeight: 700 }}>{t(`roles.${user?.role}`)}</Typography>
              </Box>
              <Avatar
                src={user?.avatarUrl}
                sx={{
                  width: 36, height: 36,
                  bgcolor: 'oklch(65% 0.15 160)',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  border: '2px solid oklch(100% 0 0 / 0.5)',
                }}
              >
                {user?.fullName?.[0]}
              </Avatar>
            </Box>

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={() => setAnchorEl(null)}
              slotProps={{
                paper: {
                  sx: {
                    mt: 2, borderRadius: '20px',
                    bgcolor: 'oklch(100% 0 0 / 0.8)',
                    backdropFilter: 'blur(20px)',
                    boxShadow: '0 12px 40px oklch(0% 0 0 / 0.1)',
                    border: '1px solid oklch(100% 0 0 / 0.1)',
                    minWidth: 200,
                    p: 1
                  }
                }
              }}
            >
              <MenuItem onClick={() => { setAnchorEl(null); navigate('/profile') }} sx={{ borderRadius: '12px', py: 1.2 }}>
                <ListItemIcon><Person fontSize="small" /></ListItemIcon>
                {t('sidebar.profile')}
              </MenuItem>
              <Divider sx={{ my: 1, opacity: 0.5 }} />
              <MenuItem onClick={handleLogout} sx={{ borderRadius: '12px', py: 1.2, color: 'error.main' }}>
                <ListItemIcon><Logout fontSize="small" sx={{ color: 'error.main' }} /></ListItemIcon>
                {t('sidebar.logout')}
              </MenuItem>
            </Menu>
          </Box>
        </Box>

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            py: 2,
            transition: 'all 0.3s ease',
          }}
        >
          <Outlet />
        </Box>
      </Box>
      <ChatWidget />
    </Box>
  )
}
