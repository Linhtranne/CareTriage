import { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Paper,
  Grid,
  Stack,
  Alert,
  Chip,
  Skeleton,
  Breadcrumbs,
  Link,
  Tooltip,
  Divider,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress
} from '@mui/material';
import {
  ChevronLeft,
  FileText,
  PlusCircle,
  Activity,
  Pill,
  Thermometer,
  Calendar,
  AlertCircle,
  ChevronDown
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import ehrApi from '../../services/ehr-service';
import PatientPageShell from '../../components/patient/patient-page-shell';

// Entity Color Map matching EHRResult.jsx
const ENTITY_CONFIG = {
  MEDICATION: { bg: 'rgba(59,130,246,0.15)', border: '#3b82f6', label: '#1d4ed8' },
  SYMPTOM: { bg: 'rgba(239,68,68,0.12)', border: '#ef4444', label: '#b91c1c' },
  CONDITION: { bg: 'rgba(245,158,11,0.15)', border: '#f59e0b', label: '#92400e' },
  DOSAGE: { bg: 'rgba(8,187,163,0.15)', border: '#08bba3', label: '#065f46' },
  LAB_TEST: { bg: 'rgba(139,92,246,0.15)', border: '#8b5cf6', label: '#5b21b6' },
  PROCEDURE: { bg: 'rgba(236,72,153,0.15)', border: '#ec4899', label: '#9d174d' }
};

export default function EHRSummary() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Expandable notes entities cache mapping: { [noteId]: { entities: [], loading: false, error: '' } }
  const [noteEntitiesCache, setNoteEntitiesCache] = useState({});

  useEffect(() => {
    const fetchSummaryData = async () => {
      setLoading(true);
      setError('');
      try {
        const [summaryRes, notesRes] = await Promise.all([
          ehrApi.getPatientSummary(patientId),
          ehrApi.getNotesByPatient(patientId)
        ]);

        const summaryData = summaryRes.data?.data || summaryRes.data;
        const notesData = notesRes.data?.data || notesRes.data || [];

        setSummary(summaryData);
        setNotes(notesData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      } catch (err) {
        setError('Không thể tải tóm tắt bệnh án EHR của bệnh nhân. Vui lòng thử lại sau.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSummaryData();
  }, [patientId]);

  const handleAccordionChange = (noteId) => async (event, isExpanded) => {
    if (!isExpanded) return;
    if (noteEntitiesCache[noteId]) return; // Already fetched

    // Initialize loading state in cache
    setNoteEntitiesCache(prev => ({
      ...prev,
      [noteId]: { entities: [], loading: true, error: '' }
    }));

    try {
      const response = await ehrApi.getEntitiesByNote(noteId);
      const dto = response.data?.data || response.data;
      
      const allEntities = [
        ...(dto.entities || []),
        ...(dto.medications || []),
        ...(dto.symptoms || []),
        ...(dto.conditions || []),
        ...(dto.dosages || []),
        ...(dto.labTests || []),
        ...(dto.procedures || []),
      ];

      // Deduplicate
      const seen = new Set();
      const deduped = allEntities.filter(e => {
        const key = `${e.entityType}__${e.entityValue}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      setNoteEntitiesCache(prev => ({
        ...prev,
        [noteId]: { entities: deduped, loading: false, error: '' }
      }));
    } catch (err) {
      setNoteEntitiesCache(prev => ({
        ...prev,
        [noteId]: { entities: [], loading: false, error: 'Không thể tải chi tiết thực thể y khoa.' }
      }));
      console.error(err);
    }
  };

  // Reusable Highlighting Algorithm per expanded note
  const getHighlightedSegments = (rawText, entities) => {
    if (!rawText || !entities || !entities.length) return [rawText || ''];

    const text = rawText;
    const processedEntities = entities.map(e => {
      let start = e.startPosition;
      let end = e.endPosition;

      if (start === null || start === undefined || end === null || end === undefined) {
        const index = text.indexOf(e.entityValue);
        if (index !== -1) {
          start = index;
          end = index + e.entityValue.length;
        } else {
          start = -1;
          end = -1;
        }
      }
      return { ...e, start, end };
    })
      .filter(e => e.start >= 0 && e.end > e.start)
      .sort((a, b) => a.start - b.start);

    const nonOverlapping = processedEntities.reduce((acc, e) => {
      const last = acc[acc.length - 1];
      if (!last || e.start >= last.end) {
        acc.push(e);
      }
      return acc;
    }, []);

    const segments = [];
    let lastIndex = 0;

    nonOverlapping.forEach((entity) => {
      if (entity.start > lastIndex) {
        segments.push(text.substring(lastIndex, entity.start));
      }
      segments.push({ type: 'highlight', content: text.substring(entity.start, entity.end), entity });
      lastIndex = entity.end;
    });

    if (lastIndex < text.length) {
      segments.push(text.substring(lastIndex));
    }

    return segments;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Chưa xác định';
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  if (loading) {
    return (
      <PatientPageShell title="EHR Summary" description="Đang tải tóm tắt hồ sơ bệnh án..." maxWidth="xl" transparent>
        <Grid container spacing={3}>
          <Grid item xs={12} md={7}>
            <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 6, mb: 3 }} />
            <Skeleton variant="rectangular" height={500} sx={{ borderRadius: 6 }} />
          </Grid>
          <Grid item xs={12} md={5}>
            <Stack spacing={3}>
              {[1, 2, 3].map(i => <Skeleton key={i} variant="rectangular" height={180} sx={{ borderRadius: 6 }} />)}
            </Stack>
          </Grid>
        </Grid>
      </PatientPageShell>
    );
  }

  if (error) {
    return (
      <PatientPageShell title="EHR Summary" description="Lỗi hệ thống" maxWidth="xl" transparent>
        <Box sx={{ py: 10, textAlign: 'center' }}>
          <AlertCircle size={64} color="#f43f5e" />
          <Typography variant="h5" sx={{ mt: 2, fontWeight: 700 }}>{error}</Typography>
          <Button variant="contained" sx={{ mt: 3, borderRadius: 3, bgcolor: 'oklch(60% 0.18 160)' }} onClick={() => window.location.reload()}>
            Thử lại
          </Button>
        </Box>
      </PatientPageShell>
    );
  }

  return (
    <PatientPageShell
      title={`EHR Summary - ${summary?.patientName}`}
      description="Tổng quan tóm tắt lâm sàng và lịch sử hồ sơ bệnh án AI"
      maxWidth="xl"
      transparent={true}
    >
      <Box sx={{ mb: 4 }}>
        <Breadcrumbs sx={{ mb: 2 }}>
          <Link 
            component="button" 
            onClick={() => navigate('/doctor/ehr/search')} 
            sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary', textDecoration: 'none', gap: 0.5, fontWeight: 600, border: 0, bgcolor: 'transparent', cursor: 'pointer' }}
          >
            <ChevronLeft size={16} /> Tìm kiếm EHR
          </Link>
          <Typography color="text.primary" sx={{ fontWeight: 600 }}>Tóm tắt bệnh án bệnh nhân</Typography>
        </Breadcrumbs>
        
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 900, color: 'oklch(20% 0.05 160)' }}>
              {summary?.patientName}
            </Typography>
            <Typography variant="body2" sx={{ color: 'oklch(50% 0.02 160)', fontWeight: 600 }}>
              Mã số bệnh nhân: #{summary?.patientId}
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<PlusCircle size={18} />}
            onClick={() => navigate(`/doctor/ehr/upload?patientId=${summary?.patientId}`)}
            sx={{
              borderRadius: '24px',
              px: 4,
              py: 1.2,
              fontWeight: 700,
              bgcolor: 'oklch(60% 0.18 160)',
              color: '#fff',
              boxShadow: '0 8px 24px oklch(60% 0.18 160 / 0.25)',
              textTransform: 'none',
              fontSize: '0.95rem',
              transition: 'all 0.3s',
              '&:hover': {
                bgcolor: 'oklch(55% 0.18 160)',
                transform: 'scale(1.02)'
              }
            }}
          >
            Nhập ghi chú lâm sàng mới
          </Button>
        </Stack>
      </Box>

      <Grid container spacing={4}>
        {/* Left Column: Chronological Clinical Notes Accordion List */}
        <Grid item xs={12} md={7}>
          <Typography variant="h5" sx={{ fontWeight: 800, color: 'oklch(20% 0.05 160)', mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
            <FileText size={22} color="oklch(60% 0.18 160)" /> Lịch sử ghi chú lâm sàng ({notes.length})
          </Typography>

          {notes.length === 0 ? (
            <Paper sx={{ p: 6, borderRadius: 6, textAlign: 'center', bgcolor: 'oklch(100% 0 0 / 0.15)', backdropFilter: 'blur(20px)', border: '1px solid oklch(100% 0 0 / 0.1)' }}>
              <Typography sx={{ color: 'oklch(50% 0.02 160)', fontWeight: 600 }}>Chưa có ghi chú lâm sàng nào được trích xuất cho bệnh nhân này.</Typography>
            </Paper>
          ) : (
            <Stack spacing={2}>
              {notes.map((note) => {
                const noteCached = noteEntitiesCache[note.id] || { entities: [], loading: false, error: '' };
                const highlightedSegments = getHighlightedSegments(note.rawText, noteCached.entities);

                return (
                  <Accordion 
                    key={note.id}
                    onChange={handleAccordionChange(note.id)}
                    sx={{
                      borderRadius: '16px !important',
                      border: '1px solid oklch(100% 0 0 / 0.1)',
                      bgcolor: 'oklch(100% 0 0 / 0.15)',
                      backdropFilter: 'blur(30px)',
                      boxShadow: 'none',
                      overflow: 'hidden',
                      '&:before': { display: 'none' },
                      transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                      '&:hover': {
                        bgcolor: 'oklch(100% 0 0 / 0.25)',
                        borderColor: 'oklch(65% 0.15 160 / 0.3)'
                      }
                    }}
                  >
                    <AccordionSummary 
                      expandIcon={<ChevronDown size={18} color="oklch(50% 0.02 160)" />}
                      sx={{ px: 3, py: 1.5 }}
                    >
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ width: '100%', pr: 1 }}>
                        <Stack spacing={0.5}>
                          <Typography sx={{ fontWeight: 800, fontSize: '1.05rem', color: 'oklch(20% 0.05 160)' }}>
                            {note.noteType === 'ADMISSION' ? 'Ghi chú nhập viện' :
                             note.noteType === 'PROGRESS' ? 'Ghi chú tiến triển' :
                             note.noteType === 'DISCHARGE' ? 'Ghi chú xuất viện' :
                             note.noteType === 'CONSULTATION' ? 'Ghi chú hội chẩn' :
                             note.noteType === 'PRESCRIPTION' ? 'Ghi chú đơn thuốc' : note.noteType}
                          </Typography>
                          <Stack direction="row" spacing={2} alignItems="center">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'oklch(50% 0.02 160)' }}>
                              <Calendar size={14} />
                              <Typography variant="caption" sx={{ fontWeight: 600 }}>{formatDate(note.createdAt)}</Typography>
                            </Box>
                            <Chip 
                              label={`${note.entityCount} thực thể`}
                              size="small"
                              sx={{ height: 20, fontSize: '0.7rem', fontWeight: 800, bgcolor: 'oklch(100% 0 0 / 0.1)', color: 'oklch(30% 0.05 160)' }}
                            />
                          </Stack>
                        </Stack>
                        <Chip
                          label={note.extractionStatus}
                          color={note.extractionStatus === 'COMPLETED' ? 'success' : note.extractionStatus === 'FAILED' ? 'error' : 'warning'}
                          size="small"
                          sx={{ fontWeight: 800, borderRadius: '6px' }}
                        />
                      </Stack>
                    </AccordionSummary>
                    <AccordionDetails sx={{ px: 3, pb: 3, borderTop: '1px solid oklch(100% 0 0 / 0.05)' }}>
                      {noteCached.loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                          <CircularProgress size={28} sx={{ color: 'oklch(60% 0.18 160)' }} />
                        </Box>
                      ) : noteCached.error ? (
                        <Alert severity="error" sx={{ borderRadius: 2 }}>{noteCached.error}</Alert>
                      ) : (
                        <Stack spacing={3}>
                          {/* Highlighted text container */}
                          <Box sx={{ p: 2.5, borderRadius: 3, bgcolor: '#ffffffcc', border: '1px solid oklch(92% 0.02 160)', lineHeight: 1.8, fontSize: '1rem', whiteSpace: 'pre-wrap', color: '#1e293b' }}>
                            {highlightedSegments.map((segment, idx) => {
                              if (typeof segment === 'string') {
                                return <span key={idx}>{segment}</span>;
                              }
                              const config = ENTITY_CONFIG[segment.entity.entityType] || { bg: '#eee', label: '#333', border: '#ccc' };
                              return (
                                <Tooltip 
                                  key={idx}
                                  title={
                                    <Box sx={{ p: 0.5 }}>
                                      <Typography variant="caption" sx={{ fontWeight: 700, display: 'block' }}>
                                        {segment.entity.entityType}
                                      </Typography>
                                      <Typography variant="caption" sx={{ display: 'block' }}>
                                        Độ tin cậy: {(segment.entity.confidenceScore * 100).toFixed(1)}%
                                      </Typography>
                                    </Box>
                                  }
                                  arrow
                                >
                                  <Box
                                    component="mark"
                                    sx={{
                                      bgcolor: config.bg,
                                      color: config.label,
                                      borderBottom: `2px solid ${config.border}`,
                                      px: 0.5,
                                      mx: 0.2,
                                      borderRadius: '4px',
                                      cursor: 'help',
                                      fontWeight: 600,
                                      transition: 'all 0.2s',
                                      '&:hover': {
                                        bgcolor: config.border,
                                        color: '#fff'
                                      }
                                    }}
                                  >
                                    {segment.content}
                                  </Box>
                                </Tooltip>
                              );
                            })}
                          </Box>

                          {/* Tag Summary chips for this expanded note */}
                          <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5}>
                            {noteCached.entities.map((e, i) => {
                              const config = ENTITY_CONFIG[e.entityType] || { bg: '#eee', label: '#333', border: '#ccc' };
                              return (
                                <Chip
                                  key={i}
                                  label={`${e.entityValue} (${e.entityType})`}
                                  size="small"
                                  sx={{ bgcolor: config.bg, color: config.label, fontWeight: 700, border: `1px solid ${config.border}33`, fontSize: '0.72rem' }}
                                />
                              );
                            })}
                          </Stack>
                        </Stack>
                      )}
                    </AccordionDetails>
                  </Accordion>
                );
              })}
            </Stack>
          )}
        </Grid>

        {/* Right Column: Consolidated Clinical Profile Islands */}
        <Grid item xs={12} md={5}>
          <Stack spacing={4}>
            {/* 1. Active Conditions */}
            <Paper sx={{ p: 3, borderRadius: 6, border: '1px solid oklch(100% 0 0 / 0.15)', bgcolor: 'oklch(100% 0 0 / 0.1)', backdropFilter: 'blur(35px)', boxShadow: 'none' }}>
              <Typography variant="h6" sx={{ fontWeight: 800, color: 'oklch(20% 0.05 160)', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Activity size={20} color="oklch(60% 0.18 160)" /> Chẩn đoán & Bệnh lý ({summary?.activeConditions?.length || 0})
              </Typography>
              <Divider sx={{ mb: 2, borderColor: 'oklch(100% 0 0 / 0.05)' }} />

              {(!summary?.activeConditions || summary.activeConditions.length === 0) ? (
                <Typography variant="body2" sx={{ color: 'oklch(50% 0.02 160)', fontStyle: 'italic' }}>Không ghi nhận bệnh lý active.</Typography>
              ) : (
                <Stack spacing={2}>
                  {summary.activeConditions.map((c) => (
                    <Box key={c.id} sx={{ p: 2, borderRadius: 3, bgcolor: '#ffffff99', border: '1px solid oklch(92% 0.02 160)' }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                        <Box>
                          <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: 'oklch(20% 0.05 160)' }}>{c.conditionName}</Typography>
                          <Typography variant="caption" sx={{ color: 'oklch(50% 0.02 160)', display: 'block', mt: 0.5, fontWeight: 600 }}>
                            Chẩn đoán ngày: {formatDate(c.diagnosedDate)}
                          </Typography>
                        </Box>
                        <Stack direction="row" spacing={0.5}>
                          <Chip 
                            size="small" 
                            label={c.severity}
                            color={c.severity === 'SEVERE' ? 'error' : c.severity === 'MODERATE' ? 'warning' : 'success'}
                            sx={{ height: 20, fontSize: '0.65rem', fontWeight: 800, borderRadius: '4px' }}
                          />
                          <Chip 
                            size="small" 
                            label={c.status}
                            variant="outlined"
                            sx={{ height: 20, fontSize: '0.65rem', fontWeight: 800, borderRadius: '4px' }}
                          />
                        </Stack>
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              )}
            </Paper>

            {/* 2. Active Medications */}
            <Paper sx={{ p: 3, borderRadius: 6, border: '1px solid oklch(100% 0 0 / 0.15)', bgcolor: 'oklch(100% 0 0 / 0.1)', backdropFilter: 'blur(35px)', boxShadow: 'none' }}>
              <Typography variant="h6" sx={{ fontWeight: 800, color: 'oklch(20% 0.05 160)', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Pill size={20} color="oklch(60% 0.18 160)" /> Thuốc đang sử dụng ({summary?.activeMedications?.length || 0})
              </Typography>
              <Divider sx={{ mb: 2, borderColor: 'oklch(100% 0 0 / 0.05)' }} />

              {(!summary?.activeMedications || summary.activeMedications.length === 0) ? (
                <Typography variant="body2" sx={{ color: 'oklch(50% 0.02 160)', fontStyle: 'italic' }}>Không có đơn thuốc active nào được ghi nhận.</Typography>
              ) : (
                <Stack spacing={2}>
                  {summary.activeMedications.map((m) => (
                    <Box key={m.id} sx={{ p: 2, borderRadius: 3, bgcolor: '#ffffff99', border: '1px solid oklch(92% 0.02 160)' }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
                        <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: 'oklch(20% 0.05 160)' }}>{m.medicationName}</Typography>
                        <Chip 
                          size="small" 
                          label={m.status}
                          color={m.status === 'ACTIVE' ? 'success' : 'default'}
                          sx={{ height: 20, fontSize: '0.65rem', fontWeight: 800, borderRadius: '4px' }}
                        />
                      </Stack>
                      <Grid container spacing={1}>
                        <Grid item xs={6}>
                          <Typography variant="caption" sx={{ color: 'oklch(50% 0.02 160)', display: 'block' }}>Liều lượng</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>{m.dosage || 'Không có'}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" sx={{ color: 'oklch(50% 0.02 160)', display: 'block' }}>Tần suất</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>{m.frequency || 'Không có'}</Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <Typography variant="caption" sx={{ color: 'oklch(50% 0.02 160)', display: 'block', mt: 0.5 }}>Ngày bắt đầu</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>{formatDate(m.startDate)}</Typography>
                        </Grid>
                      </Grid>
                    </Box>
                  ))}
                </Stack>
              )}
            </Paper>

            {/* 3. Recent Symptoms */}
            <Paper sx={{ p: 3, borderRadius: 6, border: '1px solid oklch(100% 0 0 / 0.15)', bgcolor: 'oklch(100% 0 0 / 0.1)', backdropFilter: 'blur(35px)', boxShadow: 'none' }}>
              <Typography variant="h6" sx={{ fontWeight: 800, color: 'oklch(20% 0.05 160)', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Thermometer size={20} color="oklch(60% 0.18 160)" /> Triệu chứng ghi nhận gần đây ({summary?.recentSymptoms?.length || 0})
              </Typography>
              <Divider sx={{ mb: 2, borderColor: 'oklch(100% 0 0 / 0.05)' }} />

              {(!summary?.recentSymptoms || summary.recentSymptoms.length === 0) ? (
                <Typography variant="body2" sx={{ color: 'oklch(50% 0.02 160)', fontStyle: 'italic' }}>Không ghi nhận triệu chứng nào gần đây.</Typography>
              ) : (
                <Stack spacing={2}>
                  {summary.recentSymptoms.map((s) => (
                    <Box key={s.id} sx={{ p: 2, borderRadius: 3, bgcolor: '#ffffff99', border: '1px solid oklch(92% 0.02 160)' }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                        <Box>
                          <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: 'oklch(20% 0.05 160)' }}>{s.symptomName}</Typography>
                          <Typography variant="caption" sx={{ color: 'oklch(50% 0.02 160)', display: 'block', mt: 0.5, fontWeight: 600 }}>
                            Khởi phát: {formatDate(s.onsetDate)}
                          </Typography>
                        </Box>
                        <Chip 
                          size="small" 
                          label={s.severity}
                          color={s.severity === 'SEVERE' ? 'error' : s.severity === 'MODERATE' ? 'warning' : 'success'}
                          sx={{ height: 20, fontSize: '0.65rem', fontWeight: 800, borderRadius: '4px' }}
                        />
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              )}
            </Paper>
          </Stack>
        </Grid>
      </Grid>
    </PatientPageShell>
  );
}
