import { useState, useEffect, useMemo } from 'react';
import { 
  Box, Typography, Card, CardContent, Grid, TextField, 
  MenuItem, Select, FormControl, InputLabel,
  Chip, Avatar,
  Button,
  useTheme, useMediaQuery
} from '@mui/material';
import {
  Search, Filter, Calendar,
  Stethoscope, User
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
      maxWidth="lg"
      actions={
        <Button
          variant="contained"
          startIcon={<Calendar size={18} />}
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
          {t('records.book_now')}
        </Button>
      }
    >
      <Box sx={{ maxWidth: 1000, mx: 'auto' }}>
        {/* Filters */}
        <Box sx={{ mb: 4 }}>
          <Card sx={{
          p: 2, 
          bgcolor: 'rgba(255, 255, 255, 0.6)', 
          backdropFilter: 'blur(10px)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
          border: '1px solid rgba(16, 185, 129, 0.1)',
          borderRadius: 4
        }}>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', md: 'row' }, 
            gap: 2, 
            alignItems: 'center',
            width: '100%'
          }}>
            <TextField
              placeholder={t('records.search_placeholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <Search size={20} style={{ marginRight: 8, color: '#64748b' }} />,
              }}
              size="small"
              sx={{ 
                flex: 1, // Giãn ra chiếm 100% không gian còn lại
                width: '100%',
                '& .MuiOutlinedInput-root': { 
                  bgcolor: '#ffffff',
                  borderRadius: 2,
                  '&:hover fieldset': { borderColor: '#10b981' },
                } 
              }}
            />
            
            <FormControl size="small" sx={{ minWidth: { xs: '100%', md: 220 } }}>
              <InputLabel>{t('records.department_filter')}</InputLabel>
              <Select
                value={filterType}
                label={t('records.department_filter')}
                onChange={(e) => setFilterType(e.target.value)}
                sx={{ 
                  bgcolor: '#ffffff',
                  borderRadius: 2,
                  '& .MuiOutlinedInput-notchedOutline': { borderRadius: 2 }
                }}
              >
                <MenuItem value="ALL">{t('records.all_departments')}</MenuItem>
                {[...new Set(records.map(r => r.departmentName).filter(Boolean))].map(dept => (
                  <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <Button 
              variant="contained" 
              startIcon={<Filter size={18} />}
              sx={{ 
                height: 40, 
                minWidth: { xs: '100%', md: 160 },
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 700,
                whiteSpace: 'nowrap'
              }}
            >
              {t('records.advanced_filter')}
            </Button>
          </Box>
        </Card>
      </Box>

      {/* Timeline Content */}
      {loading ? (
        <LoadingScreen message={t('records.loading')} />
      ) : filteredRecords.length > 0 ? (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          style={{ position: 'relative', paddingLeft: isMobile ? '20px' : '40px' }}
        >
          {/* Vertical Line */}
          {!isMobile && (
            <Box sx={{
              position: 'absolute',
              left: '48px',
              top: 0,
              bottom: 0,
              width: '2px',
              bgcolor: 'rgba(16, 185, 129, 0.15)',
              zIndex: 0
            }} />
          )}

          {filteredRecords.map((record) => (
            <motion.div key={record.id} variants={itemVariants} style={{ marginBottom: '24px', position: 'relative', paddingLeft: isMobile ? 0 : '40px' }}>
              {/* Node Icon */}
              <Box sx={{
                position: 'absolute',
                left: isMobile ? '-14px' : '-24px',
                top: '20px',
                width: isMobile ? '32px' : '48px',
                height: isMobile ? '32px' : '48px',
                borderRadius: '50%',
                bgcolor: 'white',
                border: '4px solid',
                borderColor: CATEGORY_COLORS.EXAM,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1,
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
              }}>
                <Stethoscope size={isMobile ? 16 : 24} color={CATEGORY_COLORS.EXAM} />
              </Box>

              {/* Card Content */}
              <Card
                role="button"
                tabIndex={0}
                aria-haspopup="dialog"
                onClick={() => handleOpenDetail(record)}
                onKeyDown={(event) => handleCardKeyDown(event, record)}
                sx={{
                  ml: isMobile ? 0 : '40px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 32px rgba(8, 187, 163, 0.12)',
                    borderColor: 'primary.main'
                  },
                  '&:focus-visible': {
                    outline: 'none',
                    borderColor: 'primary.main',
                    boxShadow: '0 0 0 4px rgba(8, 187, 163, 0.18)'
                  }
                }}
              >
                <CardContent sx={{ p: isMobile ? 2 : 3 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={8}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                        <Typography variant="overline" sx={{ fontWeight: 800, color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Calendar size={14} />
                          {formatDateValue(record.createdAt, 'dd MMMM, yyyy HH:mm')}
                        </Typography>
                        <Chip 
                          label={record.departmentName || t('records.department_filter')} 
                          size="small" 
                          sx={{ 
                            height: 20, 
                            fontSize: '0.65rem', 
                            fontWeight: 700, 
                            bgcolor: 'rgba(59, 130, 246, 0.1)', 
                            color: '#2563eb' 
                          }} 
                        />
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5 }}>
                        {record.diagnosis}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" noWrap sx={{ mb: 1 }}>
                        {record.symptoms || t('records.no_symptoms')}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={4} sx={{ borderLeft: { md: '1px solid #e2e8f0' }, pl: { md: 3 } }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main' }}>
                          <User size={20} />
                        </Avatar>
                        <Box>
                          <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', fontWeight: 600 }}>
                            {t('records.attending_doctor')}
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            {record.doctorName}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <Box sx={{ textAlign: 'center', py: 10 }}>

          <Typography variant="h5" color="text.secondary" sx={{ fontWeight: 700 }}>
            {t('records.no_records')}
          </Typography>
          <Button 
            variant="contained" 
            sx={{ mt: 3 }}
            onClick={() => navigate('/patient/appointments/book-appointment')}
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
