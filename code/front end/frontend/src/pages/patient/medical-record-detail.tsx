import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Grid, IconButton, Divider, Button, Breadcrumbs, Link, Stack
} from '@mui/material';
import {
  Calendar, Pill, ClipboardList, Download, Printer, Info, ChevronLeft
} from 'lucide-react';
import { format, isValid, Locale } from 'date-fns';
import { vi, enUS } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import medicalRecordApi from '../../services/medical-record-service';
import LoadingScreen from '../../components/common/loading-screen';
import PatientPageShell from '../../components/patient/patient-page-shell';

interface MedicalRecordDetailData {
  id: number | string;
  createdAt: string;
  doctorName?: string;
  doctorSpecialization?: string;
  departmentName?: string;
  followUpDate?: string;
  triagePriority?: string;
  diagnosis?: string;
  symptoms?: string;
  aiSummarySnapshot?: string;
  prescription?: string;
  treatmentPlan?: string;
  notes?: string;
}

const MedicalRecordDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language === 'vi' ? vi : enUS;

  const [loading, setLoading] = useState<boolean>(true);
  const [record, setRecord] = useState<MedicalRecordDetailData | null>(null);
  const [error, setError] = useState<string>('');

  const formatDateValue = (value: string | null | undefined, pattern: string, locale: Locale = dateLocale) => {
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
      } catch {
        setError(t('records.fetch_error') || 'Lỗi khi tải dữ liệu');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchRecord();
  }, [id, t]);

  if (loading) return <LoadingScreen message={t('records.loading') || 'Đang tải chi tiết...'} />;
  if (error || !record) return (
    <PatientPageShell title={t('records.detail_title') || 'Chi tiết hồ sơ bệnh án'}>
      <Box sx={{ textAlign: 'center', py: 10 }}>
        <Typography color="error" variant="h6">{error || t('records.not_found')}</Typography>
        <Button variant="outlined" sx={{ mt: 2 }} onClick={() => navigate('/patient/records')}>
          {t('records.back')}
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
              {t('records.history_link')}
            </Link>
            <Typography sx={{ fontWeight: 900, color: 'oklch(20% 0.05 250)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {t('records.detail_title_short')}
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
              {t('records.record_code')}
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
                borderRadius: 4, px: 4, py: 0.5, fontWeight: 700, textTransform: 'none',
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
              {t('records.print_record')}
            </Button>
            <Button
              variant="contained"
              startIcon={<Download size={20} />}
              onClick={() => window.print()}
              sx={{
                borderRadius: 4, px: 4, py: 1.5, fontWeight: 700, textTransform: 'none',
                bgcolor: '#10b981', color: 'white',
                boxShadow: '0 10px 30px rgba(16, 185, 129, 0.2)',
                '&:hover': { bgcolor: '#059669' }
              }}
            >
              {t('records.download_pdf')}
            </Button>
          </Stack>
        </Stack>

        <Grid container spacing={8}>
          <Grid size={{ xs: 12, lg: 4 }}>
            <Stack spacing={4}>
              <Box sx={{ p: 4, borderRadius: 6, bgcolor: 'oklch(98% 0.01 250)', border: '1px solid oklch(94% 0.02 250)' }}>
                <Typography variant="caption" sx={{ fontWeight: 900, color: 'oklch(60% 0.02 250)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                  <Info size={18} strokeWidth={2.5} /> {t('records.doctor_info')}
                </Typography>
                <Stack spacing={3}>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'oklch(60% 0.02 250)', fontWeight: 700 }}>{t('records.doctor_in_charge')}</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 900, mt: 0.5 }}>{record.doctorName || '-'}</Typography>
                    <Typography variant="body2" sx={{ color: 'oklch(65% 0.15 160)', fontWeight: 800 }}>{record.doctorSpecialization || '-'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'oklch(60% 0.02 250)', fontWeight: 700 }}>{t('records.department')}</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 900, mt: 0.5 }}>{record.departmentName || '-'}</Typography>
                  </Box>
                  {record.followUpDate && (
                    <Box sx={{ p: 2, borderRadius: 3, bgcolor: 'oklch(96% 0.01 20)', color: 'oklch(60% 0.15 20)', display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Calendar size={20} />
                      <Box>
                        <Typography variant="caption" sx={{ fontWeight: 900, textTransform: 'uppercase' }}>{t('records.follow_up_date')}</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 950 }}>{formatDateValue(record.followUpDate, 'dd/MM/yyyy')}</Typography>
                      </Box>
                    </Box>
                  )}
                  {record.triagePriority && (
                    <Box sx={{ p: 2, borderRadius: 3, bgcolor: record.triagePriority === 'HIGH' ? 'oklch(96% 0.01 20)' : 'oklch(96% 0.01 250)', color: record.triagePriority === 'HIGH' ? 'oklch(60% 0.15 20)' : 'oklch(60% 0.02 250)', display: 'flex', alignItems: 'center', gap: 2, border: '1px solid currentColor', borderOpacity: 0.2 }}>
                      <Info size={20} />
                      <Box>
                        <Typography variant="caption" sx={{ fontWeight: 900, textTransform: 'uppercase' }}>{t('records.triage_priority')}</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 950 }}>
                          {(() => {
                            let defaultName = 'Bình thường';
                            if (record.triagePriority === 'HIGH') defaultName = 'Ưu tiên cao';
                            else if (record.triagePriority === 'URGENT') defaultName = 'Cấp cứu';
                            return t(`priority.${record.triagePriority}`, { defaultValue: defaultName });
                          })()}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </Stack>
              </Box>

              <Box sx={{ p: 4, borderRadius: 6, border: '2px dashed oklch(92% 0.02 250)', textAlign: 'center' }}>
                <Typography variant="body2" sx={{ color: 'oklch(60% 0.02 250)', fontWeight: 700 }}>
                  {t('records.need_help')}
                </Typography>
                <Button sx={{ mt: 1, fontWeight: 950, color: 'oklch(65% 0.15 160)' }}>
                  {t('records.contact_support')}
                </Button>
              </Box>
            </Stack>
          </Grid>

          <Grid size={{ xs: 12, lg: 8 }}>
            <Stack spacing={6}>
              <Box>
                <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
                  <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: 'oklch(96% 0.01 160)', color: 'oklch(65% 0.15 160)' }}>
                    <ClipboardList size={24} strokeWidth={2.5} />
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 950, color: 'oklch(20% 0.05 250)', letterSpacing: '-0.02em' }}>
                    {t('records.diagnosis_symptoms_title')}
                  </Typography>
                </Stack>
                <Box sx={{ mb: 4 }}>
                  <Typography variant="caption" sx={{ fontWeight: 900, color: 'oklch(60% 0.02 250)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    {t('records.diagnosis_result')}
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 950, color: 'oklch(65% 0.15 160)', mt: 1, letterSpacing: '-0.01em' }} dangerouslySetInnerHTML={{ __html: record.diagnosis || '-' }} />
                </Box>
                <Box sx={{ p: 4, borderRadius: 6, bgcolor: 'oklch(98% 0.01 250)', border: '1px solid oklch(94% 0.02 250)' }}>
                  <Typography variant="caption" sx={{ fontWeight: 900, color: 'oklch(60% 0.02 250)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    {t('records.recorded_symptoms')}
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 2, color: 'oklch(30% 0.02 250)', lineHeight: 1.8, fontWeight: 500 }} dangerouslySetInnerHTML={{ __html: record.symptoms || t('records.no_symptoms_recorded') }} />
                </Box>
                {record.aiSummarySnapshot && (
                  <Box sx={{ mt: 4, p: 4, borderRadius: 6, bgcolor: 'oklch(98% 0.01 250)', border: '1px dashed oklch(90% 0.02 250)' }}>
                    <Typography variant="caption" sx={{ fontWeight: 900, color: 'oklch(60% 0.02 250)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      {t('records.ai_analysis')}
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 2, color: 'oklch(40% 0.02 250)', lineHeight: 1.8, fontStyle: 'italic' }}>
                      {record.aiSummarySnapshot}
                    </Typography>
                  </Box>
                )}
              </Box>

              <Divider sx={{ borderColor: 'oklch(92% 0.02 250)' }} />

              <Box>
                <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
                  <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: 'oklch(96% 0.01 250)', color: 'oklch(20% 0.05 250)' }}>
                    <Pill size={24} strokeWidth={2.5} />
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 950, color: 'oklch(20% 0.05 250)', letterSpacing: '-0.02em' }}>
                    {t('records.prescription_treatment_title')}
                  </Typography>
                </Stack>
                <Box sx={{ p: 4, borderRadius: 6, border: '2px solid oklch(94% 0.02 250)', mb: 4 }}>
                  <Typography variant="caption" sx={{ fontWeight: 900, color: 'oklch(60% 0.02 250)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    {t('records.prescription_details')}
                  </Typography>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-line', mt: 2, color: 'oklch(20% 0.05 250)', fontWeight: 800, fontSize: '1.1rem', lineHeight: 1.8 }} dangerouslySetInnerHTML={{ __html: record.prescription || t('records.no_prescription') }} />
                </Box>
                {record.treatmentPlan && (
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 900, color: 'oklch(60% 0.02 250)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      {t('records.additional_treatment_plan')}
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 1.5, color: 'oklch(40% 0.02 250)', lineHeight: 1.8, fontWeight: 500 }} dangerouslySetInnerHTML={{ __html: record.treatmentPlan }} />
                  </Box>
                )}
              </Box>

              {record.notes && (
                <Box sx={{ p: 4, borderRadius: 6, bgcolor: 'oklch(98% 0.01 30)', borderLeft: '6px solid oklch(60% 0.15 30)' }}>
                  <Typography variant="h6" sx={{ fontWeight: 950, color: 'oklch(25% 0.05 30)', mb: 1 }}>
                    {t('records.professional_notes')}
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'oklch(35% 0.05 30)', lineHeight: 1.7, fontWeight: 500 }} dangerouslySetInnerHTML={{ __html: record.notes }} />
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
