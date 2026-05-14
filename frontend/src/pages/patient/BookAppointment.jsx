import { useState, useEffect } from 'react';
import {
  Paper,
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Avatar,
  TextField,
  MenuItem,
  CircularProgress,
  Divider,
  Alert,
  Stack,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  CalendarDays,
  Clock,
  Stethoscope,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { format, addDays, isSameDay } from 'date-fns';
import { vi, enUS } from 'date-fns/locale';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import publicApi from '../../api/publicApi';
import appointmentApi from '../../api/appointmentApi';
import useAuthStore from '../../store/authStore';
import PatientPageShell from '../../components/patient/PatientPageShell';

export default function BookAppointment() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const steps = [
    t('booking.step1_label'), 
    t('booking.step2_label'), 
    t('booking.step3_label')
  ];
  
  const dateLocale = i18n.language === 'vi' ? vi : enUS;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user } = useAuthStore();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Data for selection
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [doctorSchedules, setDoctorSchedules] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  
  // Selection state
  const [selectedDept, setSelectedDept] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [reason, setReason] = useState('');

  async function fetchDepartments() {
    try {
      const res = await publicApi.getDepartments({ size: 100 });
      setDepartments(res.data?.content || []);
    } catch (err) {
      console.error('Failed to fetch departments', err);
      setDepartments([]);
    }
  }

  async function fetchDoctors(deptId) {
    try {
      const res = await publicApi.getDoctors({ departmentId: deptId, size: 100 });
      setDoctors(res.data?.content || []);
    } catch (err) {
      console.error('Failed to fetch doctors', err);
      setDoctors([]);
    }
  }

  async function fetchDoctorSchedules(doctorId) {
    try {
      const res = await appointmentApi.getDoctorSchedules(doctorId);
      setDoctorSchedules(res.data || []);
    } catch (err) {
      console.error('Failed to fetch doctor schedules', err);
      setDoctorSchedules([]);
    }
  }

  async function fetchSlots(doctorId, dateStr) {
    setLoading(true);
    try {
      const res = await appointmentApi.getAvailableSlots(doctorId, dateStr);
      setAvailableSlots(res.data || []);
    } catch (err) {
      console.error('Failed to fetch slots', err);
      setAvailableSlots([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- effect triggers async server fetch for initial department options
    fetchDepartments();

    // Check for pre-filled data from navigation state
    if (location.state) {
      const { doctor, date, slot } = location.state;
      if (doctor) setSelectedDoctor(doctor);
      if (date) setSelectedDate(new Date(date));
      if (slot) {
        setSelectedSlot(slot);
        setActiveStep(2); // Jump to step 3 (Confirm & Reason) if everything is pre-selected
      } else if (doctor && date) {
        setActiveStep(1); // Jump to step 2 (Slot Selection) if doctor and date are pre-selected
      }
    }
  }, [location.state]);

  useEffect(() => {
    if (selectedDept) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- effect refetches doctors when department filter changes
      fetchDoctors(selectedDept.id);
    } else {
      fetchDoctors();
    }
  }, [selectedDept]);

  useEffect(() => {
    if (selectedDoctor) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- effect syncs schedule data for selected doctor
      fetchDoctorSchedules(selectedDoctor.id);
    }
  }, [selectedDoctor]);

  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- effect refreshes server-available slots based on doctor/date selection
      fetchSlots(selectedDoctor.id, format(selectedDate, 'yyyy-MM-dd'));
    }
  }, [selectedDoctor, selectedDate]);
  const isDoctorWorkingOn = (date) => {
    if (doctorSchedules.length === 0) return true; // Fallback if no schedule info
    const dayOfWeek = format(date, 'EEEE').toUpperCase();
    return doctorSchedules.some(s => s.dayOfWeek === dayOfWeek && s.isActive);
  };

  const handleNext = () => {
    if (activeStep === 0 && !selectedDoctor) {
      setError(t('booking.error_no_doctor'));
      return;
    }
    if (activeStep === 1 && !selectedSlot) {
      setError(t('booking.error_no_slot'));
      return;
    }
    setError('');
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleBooking = async () => {
    if (reason.length < 10) {
      setError(t('booking.error_reason_min'));
      return;
    }

    setLoading(true);
    try {
      const bookingData = {
        doctorId: selectedDoctor.id,
        departmentId: selectedDept?.id || (selectedDoctor.departments?.[0]?.id),
        appointmentDate: format(selectedDate, 'yyyy-MM-dd'),
        appointmentTime: selectedSlot.startTime,
        reason: reason
      };
      
      await appointmentApi.bookAppointment(bookingData);
      setActiveStep(3); // Success step
    } catch (err) {
      setError(err.response?.data?.message || t('booking.error_general'));
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Stethoscope size={20} /> {t('booking.step1_title')}
            </Typography>
            
            <TextField
              select
              fullWidth
              label={t('booking.select_department')}
              value={selectedDept?.id || ''}
              onChange={(e) => {
                const dept = (departments || []).find(d => d.id === e.target.value);
                setSelectedDept(dept);
                setSelectedDoctor(null);
              }}
              sx={{ mb: 4, mt: 2 }}
            >
              <MenuItem value="">{t('booking.all_departments')}</MenuItem>
              {(departments || []).map((dept) => (
                <MenuItem key={dept.id} value={dept.id}>{dept.name}</MenuItem>
              ))}
            </TextField>

            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 500 }}>
              {t('booking.available_doctors', { count: doctors.length })}
            </Typography>
            
            <Grid container spacing={2}>
              {(doctors || []).map((doc) => (
                <Grid item xs={12} sm={6} key={doc.id}>
                  <Card 
                    variant="outlined" 
                    sx={{ 
                      borderRadius: 3,
                      transition: 'all 0.2s',
                      border: selectedDoctor?.id === doc.id ? '2px solid #10b981' : '1px solid #e2e8f0',
                      bgcolor: selectedDoctor?.id === doc.id ? '#f0fdf4' : 'white',
                      '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }
                    }}
                  >
                    <CardActionArea onClick={() => { setSelectedDoctor(doc); setSelectedSlot(null); setError(''); }}>
                      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar src={doc.avatarUrl} sx={{ width: 64, height: 64, bgcolor: '#10b981' }}>
                          {doc.fullName.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{doc.fullName}</Typography>
                          <Typography variant="body2" color="text.secondary">{doc.specialization}</Typography>
                          <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5, color: '#10b981', fontWeight: 600 }}>
                            <CheckCircle2 size={12} /> {t('booking.ready_to_book')}
                          </Typography>
                        </Box>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        );

      case 1:
        return (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
              <CalendarDays size={20} /> {t('booking.step2_title')}
            </Typography>

            <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 2, mt: 2, px: 1 }}>
              {[...Array(14)].map((_, i) => {
                const date = addDays(new Date(), i);
                const isSelected = isSameDay(date, selectedDate);
                const isWorking = isDoctorWorkingOn(date);
                
                return (
                  <Card 
                    key={i}
                    variant="outlined"
                    sx={{ 
                      minWidth: 85, 
                      textAlign: 'center', 
                      borderRadius: 4,
                      cursor: isWorking ? 'pointer' : 'not-allowed',
                      transition: 'all 0.2s',
                      opacity: isWorking ? 1 : 0.4,
                      border: isSelected ? '2px solid #10b981' : '1px solid #e2e8f0',
                      bgcolor: isSelected ? '#10b981' : (isWorking ? 'white' : '#f8fafc'),
                      color: isSelected ? 'white' : 'inherit',
                      boxShadow: isSelected ? '0 4px 12px rgba(16, 185, 129, 0.2)' : 'none',
                      '&:hover': isWorking ? { transform: 'translateY(-4px)', borderColor: '#10b981' } : {}
                    }}
                    onClick={() => isWorking && setSelectedDate(date)}
                  >
                    <CardContent sx={{ p: '14px !important' }}>
                      <Typography variant="caption" sx={{ textTransform: 'uppercase', opacity: 0.8, fontWeight: 700, fontSize: '0.65rem' }}>
                        {format(date, 'eee', { locale: dateLocale })}
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 800, my: 0.2 }}>
                        {format(date, 'dd')}
                      </Typography>
                      <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                        {format(date, 'MMM', { locale: dateLocale })}
                      </Typography>
                    </CardContent>
                  </Card>
                );
              })}
            </Box>

            <Divider sx={{ my: 3 }} />

            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Clock size={18} /> {t('booking.available_slots')}
            </Typography>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress size={32} />
              </Box>
            ) : (availableSlots || []).length > 0 ? (
              <Grid container spacing={1} sx={{ mt: 1 }}>
                {(availableSlots || []).map((slot, idx) => (
                  <Grid item xs={4} sm={3} md={2} key={idx}>
                    <Button
                      fullWidth
                      variant={selectedSlot === slot ? "contained" : "outlined"}
                      disabled={!slot.available}
                      onClick={() => { setSelectedSlot(slot); setError(''); }}
                      sx={{ 
                        borderRadius: 2,
                        py: 1,
                        textTransform: 'none',
                        fontWeight: 600,
                        bgcolor: selectedSlot === slot ? '#10b981' : 'transparent',
                        borderColor: slot.available ? '#10b981' : '#e2e8f0',
                        color: selectedSlot === slot ? 'white' : (slot.available ? '#10b981' : '#94a3b8'),
                        '&:hover': { bgcolor: selectedSlot === slot ? '#059669' : '#f0fdf4' }
                      }}
                    >
                      {slot.startTime.substring(0, 5)}
                    </Button>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Alert severity="info" sx={{ mt: 2, borderRadius: 2 }}>
                {t('booking.no_slots')}
              </Alert>
            )}
          </Box>
        );

      case 2:
        return (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckCircle2 size={20} /> {t('booking.step3_title')}
            </Typography>

            <Paper variant="outlined" sx={{ p: 3, borderRadius: 4, bgcolor: '#f8fafc', mb: 4, mt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="caption" color="text.secondary">{t('booking.confirm_doctor')}</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 0.5 }}>
                    <Avatar src={selectedDoctor?.avatarUrl} sx={{ width: 40, height: 40 }} />
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{selectedDoctor?.fullName}</Typography>
                      <Typography variant="caption">{selectedDoctor?.specialization}</Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="caption" color="text.secondary">{t('booking.confirm_time')}</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                    <CalendarDays size={18} color="#10b981" />
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      {format(selectedDate, 'eeee, dd/MM/yyyy', { locale: dateLocale })}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                    <Clock size={18} color="#10b981" />
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      {selectedSlot?.startTime.substring(0, 5)} - {selectedSlot?.endTime.substring(0, 5)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="caption" color="text.secondary">{t('booking.confirm_patient')}</Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mt: 0.5 }}>
                    {user?.fullName} — {user?.phone}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>

            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
              {t('booking.reason_label')}
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              placeholder={t('booking.reason_placeholder')}
              value={reason}
              onChange={(e) => { setReason(e.target.value); setError(''); }}
              error={!!error && reason.length < 10}
              helperText={reason.length > 0 && reason.length < 10 ? t('booking.reason_short') : ""}
              sx={{ 
                '& .MuiOutlinedInput-root': { borderRadius: 3 }
              }}
            />
          </Box>
        );

      case 3: // Success
        return (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Box sx={{ mb: 3 }}>
              <CheckCircle2 size={80} color="#10b981" />
            </Box>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 800 }}>{t('booking.success_title')}</Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 500, mx: 'auto' }}>
              {t('booking.success_desc')}
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button 
                variant="contained" 
                onClick={() => navigate('/patient/appointments')}
                sx={{ borderRadius: 2, px: 4, py: 1.2, bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' } }}
              >
                {t('booking.manage_btn')}
              </Button>
              <Button 
                variant="outlined" 
                onClick={() => navigate('/patient/dashboard')}
                sx={{ borderRadius: 2, px: 4, py: 1.2, color: '#10b981', borderColor: '#10b981' }}
              >
                {t('booking.dashboard_btn')}
              </Button>
            </Box>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <PatientPageShell
      title={t('booking.title')}
      subtitle={t('booking.subtitle')}
      maxWidth="md"
      actions={
        <Button
          variant="outlined"
          onClick={() => navigate('/patient/appointments')}
          sx={{
            borderRadius: 3,
            color: '#0f766e',
            borderColor: 'rgba(8, 187, 163, 0.28)',
            fontWeight: 700,
            px: 2.5,
            py: 1.1,
            width: 'auto',
            minWidth: 0,
            alignSelf: 'flex-end',
            '&:hover': {
              borderColor: '#08bba3',
              bgcolor: 'rgba(8, 187, 163, 0.06)'
            }
          }}
        >
          {t('booking.manage_btn')}
        </Button>
      }
    >
      <Paper
        elevation={0} 
        sx={{ 
          p: { xs: 3, md: 5 }, 
          borderRadius: 6, 
          boxShadow: '0 10px 40px rgba(0,0,0,0.04)',
          border: '1px solid #f1f5f9'
        }}
      >
        {activeStep < 3 && (
          <Stepper
            activeStep={activeStep}
            orientation={isMobile ? 'vertical' : 'horizontal'}
            alternativeLabel={!isMobile}
            sx={{ mb: { xs: 4, sm: 5 } }}
          >
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel
                  slotProps={{
                    stepIcon: {
                      sx: {
                        '&.Mui-active': { color: '#10b981' },
                        '&.Mui-completed': { color: '#10b981' }
                      }
                    }
                  }}
                >
                  <Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>{label}</Typography>
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        )}

        {error && (
          <Alert 
            severity="error" 
            onClose={() => setError('')} 
            sx={{ mb: 3, borderRadius: 3, alignItems: 'center' }}
            icon={<AlertCircle size={20} />}
          >
            {error}
          </Alert>
        )}

        {renderStepContent(activeStep)}

        {activeStep < 3 && (
          <Stack
            direction={{ xs: 'column-reverse', sm: 'row' }}
            spacing={2}
            sx={{ mt: 6 }}
            justifyContent="space-between"
          >
            <Button
              disabled={activeStep === 0 || loading}
              onClick={handleBack}
              startIcon={<ChevronLeft size={18} />}
              fullWidth={isMobile}
              sx={{ borderRadius: 2, px: 3, color: '#64748b', fontWeight: 600 }}
            >
              {t('booking.back')}
            </Button>

            {activeStep === steps.length - 1 ? (
              <Button
                variant="contained"
                onClick={handleBooking}
                disabled={loading}
                fullWidth={isMobile}
                endIcon={loading ? <CircularProgress size={20} color="inherit" /> : <ChevronRight size={18} />}
                sx={{ borderRadius: 2, px: 4, py: 1.2, bgcolor: '#10b981', fontWeight: 700, '&:hover': { bgcolor: '#059669' } }}
              >
                {t('booking.confirm_booking')}
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleNext}
                fullWidth={isMobile}
                endIcon={<ChevronRight size={18} />}
                sx={{ borderRadius: 2, px: 4, py: 1.2, bgcolor: '#10b981', fontWeight: 700, '&:hover': { bgcolor: '#059669' } }}
              >
                {t('booking.next')}
              </Button>
            )}
          </Stack>
        )}
      </Paper>
    </PatientPageShell>
  );
}
