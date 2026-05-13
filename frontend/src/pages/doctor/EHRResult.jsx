import { useState, useEffect, useMemo } from 'react';
import {
  Container,
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
  Button
} from '@mui/material';
import {
  ChevronLeft,
  FileText,
  Download,
  History,
  Activity,
  CheckCircle2,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import ehrApi from '../../api/ehrApi';

// Entity Color Map
const ENTITY_CONFIG = {
  MEDICATION: {
    bg: 'rgba(59,130,246,0.15)',
    border: '#3b82f6',
    label: '#1d4ed8',
    icon: 'Pill'
  },
  SYMPTOM: {
    bg: 'rgba(239,68,68,0.12)',
    border: '#ef4444',
    label: '#b91c1c',
    icon: 'Thermometer'
  },
  CONDITION: {
    bg: 'rgba(245,158,11,0.15)',
    border: '#f59e0b',
    label: '#92400e',
    icon: 'Activity'
  },
  DOSAGE: {
    bg: 'rgba(8,187,163,0.15)',
    border: '#08bba3',
    label: '#065f46',
    icon: 'Scale'
  },
  LAB_TEST: {
    bg: 'rgba(139,92,246,0.15)',
    border: '#8b5cf6',
    label: '#5b21b6',
    icon: 'Beaker'
  },
  PROCEDURE: {
    bg: 'rgba(236,72,153,0.15)',
    border: '#ec4899',
    label: '#9d174d',
    icon: 'Stethoscope'
  }
};

export default function EHRResult() {
  const { noteId } = useParams();
  const navigate = useNavigate();
  const [note, setNote] = useState(null);
  const [entities, setEntities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        // getEntitiesByNote returns ExtractionResultDto which contains
        // both note metadata (rawText, noteType, extractionStatus) AND all entities
        const response = await ehrApi.getEntitiesByNote(noteId);
        const dto = response.data?.data || response.data;

        setNote({
          rawText: dto.rawText,
          noteType: dto.noteType,
          extractionStatus: dto.extractionStatus,
          createdAt: dto.createdAt,
        });

        // Flatten all entity lists from the DTO into a single array
        const allEntities = [
          ...(dto.entities || []),
          ...(dto.medications || []),
          ...(dto.symptoms || []),
          ...(dto.conditions || []),
          ...(dto.dosages || []),
          ...(dto.labTests || []),
          ...(dto.procedures || []),
        ];
        // Deduplicate by entityValue + entityType in case both `entities` and typed lists overlap
        const seen = new Set();
        const deduped = allEntities.filter(e => {
          const key = `${e.entityType}__${e.entityValue}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        setEntities(deduped);
      } catch (err) {
        setError('Không thể tải kết quả phân tích. Vui lòng thử lại sau.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [noteId]);

  // Highlighting Algorithm
  const highlightedSegments = useMemo(() => {
    if (!note || !note.rawText || !entities.length) return [note?.rawText || ''];

    const text = note.rawText;
    // Resolve positions for each entity
    const processedEntities = entities.map(e => {
      let start = e.startPosition;
      let end = e.endPosition;

      // Fallback: find position in text when coordinates are absent
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

    // Overlap guard: skip entities that overlap with the previously accepted one
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
      // Plain text before this highlight
      if (entity.start > lastIndex) {
        segments.push(text.substring(lastIndex, entity.start));
      }
      // Highlighted segment
      segments.push({ type: 'highlight', content: text.substring(entity.start, entity.end), entity });
      lastIndex = entity.end;
    });

    // Remaining plain text after last entity
    if (lastIndex < text.length) {
      segments.push(text.substring(lastIndex));
    }

    return segments;
  }, [note, entities]);

  const categorizedEntities = useMemo(() => {
    const categories = {};
    entities.forEach(e => {
      if (!categories[e.entityType]) categories[e.entityType] = [];
      categories[e.entityType].push(e);
    });
    return categories;
  }, [entities]);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Skeleton variant="text" width="40%" height={40} sx={{ mb: 2 }} />
        <Grid container spacing={3}>
          <Grid item xs={12} md={7}>
            <Skeleton variant="rectangular" height={500} sx={{ borderRadius: 4 }} />
          </Grid>
          <Grid item xs={12} md={5}>
            <Stack spacing={2}>
              {[1, 2, 3].map(i => <Skeleton key={i} variant="rectangular" height={150} sx={{ borderRadius: 4 }} />)}
            </Stack>
          </Grid>
        </Grid>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 10, textAlign: 'center' }}>
        <AlertCircle size={64} color="#f43f5e" />
        <Typography variant="h5" sx={{ mt: 2, fontWeight: 700 }}>{error}</Typography>
        <Button variant="contained" sx={{ mt: 3, borderRadius: 3 }} onClick={() => window.location.reload()}>
          Thử lại
        </Button>
      </Container>
    );
  }

  return (
    <Box sx={{ bgcolor: '#f0fdf4', minHeight: '100vh', py: 4 }}>
      <Container maxWidth="lg">
        <Box sx={{ mb: 3 }}>
          <Breadcrumbs sx={{ mb: 2 }}>
            <Link 
              component="button" 
              onClick={() => navigate('/doctor/ehr/upload')} 
              sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary', textDecoration: 'none', gap: 0.5 }}
            >
              <ChevronLeft size={16} /> Danh sách
            </Link>
            <Typography color="text.primary" sx={{ fontWeight: 600 }}>Kết quả phân tích AI</Typography>
          </Breadcrumbs>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h4" sx={{ fontWeight: 900, color: '#0f172a' }}>
              Kết quả trích xuất EHR
            </Typography>
            <Chip 
              label={note.extractionStatus} 
              color={note.extractionStatus === 'COMPLETED' ? 'success' : note.extractionStatus === 'FAILED' ? 'error' : 'warning'}
              sx={{ fontWeight: 800, borderRadius: 2 }}
            />
          </Stack>
        </Box>

        <Grid container spacing={3}>
          {/* Left Column - Original Text */}
          <Grid item xs={12} md={7}>
            <Paper sx={{ p: 4, borderRadius: 4, border: '1px solid #e2e8f0', bgcolor: '#f8fafc', height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <FileText size={24} color="#08bba3" />
                <Typography variant="h6" sx={{ fontWeight: 800 }}>Văn bản lâm sàng gốc</Typography>
              </Box>
              
              <Box sx={{ 
                lineHeight: 1.8, 
                fontSize: '1.1rem', 
                color: '#1e293b',
                whiteSpace: 'pre-wrap',
                fontFamily: 'inherit'
              }}>
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

              <Stack direction="row" spacing={2} sx={{ mt: 6 }}>
                <Button 
                  variant="outlined" 
                  startIcon={<Download size={18} />}
                  sx={{ borderRadius: 2, fontWeight: 700 }}
                >
                  Tải về PDF
                </Button>
                <Button 
                  variant="text" 
                  startIcon={<History size={18} />}
                  sx={{ borderRadius: 2, fontWeight: 700, color: 'text.secondary' }}
                >
                  Xem lịch sử
                </Button>
              </Stack>
            </Paper>
          </Grid>

          {/* Right Column - Entity Cards */}
          <Grid item xs={12} md={5}>
            <Stack spacing={3}>
              {Object.entries(categorizedEntities).map(([type, list]) => {
                const config = ENTITY_CONFIG[type] || { bg: '#eee', label: '#333', border: '#ccc' };
                return (
                  <Paper key={type} sx={{ borderRadius: 4, overflow: 'hidden', border: `1px solid ${config.border}33`, bgcolor: '#f8fafc' }}>
                    <Box sx={{ bgcolor: config.bg, p: 2, borderBottom: `1px solid ${config.border}33`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="subtitle1" sx={{ fontWeight: 900, color: config.label }}>
                          {type}
                        </Typography>
                        <Chip size="small" label={list.length} sx={{ bgcolor: '#fff', color: config.label, fontWeight: 800, height: 20 }} />
                      </Stack>
                    </Box>
                    <Box sx={{ p: 2 }}>
                      <Stack spacing={1.5}>
                        {list.map((e, idx) => (
                          <Box key={idx} sx={{ p: 1.5, borderRadius: 2, bgcolor: '#fff', border: '1px solid #e2e8f0' }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                              <Box>
                                <Typography sx={{ fontWeight: 700, fontSize: '0.95rem' }}>{e.entityValue}</Typography>
                                {e.normalizedValue && e.normalizedValue !== e.entityValue && (
                                  <Typography variant="caption" sx={{ fontStyle: 'italic', color: 'text.secondary', display: 'block', mt: 0.5 }}>
                                    Chuẩn hóa: {e.normalizedValue}
                                  </Typography>
                                )}
                              </Box>
                              <Chip 
                                size="small" 
                                label={`${(e.confidenceScore * 100).toFixed(0)}%`}
                                color={e.confidenceScore >= 0.8 ? 'success' : 'warning'}
                                sx={{ height: 20, fontSize: '0.7rem', fontWeight: 800 }}
                              />
                            </Stack>
                          </Box>
                        ))}
                      </Stack>
                    </Box>
                  </Paper>
                );
              })}

              <Paper sx={{ p: 3, borderRadius: 4, border: '1px solid #e2e8f0', bgcolor: '#f8fafc' }}>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>Tổng kết</Typography>
                <Typography variant="body2" color="text.secondary">
                  Hệ thống AI đã phát hiện <strong>{entities.length} thực thể</strong> thuộc <strong>{Object.keys(categorizedEntities).length} loại</strong> khác nhau trong ghi chú này.
                </Typography>
              </Paper>
            </Stack>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
