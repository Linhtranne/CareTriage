import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
    Typography, IconButton, List, ListItemButton,
    ListItemIcon, ListItemText, Box, Avatar, Menu, MenuItem, Divider,
    Button,
} from '@mui/material'
import {
    Dashboard, CalendarMonth, Chat, Assignment,
    Person, MedicalServices, Logout, Menu as MenuIcon,
} from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import useAuthStore from '../store/auth-store'
import NotificationBell from '../components/features/notification-bell'
import ChatWidget from '../components/chat/chat-widget'

import { Brain, Search } from 'lucide-react'

import { LAYOUT } from '../constants/layout-constants'

const DRAWER_WIDTH = LAYOUT.shell.drawerWidth
const COLLAPSED_WIDTH = LAYOUT.shell.collapsedWidth
const ISLAND_MARGIN = LAYOUT.shell.islandMargin

const menuByRole = {
    PATIENT: [
        { textKey: 'sidebar.ai_triage', icon: <Chat />, path: '/patient/triage' },
        { textKey: 'sidebar.dashboard', icon: <Dashboard />, path: '/patient/dashboard' },
        { textKey: 'sidebar.appointments', icon: <CalendarMonth />, path: '/patient/appointments' },
        { textKey: 'sidebar.records', icon: <Assignment />, path: '/patient/records' },
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

    const cleanRole = user?.role ? user.role.replace('ROLE_', '').toUpperCase() : ''
    const rawMenu = menuByRole[cleanRole] || []
    const menu = rawMenu.map(navItem => ({ ...navItem, text: navItem.text || t(navItem.textKey) }))

    const handleLogout = () => { logout(); navigate('/login') }
    const sidebarWidth = collapsed ? COLLAPSED_WIDTH : DRAWER_WIDTH
    const isTriageRoute = location.pathname === '/patient/triage'

    return (
        <Box sx={{
            display: 'flex',
            minHeight: '100vh',
            bgcolor: 'var(--color-surface-50)',
            backgroundImage: 'var(--app-shell-background)',
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
                    background: 'var(--app-glass-surface)',
                    backdropFilter: 'blur(50px) saturate(1.8)',
                    border: '1px solid var(--app-glass-border)',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: 'var(--app-glass-shadow)',
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
                            height: LAYOUT.shell.logoMaxHeight,
                            width: 'auto',
                            maxWidth: collapsed ? LAYOUT.shell.logoMaxHeight : LAYOUT.shell.logoMaxWidth,
                            objectFit: 'contain',
                            transition: 'all 0.3s ease',
                        }}
                    />
                </Box>

                {/* Navigation Items */}
                <List sx={{ px: 1.5, flexGrow: 1 }}>
                    {menu.map((navItem) => {
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
                                    bgcolor: isActive ? 'var(--app-active-nav-surface)' : 'var(--color-clear)',
                                    color: isActive ? 'var(--color-primary-600)' : 'var(--app-muted-nav-text)',
                                    transition: 'background-color 0.3s',
                                    '&:hover': {
                                        bgcolor: isActive ? 'var(--app-active-nav-surface-hover)' : 'var(--app-glass-surface)',
                                    },
                                }}
                            >
                                <ListItemIcon
                                    sx={{
                                        minWidth: collapsed ? 'auto' : LAYOUT.shell.navIconMinWidth,
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
                                                    fontWeight: isActive ? 'bold' : '600',
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
                <Box sx={{ p: 2, borderTop: '1px solid var(--app-glass-border)' }}>
                    <IconButton
                        onClick={() => setCollapsed(!collapsed)}
                        sx={{
                            width: '100%',
                            borderRadius: '16px',
                            bgcolor: 'var(--app-glass-surface-muted)',
                            color: 'var(--app-muted-nav-text)',
                            '&:hover': { bgcolor: 'var(--app-glass-surface-hover)' }
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
                    mr: `${LAYOUT.shell.contentRightMargin}px`,
                    transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    minHeight: '100vh',
                    pt: isTriageRoute ? LAYOUT.shell.triageContentTopPadding : LAYOUT.shell.contentTopPadding,
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
                        right: LAYOUT.shell.contentRightMargin,
                        zIndex: 1100,
                        height: 64,
                        borderRadius: '24px',
                        background: 'var(--app-glass-surface)',
                        backdropFilter: 'blur(40px)',
                        border: '1px solid var(--app-glass-border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        px: 3,
                        boxShadow: 'var(--app-glass-shadow)',
                        transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                >
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'var(--app-muted-nav-text)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {menu.find(m => location.pathname.startsWith(m.path))?.text || 'Dashboard'}
                    </Typography>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Button
                            variant="text"
                            size="small"
                            onClick={() => i18n.changeLanguage(i18n.language === 'vi' ? 'en' : 'vi')}
                            sx={{
                                borderRadius: '12px',
                                color: 'var(--color-primary-600)',
                                fontWeight: 'bold',
                                fontSize: '0.75rem',
                                minWidth: 44,
                                '&:hover': { bgcolor: 'var(--app-glass-surface)' },
                            }}
                        >
                            {i18n.language?.startsWith('vi') ? 'EN' : 'VI'}
                        </Button>

                        <NotificationBell />

                        <Divider orientation="vertical" flexItem sx={{ height: 24, alignSelf: 'center', borderColor: 'var(--app-glass-border)' }} />

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer' }} onClick={(e) => setAnchorEl(e.currentTarget)}>
                            <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
                                <Typography sx={{ fontWeight: 'bold', fontSize: '0.85rem', color: 'var(--color-surface-800)' }}>{user?.fullName}</Typography>
                                <Typography variant="caption" sx={{ color: 'var(--color-primary-600)', fontWeight: 'bold' }}>{t(`roles.${user?.role ? user.role.replace('ROLE_', '').toUpperCase() : ''}`)}</Typography>
                            </Box>
                            <Avatar
                                src={user?.avatarUrl}
                                sx={{
                                    width: 36, height: 36,
                                    bgcolor: 'var(--color-primary-500)',
                                    fontWeight: 'bold',
                                    fontSize: '0.85rem',
                                    border: '2px solid var(--app-glass-border)',
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
                                        bgcolor: 'var(--app-glass-surface)',
                                        backdropFilter: 'blur(20px)',
                                        boxShadow: 'var(--app-glass-shadow)',
                                        border: '1px solid var(--app-glass-border)',
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
                        py: isTriageRoute ? 0 : 2,
                        transition: 'all 0.3s ease',
                    }}
                >
                    <Outlet />
                </Box>
            </Box>

            {/* LEGACY CHAT WIDGET QUARANTINE:
          Do not mount in Phase 1 clinical flows (/patient and /doctor)
          which now use dedicated Agent-First Liquid Glass shells. */}
            {!location.pathname.startsWith('/patient') && !location.pathname.startsWith('/doctor') && (
                <ChatWidget />
            )}
        </Box>
    )
}
