import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, Grid, IconButton, Divider, Button, Breadcrumbs, Link, Stack
} from '@mui/material';
import {
  Calendar, Pill, ClipboardList, Download, Printer, Info, ChevronLeft
} from 'lucide-react';
import { format, isValid } from 'date-fns';
import { vi, enUS } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import medicalRecordApi from '../../api/medicalRecordApi';
import LoadingScreen from '../../components/common/LoadingScreen';
import PatientPageShell from '../../components/patient/PatientPageShell';

const CATEGORY_COLORS = {
  EXAM: '#08bba3',
  MEDICATION: '#f59e0b',
};

const MedicalRecordDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language === 'vi' ? vi : enUS;

  const [loading, setLoading] = useState(true);
  const [record, setRecord] = useState(null);
  const [error, setError] = useState('');

  const formatDateValue = (value, pattern, locale = dateLocale) => {
    if (!value) return '-';
    const date = new Date(value);
    if (!isValid(date)) return '-';
    return locale ? format(date, pattern, { locale }) : format(date, pattern);
  };

  useEffect(() => {
    const fetchRecord = async () => {
      try {
        setLoading(true);
        const res = await medicalRecordApi.getRecordById(id);
        if (res.data.success) {
          setRecord(res.data.data);
        }
      } catch (err) {
        setError(t('records.fetch_error') || 'Lỗi khi tải dữ liệu');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchRecord();
  }, [id, t]);

  if (loading) return <LoadingScreen message={t('records.loading') || 'Đang tải chi tiết...'} />;
  if (error || !record) return (
    <PatientPageShell title="Chi tiết hồ sơ bệnh án">
      <Box sx={{ textAlign: 'center', py: 10 }}>
        <Typography color="error" variant="h6">{error || 'Không tìm thấy hồ sơ'}</Typography>
        <Button variant="outlined" sx={{ mt: 2 }} onClick={() => navigate('/patient/records')}>
          Quay lại
        </Button>
      </Box>
    </PatientPageShell>
  );

  return (
    <PatientPageShell 
      title={t('records.detail_title') || 'Chi tiết hồ sơ bệnh án'} 
      maxWidth={false}
      transparent={true}
    >
      <Box sx={{ mb: 6 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <IconButton 
            onClick={() => navigate('/patient/records')}
            sx={{ 
              bgcolor: 'white', 
              border: '1px solid oklch(92% 0.02 250)',
              borderRadius: 3,
              '&:hover': { bgcolor: 'oklch(96% 0.01 250)' }
            }}
          >
            <ChevronLeft size={20} />
          </IconButton>
          <Breadcrumbs separator={<Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: 'oklch(80% 0.02 250)' }} />}>
            <Link 
              component="button" 
              onClick={() => navigate('/patient/records')} 
              sx={{ fontWeight: 800, color: 'oklch(60% 0.02 250)', textDecoration: 'none', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}
            >
              Lịch sử khám
            </Link>
            <Typography sx={{ fontWeight: 900, color: 'oklch(20% 0.05 250)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Chi tiết hồ sơ
            </Typography>
          </Breadcrumbs>
        </Stack>
      </Box>

      <Box sx={{ 
        p: { xs: 4, md: 8 }, 
        borderRadius: 8, 
        border: '1px solid oklch(92% 0.02 250)',
        bgcolor: 'transparent',
        position: 'relative'
      }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems="flex-start" sx={{ mb: 8, gap: 4 }}>
          <Box>
            <Typography variant="caption" sx={{ fontWeight: 900, color: 'oklch(60% 0.02 250)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
              Mã hồ sơ y tế
            </Typography>
            <Typography variant="h2" sx={{ fontWeight: 950, color: 'oklch(20% 0.05 250)', letterSpacing: '-0.05em', mt: 1 }}>
              #{record.id.toString().padStart(6, '0')}
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 2 }}>
              <Calendar size={18} color="oklch(65% 0.15 160)" />
              <Typography variant="h6" sx={{ fontWeight: 800, color: 'oklch(40% 0.02 250)' }}>
                {formatDateValue(record.createdAt, 'dd MMMM, yyyy HH:mm')}
              </Typography>
            </Stack>
          </Box>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<Printer size={20} />}
              onClick={() => window.print()}
              sx={{ 
                borderRadius: 4, px: 4, py: 1.5, fontWeight: 950,
                color: 'oklch(20% 0.05 250)', 
                borderColor: 'oklch(90% 0.02 250)',
                transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                '&:hover': { 
                  bgcolor: 'oklch(98% 0.01 250)', 
                  borderColor: 'oklch(20% 0.05 250)',
                  transform: 'translateY(-2px)'
                }
              }}
            >
              In hồ sơ
            </Button>
            <Button
              variant="contained"
              startIcon={<Download size={20} />}
              onClick={() => window.print()}
              sx={{ 
                borderRadius: 4, px: 4, py: 1.5, fontWeight: 950,
                bgcolor: 'oklch(20% 0.05 250)', color: 'white',
                '&:hover': { bgcolor: 'oklch(15% 0.05 250)' }
              }}
            >
              Tải xuống PDF
            </Button>
          </Stack>
        </Stack>

        <Grid container spacing={8}>
          <Grid item xs={12} lg={4}>
            <Stack spacing={4}>
              <Box sx={{ p: 4, borderRadius: 6, bgcolor: 'oklch(98% 0.01 250)', border: '1px solid oklch(94% 0.02 250)' }}>
                <Typography variant="caption" sx={{ fontWeight: 900, color: 'oklch(60% 0.02 250)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                  <Info size={18} strokeWidth={2.5} /> Thông tin bác sĩ
                </Typography>
                <Stack spacing={3}>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'oklch(60% 0.02 250)', fontWeight: 700 }}>Bác sĩ phụ trách</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 900, mt: 0.5 }}>{record.doctorName || '-'}</Typography>
                    <Typography variant="body2" sx={{ color: 'oklch(65% 0.15 160)', fontWeight: 800 }}>{record.doctorSpecialization || '-'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'oklch(60% 0.02 250)', fontWeight: 700 }}>Khoa / Phòng</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 900, mt: 0.5 }}>{record.departmentName || '-'}</Typography>
                  </Box>
                  {record.followUpDate && (
                    <Box sx={{ p: 2, borderRadius: 3, bgcolor: 'oklch(96% 0.01 20)', color: 'oklch(60% 0.15 20)', display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Calendar size={20} />
                      <Box>
                        <Typography variant="caption" sx={{ fontWeight: 900, textTransform: 'uppercase' }}>Hẹn tái khám</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 950 }}>{formatDateValue(record.followUpDate, 'dd/MM/yyyy')}</Typography>
                      </Box>
                    </Box>
                  )}
                </Stack>
              </Box>

              <Box sx={{ p: 4, borderRadius: 6, border: '2px dashed oklch(92% 0.02 250)', textAlign: 'center' }}>
                <Typography variant="body2" sx={{ color: 'oklch(60% 0.02 250)', fontWeight: 700 }}>
                  Cần hỗ trợ về hồ sơ này?
                </Typography>
                <Button sx={{ mt: 1, fontWeight: 950, color: 'oklch(65% 0.15 160)' }}>
                  Liên hệ bộ phận chuyên môn
                </Button>
              </Box>
            </Stack>
          </Grid>

          <Grid item xs={12} lg={8}>
            <Stack spacing={6}>
              <Box>
                <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
                  <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: 'oklch(96% 0.01 160)', color: 'oklch(65% 0.15 160)' }}>
                    <ClipboardList size={24} strokeWidth={2.5} />
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 950, color: 'oklch(20% 0.05 250)', letterSpacing: '-0.02em' }}>
                    Chẩn đoán & Triệu chứng
                  </Typography>
                </Stack>
                <Box sx={{ mb: 4 }}>
                  <Typography variant="caption" sx={{ fontWeight: 900, color: 'oklch(60% 0.02 250)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    Kết quả chẩn đoán
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 950, color: 'oklch(65% 0.15 160)', mt: 1, letterSpacing: '-0.01em' }}>
                    {record.diagnosis || '-'}
                  </Typography>
                </Box>
                <Box sx={{ p: 4, borderRadius: 6, bgcolor: 'oklch(98% 0.01 250)', border: '1px solid oklch(94% 0.02 250)' }}>
                  <Typography variant="caption" sx={{ fontWeight: 900, color: 'oklch(60% 0.02 250)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    Ghi nhận triệu chứng
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 2, color: 'oklch(30% 0.02 250)', lineHeight: 1.8, fontWeight: 500 }}>
                    {record.symptoms || 'Không có ghi nhận triệu chứng từ bác sĩ'}
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ borderColor: 'oklch(92% 0.02 250)' }} />

              <Box>
                <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
                  <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: 'oklch(96% 0.01 250)', color: 'oklch(20% 0.05 250)' }}>
                    <Pill size={24} strokeWidth={2.5} />
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 950, color: 'oklch(20% 0.05 250)', letterSpacing: '-0.02em' }}>
                    Đơn thuốc & Điều trị
                  </Typography>
                </Stack>
                <Box sx={{ p: 4, borderRadius: 6, border: '2px solid oklch(94% 0.02 250)', mb: 4 }}>
                  <Typography variant="caption" sx={{ fontWeight: 900, color: 'oklch(60% 0.02 250)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    Chi tiết đơn thuốc
                  </Typography>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-line', mt: 2, color: 'oklch(20% 0.05 250)', fontWeight: 800, fontSize: '1.1rem', lineHeight: 1.8 }}>
                    {record.prescription || 'Không có chỉ định đơn thuốc'}
                  </Typography>
                </Box>
                {record.treatmentPlan && (
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 900, color: 'oklch(60% 0.02 250)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      Phác đồ điều trị bổ sung
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 1.5, color: 'oklch(40% 0.02 250)', lineHeight: 1.8, fontWeight: 500 }}>
                      {record.treatmentPlan}
                    </Typography>
                  </Box>
                )}
              </Box>

              {record.notes && (
                <Box sx={{ p: 4, borderRadius: 6, bgcolor: 'oklch(98% 0.01 30)', borderLeft: '6px solid oklch(60% 0.15 30)' }}>
                  <Typography variant="h6" sx={{ fontWeight: 950, color: 'oklch(25% 0.05 30)', mb: 1 }}>
                    Ghi chú chuyên môn
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'oklch(35% 0.05 30)', lineHeight: 1.7, fontWeight: 500 }}>
                    {record.notes}
                  </Typography>
                </Box>
              )}
            </Stack>
          </Grid>
        </Grid>
      </Box>
    </PatientPageShell>
  );
};

export default MedicalRecordDetail;
