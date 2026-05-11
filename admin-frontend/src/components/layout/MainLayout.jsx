import { useState, useEffect, useRef } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  AppBar, Toolbar, Typography, IconButton, List, ListItemButton,
  ListItemIcon, ListItemText, Box, Avatar, Menu, MenuItem, Divider,
  Tooltip, Badge, Chip,
} from '@mui/material'
import {
  Dashboard, Person, LocalHospital, Logout, MedicalServices,
  CalendarMonth, Campaign, NotificationsNone, Settings,
  Menu as MenuIcon,
} from '@mui/icons-material'
import useAuthStore from '../../store/authStore'

const DRAWER_WIDTH = 260
const COLLAPSED_WIDTH = 68

// Subtle particle animation for the main content area
function InteractiveParticles({ color = '16, 185, 129' }) {
  const canvasRef = useRef(null)
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let animationFrameId, isVisible = true
    const parent = canvas.parentElement
    let width = (canvas.width = parent.clientWidth)
    let height = (canvas.height = parent.clientHeight)

    const handleResize = () => { width = canvas.width = parent.clientWidth; height = canvas.height = parent.clientHeight }
    window.addEventListener('resize', handleResize)
    const mouse = { x: null, y: null }
    parent.addEventListener('mousemove', (e) => { const r = parent.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top })
    parent.addEventListener('mouseleave', () => { mouse.x = null; mouse.y = null })

    const observer = new IntersectionObserver(([e]) => { isVisible = e.isIntersecting }, { threshold: 0.01 })
    if (canvas) observer.observe(canvas)

    class Particle {
      constructor() { this.x = Math.random() * width; this.y = Math.random() * height; this.vx = (Math.random() - 0.5) * 0.25; this.vy = (Math.random() - 0.5) * 0.25; this.r = Math.random() * 1.2 + 0.8 }
      update() {
        if (mouse.x !== null) { const dx = mouse.x - this.x, dy = mouse.y - this.y, d = Math.sqrt(dx*dx+dy*dy); if (d < 100) { this.x += dx/d*0.15; this.y += dy/d*0.15 } }
        this.x += this.vx; this.y += this.vy
        if (this.x < 0 || this.x > width) this.vx *= -1
        if (this.y < 0 || this.y > height) this.vy *= -1
      }
      draw() { ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, Math.PI*2); ctx.fillStyle = `rgba(${color}, 0.2)`; ctx.fill() }
    }
    const particles = Array.from({ length: 60 }, () => new Particle())
    const animate = () => {
      if (isVisible) {
        ctx.clearRect(0, 0, width, height)
        particles.forEach((p, i) => {
          p.update(); p.draw()
          particles.slice(i+1).forEach(q => {
            const dx = p.x-q.x, dy = p.y-q.y, d = Math.sqrt(dx*dx+dy*dy)
            if (d < 90) { ctx.beginPath(); ctx.moveTo(p.x,p.y); ctx.lineTo(q.x,q.y); ctx.strokeStyle=`rgba(${color},${0.07*(1-d/90)})`; ctx.lineWidth=0.6; ctx.stroke() }
          })
        })
      }
      animationFrameId = requestAnimationFrame(animate)
    }
    animate()
    return () => { window.removeEventListener('resize', handleResize); cancelAnimationFrame(animationFrameId); if (canvas) observer.unobserve(canvas) }
  }, [color])
  return <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none' }} />
}

const menuByRole = {
  SUPER_ADMIN: [
    { text: 'Tổng quan hệ thống', icon: <Dashboard />, path: '/super-admin/dashboard' },
  ],
  CONTENT_ADMIN: [
    { text: 'Quản lý bài viết', icon: <Campaign />, path: '/content-admin/posts' },
    { text: 'Quản lý nội dung (CMS)', icon: <Dashboard />, path: '/admin/cms' },
  ],
  ADMIN: [
    { text: 'Dashboard', icon: <Dashboard />, path: '/admin/dashboard' },
    { text: 'Quản lý người dùng', icon: <Person />, path: '/admin/users' },
    { text: 'Quản lý chuyên khoa', icon: <LocalHospital />, path: '/admin/departments' },
    { text: 'Lịch hẹn hệ thống', icon: <CalendarMonth />, path: '/admin/appointments' },
    { text: 'Hồ sơ bệnh án', icon: <MedicalServices />, path: '/admin/records' },
    { text: 'Quản lý nội dung', icon: <Campaign />, path: '/admin/cms' },
  ],
}

const roleConfig = {
  ADMIN: { label: 'Quản trị viên', color: '#059669', bg: 'rgba(16,185,129,0.12)' },
  SUPER_ADMIN: { label: 'Super Admin', color: '#d97706', bg: 'rgba(245,158,11,0.12)' },
  CONTENT_ADMIN: { label: 'Nội dung', color: '#7c3aed', bg: 'rgba(139,92,246,0.12)' },
}

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [anchorEl, setAnchorEl] = useState(null)
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  const menu = menuByRole[user?.role] || []
  const role = roleConfig[user?.role] || { label: user?.role, color: '#059669', bg: 'rgba(16,185,129,0.12)' }

  const handleLogout = () => { logout(); navigate('/login') }
  const sidebarWidth = collapsed ? COLLAPSED_WIDTH : DRAWER_WIDTH

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f8fafc' }}>

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
          // Same light glassmorphism as frontend sidebar
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
              mx: 1.5, my: 1.5, p: 1.5,
              borderRadius: '12px',
              bgcolor: 'rgba(16, 185, 129, 0.06)',
              border: '1px solid rgba(16, 185, 129, 0.1)',
              display: 'flex', alignItems: 'center', gap: 1.2,
              transition: 'all 0.2s',
            }}
          >
            <Avatar
              src={user?.avatarUrl}
              sx={{
                width: 34, height: 34,
                bgcolor: '#10b981',
                fontWeight: 800, fontSize: '0.85rem', flexShrink: 0,
              }}
            >
              {user?.fullName?.[0] || 'A'}
            </Avatar>
            <Box sx={{ overflow: 'hidden', flex: 1 }}>
              <Typography noWrap sx={{ fontWeight: 700, fontSize: '0.82rem', color: 'text.primary', lineHeight: 1.3 }}>
                {user?.fullName}
              </Typography>
              <Chip
                label={role.label}
                size="small"
                sx={{
                  height: 16, fontSize: '0.6rem', fontWeight: 700,
                  bgcolor: role.bg, color: role.color, border: 'none',
                  '& .MuiChip-label': { px: 0.8 },
                }}
              />
            </Box>
          </Box>
        )}

        {collapsed && (
          <Tooltip title={user?.fullName} placement="right">
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 1.5 }}>
              <Avatar
                src={user?.avatarUrl}
                sx={{
                  width: 34, height: 34, bgcolor: '#10b981',
                  fontWeight: 800, fontSize: '0.85rem',
                  border: '2px solid rgba(16,185,129,0.2)',
                }}
              >
                {user?.fullName?.[0] || 'A'}
              </Avatar>
            </Box>
          </Tooltip>
        )}

        {/* ── Nav Items ───────────────────────────────────────────── */}
        <List sx={{ px: 1, flexGrow: 1, pt: 0.5 }}>
          {menu.map((item) => {
            const isActive = location.pathname.startsWith(item.path)
            return (
              <Tooltip key={item.path} title={collapsed ? item.text : ''} placement="right" arrow>
                <ListItemButton
                  onClick={() => navigate(item.path)}
                  sx={{
                    borderRadius: '10px', mb: 0.5, py: 1,
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
                    {item.icon}
                  </ListItemIcon>
                  {!collapsed && (
                    <ListItemText
                      primary={item.text}
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
                  {isActive && !collapsed && (
                    <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: '#10b981', flexShrink: 0 }} />
                  )}
                </ListItemButton>
              </Tooltip>
            )
          })}
        </List>

        {/* ── Bottom ──────────────────────────────────────────────── */}
        <Box sx={{ px: 1, pb: 1.5, pt: 1, borderTop: '1px solid rgba(16,185,129,0.08)' }}>
          {/* Collapse/Expand Toggle Button */}
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
          display: 'flex', flexDirection: 'column',
          ml: `${sidebarWidth}px`,
          transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* AppBar */}
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
              {menu.find(m => location.pathname.startsWith(m.path))?.text || 'Admin Panel'}
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
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
                  fontWeight: 800, fontSize: '0.8rem',
                  cursor: 'pointer',
                  border: '2px solid rgba(16,185,129,0.2)',
                  transition: 'all 0.2s',
                  '&:hover': { borderColor: 'primary.main' },
                }}
              >
                {user?.fullName?.[0] || 'A'}
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
                  <ListItemIcon><Settings fontSize="small" /></ListItemIcon>
                  Cài đặt tài khoản
                </MenuItem>
                <MenuItem onClick={handleLogout} sx={{ py: 1.1, color: 'error.main', fontSize: '0.875rem' }}>
                  <ListItemIcon><Logout fontSize="small" sx={{ color: 'error.main' }} /></ListItemIcon>
                  Đăng xuất
                </MenuItem>
              </Menu>
            </Box>
          </Toolbar>
        </AppBar>

        {/* Page Content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: { xs: 2, md: 3 },
            position: 'relative',
            overflow: 'hidden',
            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
            minHeight: 'calc(100vh - 60px)',
          }}
        >
          <InteractiveParticles />
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Outlet />
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
