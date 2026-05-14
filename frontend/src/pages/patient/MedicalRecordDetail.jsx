import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, Grid, IconButton, Divider, Button, Breadcrumbs, Link
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
    <PatientPageShell title={t('records.detail_title') || 'Chi tiết hồ sơ bệnh án'} maxWidth="lg">
      <Box sx={{ mb: 3 }}>
        <Breadcrumbs sx={{ mb: 2 }}>
          <Link component="button" onClick={() => navigate('/patient/records')} sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary', textDecoration: 'none' }}>
            <ChevronLeft size={16} /> Lịch sử khám
          </Link>
          <Typography color="text.primary">Chi tiết</Typography>
        </Breadcrumbs>
      </Box>

      <Card sx={{ borderRadius: 4, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <Box sx={{ p: 3, borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>Mã hồ sơ: {record.id.toString().padStart(6, '0')}</Typography>
            <Typography variant="caption" color="text.secondary">
              {formatDateValue(record.createdAt, 'dd/MM/yyyy HH:mm')}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton onClick={() => window.print()}><Printer size={20} /></IconButton>
            <IconButton onClick={() => window.print()}><Download size={20} /></IconButton>
          </Box>
        </Box>

        <CardContent sx={{ p: 4 }}>
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Card variant="outlined" sx={{ bgcolor: 'rgba(8, 187, 163, 0.03)', border: '1px dashed rgba(8, 187, 163, 0.3)' }}>
                <CardContent>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Info size={16} /> Thông tin chung
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Bác sĩ phụ trách</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{record.doctorName || '-'}</Typography>
                      <Typography variant="caption" color="primary.main">{record.doctorSpecialization || '-'}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Chuyên khoa</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{record.departmentName || '-'}</Typography>
                    </Box>
                    {record.followUpDate && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'error.main' }}>
                        <Calendar size={16} />
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          Tái khám: {formatDateValue(record.followUpDate, 'dd/MM/yyyy')}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={8}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ClipboardList size={20} color={CATEGORY_COLORS.EXAM} /> Chẩn đoán & Triệu chứng
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>
                    {record.diagnosis || '-'}
                  </Typography>
                  <Typography variant="body2" sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2 }}>
                    {record.symptoms || 'Không có ghi nhận triệu chứng'}
                  </Typography>
                </Box>

                <Divider />

                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Pill size={20} color={CATEGORY_COLORS.MEDICATION} /> Đơn thuốc & Phác đồ
                  </Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-line', p: 2, border: '1px solid #e2e8f0', borderRadius: 2, mb: 2 }}>
                    {record.prescription || 'Không có đơn thuốc'}
                  </Typography>
                  {record.treatmentPlan && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>Phác đồ điều trị:</Typography>
                      <Typography variant="body2" sx={{ mt: 0.5 }}>{record.treatmentPlan}</Typography>
                    </Box>
                  )}
                </Box>

                {record.notes && (
                  <Box sx={{ p: 2, bgcolor: 'rgba(245, 158, 11, 0.05)', borderRadius: 2, borderLeft: '4px solid #f59e0b' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>Ghi chú của bác sĩ</Typography>
                    <Typography variant="body2">{record.notes}</Typography>
                  </Box>
                )}
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </PatientPageShell>
  );
};

export default MedicalRecordDetail;
