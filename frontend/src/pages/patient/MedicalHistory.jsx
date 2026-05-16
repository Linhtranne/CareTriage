import { useState, useEffect, useMemo } from 'react';
import { 
  Box, Typography, Grid, TextField, 
  MenuItem,
  Chip, Avatar,
  Button,
  Stack,
  useTheme, useMediaQuery
} from '@mui/material';
import {
  Search, Filter, Calendar,
  Stethoscope, User, FileText,
  ChevronRight
} from 'lucide-react';
import { format, isValid } from 'date-fns';
import { vi, enUS } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import medicalRecordApi from '../../api/medicalRecordApi';
import LoadingScreen from '../../components/common/LoadingScreen';
import PatientPageShell from '../../components/patient/PatientPageShell';

// Styled Components / Constants
const CATEGORY_COLORS = {
  EXAM: '#08bba3',
  LAB: '#3b82f6',
  MEDICATION: '#f59e0b',
  EMERGENCY: '#ef4444'
};

const MedicalHistory = () => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [filterType, setFilterType] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const dateLocale = i18n.language === 'vi' ? vi : enUS;
  const navigate = useNavigate();

  const formatDateValue = (value, pattern, locale = dateLocale) => {
    if (!value) return '-';
    const date = new Date(value);
    if (!isValid(date)) return '-';
    return locale ? format(date, pattern, { locale }) : format(date, pattern);
  };

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await medicalRecordApi.getPatientHistory(user.id);
      if (response.data.success) {
        setRecords(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching medical history:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- effect performs initial/identity-based history fetch from server
    fetchHistory();
  }, [user]);

  const filteredRecords = useMemo(() => {
    return records.filter(record => {
      const matchesSearch =
        record.diagnosis?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.doctorName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.departmentName?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filterType === 'ALL' || (record.departmentName || '').trim() === filterType;

      return matchesSearch && matchesFilter;
    });
  }, [records, searchQuery, filterType]);

  const handleOpenDetail = (record) => {
    navigate(`/patient/records/${record.id}`);
  };

  const handleCardKeyDown = (event, record) => {
    if (event.target !== event.currentTarget) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleOpenDetail(record);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 }
  };

  return (
    <PatientPageShell
      title={t('records.title')}
      subtitle={t('records.subtitle')}
      maxWidth={false}
      transparent={true}
      actions={
        <Button
          variant="contained"
          startIcon={<Calendar size={20} />}
          onClick={() => navigate('/patient/appointments/book-appointment')}
          sx={{
            borderRadius: 4,
            bgcolor: '#10b981',
            '&:hover': { bgcolor: '#059669' },
            fontWeight: 700,
            px: 4,
            py: 1.5,
            boxShadow: '0 10px 30px rgba(16, 185, 129, 0.2)',
            textTransform: 'none',
          }}
        >
          {t('records.book_now')}
        </Button>
      }
    >
      <Box sx={{ width: '100%' }}>
        {/* Modern Filter Bar */}
        <Box sx={{ 
          display: 'flex', 
          gap: 2, 
          mb: 8, 
          bgcolor: 'white', 
          p: 1.5, 
          borderRadius: 6,
          border: '1px solid oklch(92% 0.02 250)',
          flexWrap: { xs: 'wrap', lg: 'nowrap' },
          boxShadow: '0 10px 30px rgba(0,0,0,0.02)'
        }}>
          <TextField
            placeholder={t('records.search_placeholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: <Search size={20} style={{ marginRight: 12, color: 'oklch(60% 0.02 250)' }} />,
            }}
            sx={{ 
              flex: 1,
              minWidth: { xs: '100%', lg: 400 },
              '& .MuiOutlinedInput-root': { 
                height: 52,
                borderRadius: 5,
                bgcolor: 'oklch(98% 0.01 250)',
                '& fieldset': { border: 'none' },
              } 
            }}
          />
          
          <TextField
            select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            sx={{ 
              minWidth: { xs: '100%', lg: 240 },
              '& .MuiOutlinedInput-root': { 
                height: 52,
                borderRadius: 5,
                bgcolor: 'oklch(98% 0.01 250)',
                '& fieldset': { border: 'none' }
              }
            }}
          >
            <MenuItem value="ALL">{t('records.all_departments')}</MenuItem>
            {[...new Set(records.map(r => r.departmentName).filter(Boolean))].map(dept => (
              <MenuItem key={dept} value={dept}>{dept}</MenuItem>
            ))}
          </TextField>

          <Button 
            variant="contained" 
            startIcon={<Filter size={18} />}
            sx={{ 
              height: 52, 
              minWidth: { xs: '100%', lg: 180 },
              borderRadius: 5,
              bgcolor: 'oklch(20% 0.05 250)',
              color: 'white',
              fontWeight: 700,
              textTransform: 'none',
              '&:hover': { bgcolor: 'black' }
            }}
          >
            {t('records.advanced_filter')}
          </Button>
        </Box>

        {/* Timeline Content */}
        {loading ? (
          <LoadingScreen message={t('records.loading')} />
        ) : filteredRecords.length > 0 ? (
          <Box sx={{ position: 'relative', pl: { xs: 4, md: 8 } }}>
            {/* Timeline Vertical Line */}
            <Box sx={{
              position: 'absolute',
              left: { xs: '31px', md: '63px' },
              top: 0,
              bottom: 0,
              width: 3,
              bgcolor: 'oklch(95% 0.01 160)',
              borderRadius: 2,
              zIndex: 0
            }} />

            <Stack spacing={6}>
              {filteredRecords.map((record, idx) => (
                <motion.div 
                  key={record.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Box sx={{ position: 'relative' }}>
                    {/* Node Icon */}
                    <Box sx={{
                      position: 'absolute',
                      left: { xs: '-44px', md: '-64px' },
                      top: '16px',
                      width: 52,
                      height: 52,
                      borderRadius: '16px',
                      bgcolor: 'white',
                      border: '1.5px solid oklch(92% 0.02 250)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 1,
                      boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
                      color: '#10b981'
                    }}>
                      <Stethoscope size={24} />
                    </Box>

                    {/* Card Content */}
                    <Box
                      onClick={() => handleOpenDetail(record)}
                      sx={{
                        p: 4,
                        borderRadius: 6,
                        border: '1px solid oklch(95% 0.01 250)',
                        bgcolor: 'white',
                        cursor: 'pointer',
                        transition: 'all 0.3s',
                        '&:hover': {
                          transform: 'translateX(8px)',
                          boxShadow: '0 15px 40px rgba(0,0,0,0.03)',
                          borderColor: '#10b981'
                        }
                      }}
                    >
                      <Grid container spacing={4}>
                        <Grid item xs={12} md={8}>
                          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2.5 }}>
                            <Typography variant="caption" sx={{ fontWeight: 700, color: 'oklch(50% 0.02 250)', display: 'flex', alignItems: 'center', gap: 1, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              <Calendar size={14} />
                              {formatDateValue(record.createdAt, 'dd MMMM, yyyy HH:mm')}
                            </Typography>
                            <Chip 
                              label={record.departmentName} 
                              size="small"
                              sx={{ 
                                bgcolor: alpha('#10b981', 0.08), 
                                color: '#10b981',
                                fontWeight: 700,
                                borderRadius: '6px'
                              }} 
                            />
                          </Stack>
                          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, color: 'oklch(20% 0.05 250)', letterSpacing: '-0.02em' }}>
                            {record.diagnosis}
                          </Typography>
                          <Typography variant="body1" sx={{ color: 'oklch(50% 0.02 250)', fontWeight: 500, lineHeight: 1.6, mb: 3 }}>
                            {record.symptoms || t('records.no_symptoms')}
                          </Typography>
                          <Button 
                            variant="text" 
                            size="small"
                            endIcon={<ChevronRight size={16} className="chevron-icon" />}
                            sx={{ 
                              fontWeight: 700, 
                              color: '#10b981', 
                              textTransform: 'none',
                              px: 0,
                              '&:hover': {
                                bgcolor: 'transparent',
                                '& .chevron-icon': { transform: 'translateX(4px)' }
                              }
                            }}
                          >
                            {t('records.view_detail')}
                          </Button>
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <Box sx={{ 
                            p: 3, 
                            borderRadius: 5, 
                            bgcolor: 'oklch(99% 0.01 250)', 
                            border: '1px solid oklch(96% 0.01 250)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2.5,
                            height: '100%'
                          }}>
                            <Avatar sx={{ width: 48, height: 48, borderRadius: '12px', bgcolor: alpha('#10b981', 0.1), color: '#10b981', fontWeight: 700 }}>
                              {record.doctorName?.charAt(0)}
                            </Avatar>
                            <Box>
                              <Typography variant="caption" sx={{ fontWeight: 700, color: 'oklch(60% 0.02 250)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                {t('records.attending_doctor')}
                              </Typography>
                              <Typography variant="h6" sx={{ fontWeight: 700, color: 'oklch(20% 0.05 250)', fontSize: '1rem' }}>
                                {record.doctorName}
                              </Typography>
                            </Box>
                          </Box>
                        </Grid>
                      </Grid>
                    </Box>
                  </Box>
                </motion.div>
              ))}
            </Stack>
          </Box>
        ) : (
          <Box sx={{ textAlign: 'center', py: 16 }}>
            <Box sx={{ 
              width: 120, height: 120, borderRadius: '50%', 
              bgcolor: 'oklch(96% 0.01 250)', color: 'oklch(80% 0.02 250)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              mx: 'auto', mb: 4
            }}>
              <FileText size={64} strokeWidth={1.5} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'oklch(20% 0.05 250)', mb: 2, letterSpacing: '-0.02em' }}>
              {t('records.no_records')}
            </Typography>
            <Button 
              variant="contained" 
              onClick={() => navigate('/patient/appointments/book-appointment')}
              sx={{ 
                borderRadius: 4, px: 6, py: 1.8, 
                bgcolor: '#10b981', fontWeight: 700,
                boxShadow: '0 10px 30px rgba(16, 185, 129, 0.2)'
              }}
            >
              {t('records.book_now')}
            </Button>
          </Box>
        )}
      </Box>
    </PatientPageShell>
  );
};

export default MedicalHistory;
