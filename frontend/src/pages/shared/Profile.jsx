import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';


import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Avatar,
  Divider,
  CircularProgress,
  Alert,
  IconButton,
  Fade,
  Grow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Zoom,
  InputAdornment,
  ButtonBase,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tabs,
  Tab,
  Switch,
  FormControlLabel,
  Autocomplete,
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Person as PersonIcon,
  Cake as CakeIcon,
  Wc as GenderIcon,
  Home as HomeIcon,
  Bloodtype as BloodTypeIcon,
  Warning as AllergyIcon,
  HistoryEdu as BioIcon,
  WorkspacePremium as SpecializationIcon,
  Timeline as ExperienceIcon,
  CameraAlt as CameraIcon,
  MedicalServices as MedicalServicesIcon,
  Close as CloseIcon,
  ContactPage as ContactPageIcon,
  HealthAndSafety as HealthIcon,
  Upload as UploadIcon,
  Link as LinkIcon,
  Lock as LockIcon,
  Shield as ShieldIcon,
  VpnKey as KeyIcon,
  CreditCard as CardIcon,
  ContactPhone as ContactPhoneIcon,
  Business as BusinessIcon,
  School as SchoolIcon,
} from '@mui/icons-material';
import { keyframes } from '@emotion/react';
import { useTranslation } from 'react-i18next';
import axiosClient from '../../api/axiosClient';
import useAuthStore from '../../store/authStore';

// Animations
const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
`;

// Interactive Particle Visualizer
function InteractiveParticles({ mode = 'neural', color = '16, 185, 129' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const parent = canvas.parentElement;
    let width = (canvas.width = parent.clientWidth);
    let height = (canvas.height = parent.clientHeight);

    const handleResize = () => {
      width = (canvas.width = parent.clientWidth);
      height = (canvas.height = parent.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    const mouse = { x: null, y: null };
    const handleMouseMove = (e) => {
      const rect = parent.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };
    const handleMouseLeave = () => {
      mouse.x = null;
      mouse.y = null;
    };
    parent.addEventListener('mousemove', handleMouseMove);
    parent.addEventListener('mouseleave', handleMouseLeave);

    const particles = [];
    const particleCount = 40;
    const connectionDistance = 100;

    class Particle {
      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.3;
        this.vy = (Math.random() - 0.5) * 0.3;
        this.radius = Math.random() * 1.5 + 1;
      }

      update() {
        if (mouse.x !== null && mouse.y !== null) {
          const dx = mouse.x - this.x;
          const dy = mouse.y - this.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            this.x += (dx / dist) * 0.2;
            this.y += (dy / dist) * 0.2;
          }
        }

        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${color}, 0.2)`;
        ctx.fill();
      }
    }

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        p1.update();
        p1.draw();

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < connectionDistance) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(${color}, ${0.1 * (1 - dist / connectionDistance)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      parent.removeEventListener('mousemove', handleMouseMove);
      parent.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, [mode, color]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
        zIndex: 0, pointerEvents: 'none',
      }}
    />
  );
}

const ProfileInfoDisplay = ({ icon, label, value }) => {
  const { t } = useTranslation();
  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5, gap: 1 }}>
        <Box sx={{ color: 'primary.main', display: 'flex' }}>{icon}</Box>
        <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {label}
        </Typography>
      </Box>
      <Typography variant="body1" sx={{ ml: 4, fontWeight: 500, color: value ? 'text.primary' : 'text.disabled' }}>
        {value || t('common.not_provided', 'Not provided')}
      </Typography>
    </Box>
  );
};

const CustomTextField = ({ icon, label, error, helperText, ...props }) => (
  <TextField
    fullWidth
    label={label}
    variant="outlined"
    error={!!error}
    helperText={error || helperText}
    slotProps={{
      inputLabel: { shrink: true },
      input: {
        startAdornment: icon ? (
          <InputAdornment position="start" sx={{ mt: props.multiline ? '2px' : 0, alignSelf: props.multiline ? 'flex-start' : 'center' }}>
            <Box sx={{ color: 'primary.main', display: 'flex', mr: 0.5, mt: props.multiline ? 1.2 : 0 }}>
              {React.cloneElement(icon, { sx: { fontSize: 20 } })}
            </Box>
          </InputAdornment>
        ) : null,
        sx: {
          borderRadius: 3,
          backgroundColor: 'rgba(255, 255, 255, 0.6)',
          backdropFilter: 'blur(4px)',
          '& .MuiOutlinedInput-input': {
            py: props.multiline ? 1.5 : 1.2,
          },
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
          },
          '&.Mui-focused': {
            backgroundColor: '#fff',
          }
        }
      }
    }}
    sx={{ 
      mb: 1.5,
      '& .MuiOutlinedInput-notchedOutline': {
        borderColor: 'rgba(16, 185, 129, 0.2)',
        borderRadius: 3,
      },
      '&:hover .MuiOutlinedInput-notchedOutline': {
        borderColor: 'primary.main',
      },
      '& .MuiInputLabel-root': {
        color: 'text.secondary',
        transform: 'translate(14px, -9px) scale(0.75)',
        background: 'transparent',
        padding: '0 4px',
      }
    }}
    {...props}
  />
);

const Profile = () => {
  const { t } = useTranslation();
  const { user, updateUser } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [openUrlDialog, setOpenUrlDialog] = useState(false);
  const [tempUrl, setTempUrl] = useState('');
  const [profileData, setProfileData] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [avatarAnchor, setAvatarAnchor] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const fileInputRef = useRef(null);
  const [provincesList, setProvincesList] = useState([]);
  const [selectedProv, setSelectedProv] = useState(null);
  const [selectedDist, setSelectedDist] = useState(null);
  const [selectedWard, setSelectedWard] = useState(null);
  const [streetAddr, setStreetAddr] = useState('');

  const districtsList = useMemo(() => selectedProv?.districts || [], [selectedProv]);
  const wardsList = useMemo(() => selectedDist?.wards || [], [selectedDist]);

  useEffect(() => {
    fetch('https://provinces.open-api.vn/api/?depth=3')
      .then(res => res.json())
      .then(data => setProvincesList(data || []))
      .catch(e => console.error('Failed to load provinces from API:', e));
  }, []);

  // Password state
  const [passForm, setPassForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });


  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axiosClient.get('/api/users/profile');
      if (response.data.success) {
        setProfileData(response.data.data);
        setEditForm(response.data.data);
      }
    } catch (err) {
      setError(t('profile.error'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial profile bootstrap on mount
    fetchProfile();
  }, [fetchProfile]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePassChange = (e) => {
    const { name, value } = e.target;
    setPassForm(prev => ({ ...prev, [name]: value }));
  };

  const handleOpenEdit = () => {
    setEditForm({ ...profileData });
    setStreetAddr(profileData?.address || '');
    setSelectedProv(null);
    setSelectedDist(null);
    setSelectedWard(null);
    setError(null);
    setSuccess(null);
    setFieldErrors({});
    setOpenModal(true);
  };

  const handleAvatarClick = (event) => {
    setAvatarAnchor(event.currentTarget);
  };

  const handleAvatarClose = () => {
    setAvatarAnchor(null);
  };

  const handleUploadClick = () => {
    handleAvatarClose();
    fileInputRef.current?.click();
  };

  const handleUrlClick = () => {
    handleAvatarClose();
    setTempUrl(profileData?.avatarUrl || '');
    setOpenUrlDialog(true);
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target.result;
      updateAvatar(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const updateAvatar = async (newUrl) => {
    try {
      setSaving(true);
      const updateRequest = { 
        fullName: profileData.fullName,
        phone: profileData.phone,
        avatarUrl: newUrl 
      };
      const response = await axiosClient.put('/api/users/profile', updateRequest);
      if (response.data.success) {
        setProfileData(response.data.data);
        setSuccess(t('profile.success'));
        if (user) {
          updateUser({ avatarUrl: newUrl });
        }
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch {
      setError(t('profile.error'));
    } finally {
      setSaving(false);
      setOpenUrlDialog(false);
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!editForm.fullName?.trim()) errors.fullName = t('validation.required');
    if (!editForm.phone?.trim()) errors.phone = t('validation.required');
    else if (!/^\d{8,15}$/.test(editForm.phone.trim())) errors.phone = t('validation.invalid_phone');
    
    if (isPatient) {
      if (!editForm.dateOfBirth) errors.dateOfBirth = t('validation.required');
      if (!editForm.gender) errors.gender = t('validation.required');
    }
    
    if (isDoctor) {
      if (!editForm.specialization?.trim()) errors.specialization = t('validation.required');
      if (!editForm.hospitalName?.trim()) errors.hospitalName = t('validation.required');
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    try {
      setSaving(true);
      setError(null);
      
      let finalAddress = streetAddr;
      if (selectedWard && selectedDist && selectedProv) {
        finalAddress = `${streetAddr ? streetAddr + ', ' : ''}${selectedWard.name}, ${selectedDist.name}, ${selectedProv.name}`;
      } else if (selectedDist && selectedProv) {
        finalAddress = `${streetAddr ? streetAddr + ', ' : ''}${selectedDist.name}, ${selectedProv.name}`;
      } else if (selectedProv) {
        finalAddress = `${streetAddr ? streetAddr + ', ' : ''}${selectedProv.name}`;
      }
      
      const response = await axiosClient.put('/api/users/profile', {
        fullName: editForm.fullName,
        phone: editForm.phone,
        avatarUrl: editForm.avatarUrl,
        dateOfBirth: editForm.dateOfBirth,
        gender: editForm.gender,
        address: finalAddress,
        bloodType: editForm.bloodType,
        allergies: editForm.allergies,
        insuranceNumber: editForm.insuranceNumber,
        emergencyContactName: editForm.emergencyContactName,
        emergencyContactPhone: editForm.emergencyContactPhone,
        chronicConditions: editForm.chronicConditions,
        bio: editForm.bio,
        specialization: editForm.specialization,
        experienceYears: editForm.experienceYears,
        degrees: editForm.degrees,
        hospitalName: editForm.hospitalName
      });
      
      if (response.data.success) {
        setProfileData(response.data.data);
        setSuccess(t('profile.success'));
        setOpenModal(false);
        if (user) {
          updateUser({
            fullName: response.data.data.fullName,
            phone: response.data.data.phone,
            avatarUrl: response.data.data.avatarUrl,
          });
        }
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      setError(t('profile.error'));
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (passForm.currentPassword === passForm.newPassword) {
      setError(t('auth.password_same_as_old'));
      return;
    }
    if (passForm.newPassword !== passForm.confirmPassword) {
      setError(t('auth.passwords_not_match'));
      return;
    }
    try {
      setSaving(true);
      // TODO: Implement /api/users/change-password on backend
      // const response = await axiosClient.post('/api/users/change-password', passForm);
      setSuccess(t('auth.password_updated', 'Password updated successfully!'));
      setPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError(t('auth.password_update_failed', 'Failed to update password.'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress thickness={5} size={60} sx={{ color: 'primary.main' }} />
      </Box>
    );
  }

  const isDoctor = profileData?.role?.includes('DOCTOR');
  const isPatient = profileData?.role?.includes('PATIENT');

  return (
    <Container maxWidth="lg" sx={{ py: 6, position: 'relative' }}>
      <Fade in timeout={800}>
        <Box>
          <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleFileChange} />

          {/* Hero Header Card */}
          <Paper
            elevation={0}
            sx={{
              p: 0,
              borderRadius: 6,
              overflow: 'hidden',
              mb: 4,
              position: 'relative',
              background: 'rgba(255, 255, 255, 0.4)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.5)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.05)',
            }}
          >
            <Box sx={{ height: 200, background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', position: 'relative', overflow: 'hidden' }}>
              <InteractiveParticles color="255, 255, 255" />
            </Box>

            <Box sx={{ px: 4, pb: 4, mt: -8, position: 'relative', zIndex: 1, display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 3 }}>
                <ButtonBase onClick={handleAvatarClick} sx={{ borderRadius: '50%', transition: 'transform 0.3s ease', '&:hover': { transform: 'scale(1.05)' } }}>
                  <Box sx={{ position: 'relative' }}>
                    <Avatar src={profileData?.avatarUrl} sx={{ width: 160, height: 160, border: '6px solid #fff', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', animation: `${float} 6s ease-in-out infinite` }} />
                    <Box sx={{ position: 'absolute', bottom: 10, right: 10, bgcolor: 'primary.main', color: '#fff', borderRadius: '50%', p: 0.5, display: 'flex', boxShadow: 2 }}>
                      <CameraIcon fontSize="small" />
                    </Box>
                  </Box>
                </ButtonBase>

              <Menu anchorEl={avatarAnchor} open={Boolean(avatarAnchor)} onClose={handleAvatarClose} TransitionComponent={Zoom} slotProps={{ paper: { sx: { borderRadius: 3, mt: 1, boxShadow: '0 10px 30px rgba(0,0,0,0.1)', minWidth: 180 } } }}>
                <MenuItem onClick={handleUploadClick}><ListItemIcon><UploadIcon fontSize="small" /></ListItemIcon><ListItemText primary="Tải ảnh từ máy" /></MenuItem>
                <MenuItem onClick={handleUrlClick}><ListItemIcon><LinkIcon fontSize="small" /></ListItemIcon><ListItemText primary="Sử dụng link ảnh" /></MenuItem>
              </Menu>

              <Box sx={{ flex: 1, minWidth: 200 }}>
                <Typography variant="h3" fontWeight={900} sx={{ color: '#064e3b', mb: 0.5 }}>{profileData?.fullName}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ px: 2, py: 0.5, borderRadius: 4, bgcolor: 'rgba(16, 185, 129, 0.1)', color: 'primary.main', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase' }}>{profileData?.role ? t(`roles.${profileData.role}`) : ''}</Box>
                </Box>
              </Box>

              <Box sx={{ mb: 1 }}>
                <Button variant="contained" startIcon={<EditIcon />} onClick={handleOpenEdit} sx={{ borderRadius: 3, px: 3, py: 1, textTransform: 'none', fontWeight: 700, boxShadow: '0 8px 20px rgba(16, 185, 129, 0.3)', '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 12px 25px rgba(16, 185, 129, 0.4)' }, transition: 'all 0.3s ease' }}>
                  {t('profile.edit')}
                </Button>
              </Box>
            </Box>
          </Paper>

          {/* Tab Navigation */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
            <Tabs 
              value={activeTab} 
              onChange={(e, v) => setActiveTab(v)} 
              textColor="primary" 
              indicatorColor="primary"
              sx={{
                '& .MuiTab-root': { fontWeight: 800, fontSize: '1rem', textTransform: 'none', px: 4 }
              }}
            >
              <Tab icon={<PersonIcon />} iconPosition="start" label={t('profile.profile_tab')} />
              <Tab icon={<ShieldIcon />} iconPosition="start" label={t('profile.security_tab')} />
            </Tabs>
          </Box>

          {error && <Grow in><Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>{error}</Alert></Grow>}
          {success && <Grow in><Alert severity="success" sx={{ mb: 3, borderRadius: 3 }}>{success}</Alert></Grow>}

          {/* TAB 0: Profile Information */}
          {activeTab === 0 && (
            <Grid container spacing={4}>
              <Grid size={{ xs: 12, md: 7 }}>
                <Paper elevation={0} sx={{ p: 4, borderRadius: 6, background: 'rgba(255, 255, 255, 0.4)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.5)', boxShadow: '0 20px 40px rgba(0,0,0,0.03)' }}>
                  <Typography variant="h6" fontWeight={800} color="primary.dark" sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <ContactPageIcon /> {t('profile.detailed_info')}
                  </Typography>

                  <Grid container spacing={1}>
                    <Grid size={{ xs: 12, sm: 6 }}><ProfileInfoDisplay icon={<PersonIcon />} label={t('profile.full_name')} value={profileData?.fullName} /></Grid>
                    <Grid size={{ xs: 12, sm: 6 }}><ProfileInfoDisplay icon={<PhoneIcon />} label={t('profile.phone')} value={profileData?.phone} /></Grid>
                    <Grid size={{ xs: 12 }}><ProfileInfoDisplay icon={<EmailIcon />} label={t('profile.email')} value={profileData?.email} /></Grid>
                    <Grid size={{ xs: 12 }}><Divider sx={{ my: 1, mb: 3, opacity: 0.5 }} /></Grid>

                    {isPatient && (
                      <>
                        <Grid size={{ xs: 12, sm: 6 }}><ProfileInfoDisplay icon={<CakeIcon />} label={t('profile.dob')} value={profileData?.dateOfBirth} /></Grid>
                        <Grid size={{ xs: 12, sm: 6 }}><ProfileInfoDisplay icon={<GenderIcon />} label={t('profile.gender')} value={profileData?.gender} /></Grid>
                        <Grid size={{ xs: 12 }}><ProfileInfoDisplay icon={<HomeIcon />} label={t('profile.address')} value={profileData?.address} /></Grid>
                        <Grid size={{ xs: 12 }}><Divider sx={{ my: 1, mb: 3, opacity: 0.5 }} /></Grid>
                        <Grid size={{ xs: 12, sm: 6 }}><ProfileInfoDisplay icon={<CardIcon />} label={t('profile.insurance_number')} value={profileData?.insuranceNumber} /></Grid>
                        <Grid size={{ xs: 12, sm: 6 }}><ProfileInfoDisplay icon={<ContactPhoneIcon />} label={t('profile.emergency_contact')} value={`${profileData?.emergencyContactName || ''} (${profileData?.emergencyContactPhone || ''})`} /></Grid>
                      </>
                    )}

                    {isDoctor && (
                      <>
                        <Grid size={{ xs: 12, sm: 6 }}><ProfileInfoDisplay icon={<SchoolIcon />} label={t('profile.degrees')} value={profileData?.degrees} /></Grid>
                        <Grid size={{ xs: 12, sm: 6 }}><ProfileInfoDisplay icon={<BusinessIcon />} label={t('profile.hospital')} value={profileData?.hospitalName} /></Grid>
                        <Grid size={{ xs: 12, sm: 6 }}><ProfileInfoDisplay icon={<SpecializationIcon />} label={t('profile.specialization')} value={profileData?.specialization} /></Grid>
                        <Grid size={{ xs: 12, sm: 6 }}><ProfileInfoDisplay icon={<ExperienceIcon />} label={t('profile.experience')} value={profileData?.experienceYears} /></Grid>
                        <Grid size={{ xs: 12 }}><ProfileInfoDisplay icon={<BioIcon />} label={t('profile.bio')} value={profileData?.bio} /></Grid>
                      </>
                    )}
                  </Grid>
                </Paper>
              </Grid>

              <Grid size={{ xs: 12, md: 5 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {isPatient && (
                    <Paper elevation={0} sx={{ p: 4, borderRadius: 6, background: 'rgba(255, 255, 255, 0.4)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.5)', boxShadow: '0 20px 40px rgba(0,0,0,0.03)' }}>
                      <Typography variant="h6" fontWeight={800} color="primary.dark" sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <MedicalServicesIcon /> {t('profile.health_vitals')}
                      </Typography>
                      <ProfileInfoDisplay icon={<BloodTypeIcon />} label={t('profile.blood_type')} value={profileData?.bloodType} />
                      <ProfileInfoDisplay icon={<AllergyIcon />} label={t('profile.allergies')} value={profileData?.allergies} />
                      <ProfileInfoDisplay icon={<HealthIcon />} label={t('profile.chronic_conditions')} value={profileData?.chronicConditions} />
                    </Paper>
                  )}

                </Box>
              </Grid>
            </Grid>
          )}

          {/* TAB 1: Security Settings */}
          {activeTab === 1 && (
            <Grid container spacing={4}>
              <Grid size={{ xs: 12, md: 7 }}>
                <Paper elevation={0} sx={{ p: 4, borderRadius: 6, background: 'rgba(255, 255, 255, 0.4)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.5)', boxShadow: '0 20px 40px rgba(0,0,0,0.03)' }}>
                  <Typography variant="h6" fontWeight={800} color="primary.dark" sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <LockIcon /> {t('profile.change_password')}
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12 }}>
                      <CustomTextField icon={<KeyIcon />} type="password" label={t('profile.current_password')} name="currentPassword" value={passForm.currentPassword} onChange={handlePassChange} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <CustomTextField icon={<LockIcon />} type="password" label={t('profile.new_password')} name="newPassword" value={passForm.newPassword} onChange={handlePassChange} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <CustomTextField icon={<LockIcon />} type="password" label={t('profile.confirm_password')} name="confirmPassword" value={passForm.confirmPassword} onChange={handlePassChange} />
                    </Grid>
                    <Grid size={{ xs: 12 }} sx={{ mt: 2 }}>
                      <Button variant="contained" fullWidth onClick={handleUpdatePassword} disabled={saving} sx={{ borderRadius: 4, py: 1.5, fontWeight: 800 }}>
                        {t('profile.update_password_btn')}
                      </Button>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              <Grid size={{ xs: 12, md: 5 }}>
                <Paper elevation={0} sx={{ p: 4, borderRadius: 6, background: 'rgba(255, 255, 255, 0.4)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.5)', boxShadow: '0 20px 40px rgba(0,0,0,0.03)' }}>
                  <Typography variant="h6" fontWeight={800} color="primary.dark" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ShieldIcon /> {t('profile.two_factor')}
                  </Typography>
                  <FormControlLabel control={<Switch defaultChecked color="primary" />} label="Email Authentication" sx={{ mb: 1, display: 'flex' }} />
                  <FormControlLabel control={<Switch color="primary" />} label="SMS Authentication" sx={{ display: 'flex' }} />
                  <Divider sx={{ my: 3 }} />
                  <Typography variant="caption" fontWeight={700} color="text.secondary">ACTIVE SESSIONS</Typography>
                  <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'success.main' }} />
                    <Typography variant="body2">Windows 11 • Chrome • <b>Active Now</b></Typography>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          )}
        </Box>
      </Fade>

      {/* Edit Profile Modal (EXPANDED WITH NEW FIELDS) */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="md" fullWidth TransitionComponent={Zoom} TransitionProps={{ timeout: 500 }} slotProps={{ paper: { sx: { borderRadius: 8, overflow: 'hidden', background: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.6)', boxShadow: '0 40px 80px rgba(0,0,0,0.15)' } } }}>
        <Box sx={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', p: 3, color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box display="flex" alignItems="center" gap={2}>
            <Typography variant="h5" fontWeight={900}>{t('profile.edit')}</Typography>
          </Box>
          <IconButton onClick={() => setOpenModal(false)} sx={{ color: '#fff' }}><CloseIcon /></IconButton>
        </Box>

        <DialogContent sx={{ p: 4 }}>
          {error && <Grow in><Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>{error}</Alert></Grow>}
          {success && <Grow in><Alert severity="success" sx={{ mb: 3, borderRadius: 3 }}>{success}</Alert></Grow>}
          <Grid container spacing={3}>
            <Grid size={12}>
              <Typography variant="subtitle2" color="primary.main" fontWeight={800} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}><ContactPageIcon fontSize="small" /> {t('profile.account_section')}</Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}><CustomTextField icon={<PersonIcon />} label={t('profile.full_name')} name="fullName" value={editForm?.fullName || ''} onChange={handleInputChange} error={fieldErrors.fullName} /></Grid>
                <Grid size={{ xs: 12, sm: 6 }}><CustomTextField icon={<PhoneIcon />} label={t('profile.phone')} name="phone" value={editForm?.phone || ''} onChange={handleInputChange} error={fieldErrors.phone} /></Grid>
              </Grid>
            </Grid>
            <Grid size={12}>
              <Typography variant="subtitle2" color="primary.main" fontWeight={800} sx={{ mb: 2, mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>{isPatient ? <HealthIcon fontSize="small" /> : <BioIcon fontSize="small" />} {isPatient ? t('profile.details_section') : t('profile.pro_section')}</Typography>
              <Grid container spacing={2}>
                {isPatient && (
                  <>
                    <Grid size={{ xs: 12, sm: 6 }}><CustomTextField label={t('profile.dob')} name="dateOfBirth" type="date" value={editForm?.dateOfBirth || ''} onChange={handleInputChange} error={fieldErrors.dateOfBirth} /></Grid>
                    <Grid size={{ xs: 12, sm: 6 }}><CustomTextField icon={<GenderIcon />} label={t('profile.gender')} name="gender" value={editForm?.gender || ''} onChange={handleInputChange} error={fieldErrors.gender} /></Grid>
                    <Grid size={{ xs: 12, sm: 6 }}><CustomTextField icon={<BloodTypeIcon />} label={t('profile.blood_type')} name="bloodType" value={editForm?.bloodType || ''} onChange={handleInputChange} /></Grid>
                    <Grid size={{ xs: 12, sm: 6 }}><CustomTextField icon={<CardIcon />} label={t('profile.insurance_number')} name="insuranceNumber" value={editForm?.insuranceNumber || ''} onChange={handleInputChange} /></Grid>
                    <Grid size={12}>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, ml: 1, mb: 1, display: 'block' }}>{t('profile.address')}</Typography>
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 4 }}>
                          <Autocomplete
                            options={provincesList}
                            getOptionLabel={(option) => option.name}
                            value={selectedProv}
                            onChange={(e, v) => {
                              setSelectedProv(v);
                              setSelectedDist(null);
                              setSelectedWard(null);
                            }}
                            renderInput={(params) => (
                              <TextField {...params} label={t('profile.province')} variant="outlined" InputLabelProps={{ shrink: true }} sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'rgba(255, 255, 255, 0.6)', borderRadius: 3, '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.9)' }, '&.Mui-focused': { bgcolor: '#fff' } } }} />
                            )}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                          <Autocomplete
                            options={districtsList}
                            getOptionLabel={(option) => option.name}
                            value={selectedDist}
                            onChange={(e, v) => {
                              setSelectedDist(v);
                              setSelectedWard(null);
                            }}
                            disabled={!selectedProv}
                            renderInput={(params) => (
                              <TextField {...params} label={t('profile.district')} variant="outlined" InputLabelProps={{ shrink: true }} sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'rgba(255, 255, 255, 0.6)', borderRadius: 3, '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.9)' }, '&.Mui-focused': { bgcolor: '#fff' } } }} />
                            )}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                          <Autocomplete
                            options={wardsList}
                            getOptionLabel={(option) => option.name}
                            value={selectedWard}
                            onChange={(e, v) => setSelectedWard(v)}
                            disabled={!selectedDist}
                            renderInput={(params) => (
                              <TextField {...params} label={t('profile.ward')} variant="outlined" InputLabelProps={{ shrink: true }} sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'rgba(255, 255, 255, 0.6)', borderRadius: 3, '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.9)' }, '&.Mui-focused': { bgcolor: '#fff' } } }} />
                            )}
                          />
                        </Grid>
                        <Grid size={12}>
                          <CustomTextField icon={<HomeIcon />} label={t('profile.street_address')} value={streetAddr} onChange={(e) => setStreetAddr(e.target.value)} multiline minRows={1} />
                        </Grid>
                      </Grid>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}><CustomTextField icon={<PersonIcon />} label={t('profile.emergency_contact')} name="emergencyContactName" value={editForm?.emergencyContactName || ''} onChange={handleInputChange} /></Grid>
                    <Grid size={{ xs: 12, sm: 6 }}><CustomTextField icon={<ContactPhoneIcon />} label={t('profile.emergency_phone')} name="emergencyContactPhone" value={editForm?.emergencyContactPhone || ''} onChange={handleInputChange} /></Grid>
                    <Grid size={12}><CustomTextField icon={<AllergyIcon />} label={t('profile.allergies')} name="allergies" value={editForm?.allergies || ''} onChange={handleInputChange} multiline minRows={1} /></Grid>
                    <Grid size={12}><CustomTextField icon={<HealthIcon />} label={t('profile.chronic_conditions')} name="chronicConditions" value={editForm?.chronicConditions || ''} onChange={handleInputChange} multiline minRows={1} /></Grid>
                  </>
                )}
                {isDoctor && (
                  <>
                    <Grid size={{ xs: 12, sm: 6 }}><CustomTextField icon={<SchoolIcon />} label={t('profile.degrees')} name="degrees" value={editForm?.degrees || ''} onChange={handleInputChange} /></Grid>
                    <Grid size={{ xs: 12, sm: 6 }}><CustomTextField icon={<BusinessIcon />} label={t('profile.hospital')} name="hospitalName" value={editForm?.hospitalName || ''} onChange={handleInputChange} error={fieldErrors.hospitalName} /></Grid>
                    <Grid size={{ xs: 12, sm: 8 }}><CustomTextField icon={<SpecializationIcon />} label={t('profile.specialization')} name="specialization" value={editForm?.specialization || ''} onChange={handleInputChange} error={fieldErrors.specialization} /></Grid>
                    <Grid size={{ xs: 12, sm: 4 }}><CustomTextField icon={<ExperienceIcon />} label={t('profile.experience')} name="experienceYears" type="number" value={editForm?.experienceYears || ''} onChange={handleInputChange} /></Grid>
                    <Grid size={12}><CustomTextField icon={<BioIcon />} label={t('profile.bio')} name="bio" value={editForm?.bio || ''} onChange={handleInputChange} multiline minRows={2} /></Grid>
                  </>
                )}
              </Grid>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 4, pt: 2, background: 'rgba(0,0,0,0.02)' }}>
          <Button onClick={() => setOpenModal(false)} sx={{ fontWeight: 800, textTransform: 'none', px: 4 }}>{t('profile.cancel')}</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving} startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />} sx={{ borderRadius: 4, px: 6, py: 1.5, fontWeight: 900, textTransform: 'none', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', boxShadow: '0 10px 25px rgba(16, 185, 129, 0.4)' }}>
            {saving ? t('common.saving', 'Saving...') : t('profile.save')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* URL Dialog */}
      <Dialog open={openUrlDialog} onClose={() => setOpenUrlDialog(false)} slotProps={{ paper: { sx: { borderRadius: 4, p: 2, minWidth: 400 } } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Sử dụng link ảnh</DialogTitle>
        <DialogContent><TextField fullWidth autoFocus label="Dán URL ảnh vào đây" value={tempUrl} onChange={(e) => setTempUrl(e.target.value)} sx={{ mt: 2, '& .MuiOutlinedInput-root': { borderRadius: 3 } }} /></DialogContent>
        <DialogActions><Button onClick={() => setOpenUrlDialog(false)}>Hủy</Button><Button variant="contained" onClick={() => updateAvatar(tempUrl)} sx={{ borderRadius: 3, px: 4 }}>Áp dụng</Button></DialogActions>
      </Dialog>
    </Container>
  );
};

export default Profile;
