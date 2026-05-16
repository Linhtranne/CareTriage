import { useState, useEffect, useRef } from 'react';
import {
  Typography,
  Box,
  Paper,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  Avatar,
  Chip,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Stack,
  Divider,
  Tooltip
} from '@mui/material';
import {
  CalendarDays,
  Clock,
  MapPin,
  FileText,
  AlertCircle,
  XCircle,
  CheckCircle2,
  CalendarCheck,
  ChevronRight,
  Navigation,
  RefreshCw,
  Info
} from 'lucide-react';
import { format, isValid } from 'date-fns';
import { vi, enUS } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import appointmentApi from '../../api/appointmentApi';
import LoadingScreen from '../../components/common/LoadingScreen';
import PatientPageShell from '../../components/patient/PatientPageShell';

export default function MyAppointments() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  
  const dateLocale = i18n.language === 'vi' ? vi : enUS;

  const STATUS_MAP = {
    PENDING: { label: t('appointments.status.PENDING'), color: 'warning', icon: <Clock size={14} />, bg: '#fff7ed', text: '#9a3412' },
    CONFIRMED: { label: t('appointments.status.CONFIRMED'), color: 'info', icon: <CheckCircle2 size={14} />, bg: '#eff6ff', text: '#1e40af' },
    CHECKED_IN: { label: t('appointments.status.CHECKED_IN'), color: 'success', icon: <CalendarCheck size={14} />, bg: '#f0fdf4', text: '#15803d' },
    IN_PROGRESS: { label: t('appointments.status.IN_PROGRESS'), color: 'primary', icon: <RefreshCw size={14} />, bg: '#f0fdf4', text: '#15803d' },
    COMPLETED: { label: t('appointments.status.COMPLETED'), color: 'success', icon: <CheckCircle2 size={14} />, bg: '#f0fdf4', text: '#15803d' },
    CANCELLED: { label: t('appointments.status.CANCELLED'), color: 'error', icon: <XCircle size={14} />, bg: '#fef2f2', text: '#991b1b' },
    NO_SHOW: { label: t('appointments.status.NO_SHOW'), color: 'default', icon: <AlertCircle size={14} />, bg: '#f8fafc', text: '#475569' }
  };
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Dialog states
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const detailTriggerRef = useRef(null);
  const cancelReturnRef = useRef(null);

  const focusTrigger = (target) => {
    if (!target?.focus) return;
    window.requestAnimationFrame(() => {
      if (target.isConnected) target.focus();
    });
  };

  const formatDateValue = (value, pattern, locale = dateLocale) => {
    if (!value) return '-';
    const date = new Date(value);
    if (!isValid(date)) return '-';
    return locale ? format(date, pattern, { locale }) : format(date, pattern);
  };

  const formatTimeValue = (value) => value?.slice?.(0, 5) || '-';

  const handleCardKeyDown = (event, appt) => {
    if (event.target !== event.currentTarget) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleOpenDetail(appt, event.currentTarget);
    }
  };

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      // Mapping tab indices to backend status filters
      let status = '';
      if (tabValue === 1) status = 'PENDING,CONFIRMED,CHECKED_IN'; // Upcoming
      else if (tabValue === 2) status = 'COMPLETED';
      else if (tabValue === 3) status = 'CANCELLED';

      const res = await appointmentApi.getMyAppointments(status);
      setAppointments(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch appointments', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- effect loads appointments when active tab status filter changes
    fetchAppointments();
  }, [tabValue]);

  const handleOpenCancel = (e, appt, returnFocusTarget = null) => {
    e.stopPropagation();
    cancelReturnRef.current = returnFocusTarget || detailTriggerRef.current || e.currentTarget;
    setSelectedAppt(appt);
    setCancelDialogOpen(true);
  };

  const handleOpenDetail = (appt, trigger = null) => {
    if (trigger) detailTriggerRef.current = trigger;
    setSelectedAppt(appt);
    setDetailDialogOpen(true);
  };

  const handleCloseDetail = (restoreFocus = true) => {
    setDetailDialogOpen(false);
    if (restoreFocus) focusTrigger(detailTriggerRef.current);
  };

  const handleCloseCancel = () => {
    setCancelDialogOpen(false);
    focusTrigger(cancelReturnRef.current);
  };

  const handleCancelAppointment = async () => {
    setActionLoading(true);
    try {
      await appointmentApi.cancelAppointment(selectedAppt.id, { cancellationReason: cancelReason });
      setCancelDialogOpen(false);
      setCancelReason('');
      focusTrigger(cancelReturnRef.current);
      fetchAppointments();
    } catch (err) {
      alert(err.response?.data?.message || t('appointments.error_cancel_failed'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleRebook = (appt) => {
    // Logic to navigate to booking with pre-selected doctor (T-031 AC-5)
    navigate(`/patient/appointments/book-appointment?doctorId=${appt.doctorId}`);
  };

  const renderStatusChip = (status) => {
    const config = STATUS_MAP[status] || STATUS_MAP.PENDING;
    return (
      <Chip 
        label={config.label} 
        size="small" 
        icon={config.icon}
        sx={{ 
          fontWeight: 700, 
          borderRadius: 2, 
          bgcolor: config.bg, 
          color: config.text,
          '& .MuiChip-icon': { color: 'inherit' }
        }}
      />
    );
  };

  return (
    <PatientPageShell
      title={t('appointments.title')}
      subtitle={t('appointments.subtitle')}
      maxWidth={false}
      transparent={true}
      actions={
        <Button
          variant="contained"
          startIcon={<CalendarCheck size={20} />}
          onClick={() => navigate('/patient/appointments/book-appointment')}
          sx={{
            borderRadius: 4,
            bgcolor: 'oklch(65% 0.15 160)',
            '&:hover': { bgcolor: 'oklch(60% 0.15 160)' },
            fontWeight: 950,
            px: 4,
            py: 1.5,
            boxShadow: '0 10px 30px oklch(65% 0.15 160 / 0.3)',
            width: 'auto',
            textTransform: 'none',
            fontSize: '1rem'
          }}
        >
          {t('appointments.book_new')}
        </Button>
      }
    >
      {/* Filter Section */}
      <Box sx={{ mb: 6 }}>
        <Tabs 
          value={tabValue} 
          onChange={(e, v) => setTabValue(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ 
            '& .MuiTabs-indicator': { display: 'none' },
            '& .MuiTabs-flexContainer': { gap: 1.5 }
          }}
        >
          {[
            t('appointments.tab_all'),
            t('appointments.tab_upcoming'),
            t('appointments.tab_completed'),
            t('appointments.tab_cancelled')
          ].map((label, idx) => (
            <Tab 
              key={idx}
              label={label} 
              sx={{ 
                fontWeight: 900, 
                textTransform: 'none', 
                fontSize: '1rem',
                borderRadius: 4,
                px: 4,
                py: 2,
                minHeight: 0,
                color: 'oklch(50% 0.02 250)',
                border: '2px solid transparent',
                transition: 'all 0.3s',
                '&.Mui-selected': { 
                  color: 'oklch(20% 0.05 250)', 
                  bgcolor: 'oklch(96% 0.01 250)',
                  borderColor: 'oklch(90% 0.02 250)'
                }
              }} 
            />
          ))}
        </Tabs>
      </Box>

      {/* Content Section */}
      <Box sx={{ minHeight: 500 }}>
        {loading ? (
          <LoadingScreen message={t('appointments.loading')} />
        ) : appointments.length > 0 ? (
          <Grid container spacing={4}>
            {appointments.map((appt) => (
              <Grid item xs={12} lg={6} key={appt.id}>
                <Box
                  onClick={(e) => handleOpenDetail(appt, e.currentTarget)}
                  sx={{
                    p: 4,
                    borderRadius: 8,
                    border: '1px solid oklch(92% 0.02 250)',
                    bgcolor: 'transparent',
                    cursor: 'pointer',
                    transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                    position: 'relative',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: '0 30px 60px oklch(20% 0.05 250 / 0.06)',
                      borderColor: 'oklch(65% 0.15 160)',
                      '& .appt-chevron': { transform: 'translateX(6px)', color: 'oklch(65% 0.15 160)' }
                    }
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 4 }}>
                    <Stack direction="row" spacing={3}>
                      <Avatar 
                        src={appt.doctorAvatar} 
                        sx={{ 
                          width: 80, height: 80, borderRadius: 5,
                          border: '3px solid white',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.08)'
                        }}
                      >
                        {appt.doctorName?.charAt(0) || '?'}
                      </Avatar>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 950, color: 'oklch(20% 0.05 250)', letterSpacing: '-0.02em', mb: 0.5 }}>
                          {appt.doctorName}
                        </Typography>
                        <Typography variant="body1" sx={{ color: 'oklch(55% 0.02 250)', fontWeight: 700, mb: 1.5 }}>
                          {appt.doctorSpecialization}
                        </Typography>
                        <Box>{renderStatusChip(appt.status)}</Box>
                      </Box>
                    </Stack>
                    <ChevronRight className="appt-chevron" size={24} color="oklch(70% 0.02 250)" style={{ transition: 'all 0.3s' }} />
                  </Stack>

                  <Box sx={{ 
                    p: 3, 
                    borderRadius: 5, 
                    bgcolor: 'oklch(98% 0.01 250)', 
                    border: '1px solid oklch(94% 0.02 250)',
                    mb: 3
                  }}>
                    <Grid container spacing={3}>
                      <Grid item xs={6}>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <CalendarDays size={20} color="oklch(65% 0.15 160)" />
                          <Typography variant="h6" sx={{ fontWeight: 850, color: 'oklch(20% 0.05 250)', fontSize: '1rem' }}>
                            {formatDateValue(appt.appointmentDate, 'dd/MM/yyyy')}
                          </Typography>
                        </Stack>
                      </Grid>
                      <Grid item xs={6}>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Clock size={20} color="oklch(65% 0.15 160)" />
                          <Typography variant="h6" sx={{ fontWeight: 850, color: 'oklch(20% 0.05 250)', fontSize: '1rem' }}>
                            {formatTimeValue(appt.appointmentTime)}
                          </Typography>
                        </Stack>
                      </Grid>
                    </Grid>
                  </Box>

                  <Stack direction="row" spacing={2}>
                    {(appt.status === 'PENDING' || appt.status === 'CONFIRMED') && (
                      <Button
                        fullWidth
                        variant="outlined"
                        onClick={(e) => handleOpenCancel(e, appt, e.currentTarget)}
                        sx={{ 
                          borderRadius: 4, 
                          py: 1.5, 
                          fontWeight: 950,
                          color: 'oklch(60% 0.15 20)',
                          borderColor: 'oklch(92% 0.02 20)',
                          transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                          '&:hover': { 
                            borderColor: 'oklch(60% 0.15 20)', 
                            bgcolor: 'oklch(98% 0.01 20)',
                            transform: 'translateY(-2px)'
                          }
                        }}
                      >
                        {t('appointments.cancel_btn')}
                      </Button>
                    )}
                    {(appt.status === 'COMPLETED' || appt.status === 'CANCELLED') && (
                      <Button 
                        fullWidth 
                        variant="contained" 
                        onClick={(e) => { e.stopPropagation(); handleRebook(appt); }}
                        startIcon={<RefreshCw size={18} />}
                        sx={{ 
                          borderRadius: 4, 
                          py: 1.5, 
                          fontWeight: 950,
                          bgcolor: 'oklch(20% 0.05 250)',
                          '&:hover': { bgcolor: 'oklch(15% 0.05 250)' }
                        }}
                      >
                        {t('appointments.rebook_btn')}
                      </Button>
                    )}
                  </Stack>
                </Box>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Box sx={{ textAlign: 'center', py: 16 }}>
            <Box sx={{ 
              width: 140, height: 140, borderRadius: '50%', 
              bgcolor: 'oklch(96% 0.01 250)', color: 'oklch(80% 0.02 250)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              mx: 'auto', mb: 4
            }}>
              <CalendarCheck size={80} strokeWidth={1} />
            </Box>
            <Typography variant="h3" sx={{ fontWeight: 950, color: 'oklch(20% 0.05 250)', mb: 2, letterSpacing: '-0.04em' }}>
              {t('appointments.no_appointments')}
            </Typography>
            <Typography variant="h6" sx={{ color: 'oklch(50% 0.02 250)', mb: 6, maxWidth: 500, mx: 'auto', fontWeight: 500 }}>
              {t('appointments.empty_desc')}
            </Typography>
            <Button 
              variant="contained" 
              onClick={() => navigate('/patient/appointments/book-appointment')}
              sx={{ 
                borderRadius: 4, px: 8, py: 2, 
                bgcolor: 'oklch(65% 0.15 160)', fontWeight: 950, fontSize: '1.1rem',
                boxShadow: '0 20px 40px oklch(65% 0.15 160 / 0.2)'
              }}
            >
              {t('appointments.book_now')}
            </Button>
          </Box>
        )}
      </Box>

      {/* Appointment Detail Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={handleCloseDetail}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: 8, p: 2, bgcolor: 'white' } }}
      >
        <DialogTitle sx={{ p: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h4" sx={{ fontWeight: 950, color: 'oklch(20% 0.05 250)', letterSpacing: '-0.04em' }}>
            {t('appointments.detail_title')}
          </Typography>
          {selectedAppt && renderStatusChip(selectedAppt.status)}
        </DialogTitle>
        <DialogContent sx={{ px: 4, pb: 2 }}>
          <Box sx={{ mb: 6 }}>
            <Stack direction="row" spacing={3} alignItems="center">
              <Avatar src={selectedAppt?.doctorAvatar} sx={{ width: 100, height: 100, borderRadius: 5 }} />
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 950, color: 'oklch(20% 0.05 250)', mb: 0.5 }}>
                  {selectedAppt?.doctorName}
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'oklch(65% 0.15 160)', mb: 0.5 }}>
                  {selectedAppt?.doctorSpecialization}
                </Typography>
                <Typography variant="body1" sx={{ color: 'oklch(55% 0.02 250)', fontWeight: 700 }}>
                  {selectedAppt?.departmentName}
                </Typography>
              </Box>
            </Stack>
          </Box>

          <Grid container spacing={4} sx={{ mb: 6 }}>
            <Grid item xs={12} sm={6}>
              <Stack spacing={3}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box sx={{ p: 2, borderRadius: 4, bgcolor: 'oklch(96% 0.01 160)', color: 'oklch(65% 0.15 160)' }}>
                    <CalendarDays size={28} />
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 900, color: 'oklch(60% 0.02 250)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      {t('appointments.exam_date')}
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>
                      {selectedAppt && formatDateValue(selectedAppt.appointmentDate, 'eeee, dd/MM/yyyy')}
                    </Typography>
                  </Box>
                </Stack>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box sx={{ p: 2, borderRadius: 4, bgcolor: 'oklch(96% 0.01 160)', color: 'oklch(65% 0.15 160)' }}>
                    <Clock size={28} />
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 900, color: 'oklch(60% 0.02 250)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      {t('appointments.exam_time')}
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>
                      {formatTimeValue(selectedAppt?.appointmentTime)} - {formatTimeValue(selectedAppt?.endTime)}
                    </Typography>
                  </Box>
                </Stack>
              </Stack>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Stack direction="row" spacing={2} alignItems="flex-start">
                <Box sx={{ p: 2, borderRadius: 4, bgcolor: 'oklch(96% 0.01 250)', color: 'oklch(20% 0.05 250)' }}>
                  <MapPin size={28} />
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 900, color: 'oklch(60% 0.02 250)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    {t('appointments.location')}
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>{t('appointments.clinic_name')}</Typography>
                  <Typography variant="body2" sx={{ color: 'oklch(55% 0.02 250)', fontWeight: 500 }}>{t('appointments.clinic_address')}</Typography>
                  <Button 
                    variant="text" 
                    startIcon={<Navigation size={16} />}
                    sx={{ p: 0, mt: 1, fontWeight: 950, color: 'oklch(65% 0.15 160)', fontSize: '0.9rem' }}
                  >
                    {t('appointments.get_directions')}
                  </Button>
                </Box>
              </Stack>
            </Grid>
          </Grid>

          <Box sx={{ p: 4, borderRadius: 6, bgcolor: 'oklch(98% 0.01 250)', border: '1px solid oklch(92% 0.02 250)' }}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
              <FileText size={20} color="oklch(50% 0.02 250)" />
              <Typography variant="h6" sx={{ fontWeight: 900, letterSpacing: '-0.02em' }}>{t('appointments.reason')}</Typography>
            </Stack>
            <Typography variant="body1" sx={{ color: 'oklch(40% 0.02 250)', lineHeight: 1.7, fontWeight: 500 }}>
              {selectedAppt?.reason}
            </Typography>

            {selectedAppt?.notes && (
              <>
                <Divider sx={{ my: 3, borderColor: 'oklch(92% 0.02 250)' }} />
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                  <Info size={20} color="oklch(65% 0.15 160)" />
                  <Typography variant="h6" sx={{ fontWeight: 900, letterSpacing: '-0.02em' }}>{t('appointments.doctor_notes')}</Typography>
                </Stack>
                <Typography variant="body1" sx={{ color: 'oklch(30% 0.02 250)', fontStyle: 'italic', fontWeight: 500 }}>
                  {selectedAppt.notes}
                </Typography>
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 4, gap: 3 }}>
          <Button 
            fullWidth 
            onClick={handleCloseDetail}
            sx={{ borderRadius: 4, py: 2, fontWeight: 950, color: 'oklch(50% 0.02 250)', fontSize: '1rem' }}
          >
            {t('appointments.close')}
          </Button>
          {(selectedAppt?.status === 'PENDING' || selectedAppt?.status === 'CONFIRMED') && (
            <Button 
              fullWidth 
              variant="contained" 
              onClick={(e) => { handleCloseDetail(false); handleOpenCancel(e, selectedAppt, detailTriggerRef.current); }}
              sx={{ 
                borderRadius: 4, py: 2, 
                bgcolor: 'oklch(60% 0.15 20)', color: 'white',
                fontWeight: 950, fontSize: '1rem',
                boxShadow: '0 10px 30px oklch(60% 0.15 20 / 0.2)'
              }}
            >
              {t('appointments.cancel_now')}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <Dialog
        open={cancelDialogOpen}
        onClose={handleCloseCancel}
        PaperProps={{ sx: { borderRadius: 8, p: 3, maxWidth: 500 } }}
      >
        <DialogTitle sx={{ pt: 4, textAlign: 'center' }}>
          <Box sx={{ 
            width: 80, height: 80, borderRadius: '50%', 
            bgcolor: 'oklch(96% 0.01 20)', color: 'oklch(60% 0.15 20)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            mx: 'auto', mb: 3
          }}>
            <AlertCircle size={48} strokeWidth={2.5} />
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 950, color: 'oklch(20% 0.05 250)', letterSpacing: '-0.04em' }}>
            {t('appointments.cancel_confirm_title')}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="h6" sx={{ textAlign: 'center', color: 'oklch(50% 0.02 250)', mb: 6, fontWeight: 500 }}>
            {t('appointments.cancel_warning', { name: selectedAppt?.doctorName })}
          </Typography>
          <TextField
            fullWidth
            label={t('appointments.cancel_reason_label')}
            placeholder={t('appointments.cancel_reason_placeholder')}
            multiline
            rows={3}
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 6, bgcolor: 'oklch(98% 0.01 250)', p: 3, fontSize: '1.1rem' } }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 4, gap: 3 }}>
          <Button 
            fullWidth 
            onClick={handleCloseCancel}
            sx={{ borderRadius: 4, py: 2, fontWeight: 950, color: 'oklch(50% 0.02 250)', fontSize: '1rem' }}
          >
            {t('appointments.go_back')}
          </Button>
          <Button 
            fullWidth 
            variant="contained" 
            onClick={handleCancelAppointment}
            disabled={actionLoading}
            sx={{ 
              borderRadius: 4, py: 2, 
              bgcolor: 'oklch(60% 0.15 20)', color: 'white',
              fontWeight: 950, fontSize: '1rem',
              boxShadow: '0 10px 30px oklch(60% 0.15 20 / 0.3)'
            }}
          >
            {actionLoading ? <CircularProgress size={24} color="inherit" /> : t('appointments.confirm_cancel')}
          </Button>
        </DialogActions>
      </Dialog>
    </PatientPageShell>
  );
}
