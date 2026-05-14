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
      setAppointments(res.data);
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
      maxWidth="lg"
      actions={
        <Button
          variant="contained"
          startIcon={<CalendarCheck size={18} />}
          onClick={() => navigate('/patient/appointments/book-appointment')}
          sx={{
            borderRadius: 3,
            bgcolor: '#10b981',
            '&:hover': { bgcolor: '#059669' },
            fontWeight: 700,
            px: 3,
            py: 1.2,
            boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
            width: 'auto',
            minWidth: 0,
            alignSelf: 'flex-end',
          }}
        >
          {t('appointments.book_new')}
        </Button>
      }
    >
      {/* Tabs Section */}
      <Paper sx={{ borderRadius: 5, overflow: 'hidden', boxShadow: '0 10px 40px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9' }}>
        <Tabs 
          value={tabValue} 
          onChange={(e, v) => setTabValue(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ 
            bgcolor: 'white',
            borderBottom: 1, 
            borderColor: 'divider',
            px: 2,
            '& .MuiTab-root': { fontWeight: 700, textTransform: 'none', py: 2.5, minWidth: 120, fontSize: '0.95rem' },
            '& .Mui-selected': { color: '#10b981 !important' },
            '& .MuiTabs-indicator': { bgcolor: '#10b981', height: 4, borderRadius: '4px 4px 0 0' }
          }}
        >
          <Tab label={t('appointments.tab_all')} />
          <Tab label={t('appointments.tab_upcoming')} />
          <Tab label={t('appointments.tab_completed')} />
          <Tab label={t('appointments.tab_cancelled')} />
        </Tabs>

        {/* Content Section */}
        <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: '#f8fafc', minHeight: 450 }}>
          {loading ? (
            <LoadingScreen message={t('appointments.loading')} />
          ) : appointments.length > 0 ? (
            <Grid container spacing={3}>
              {appointments.map((appt) => (
                <Grid item xs={12} md={6} key={appt.id}>
                  <Card
                    role="button"
                    tabIndex={0}
                    aria-haspopup="dialog"
                    onClick={(e) => handleOpenDetail(appt, e.currentTarget)}
                    onKeyDown={(event) => handleCardKeyDown(event, appt)}
                    sx={{
                      borderRadius: 5,
                      border: '1px solid #e2e8f0',
                      boxShadow: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      position: 'relative',
                      overflow: 'visible',
                      '&:hover': {
                        transform: 'translateY(-6px)',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.06)',
                        borderColor: '#10b981'
                      },
                      '&:focus-visible': {
                        outline: 'none',
                        borderColor: '#10b981',
                        boxShadow: '0 0 0 4px rgba(16, 185, 129, 0.18)'
                      }
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                          <Avatar 
                            src={appt.doctorAvatar} 
                            sx={{ width: 60, height: 60, borderRadius: 3, bgcolor: '#f0fdf4', color: '#10b981', fontWeight: 800, fontSize: '1.5rem', border: '2px solid white', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                          >
                            {appt.doctorName?.charAt(0) || '?'}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1e293b', lineHeight: 1.2 }}>{t('appointments.attending_doctor')}: {appt.doctorName}</Typography>
                            <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>{appt.doctorSpecialization}</Typography>
                            <Box sx={{ mt: 1 }}>{renderStatusChip(appt.status)}</Box>
                          </Box>
                        </Box>
                        <Tooltip title={t('appointments.open_detail')}>
                          <IconButton
                            size="small"
                            aria-label={t('appointments.open_detail')}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDetail(appt, e.currentTarget);
                            }}
                            sx={{ bgcolor: '#f1f5f9' }}
                          >
                            <ChevronRight size={18} />
                          </IconButton>
                        </Tooltip>
                      </Box>

                      <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, bgcolor: 'white', border: '1px solid #f1f5f9', mb: 2 }}>
                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <CalendarDays size={14} color="#10b981" />
                              <Typography variant="caption" sx={{ fontWeight: 700, color: '#334155' }}>
                                {formatDateValue(appt.appointmentDate, 'dd/MM/yyyy')}
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={6}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Clock size={14} color="#10b981" />
                              <Typography variant="caption" sx={{ fontWeight: 700, color: '#334155' }}>
                                {formatTimeValue(appt.appointmentTime)}
                              </Typography>
                            </Box>
                          </Grid>
                        </Grid>
                      </Paper>

                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {(appt.status === 'PENDING' || appt.status === 'CONFIRMED') && (
                          <Button
                            fullWidth
                            variant="outlined"
                            color="error"
                            size="small"
                            onClick={(e) => handleOpenCancel(e, appt, e.currentTarget)}
                            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, py: 1 }}
                          >
                            {t('appointments.cancel_btn')}
                          </Button>
                        )}
                        {(appt.status === 'COMPLETED' || appt.status === 'CANCELLED') && (
                          <Button 
                            fullWidth 
                            variant="outlined" 
                            size="small"
                            onClick={(e) => { e.stopPropagation(); handleRebook(appt); }}
                            startIcon={<RefreshCw size={14} />}
                            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, color: '#10b981', borderColor: '#10b981', py: 1 }}
                          >
                            {t('appointments.rebook_btn')}
                          </Button>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Box sx={{ textAlign: 'center', py: 12 }}>
              <Box sx={{ p: 4, borderRadius: '50%', bgcolor: 'white', display: 'inline-flex', mb: 3, boxShadow: '0 10px 30px rgba(0,0,0,0.03)' }}>
                <CalendarCheck size={64} color="#cbd5e1" />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#334155', mb: 1 }}>{t('appointments.no_appointments')}</Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 400, mx: 'auto' }}>
                {t('appointments.empty_desc')}
              </Typography>
              <Button 
                variant="contained" 
                onClick={() => navigate('/patient/appointments/book-appointment')}
                sx={{ borderRadius: 3, bgcolor: '#10b981', px: 4, py: 1.5, fontWeight: 700 }}
              >
                {t('appointments.book_now')}
              </Button>
            </Box>
          )}
        </Box>
      </Paper>

      {/* Appointment Detail Dialog (T-031 AC-4) */}
      <Dialog
        open={detailDialogOpen}
        onClose={handleCloseDetail}
        fullWidth
        maxWidth="sm"
        aria-labelledby="appointment-detail-title"
        PaperProps={{ sx: { borderRadius: 6, p: 1 } }}
      >
        <DialogTitle
          id="appointment-detail-title"
          sx={{ fontWeight: 900, fontSize: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          {t('appointments.detail_title')}
          {selectedAppt && renderStatusChip(selectedAppt.status)}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ py: 2 }}>
            <Box sx={{ display: 'flex', gap: 3, mb: 4 }}>
              <Avatar src={selectedAppt?.doctorAvatar} sx={{ width: 80, height: 80, borderRadius: 4 }} />
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>{t('appointments.attending_doctor')}: {selectedAppt?.doctorName}</Typography>
                <Typography variant="body1" color="text.secondary">{selectedAppt?.doctorSpecialization}</Typography>
                <Typography variant="subtitle2" sx={{ color: '#10b981', fontWeight: 700, mt: 0.5 }}>{t('appointments.department')}: {selectedAppt?.departmentName}</Typography>
              </Box>
            </Box>

            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ p: 1, borderRadius: 2, bgcolor: '#f0fdf4', color: '#10b981' }}><CalendarDays size={20} /></Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">{t('appointments.exam_date')}</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 700 }}>
                        {selectedAppt && formatDateValue(selectedAppt.appointmentDate, 'eeee, dd/MM/yyyy')}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ p: 1, borderRadius: 2, bgcolor: '#f0fdf4', color: '#10b981' }}><Clock size={20} /></Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">{t('appointments.exam_time')}</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 700 }}>
                        {formatTimeValue(selectedAppt?.appointmentTime)} - {formatTimeValue(selectedAppt?.endTime)}
                      </Typography>
                    </Box>
                  </Box>
                </Stack>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <Box sx={{ p: 1, borderRadius: 2, bgcolor: '#eff6ff', color: '#3b82f6' }}><MapPin size={20} /></Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">{t('appointments.location')}</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{t('appointments.clinic_name')}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{t('appointments.clinic_address')}</Typography>
                    <Button 
                      size="small" 
                      variant="text" 
                      startIcon={<Navigation size={12} />}
                      sx={{ color: '#3b82f6', textTransform: 'none', mt: 0.5, p: 0, minWidth: 0, fontWeight: 700 }}
                    >
                      {t('appointments.get_directions')}
                    </Button>
                  </Box>
                </Box>
              </Grid>
            </Grid>

            <Box sx={{ mt: 4, p: 3, borderRadius: 4, bgcolor: '#f8fafc', border: '1px solid #f1f5f9' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <FileText size={18} color="#64748b" />
                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{t('appointments.reason')}</Typography>
              </Box>
              <Typography variant="body2" sx={{ color: '#334155', lineHeight: 1.6 }}>
                {selectedAppt?.reason}
              </Typography>

              {selectedAppt?.notes && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                    <Info size={18} color="#10b981" />
                    <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{t('appointments.doctor_notes')}</Typography>
                  </Box>
                  <Typography variant="body2" sx={{ color: '#334155', fontStyle: 'italic' }}>
                    {selectedAppt.notes}
                  </Typography>
                </>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 2 }}>
          <Button 
            fullWidth 
            onClick={handleCloseDetail}
            sx={{ borderRadius: 3, fontWeight: 700, color: '#64748b', bgcolor: '#f1f5f9' }}
          >
            {t('appointments.close')}
          </Button>
          {(selectedAppt?.status === 'PENDING' || selectedAppt?.status === 'CONFIRMED') && (
            <Button 
              fullWidth 
              variant="contained" 
              color="error"
              onClick={(e) => { handleCloseDetail(false); handleOpenCancel(e, selectedAppt, detailTriggerRef.current); }}
              sx={{ borderRadius: 3, fontWeight: 700, boxShadow: 'none' }}
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
        aria-labelledby="appointment-cancel-title"
        PaperProps={{ sx: { borderRadius: 6, p: 1, maxWidth: 450 } }}
      >
        <DialogTitle id="appointment-cancel-title" sx={{ fontWeight: 900, textAlign: 'center', pt: 4 }}>{t('appointments.cancel_confirm_title')}</DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Box sx={{ p: 2, borderRadius: '50%', bgcolor: '#fef2f2', display: 'inline-flex', mb: 2 }}>
              <AlertCircle size={40} color="#ef4444" />
            </Box>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {t('appointments.cancel_warning', { name: selectedAppt?.doctorName })}
            </Typography>
          </Box>
          <TextField
            fullWidth
            label={t('appointments.cancel_reason_label')}
            placeholder={t('appointments.cancel_reason_placeholder')}
            multiline
            rows={3}
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 4 } }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 4, pb: 4, gap: 2 }}>
          <Button 
            fullWidth 
            onClick={handleCloseCancel}
            sx={{ borderRadius: 3, fontWeight: 700, color: '#64748b' }}
          >
            {t('appointments.go_back')}
          </Button>
          <Button 
            fullWidth 
            variant="contained" 
            color="error"
            onClick={handleCancelAppointment}
            disabled={actionLoading}
            sx={{ borderRadius: 3, fontWeight: 700, boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)' }}
          >
            {actionLoading ? <CircularProgress size={20} color="inherit" /> : t('appointments.confirm_cancel')}
          </Button>
        </DialogActions>
      </Dialog>
    </PatientPageShell>
  );
}
