import React, { useState, useEffect, useMemo } from 'react';
import { 
  Box, Typography, Card, CardContent, Grid, TextField, 
  MenuItem, Select, FormControl, InputLabel, IconButton, 
  Chip, Avatar, Divider, Skeleton, Tooltip, Badge,
  Button, Dialog, DialogTitle, DialogContent, DialogActions,
  useTheme, useMediaQuery
} from '@mui/material';
import { 
  Search, Filter, Calendar, History, 
  Stethoscope, Pill, ClipboardList, ChevronRight,
  Download, Printer, FileText, User, 
  ArrowRight, Info, AlertCircle
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { vi, enUS } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../../store/authStore';
import medicalRecordApi from '../../api/medicalRecordApi';
import LoadingScreen from '../../components/common/LoadingScreen';

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
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const dateLocale = i18n.language === 'vi' ? vi : enUS;

  useEffect(() => {
    fetchHistory();
  }, [user]);

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

  const filteredRecords = useMemo(() => {
    return records.filter(record => {
      const matchesSearch = 
        record.diagnosis?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.doctorName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.departmentName?.toLowerCase().includes(searchQuery.toLowerCase());
      
      // For now we only have medical records, but in future could filter by type
      return matchesSearch;
    });
  }, [records, searchQuery]);

  const handleOpenDetail = (record) => {
    setSelectedRecord(record);
    setIsDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailOpen(false);
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
    <Box sx={{ maxWidth: 1000, mx: 'auto', py: 2 }}>
      {/* Header & Filters */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <History size={32} />
          {t('sidebar.records')}
        </Typography>


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
                bgcolor: '#10b981',
                '&:hover': { bgcolor: '#059669' },
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
        <LoadingScreen message={t('appointments.loading')} />
      ) : filteredRecords.length > 0 ? (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          style={{ position: 'relative', paddingLeft: isMobile ? '20px' : '40px' }}
        >
          {/* Vertical Line */}
          <Box sx={{ 
            position: 'absolute', 
            left: isMobile ? '28px' : '48px', 
            top: 0, 
            bottom: 0, 
            width: '2px', 
            bgcolor: 'rgba(16, 185, 129, 0.15)',
            zIndex: 0
          }} />

          {filteredRecords.map((record, index) => (
            <motion.div key={record.id} variants={itemVariants} style={{ marginBottom: '24px', position: 'relative' }}>
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
                onClick={() => handleOpenDetail(record)}
                sx={{ 
                  ml: isMobile ? '24px' : '40px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 32px rgba(8, 187, 163, 0.12)',
                    borderColor: 'primary.main'
                  }
                }}
              >
                <CardContent sx={{ p: isMobile ? 2 : 3 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={8}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                        <Typography variant="overline" sx={{ fontWeight: 800, color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Calendar size={14} />
                          {format(parseISO(record.createdAt), 'dd MMMM, yyyy HH:mm', { locale: dateLocale })}
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
            onClick={() => window.location.href = '/patient/book-appointment'}
          >
            {t('records.book_now')}
          </Button>
        </Box>
      )}

      {/* Detail Modal */}
      <Dialog 
        open={isDetailOpen} 
        onClose={handleCloseDetail}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: { borderRadius: '20px', p: 1 }
        }}
      >
        {selectedRecord && (
          <>
            <DialogTitle sx={{ pb: 0 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 800 }}>{t('records.detail_title')}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {t('records.record_id')}: #MR-{selectedRecord.id.toString().padStart(6, '0')}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <IconButton onClick={() => window.print()}><Printer size={20} /></IconButton>
                  <IconButton><Download size={20} /></IconButton>
                </Box>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Box sx={{ mt: 2 }}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={4}>
                    <Card variant="outlined" sx={{ bgcolor: 'rgba(8, 187, 163, 0.03)', border: '1px dashed rgba(8, 187, 163, 0.3)' }}>
                      <CardContent>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Info size={16} /> {t('records.general_info')}
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                          <Box>
                            <Typography variant="caption" color="text.secondary">{t('records.exam_date')}</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {format(parseISO(selectedRecord.createdAt), 'dd/MM/yyyy HH:mm')}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" color="text.secondary">{t('records.doctor')}</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedRecord.doctorName}</Typography>
                            <Typography variant="caption" color="primary.main">{selectedRecord.doctorSpecialization}</Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" color="text.secondary">{t('records.department')}</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedRecord.departmentName}</Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} md={8}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                          <ClipboardList size={20} color={CATEGORY_COLORS.EXAM} /> {t('records.diagnosis_symptoms')}
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>
                          {selectedRecord.diagnosis}
                        </Typography>
                        <Typography variant="body2" sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2 }}>
                          {selectedRecord.symptoms}
                        </Typography>
                      </Box>

                      <Divider />

                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Pill size={20} color={CATEGORY_COLORS.MEDICATION} /> {t('records.prescription_treatment')}
                        </Typography>
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-line', p: 2, border: '1px solid #e2e8f0', borderRadius: 2 }}>
                          {selectedRecord.prescription || t('records.no_prescription')}
                        </Typography>
                        {selectedRecord.treatmentPlan && (
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>{t('records.treatment_plan')}</Typography>
                            <Typography variant="body2" sx={{ mt: 0.5 }}>{selectedRecord.treatmentPlan}</Typography>
                          </Box>
                        )}
                      </Box>

                      {selectedRecord.notes && (
                        <Box sx={{ p: 2, bgcolor: 'rgba(245, 158, 11, 0.05)', borderRadius: 2, borderLeft: '4px solid #f59e0b' }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>{t('records.doctor_notes')}</Typography>
                          <Typography variant="body2">{selectedRecord.notes}</Typography>
                        </Box>
                      )}

                      {selectedRecord.followUpDate && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'error.main' }}>
                          <Calendar size={16} />
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            {t('records.follow_up')}: {format(parseISO(selectedRecord.followUpDate.toString()), 'dd/MM/yyyy')}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </DialogContent>
            <DialogActions sx={{ p: 3 }}>
              <Button onClick={handleCloseDetail} variant="outlined">{t('records.close')}</Button>
              <Button variant="contained" startIcon={<Download size={18} />}>{t('records.download_pdf')}</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default MedicalHistory;
