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
      const depts = res.data.data?.content || [];
      setDepartments(depts);
      return depts;
    } catch (err) {
      console.error('Failed to fetch departments', err);
      setDepartments([]);
      return [];
    }
  }

  async function fetchDoctors(deptId) {
    try {
      const res = await publicApi.getDoctors({ departmentId: deptId, size: 100 });
      setDoctors(res.data.data?.content || []);
    } catch (err) {
      console.error('Failed to fetch doctors', err);
      setDoctors([]);
    }
  }

  async function fetchDoctorSchedules(doctorId) {
    try {
      const res = await appointmentApi.getDoctorSchedules(doctorId);
      setDoctorSchedules(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch doctor schedules', err);
      setDoctorSchedules([]);
    }
  }

  async function fetchSlots(doctorId, dateStr) {
    setLoading(true);
    try {
      const res = await appointmentApi.getAvailableSlots(doctorId, dateStr);
      setAvailableSlots(res.data.data || []);
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

    // Check for pre-filled data from navigation state or query params
    const checkPreFilled = async (deptList) => {
      if (location.state) {
        const { doctor, date, slot, fromTriage, departmentName, reason: triageReason } = location.state;
        
        if (fromTriage) {
          if (triageReason) setReason(triageReason);
          if (departmentName && deptList) {
            const normalize = (str) => str?.toLowerCase()
              .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove accents
              .replace(/đ/g, "d")
              .replace(/^khoa\s+/i, '')
              .replace(/\s+/g, ' ')
              .trim() || '';
            
            // Split by comma or slash to handle multiple suggestions
            const suggestedParts = departmentName.split(/[,/]/).map(p => normalize(p));
            
            const matchedDept = deptList.find(d => {
              const dName = normalize(d.name);
              const dNameVi = normalize(d.nameVi);
              return suggestedParts.some(target => 
                (target && dName.includes(target)) || (dName && target.includes(dName)) || 
                (target && dNameVi.includes(target)) || (dNameVi && target.includes(dNameVi))
              );
            });

            if (matchedDept) {
              setSelectedDept(matchedDept);
              fetchDoctors(matchedDept.id);
              setActiveStep(1);
            }
          }
          return;
        }

        if (doctor) setSelectedDoctor(doctor);
        if (date) setSelectedDate(new Date(date));
        if (slot) {
          setSelectedSlot(slot);
          setActiveStep(2);
        } else if (doctor && date) {
          setActiveStep(1);
        }
      } else {
        const params = new URLSearchParams(location.search);
        const doctorId = params.get('doctorId');
        if (doctorId) {
          try {
            const res = await publicApi.getDoctorById(doctorId);
            setSelectedDoctor(res.data.data);
            setActiveStep(1);
          } catch (err) {
            console.error('Failed to fetch pre-selected doctor', err);
          }
        }
      }
    };

    fetchDepartments().then(depts => {
      checkPreFilled(depts);
    });
  }, [location.state, location.search]);

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
          <Box sx={{ mt: 2 }}>
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
              sx={{ mb: 6, '& .MuiOutlinedInput-root': { borderRadius: 4, height: 64, bgcolor: 'white' } }}
            >
              <MenuItem value="">{t('booking.all_departments')}</MenuItem>
              {(departments || []).map((dept) => (
                <MenuItem key={dept.id} value={dept.id}>{dept.name}</MenuItem>
              ))}
            </TextField>

            <Typography variant="h5" sx={{ fontWeight: 950, mb: 4, color: 'oklch(20% 0.05 250)', letterSpacing: '-0.03em' }}>
              {t('booking.available_doctors', { count: doctors.length })}
            </Typography>
            
            <Grid container spacing={3}>
              {(doctors || []).map((doc) => {
                const isSelected = selectedDoctor?.id === doc.id;
                return (
                  <Grid item xs={12} sm={6} lg={4} key={doc.id}>
                    <Box 
                      onClick={() => { setSelectedDoctor(doc); setSelectedSlot(null); setError(''); }}
                      sx={{ 
                        p: 3,
                        cursor: 'pointer',
                        borderRadius: 6,
                        border: '2px solid',
                        borderColor: isSelected ? 'oklch(65% 0.15 160)' : 'oklch(92% 0.02 250)',
                        bgcolor: isSelected ? 'oklch(98% 0.01 160)' : 'transparent',
                        transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 3,
                        '&:hover': { 
                          transform: 'translateY(-6px)', 
                          borderColor: 'oklch(65% 0.15 160)',
                          boxShadow: '0 20px 40px oklch(20% 0.05 250 / 0.06)'
                        }
                      }}
                    >
                      <Avatar 
                        src={doc.avatarUrl} 
                        sx={{ 
                          width: 80, height: 80, borderRadius: 5,
                          border: '3px solid white',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.08)'
                        }}
                      >
                        {doc.fullName.charAt(0)}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="h6" sx={{ fontWeight: 950, color: 'oklch(20% 0.05 250)', mb: 0.5, letterSpacing: '-0.02em' }}>
                          {doc.fullName}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'oklch(55% 0.02 250)', fontWeight: 700, mb: 1.5 }}>
                          {doc.specialization}
                        </Typography>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ color: 'oklch(65% 0.15 160)' }}>
                          <CheckCircle2 size={16} />
                          <Typography variant="caption" sx={{ fontWeight: 900, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                            {t('booking.ready_to_book')}
                          </Typography>
                        </Stack>
                      </Box>
                    </Box>
                  </Grid>
                );
              })}
            </Grid>
          </Box>
        );

      case 1:
        return (
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 3, px: 1, '&::-webkit-scrollbar': { display: 'none' } }}>
              {[...Array(14)].map((_, i) => {
                const date = addDays(new Date(), i);
                const isSelected = isSameDay(date, selectedDate);
                const isWorking = isDoctorWorkingOn(date);
                
                return (
                  <Box 
                    key={i}
                    onClick={() => isWorking && setSelectedDate(date)}
                    sx={{ 
                      minWidth: 100, 
                      p: 2.5,
                      textAlign: 'center', 
                      borderRadius: 5,
                      cursor: isWorking ? 'pointer' : 'not-allowed',
                      transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                      opacity: isWorking ? 1 : 0.3,
                      border: '2px solid',
                      borderColor: isSelected ? 'oklch(65% 0.15 160)' : 'oklch(92% 0.02 250)',
                      bgcolor: isSelected ? 'oklch(65% 0.15 160)' : 'transparent',
                      color: isSelected ? 'white' : 'inherit',
                      '&:hover': isWorking ? { transform: 'translateY(-4px)', borderColor: 'oklch(65% 0.15 160)' } : {}
                    }}
                  >
                    <Typography variant="caption" sx={{ textTransform: 'uppercase', fontWeight: 900, letterSpacing: '0.1em', opacity: isSelected ? 0.9 : 0.6 }}>
                      {format(date, 'eee', { locale: dateLocale })}
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 950, my: 0.5, letterSpacing: '-0.04em' }}>
                      {format(date, 'dd')}
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', opacity: isSelected ? 0.9 : 0.6 }}>
                      {format(date, 'MMM', { locale: dateLocale })}
                    </Typography>
                  </Box>
                );
              })}
            </Box>

            <Typography variant="h5" sx={{ fontWeight: 950, mt: 6, mb: 4, color: 'oklch(20% 0.05 250)', letterSpacing: '-0.03em' }}>
              {t('booking.available_slots')}
            </Typography>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress size={48} sx={{ color: 'oklch(65% 0.15 160)' }} />
              </Box>
            ) : (availableSlots || []).length > 0 ? (
              <Grid container spacing={2}>
                {(availableSlots || []).map((slot, idx) => (
                  <Grid item xs={6} sm={4} md={3} lg={2} key={idx}>
                    <Box
                      onClick={() => { if(slot.available) { setSelectedSlot(slot); setError(''); } }}
                      sx={{ 
                        py: 2.5,
                        textAlign: 'center',
                        borderRadius: 4,
                        cursor: slot.available ? 'pointer' : 'not-allowed',
                        border: '2px solid',
                        borderColor: selectedSlot === slot ? 'oklch(65% 0.15 160)' : 'oklch(92% 0.02 250)',
                        bgcolor: selectedSlot === slot ? 'oklch(65% 0.15 160)' : 'transparent',
                        color: selectedSlot === slot ? 'white' : (slot.available ? 'oklch(20% 0.05 250)' : 'oklch(85% 0.02 250)'),
                        fontWeight: 900,
                        fontSize: '1.1rem',
                        transition: 'all 0.2s',
                        '&:hover': slot.available ? { borderColor: 'oklch(65% 0.15 160)', bgcolor: selectedSlot === slot ? 'oklch(65% 0.15 160)' : 'oklch(98% 0.01 160)' } : {}
                      }}
                    >
                      {slot.startTime.substring(0, 5)}
                    </Box>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Box sx={{ py: 8, textAlign: 'center', bgcolor: 'oklch(98% 0.01 250)', borderRadius: 6 }}>
                <Clock size={48} color="oklch(80% 0.02 250)" style={{ marginBottom: 16 }} />
                <Typography variant="h6" sx={{ color: 'oklch(60% 0.02 250)', fontWeight: 800 }}>
                  {t('booking.no_slots')}
                </Typography>
              </Box>
            )}
          </Box>
        );

      case 2:
        return (
          <Box sx={{ mt: 2 }}>
            <Box sx={{ 
              p: 6, 
              borderRadius: 8, 
              bgcolor: 'oklch(98% 0.01 250)', 
              border: '1px solid oklch(92% 0.02 250)',
              mb: 6
            }}>
              <Grid container spacing={6}>
                <Grid item xs={12} md={6}>
                  <Typography variant="caption" sx={{ textTransform: 'uppercase', fontWeight: 900, color: 'oklch(60% 0.02 250)', letterSpacing: '0.1em' }}>
                    {t('booking.confirm_doctor')}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mt: 2.5 }}>
                    <Avatar src={selectedDoctor?.avatarUrl} sx={{ width: 72, height: 72, borderRadius: 4 }} />
                    <Box>
                      <Typography variant="h5" sx={{ fontWeight: 950, color: 'oklch(20% 0.05 250)', letterSpacing: '-0.02em' }}>
                        {selectedDoctor?.fullName}
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 700, color: 'oklch(65% 0.15 160)' }}>
                        {selectedDoctor?.specialization}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="caption" sx={{ textTransform: 'uppercase', fontWeight: 900, color: 'oklch(60% 0.02 250)', letterSpacing: '0.1em' }}>
                    {t('booking.confirm_time')}
                  </Typography>
                  <Stack spacing={2} sx={{ mt: 2.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: 'oklch(96% 0.01 160)', color: 'oklch(65% 0.15 160)' }}>
                        <CalendarDays size={24} />
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 800, color: 'oklch(20% 0.05 250)' }}>
                        {format(selectedDate, 'eeee, dd/MM/yyyy', { locale: dateLocale })}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: 'oklch(96% 0.01 160)', color: 'oklch(65% 0.15 160)' }}>
                        <Clock size={24} />
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 800, color: 'oklch(20% 0.05 250)' }}>
                        {selectedSlot?.startTime.substring(0, 5)} - {selectedSlot?.endTime.substring(0, 5)}
                      </Typography>
                    </Box>
                  </Stack>
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ p: 3, bgcolor: 'white', borderRadius: 4, border: '1px solid oklch(92% 0.02 250)' }}>
                    <Typography variant="caption" sx={{ textTransform: 'uppercase', fontWeight: 900, color: 'oklch(60% 0.02 250)', letterSpacing: '0.1em' }}>
                      {t('booking.confirm_patient')}
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 800, mt: 1, color: 'oklch(20% 0.05 250)' }}>
                      {user?.fullName} <span style={{ opacity: 0.5, margin: '0 8px' }}>•</span> {user?.phone}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>

            <Typography variant="h6" sx={{ fontWeight: 950, mb: 2, color: 'oklch(20% 0.05 250)', letterSpacing: '-0.02em' }}>
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
                '& .MuiOutlinedInput-root': { borderRadius: 5, bgcolor: 'white', p: 3, fontSize: '1.1rem' }
              }}
            />
          </Box>
        );

      case 3: // Success
        return (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Box sx={{ 
              width: 120, height: 120, borderRadius: '50%', 
              bgcolor: 'oklch(96% 0.01 160)', color: 'oklch(65% 0.15 160)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              mx: 'auto', mb: 4,
              boxShadow: '0 20px 40px oklch(65% 0.15 160 / 0.1)'
            }}>
              <CheckCircle2 size={64} strokeWidth={2.5} />
            </Box>
            <Typography variant="h3" sx={{ fontWeight: 950, mb: 2, color: 'oklch(20% 0.05 250)', letterSpacing: '-0.04em' }}>
              {t('booking.success_title')}
            </Typography>
            <Typography variant="h6" sx={{ color: 'oklch(50% 0.02 250)', mb: 8, maxWidth: 600, mx: 'auto', fontWeight: 500, lineHeight: 1.6 }}>
              {t('booking.success_desc')}
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} justifyContent="center">
              <Button 
                variant="contained" 
                onClick={() => navigate('/patient/appointments')}
                sx={{ 
                  borderRadius: 4, px: 6, py: 2, 
                  bgcolor: 'oklch(20% 0.05 250)', color: 'white',
                  fontWeight: 950, fontSize: '1.1rem',
                  '&:hover': { bgcolor: 'oklch(15% 0.05 250)' }
                }}
              >
                {t('booking.manage_btn')}
              </Button>
              <Button 
                variant="outlined" 
                onClick={() => navigate('/patient/dashboard')}
                sx={{ 
                  borderRadius: 4, px: 6, py: 2, 
                  color: 'oklch(20% 0.05 250)', borderColor: 'oklch(20% 0.05 250)',
                  borderWidth: 2, fontWeight: 950, fontSize: '1.1rem',
                  '&:hover': { borderWidth: 2, bgcolor: 'oklch(96% 0.01 250)' }
                }}
              >
                {t('booking.dashboard_btn')}
              </Button>
            </Stack>
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
      maxWidth={false}
      transparent={true}
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
      <Box sx={{ mt: -2 }}>
        <Paper
          elevation={0} 
          sx={{ 
            p: { xs: 4, md: 6 }, 
            borderRadius: 8, 
            border: '1px solid oklch(92% 0.02 250)',
            bgcolor: 'transparent',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {activeStep < 3 && (
            <Box sx={{ mb: 6 }}>
              <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                {steps.map((_, i) => (
                  <Box 
                    key={i} 
                    sx={{ 
                      flex: 1, 
                      height: 6, 
                      borderRadius: 1, 
                      bgcolor: i <= activeStep ? 'oklch(65% 0.15 160)' : 'oklch(92% 0.02 250)',
                      transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
                    }} 
                  />
                ))}
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="h4" sx={{ fontWeight: 950, color: 'oklch(20% 0.05 250)', letterSpacing: '-0.04em' }}>
                  {steps[activeStep]}
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, color: 'oklch(60% 0.02 250)', letterSpacing: '-0.02em' }}>
                  {activeStep + 1} / {steps.length}
                </Typography>
              </Stack>
            </Box>
          )}

          {error && (
            <Alert 
              severity="error" 
              onClose={() => setError('')} 
              sx={{ mb: 4, borderRadius: 4, bgcolor: 'oklch(98% 0.01 20)', color: 'oklch(40% 0.1 20)', fontWeight: 700 }}
              icon={<AlertCircle size={22} />}
            >
              {error}
            </Alert>
          )}

          {renderStepContent(activeStep)}

          {activeStep < 3 && (
            <Stack
              direction={{ xs: 'column-reverse', sm: 'row' }}
              spacing={3}
              sx={{ mt: 8 }}
              justifyContent="space-between"
            >
              <Button
                disabled={activeStep === 0 || loading}
                onClick={handleBack}
                startIcon={<ChevronLeft size={20} />}
                fullWidth={isMobile}
                sx={{ 
                  borderRadius: 4, 
                  px: 4, 
                  py: 1.5,
                  color: 'oklch(40% 0.02 250)', 
                  fontWeight: 900,
                  fontSize: '1rem',
                  '&:hover': { bgcolor: 'oklch(96% 0.01 250)' }
                }}
              >
                {t('booking.back')}
              </Button>

              <Button
                variant="contained"
                onClick={activeStep === steps.length - 1 ? handleBooking : handleNext}
                disabled={loading}
                fullWidth={isMobile}
                endIcon={loading ? <CircularProgress size={20} color="inherit" /> : <ChevronRight size={20} />}
                sx={{ 
                  borderRadius: 4, 
                  px: 6, 
                  py: 1.5, 
                  bgcolor: 'oklch(65% 0.15 160)', 
                  fontWeight: 950,
                  fontSize: '1rem',
                  boxShadow: '0 10px 30px oklch(65% 0.15 160 / 0.3)',
                  '&:hover': { bgcolor: 'oklch(60% 0.15 160)', transform: 'translateY(-2px)' },
                  transition: 'all 0.3s'
                }}
              >
                {activeStep === steps.length - 1 ? t('booking.confirm_booking') : t('booking.next')}
              </Button>
            </Stack>
          )}
        </Paper>
      </Box>
    </PatientPageShell>
  );
}
