import { useState } from 'react';
import {
  IconButton, Badge, Menu, MenuItem, Typography, Box,
  Divider, List, ListItem, ListItemText, ListItemAvatar,
  Avatar, Button, Tooltip, CircularProgress
} from '@mui/material';
import {
  NotificationsNone,
  Chat as ChatIcon,
  CalendarMonth as AppointmentIcon,
  Assignment as RecordIcon,
  MedicalServices as TriageIcon,
  Settings as SystemIcon,
  DoneAll as DoneAllIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import useNotifications from '../../hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { vi, enUS } from 'date-fns/locale';

const getIcon = (type) => {
  switch (type) {
    case 'CHAT': return <ChatIcon sx={{ color: '#10b981' }} />;
    case 'APPOINTMENT': return <AppointmentIcon sx={{ color: '#3b82f6' }} />;
    case 'MEDICAL_RECORD': return <RecordIcon sx={{ color: '#8b5cf6' }} />;
    case 'TRIAGE': return <TriageIcon sx={{ color: '#f59e0b' }} />;
    case 'SYSTEM': return <SystemIcon sx={{ color: '#6b7280' }} />;
    default: return <NotificationsNone />;
  }
};

export default function NotificationBell() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const { unreadCount, notifications, isLoading, markAsRead, markAllAsRead } = useNotifications();

  const handleOpen = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
    handleClose();
    
    // Điều hướng dựa trên referenceType/referenceId nếu có
    if (notification.referenceType === 'CHAT_SESSION' && notification.referenceId) {
      navigate(`/patient/triage`); // Ví dụ điều hướng tới trang chat
    } else if (notification.referenceType === 'APPOINTMENT') {
        navigate(`/patient/appointments`);
    }
  };

  const dateLocale = i18n.language?.startsWith('vi') ? vi : enUS;

  return (
    <>
      <Tooltip title={t('notifications.title', 'Thông báo')}>
        <IconButton size="small" sx={{ color: 'text.secondary' }} onClick={handleOpen}>
          <Badge badgeContent={unreadCount} color="error" max={99}>
            <NotificationsNone sx={{ fontSize: 22 }} />
          </Badge>
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        slotProps={{
          paper: {
            sx: {
              mt: 1.5,
              width: 360,
              maxHeight: 480,
              borderRadius: '16px',
              boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
              border: '1px solid rgba(16, 185, 129, 0.1)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }
          }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {/* Header */}
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'rgba(16, 185, 129, 0.04)' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#065f46' }}>
            {t('notifications.title', 'Thông báo')}
          </Typography>
          {unreadCount > 0 && (
            <Button 
              size="small" 
              startIcon={<DoneAllIcon sx={{ fontSize: 16 }} />}
              onClick={markAllAsRead}
              sx={{ 
                fontSize: '0.75rem', 
                fontWeight: 700,
                color: '#10b981',
                '&:hover': { bgcolor: 'rgba(16, 185, 129, 0.08)' }
              }}
            >
              {t('notifications.mark_all_read', 'Đánh dấu tất cả đã đọc')}
            </Button>
          )}
        </Box>
        <Divider />

        {/* Content */}
        <Box sx={{ overflowY: 'auto', flex: 1 }}>
          {isLoading && notifications.length === 0 ? (
            <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
              <CircularProgress size={24} sx={{ color: '#10b981' }} />
            </Box>
          ) : notifications.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <NotificationsNone sx={{ fontSize: 40, color: 'text.disabled', mb: 1, opacity: 0.5 }} />
              <Typography variant="body2" color="text.secondary">
                {t('notifications.empty', 'Bạn không có thông báo nào')}
              </Typography>
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              {notifications.map((n) => (
                <MenuItem
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  sx={{
                    py: 1.5,
                    px: 2,
                    borderLeft: n.isRead ? '4px solid transparent' : '4px solid #10b981',
                    bgcolor: n.isRead ? 'transparent' : 'rgba(16, 185, 129, 0.02)',
                    transition: 'all 0.2s',
                    '&:hover': { bgcolor: 'rgba(16, 185, 129, 0.06)' },
                    whiteSpace: 'normal',
                    alignItems: 'flex-start'
                  }}
                >
                  <ListItemAvatar sx={{ minWidth: 48, mt: 0.5 }}>
                    <Avatar sx={{ bgcolor: 'rgba(16, 185, 129, 0.1)', width: 36, height: 36 }}>
                      {getIcon(n.type)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography variant="body2" sx={{ fontWeight: n.isRead ? 500 : 700, color: 'text.primary', mb: 0.3 }}>
                        {n.title}
                      </Typography>
                    }
                    secondary={
                      <>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
                          {n.message}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.7rem' }}>
                          {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: dateLocale })}
                        </Typography>
                      </>
                    }
                  />
                </MenuItem>
              ))}
            </List>
          )}
        </Box>

        {/* Footer */}
        <Divider />
        <Box sx={{ p: 1, textAlign: 'center' }}>
          <Button 
            fullWidth 
            size="small" 
            sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.8rem' }}
            onClick={() => { handleClose(); navigate('/notifications'); }}
          >
            {t('notifications.view_all', 'Xem tất cả')}
          </Button>
        </Box>
      </Menu>
    </>
  );
}
