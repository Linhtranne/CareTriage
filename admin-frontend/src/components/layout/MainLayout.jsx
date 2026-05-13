import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  AppBar, Toolbar, Typography, IconButton, Drawer, List, ListItemButton,
  ListItemIcon, ListItemText, Box, Avatar, Menu, MenuItem, Divider, Button,
} from '@mui/material'
import {
  Menu as MenuIcon, Dashboard, Person, LocalHospital, Logout, MedicalServices,
  CalendarMonth, Campaign
} from '@mui/icons-material'
import useAuthStore from '../../store/authStore'

const DRAWER_WIDTH = 260

const menuByRole = {
  SUPER_ADMIN: [
    { text: 'System Dashboard', icon: <Dashboard />, path: '/super-admin/dashboard' },
  ],
  CONTENT_ADMIN: [
    { text: 'Content Management', icon: <Campaign />, path: '/content-admin/posts' },
  ],
  ADMIN: [
    { text: 'Admin Dashboard', icon: <Dashboard />, path: '/admin/dashboard' },
    { text: 'User Management', icon: <Person />, path: '/admin/users' },
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
            borderRight: '1px solid #1e293b',
            backgroundColor: '#0f172a',
            color: '#f8fafc',
          },
        }}
      >
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <MedicalServices sx={{ color: 'primary.main', fontSize: 32 }} />
          <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
            Admin Portal
          </Typography>
        </Box>
        <Divider sx={{ borderColor: '#334155' }} />
        <List sx={{ px: 1, pt: 1 }}>
          {menu.map((item) => (
            <ListItemButton
              key={item.path}
              onClick={() => navigate(item.path)}
              selected={location.pathname === item.path}
              sx={{
                borderRadius: 2, mb: 0.5,
                color: '#cbd5e1',
                '& .MuiListItemIcon-root': { color: '#94a3b8' },
                '&.Mui-selected': {
                  backgroundColor: 'rgba(56, 189, 248, 0.1)',
                  color: '#38bdf8',
                  '& .MuiListItemIcon-root': { color: '#38bdf8' },
                  '&:hover': { backgroundColor: 'rgba(56, 189, 248, 0.2)' },
                },
                '&:hover': { backgroundColor: '#1e293b' },
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
        <AppBar 
          position="sticky" 
          elevation={0}
          sx={{
            backgroundColor: '#fff',
            borderBottom: '1px solid #e2e8f0',
            color: 'text.primary',
          }}
        >
          <Toolbar>
            <IconButton edge="start" onClick={() => setDrawerOpen(!drawerOpen)} sx={{ mr: 2, color: 'primary.main' }}>
              <MenuIcon />
            </IconButton>
            <Box sx={{ flexGrow: 1 }} />
            
            <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
              <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36 }}>
                {user?.fullName?.[0] || 'A'}
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
                Logout
              </MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>
        <Box 
          component="main" 
          sx={{ 
            flexGrow: 1, 
            p: 3, 
            background: '#f1f5f9',
            minHeight: 'calc(100vh - 64px)'
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  )
}
