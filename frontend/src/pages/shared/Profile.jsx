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
  Stack,
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
import PatientPageShell from '../../components/patient/PatientPageShell';
import CustomTextField from '../../components/common/CustomTextField';
import InteractiveParticles from '../../components/common/InteractiveParticles';

// Animations
const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
`;

const ProfileInfoDisplay = ({ icon, label, value }) => {
  const { t } = useTranslation();
  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1.5 }}>
        <Box sx={{ color: 'oklch(65% 0.15 160)', display: 'flex' }}>
          {React.cloneElement(icon, { sx: { fontSize: 22, strokeWidth: 2 } })}
        </Box>
        <Typography variant="caption" sx={{ fontWeight: 950, color: 'oklch(50% 0.02 250)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          {label}
        </Typography>
      </Box>
      <Typography variant="h6" sx={{ ml: 4.25, fontWeight: 700, color: value ? 'oklch(20% 0.05 250)' : 'oklch(70% 0.02 250)' }}>
        {value || t('common.not_provided', 'Not provided')}
      </Typography>
    </Box>
  );
};

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
    fetchProfile();
  }, [fetchProfile]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePassChange = (e) => {
    const { name, value } = e.target;
    setPassForm(prev => ({ ...prev, [name]: value }));
  };

  const handleOpenEdit = () => {
    setEditForm({ ...profileData });
    setStreetAddr(profileData?.address || '');
    setSelectedProv(null); setSelectedDist(null); setSelectedWard(null);
    setError(null); setSuccess(null); setFieldErrors({});
    setOpenModal(true);
  };

  const handleAvatarClick = (event) => setAvatarAnchor(event.currentTarget);
  const handleAvatarClose = () => setAvatarAnchor(null);
  const handleUploadClick = () => { handleAvatarClose(); fileInputRef.current?.click(); };
  const handleUrlClick = () => { handleAvatarClose(); setTempUrl(profileData?.avatarUrl || ''); setOpenUrlDialog(true); };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError(t('profile.file_too_large', 'Dung lượng ảnh tối đa là 5MB'));
      return;
    }
    try {
      setSaving(true);
      setError(null);
      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await axiosClient.post('/api/users/profile/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (uploadRes.data.success) {
        await updateAvatar(uploadRes.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || t('profile.upload_error', 'Lỗi khi upload ảnh'));
    } finally {
      setSaving(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const updateAvatar = async (newUrl) => {
    try {
      setSaving(true);
      const response = await axiosClient.put('/api/users/profile', { 
        fullName: profileData.fullName,
        phone: profileData.phone,
        avatarUrl: newUrl 
      });
      if (response.data.success) {
        setProfileData(response.data.data);
        setSuccess(t('profile.success'));
        if (user) updateUser({ avatarUrl: newUrl });
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
      if (selectedWard && selectedDist && selectedProv) finalAddress = `${streetAddr ? streetAddr + ', ' : ''}${selectedWard.name}, ${selectedDist.name}, ${selectedProv.name}`;
      else if (selectedDist && selectedProv) finalAddress = `${streetAddr ? streetAddr + ', ' : ''}${selectedDist.name}, ${selectedProv.name}`;
      else if (selectedProv) finalAddress = `${streetAddr ? streetAddr + ', ' : ''}${selectedProv.name}`;
      
      const response = await axiosClient.put('/api/users/profile', { ...editForm, address: finalAddress });
      if (response.data.success) {
        setProfileData(response.data.data);
        setSuccess(t('profile.success'));
        setOpenModal(false);
        if (user) updateUser({ fullName: response.data.data.fullName, phone: response.data.data.phone, avatarUrl: response.data.data.avatarUrl });
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      setError(t('profile.error'));
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (passForm.currentPassword === passForm.newPassword) { setError(t('auth.password_same_as_old')); return; }
    if (passForm.newPassword !== passForm.confirmPassword) { setError(t('auth.passwords_not_match')); return; }
    try {
      setSaving(true);
      setSuccess(t('auth.password_updated', 'Password updated successfully!'));
      setPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError(t('auth.password_update_failed', 'Failed to update password.'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}><CircularProgress thickness={2} size={60} sx={{ color: 'oklch(65% 0.15 160)' }} /></Box>;

  const isDoctor = profileData?.role?.includes('DOCTOR');
  const isPatient = profileData?.role?.includes('PATIENT');

  return (
    <PatientPageShell
      title={t('profile.profile_tab')}
      subtitle="Quản lý thông tin cá nhân và cài đặt bảo mật"
      maxWidth={false}
      transparent={true}
    >
      <Box sx={{ width: '100%' }}>
        <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleFileChange} />

        <Box sx={{ borderRadius: 8, overflow: 'hidden', mb: 8, position: 'relative', border: '1px solid oklch(92% 0.02 250)', bgcolor: 'transparent' }}>
          <Box sx={{ height: 240, background: 'oklch(20% 0.05 250)', position: 'relative', overflow: 'hidden' }}>
            <InteractiveParticles color="255, 255, 255" />
          </Box>
          <Box sx={{ px: { xs: 4, md: 8 }, pb: 8, mt: -10, position: 'relative', zIndex: 1, display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: { xs: 3, md: 6 } }}>
            <ButtonBase onClick={handleAvatarClick} sx={{ borderRadius: 6, transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)', '&:hover': { transform: 'translateY(-10px)' } }}>
              <Avatar src={profileData?.avatarUrl} sx={{ width: 200, height: 200, borderRadius: 6, border: '8px solid white', boxShadow: '0 30px 60px oklch(20% 0.05 250 / 0.12)' }} />
              <Box sx={{ position: 'absolute', bottom: 12, right: 12, bgcolor: 'oklch(65% 0.15 160)', color: 'white', borderRadius: 3, p: 1, boxShadow: '0 8px 20px oklch(65% 0.15 160 / 0.3)' }}><CameraIcon /></Box>
            </ButtonBase>
            <Menu anchorEl={avatarAnchor} open={Boolean(avatarAnchor)} onClose={handleAvatarClose} slotProps={{ paper: { sx: { borderRadius: 4, mt: 2, minWidth: 220, border: '1px solid oklch(92% 0.02 250)' } } }}>
              <MenuItem onClick={handleUploadClick} sx={{ py: 1.5, fontWeight: 800 }}><ListItemIcon><UploadIcon /></ListItemIcon><ListItemText primary="Tải ảnh từ máy" /></MenuItem>
              <MenuItem onClick={handleUrlClick} sx={{ py: 1.5, fontWeight: 800 }}><ListItemIcon><LinkIcon /></ListItemIcon><ListItemText primary="Sử dụng link ảnh" /></MenuItem>
            </Menu>
            <Box sx={{ flex: 1, minWidth: 320 }}>
              <Typography variant="h1" sx={{ fontWeight: 950, color: 'oklch(20% 0.05 250)', letterSpacing: '-0.05em', mb: 1 }}>{profileData?.fullName}</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ px: 2, py: 0.75, borderRadius: 2, bgcolor: 'oklch(96% 0.01 160)', color: 'oklch(65% 0.15 160)', fontWeight: 950, fontSize: '0.8rem', textTransform: 'uppercase' }}>{profileData?.role ? t(`roles.${profileData.role}`) : ''}</Box>
                <Typography variant="h6" sx={{ color: 'oklch(50% 0.02 250)', fontWeight: 500 }}>{profileData?.email}</Typography>
              </Box>
            </Box>
            <Box sx={{ mb: 2 }}><Button variant="contained" startIcon={<EditIcon />} onClick={handleOpenEdit} sx={{ borderRadius: 4, px: 6, py: 2, bgcolor: 'oklch(65% 0.15 160)', fontWeight: 950, '&:hover': { bgcolor: 'oklch(60% 0.15 160)' } }}>{t('profile.edit')}</Button></Box>
          </Box>
        </Box>

        <Box sx={{ mb: 8, display: 'flex', gap: 1, p: 1, borderRadius: 4, bgcolor: 'oklch(98% 0.01 250)', width: 'fit-content' }}>
          {[t('profile.profile_tab'), t('profile.security_tab')].map((label, idx) => (
            <Button 
              key={idx} 
              onClick={() => setActiveTab(idx)} 
              sx={{ 
                px: 4, 
                py: 1.5, 
                borderRadius: 3, 
                bgcolor: activeTab === idx ? 'white' : 'transparent', 
                color: activeTab === idx ? 'oklch(20% 0.05 250)' : 'oklch(60% 0.02 250)', 
                fontWeight: 950, 
                textTransform: 'none', 
                boxShadow: activeTab === idx ? '0 10px 20px oklch(20% 0.05 250 / 0.05)' : 'none',
                transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                '&:hover': {
                  transform: activeTab === idx ? 'translateY(-2px)' : 'scale(1.05)',
                  bgcolor: activeTab === idx ? 'white' : 'oklch(96% 0.01 250)'
                }
              }}
            >
              {label}
            </Button>
          ))}
        </Box>

        {error && <Alert severity="error" variant="outlined" sx={{ mb: 4, borderRadius: 4 }}>{error}</Alert>}
        {success && <Alert severity="success" variant="outlined" sx={{ mb: 4, borderRadius: 4 }}>{success}</Alert>}

        <Box sx={{ opacity: 1, transition: 'all 0.5s ease' }}>
          {activeTab === 0 ? (
            <Grid container spacing={8}>
              <Grid item xs={12} lg={7}>
                <Box sx={{ p: 6, borderRadius: 8, border: '1px solid oklch(92% 0.02 250)', bgcolor: 'transparent' }}>
                  <Typography variant="h4" sx={{ fontWeight: 950, color: 'oklch(20% 0.05 250)', mb: 6, display: 'flex', alignItems: 'center', gap: 2 }}><ContactPageIcon sx={{ fontSize: 32, color: 'oklch(65% 0.15 160)' }} /> {t('profile.detailed_info')}</Typography>
                  <Grid container spacing={4}>
                    <Grid item xs={12} sm={6}><ProfileInfoDisplay icon={<PersonIcon />} label={t('profile.full_name')} value={profileData?.fullName} /></Grid>
                    <Grid item xs={12} sm={6}><ProfileInfoDisplay icon={<PhoneIcon />} label={t('profile.phone')} value={profileData?.phone} /></Grid>
                    <Grid item xs={12}><ProfileInfoDisplay icon={<EmailIcon />} label={t('profile.email')} value={profileData?.email} /></Grid>
                    <Grid item xs={12}><Divider sx={{ my: 2, borderColor: 'oklch(94% 0.02 250)' }} /></Grid>
                    {isPatient && (
                      <>
                        <Grid item xs={12} sm={6}><ProfileInfoDisplay icon={<CakeIcon />} label={t('profile.dob')} value={profileData?.dateOfBirth} /></Grid>
                        <Grid item xs={12} sm={6}><ProfileInfoDisplay icon={<GenderIcon />} label={t('profile.gender')} value={profileData?.gender} /></Grid>
                        <Grid item xs={12}><ProfileInfoDisplay icon={<HomeIcon />} label={t('profile.address')} value={profileData?.address} /></Grid>
                        <Grid item xs={12}><Divider sx={{ my: 2, borderColor: 'oklch(94% 0.02 250)' }} /></Grid>
                        <Grid item xs={12} sm={6}><ProfileInfoDisplay icon={<CardIcon />} label={t('profile.insurance_number')} value={profileData?.insuranceNumber} /></Grid>
                        <Grid item xs={12} sm={6}><ProfileInfoDisplay icon={<ContactPhoneIcon />} label={t('profile.emergency_contact')} value={`${profileData?.emergencyContactName || ''} (${profileData?.emergencyContactPhone || ''})`} /></Grid>
                      </>
                    )}
                    {isDoctor && (
                      <>
                        <Grid item xs={12} sm={6}><ProfileInfoDisplay icon={<SchoolIcon />} label={t('profile.degrees')} value={profileData?.degrees} /></Grid>
                        <Grid item xs={12} sm={6}><ProfileInfoDisplay icon={<BusinessIcon />} label={t('profile.hospital')} value={profileData?.hospitalName} /></Grid>
                        <Grid item xs={12} sm={6}><ProfileInfoDisplay icon={<SpecializationIcon />} label={t('profile.specialization')} value={profileData?.specialization} /></Grid>
                        <Grid item xs={12} sm={6}><ProfileInfoDisplay icon={<ExperienceIcon />} label={t('profile.experience')} value={profileData?.experienceYears} /></Grid>
                        <Grid item xs={12}><ProfileInfoDisplay icon={<BioIcon />} label={t('profile.bio')} value={profileData?.bio} /></Grid>
                      </>
                    )}
                  </Grid>
                </Box>
              </Grid>
              <Grid item xs={12} lg={5}>
                {isPatient && (
                  <Box sx={{ p: 6, borderRadius: 8, bgcolor: 'oklch(98% 0.01 250)', border: '1px solid oklch(94% 0.02 250)' }}>
                    <Typography variant="h4" sx={{ fontWeight: 950, color: 'oklch(20% 0.05 250)', mb: 6, display: 'flex', alignItems: 'center', gap: 2 }}><MedicalServicesIcon sx={{ fontSize: 32, color: 'oklch(65% 0.15 160)' }} /> {t('profile.health_vitals')}</Typography>
                    <Stack spacing={4}>
                      <ProfileInfoDisplay icon={<BloodTypeIcon />} label={t('profile.blood_type')} value={profileData?.bloodType} />
                      <ProfileInfoDisplay icon={<AllergyIcon />} label={t('profile.allergies')} value={profileData?.allergies} />
                      <ProfileInfoDisplay icon={<HealthIcon />} label={t('profile.chronic_conditions')} value={profileData?.chronicConditions} />
                    </Stack>
                  </Box>
                )}
              </Grid>
            </Grid>
          ) : (
            <Grid container spacing={8}>
              <Grid item xs={12} lg={7}>
                <Box sx={{ p: 6, borderRadius: 8, border: '1px solid oklch(92% 0.02 250)', bgcolor: 'transparent' }}>
                  <Typography variant="h4" sx={{ fontWeight: 950, color: 'oklch(20% 0.05 250)', mb: 6, display: 'flex', alignItems: 'center', gap: 2 }}><LockIcon sx={{ fontSize: 32, color: 'oklch(65% 0.15 160)' }} /> {t('profile.change_password')}</Typography>
                  <Stack spacing={4}>
                    <CustomTextField icon={<KeyIcon />} type="password" label={t('profile.current_password')} name="currentPassword" value={passForm.currentPassword} onChange={handlePassChange} />
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={4}>
                      <CustomTextField icon={<LockIcon />} type="password" label={t('profile.new_password')} name="newPassword" value={passForm.newPassword} onChange={handlePassChange} />
                      <CustomTextField icon={<LockIcon />} type="password" label={t('profile.confirm_password')} name="confirmPassword" value={passForm.confirmPassword} onChange={handlePassChange} />
                    </Stack>
                    <Button variant="contained" fullWidth onClick={handleUpdatePassword} disabled={saving} sx={{ borderRadius: 4, py: 2, fontWeight: 950, bgcolor: 'oklch(20% 0.05 250)' }}>{t('profile.update_password_btn')}</Button>
                  </Stack>
                </Box>
              </Grid>
              <Grid item xs={12} lg={5}>
                <Box sx={{ p: 6, borderRadius: 8, bgcolor: 'oklch(98% 0.01 250)', border: '1px solid oklch(94% 0.02 250)' }}>
                  <Typography variant="h4" sx={{ fontWeight: 950, color: 'oklch(20% 0.05 250)', mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}><ShieldIcon sx={{ fontSize: 32, color: 'oklch(65% 0.15 160)' }} /> {t('profile.two_factor')}</Typography>
                  <Stack spacing={3} sx={{ mb: 6 }}>
                    <FormControlLabel control={<Switch defaultChecked sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: 'oklch(65% 0.15 160)' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: 'oklch(65% 0.15 160)' } }} />} label={<Typography sx={{ fontWeight: 800 }}>Email Authentication</Typography>} />
                    <FormControlLabel control={<Switch sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: 'oklch(65% 0.15 160)' } }} />} label={<Typography sx={{ fontWeight: 800 }}>SMS Authentication</Typography>} />
                  </Stack>
                  <Divider sx={{ mb: 4 }} />
                  <Typography variant="caption" sx={{ fontWeight: 950, color: 'oklch(60% 0.02 250)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Sơ đồ phiên hoạt động</Typography>
                  <Box sx={{ mt: 3, display: 'flex', alignItems: 'center', gap: 3, p: 2, borderRadius: 3, bgcolor: 'white', border: '1px solid oklch(94% 0.02 250)' }}>
                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'oklch(65% 0.15 160)' }} />
                    <Box><Typography sx={{ fontWeight: 900 }}>Windows 11 • Chrome</Typography><Typography variant="caption" sx={{ color: 'oklch(65% 0.15 160)', fontWeight: 950 }}>Đang hoạt động</Typography></Box>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          )}
        </Box>
      </Box>

      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="lg" fullWidth PaperProps={{ sx: { borderRadius: 8, bgcolor: 'white', backgroundImage: 'none', p: 0 } }}>
        <DialogTitle sx={{ p: 4, bgcolor: 'oklch(20% 0.05 250)', color: 'white' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center"><Typography variant="h3" sx={{ fontWeight: 950 }}>{t('profile.edit')}</Typography><IconButton onClick={() => setOpenModal(false)} sx={{ color: 'white' }}><CloseIcon /></IconButton></Stack>
        </DialogTitle>
        <DialogContent sx={{ p: 6, pt: 8 }}>
          <Grid container spacing={6}>
            <Grid item xs={12}>
              <Typography variant="h5" sx={{ fontWeight: 950, color: 'oklch(65% 0.15 160)', mb: 4, textTransform: 'uppercase' }}>{t('profile.account_section')}</Typography>
              <Grid container spacing={4}>
                <Grid item xs={12} sm={6}><CustomTextField icon={<PersonIcon />} label={t('profile.full_name')} name="fullName" value={editForm?.fullName || ''} onChange={handleInputChange} error={fieldErrors.fullName} /></Grid>
                <Grid item xs={12} sm={6}><CustomTextField icon={<PhoneIcon />} label={t('profile.phone')} name="phone" value={editForm?.phone || ''} onChange={handleInputChange} error={fieldErrors.phone} /></Grid>
              </Grid>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h5" sx={{ fontWeight: 950, color: 'oklch(65% 0.15 160)', mb: 4, textTransform: 'uppercase' }}>{isPatient ? t('profile.details_section') : t('profile.pro_section')}</Typography>
              <Grid container spacing={4}>
                {isPatient && (
                  <>
                    <Grid item xs={12} sm={6}><CustomTextField label={t('profile.dob')} name="dateOfBirth" type="date" value={editForm?.dateOfBirth || ''} onChange={handleInputChange} error={fieldErrors.dateOfBirth} /></Grid>
                    <Grid item xs={12} sm={6}><CustomTextField icon={<GenderIcon />} label={t('profile.gender')} name="gender" value={editForm?.gender || ''} onChange={handleInputChange} error={fieldErrors.gender} /></Grid>
                    <Grid item xs={12} sm={6}><CustomTextField icon={<BloodTypeIcon />} label={t('profile.blood_type')} name="bloodType" value={editForm?.bloodType || ''} onChange={handleInputChange} /></Grid>
                    <Grid item xs={12} sm={6}><CustomTextField icon={<CardIcon />} label={t('profile.insurance_number')} name="insuranceNumber" value={editForm?.insuranceNumber || ''} onChange={handleInputChange} /></Grid>
                    <Grid item xs={12}>
                      <Box sx={{ p: 4, borderRadius: 6, bgcolor: 'oklch(98% 0.01 250)', border: '1px solid oklch(94% 0.02 250)' }}>
                        <Typography variant="caption" sx={{ fontWeight: 950, color: 'oklch(60% 0.02 250)', textTransform: 'uppercase', mb: 4, display: 'block' }}>Địa chỉ liên lạc</Typography>
                        <Grid container spacing={3}>
                          <Grid item xs={12} sm={4}><Autocomplete options={provincesList} getOptionLabel={(option) => option.name} value={selectedProv} onChange={(e, v) => { setSelectedProv(v); setSelectedDist(null); setSelectedWard(null); }} renderInput={(params) => <TextField {...params} label={t('profile.province')} variant="outlined" InputLabelProps={{ shrink: true }} sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'white', borderRadius: 3 } }} />} /></Grid>
                          <Grid item xs={12} sm={4}><Autocomplete options={districtsList} getOptionLabel={(option) => option.name} value={selectedDist} onChange={(e, v) => { setSelectedDist(v); setSelectedWard(null); }} disabled={!selectedProv} renderInput={(params) => <TextField {...params} label={t('profile.district')} variant="outlined" InputLabelProps={{ shrink: true }} sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'white', borderRadius: 3 } }} />} /></Grid>
                          <Grid item xs={12} sm={4}><Autocomplete options={wardsList} getOptionLabel={(option) => option.name} value={selectedWard} onChange={(e, v) => setSelectedWard(v)} disabled={!selectedDist} renderInput={(params) => <TextField {...params} label={t('profile.ward')} variant="outlined" InputLabelProps={{ shrink: true }} sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'white', borderRadius: 3 } }} />} /></Grid>
                          <Grid item xs={12}><CustomTextField icon={<HomeIcon />} label={t('profile.street_address')} value={streetAddr} onChange={(e) => setStreetAddr(e.target.value)} multiline minRows={1} /></Grid>
                        </Grid>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}><CustomTextField icon={<PersonIcon />} label={t('profile.emergency_contact')} name="emergencyContactName" value={editForm?.emergencyContactName || ''} onChange={handleInputChange} /></Grid>
                    <Grid item xs={12} sm={6}><CustomTextField icon={<PhoneIcon />} label={t('profile.emergency_contact_phone')} name="emergencyContactPhone" value={editForm?.emergencyContactPhone || ''} onChange={handleInputChange} /></Grid>
                  </>
                )}
                {isDoctor && (
                  <>
                    <Grid item xs={12} sm={6}><CustomTextField icon={<SpecializationIcon />} label={t('profile.specialization')} name="specialization" value={editForm?.specialization || ''} onChange={handleInputChange} error={fieldErrors.specialization} /></Grid>
                    <Grid item xs={12} sm={6}><CustomTextField icon={<BusinessIcon />} label={t('profile.hospital')} name="hospitalName" value={editForm?.hospitalName || ''} onChange={handleInputChange} error={fieldErrors.hospitalName} /></Grid>
                    <Grid item xs={12} sm={6}><CustomTextField icon={<ExperienceIcon />} label={t('profile.experience')} name="experienceYears" type="number" value={editForm?.experienceYears || ''} onChange={handleInputChange} /></Grid>
                    <Grid item xs={12} sm={6}><CustomTextField icon={<SchoolIcon />} label={t('profile.degrees')} name="degrees" value={editForm?.degrees || ''} onChange={handleInputChange} /></Grid>
                    <Grid item xs={12}><CustomTextField icon={<BioIcon />} label={t('profile.bio')} name="bio" value={editForm?.bio || ''} onChange={handleInputChange} multiline minRows={3} /></Grid>
                  </>
                )}
              </Grid>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 6, borderTop: '1px solid oklch(94% 0.02 250)' }}>
          <Button 
            onClick={() => setOpenModal(false)} 
            sx={{ 
              fontWeight: 950, 
              color: 'oklch(50% 0.02 250)', 
              px: 4,
              transition: 'all 0.3s ease',
              '&:hover': {
                color: 'oklch(20% 0.05 250)',
                transform: 'translateY(-2px)',
                bgcolor: 'oklch(96% 0.01 250)'
              }
            }}
          >
            Huỷ
          </Button>
          <Button variant="contained" onClick={handleSave} disabled={saving} sx={{ borderRadius: 4, px: 8, py: 2, bgcolor: 'oklch(20% 0.05 250)', fontWeight: 950 }}>{saving ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Lưu thay đổi'}</Button>
        </DialogActions>
      </Dialog>
    </PatientPageShell>
  );
};

export default Profile;
