import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  AppBar, Toolbar, Typography, IconButton, Drawer, List, ListItemButton,
  ListItemIcon, ListItemText, Box, Avatar, Menu, MenuItem, Divider,
} from '@mui/material'
import {
  Menu as MenuIcon, Dashboard, CalendarMonth, Chat, Assignment,
  Person, LocalHospital, Logout, MedicalServices,
} from '@mui/icons-material'
import useAuthStore from '../../store/authStore'

const DRAWER_WIDTH = 260

const menuByRole = {
  PATIENT: [
    { text: 'Dashboard', icon: <Dashboard />, path: '/patient/dashboard' },
    { text: 'Đặt lịch khám', icon: <CalendarMonth />, path: '/patient/appointments' },
    { text: 'AI Triage', icon: <Chat />, path: '/patient/triage' },
    { text: 'Hồ sơ bệnh án', icon: <Assignment />, path: '/patient/records' },
  ],
  DOCTOR: [
    { text: 'Dashboard', icon: <Dashboard />, path: '/doctor/dashboard' },
    { text: 'Lịch khám', icon: <CalendarMonth />, path: '/doctor/appointments' },
    { text: 'Triage Tickets', icon: <MedicalServices />, path: '/doctor/tickets' },
    { text: 'Bệnh nhân', icon: <Person />, path: '/doctor/patients' },
  ],
  ADMIN: [
    { text: 'Dashboard', icon: <Dashboard />, path: '/admin/dashboard' },
    { text: 'Người dùng', icon: <Person />, path: '/admin/users' },
    { text: 'Khoa/Phòng', icon: <LocalHospital />, path: '/admin/departments' },
    { text: 'Lịch hẹn', icon: <CalendarMonth />, path: '/admin/appointments' },
  ],
}

export default function MainLayout() {
  const [drawerOpen, setDrawerOpen] = useState(true)
  const [anchorEl, setAnchorEl] = useState(null)
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  const menu = menuByRole[user?.role] || []

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <Drawer
        variant="persistent"
        open={drawerOpen}
        sx={{
          width: drawerOpen ? DRAWER_WIDTH : 0,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            borderRight: '1px solid #e2e8f0',
            backgroundColor: '#fff',
          },
        }}
      >
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <MedicalServices sx={{ color: 'primary.main', fontSize: 32 }} />
          <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
            CareTriage
          </Typography>
        </Box>
        <Divider />
        <List sx={{ px: 1, pt: 1 }}>
          {menu.map((item) => (
            <ListItemButton
              key={item.path}
              onClick={() => navigate(item.path)}
              selected={location.pathname === item.path}
              sx={{
                borderRadius: 2, mb: 0.5,
                '&.Mui-selected': {
                  backgroundColor: 'primary.main',
                  color: '#fff',
                  '& .MuiListItemIcon-root': { color: '#fff' },
                  '&:hover': { backgroundColor: 'primary.dark' },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          ))}
        </List>
      </Drawer>

      {/* Main */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <AppBar position="sticky" elevation={0}>
          <Toolbar>
            <IconButton edge="start" onClick={() => setDrawerOpen(!drawerOpen)} sx={{ mr: 2 }}>
              <MenuIcon />
            </IconButton>
            <Box sx={{ flexGrow: 1 }} />
            <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
              <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36 }}>
                {user?.fullName?.[0] || 'U'}
              </Avatar>
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={() => setAnchorEl(null)}
            >
              <MenuItem disabled>
                <Typography variant="body2" color="text.secondary">
                  {user?.fullName} ({user?.role})
                </Typography>
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout}>
                <ListItemIcon><Logout fontSize="small" /></ListItemIcon>
                Đăng xuất
              </MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>
        <Box component="main" sx={{ flexGrow: 1, p: 3, backgroundColor: '#f8fafc' }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  )
}
