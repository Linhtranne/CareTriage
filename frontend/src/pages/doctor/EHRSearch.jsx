import { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  TextField,
  Button,
  Stack,
  Alert,
  LinearProgress,
  CircularProgress,
  MenuItem,
  Chip,
  IconButton,
  Tooltip,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell
} from '@mui/material';
import PatientPageShell from '../../components/patient/PatientPageShell';
import { DataGrid } from '@mui/x-data-grid';
import {
  Search,
  RotateCcw,
  User,
  ExternalLink,
  Brain,
  AlertTriangle,
  FileSearch
} from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate } from 'react-router-dom';
import ehrApi from '../../api/ehrApi';

// Validation Schema
const schema = yup.object().shape({
  symptom: yup.string(),
  medication: yup.string(),
  condition: yup.string(),
  dateFrom: yup.string(),
  dateTo: yup.string(),
  severity: yup.string(),
}).test(
  'atLeastOne',
  'Vui lòng nhập ít nhất một tiêu chí tìm kiếm (Triệu chứng, Thuốc, hoặc Bệnh lý)',
  (values) => !!(values.symptom || values.medication || values.condition)
);

export default function EHRSearch() {
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');

  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      symptom: '',
      medication: '',
      condition: '',
      dateFrom: '',
      dateTo: '',
      severity: ''
    }
  });

  // Pre-styled Input components for high-end feel
  const inputSx = {
    width: '100%',
    '& .MuiFilledInput-root': {
      borderRadius: '28px',
      bgcolor: 'oklch(100% 0 0 / 0.15)',
      backdropFilter: 'blur(20px)',
      border: '1px solid oklch(100% 0 0 / 0.1)',
      transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      '&:hover': {
        bgcolor: 'oklch(100% 0 0 / 0.25)',
        borderColor: 'oklch(65% 0.15 160 / 0.5)',
      },
      '&.Mui-focused': {
        bgcolor: 'oklch(100% 0 0 / 0.4)',
        borderColor: 'oklch(65% 0.15 160)',
        boxShadow: 'none',
      },
      '&:before, &:after': { display: 'none' },
    },
    '& .MuiSelect-select': {
      minWidth: '180px',
      py: '12px !important',
      display: 'flex',
      alignItems: 'center',
    },
    '& .MuiInputLabel-root': {
      color: 'oklch(50% 0.02 160)',
      fontWeight: 600,
      ml: 1,
      '&.Mui-focused': { color: 'oklch(65% 0.15 160)' }
    }
  };

  const onSearch = async (data) => {
    setLoading(true);
    setError('');
    try {
      // Clean up empty params
      const params = Object.fromEntries(
        Object.entries(data).filter(([_, v]) => v !== '')
      );

      const response = await ehrApi.searchPatients(params);
      setResults(response.data.data);
      setSearched(true);
    } catch (err) {
      setError('Có lỗi xảy ra khi tìm kiếm. Vui lòng thử lại.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const onReset = () => {
    reset();
    setResults([]);
    setSearched(false);
    setError('');
  };


  return (
    <PatientPageShell
      title="EHR Search"
      description="Tìm kiếm bệnh nhân thông minh dựa trên lịch sử hồ sơ lâm sàng"
      maxWidth="xl"
      transparent={true}
    >

        {/* Zone 1: Search Form */}
      <Paper 
        elevation={0}
        sx={{ 
          p: 4, 
          borderRadius: 8, 
          border: '1px solid oklch(100% 0 0 / 0.15)', 
          bgcolor: 'oklch(100% 0 0 / 0.1)', 
          backdropFilter: 'blur(40px)',
          mb: 5,
          boxShadow: 'none',
          width: '100%'
        }}
      >
          <form onSubmit={handleSubmit(onSearch)}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={4}>
                <Controller
                  name="symptom"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Triệu chứng"
                      placeholder="Ví dụ: đau đầu, ho, sốt..."
                      variant="filled"
                      sx={inputSx}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Controller
                  name="medication"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Thuốc đang dùng"
                      placeholder="Ví dụ: Paracetamol, Insulin..."
                      variant="filled"
                      sx={inputSx}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Controller
                  name="condition"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Chẩn đoán / Bệnh lý"
                      placeholder="Ví dụ: Tiểu đường, Tăng huyết áp..."
                      variant="filled"
                      sx={inputSx}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <Controller
                  name="dateFrom"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Từ ngày"
                      type={field.value ? "date" : "text"}
                      onFocus={(e) => (e.target.type = 'date')}
                      onBlur={(e) => { if (!e.target.value) e.target.type = 'text' }}
                      variant="filled"
                      InputLabelProps={{ shrink: true }}
                      sx={inputSx}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Controller
                  name="dateTo"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Đến ngày"
                      type={field.value ? "date" : "text"}
                      onFocus={(e) => (e.target.type = 'date')}
                      onBlur={(e) => { if (!e.target.value) e.target.type = 'text' }}
                      variant="filled"
                      InputLabelProps={{ shrink: true }}
                      sx={inputSx}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Controller
                  name="severity"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      select
                      fullWidth
                      label="Mức độ nghiêm trọng"
                      variant="filled"
                      InputLabelProps={{ shrink: true }}
                      sx={inputSx}
                    >
                      <MenuItem value="">Tất cả</MenuItem>
                      <MenuItem value="MILD" sx={{ fontWeight: 600 }}>MILD (Nhẹ)</MenuItem>
                      <MenuItem value="MODERATE" sx={{ fontWeight: 600 }}>MODERATE (Vừa)</MenuItem>
                      <MenuItem value="SEVERE" sx={{ fontWeight: 600 }}>SEVERE (Nặng)</MenuItem>
                    </TextField>
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    {errors.atLeastOne && (
                      <Alert severity="warning" icon={<AlertTriangle size={20} />} sx={{ borderRadius: 2, py: 0 }}>
                        {errors.atLeastOne.message}
                      </Alert>
                    )}
                  </Box>
                  <Stack direction="row" spacing={2}>
                    <Button
                      variant="text"
                      startIcon={<RotateCcw size={18} />}
                      onClick={onReset}
                      sx={{ 
                        borderRadius: 3, 
                        fontWeight: 600, 
                        color: 'oklch(50% 0.02 160)',
                        textTransform: 'none',
                        '&:hover': { transform: 'scale(1.05)', bgcolor: 'transparent', color: 'oklch(20% 0.05 160)' }
                      }}
                    >
                      Xóa bộ lọc
                    </Button>
                    <Button
                      variant="text"
                      type="submit"
                      disabled={loading}
                      startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <Search size={20} />}
                      sx={{
                        borderRadius: 3,
                        fontWeight: 700,
                        color: 'oklch(55% 0.18 160)',
                        textTransform: 'none',
                        fontSize: '1rem',
                        '&:hover': { transform: 'scale(1.05)', bgcolor: 'transparent', color: 'oklch(50% 0.18 160)' }
                      }}
                    >
                      {loading ? 'Đang tìm...' : 'Tìm kiếm'}
                    </Button>
                  </Stack>
                </Box>
              </Grid>
            </Grid>
          </form>
        </Paper>

        {/* Zone 2: Results Table */}
        <Box
          sx={{
            '& .MuiTable-root': {
              borderCollapse: 'separate',
              borderSpacing: '0 12px',
            },
            position: 'relative'
          }}
        >
          {loading && <LinearProgress sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, bgcolor: 'transparent', '& .MuiLinearProgress-bar': { bgcolor: 'oklch(60% 0.18 160)' } }} />}

          {!searched ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 400, py: 10 }}>
              <FileSearch size={80} color="oklch(90% 0.02 160)" strokeWidth={1} />
              <Typography color="oklch(50% 0.02 160)" sx={{ mt: 2, fontWeight: 600 }}>
                Nhập tiêu chí và tìm kiếm để xem kết quả
              </Typography>
            </Box>
          ) : results.length === 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 400, py: 10 }}>
              <AlertTriangle size={80} color="oklch(90% 0.02 160)" strokeWidth={1} />
              <Typography color="oklch(50% 0.02 160)" sx={{ mt: 2, fontWeight: 600 }}>
                Không tìm thấy bệnh nhân nào khớp với tiêu chí
              </Typography>
            </Box>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, color: 'oklch(40% 0.02 160)', border: 0, pb: 1 }}>Bệnh nhân</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'oklch(40% 0.02 160)', border: 0, pb: 1 }}>Email</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600, color: 'oklch(40% 0.02 160)', border: 0, pb: 1 }}>Số ghi chú</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'oklch(40% 0.02 160)', border: 0, pb: 1 }}>Phát hiện lâm sàng</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, color: 'oklch(40% 0.02 160)', border: 0, pb: 1 }}>Hành động</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {results.map((row) => (
                  <TableRow 
                    key={row.patientId}
                    sx={{ 
                      transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                      '& td': { 
                        bgcolor: 'oklch(100% 0 0 / 0.4)', 
                        backdropFilter: 'blur(8px)',
                        borderTop: '1px solid oklch(92% 0.02 160)',
                        borderBottom: '1px solid oklch(92% 0.02 160)',
                        py: 3,
                        '&:first-of-type': { 
                          borderLeft: '1px solid oklch(92% 0.02 160)',
                          borderRadius: '16px 0 0 16px' 
                        },
                        '&:last-of-type': { 
                          borderRight: '1px solid oklch(92% 0.02 160)',
                          borderRadius: '0 16px 16px 0' 
                        }
                      },
                      '&:hover td': { 
                        bgcolor: 'oklch(100% 0 0 / 0.8)',
                        borderColor: 'oklch(65% 0.15 160)',
                      }
                    }}
                  >
                    <TableCell>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Box sx={{ bgcolor: 'oklch(96% 0.05 160)', p: 0.5, borderRadius: 2 }}>
                          <User size={18} color="oklch(55% 0.18 160)" />
                        </Box>
                        <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: 'oklch(20% 0.05 160)' }}>{row.patientName}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: 'oklch(40% 0.02 160)', fontWeight: 600 }}>{row.email}</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={row.totalNotes}
                        size="small"
                        sx={{ fontWeight: 700, bgcolor: 'oklch(100% 0 0 / 0.1)', color: 'oklch(30% 0.05 160)' }}
                      />
                    </TableCell>
                    <TableCell sx={{ maxWidth: 300 }}>
                      <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5}>
                        {row.matchedConditions?.slice(0, 2).map((c, i) => (
                          <Chip key={i} label={c} size="small" sx={{ bgcolor: 'oklch(96% 0.05 40 / 0.4)', color: 'oklch(50% 0.15 40)', fontWeight: 600, fontSize: '0.7rem' }} />
                        ))}
                        {row.matchedMedications?.slice(0, 2).map((m, i) => (
                          <Chip key={i} label={m} size="small" sx={{ bgcolor: 'oklch(96% 0.05 220 / 0.4)', color: 'oklch(50% 0.15 220)', fontWeight: 600, fontSize: '0.7rem' }} />
                        ))}
                      </Stack>
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        variant="text"
                        startIcon={<ExternalLink size={16} />}
                        onClick={() => navigate(`/doctor/ehr/summary/${row.patientId}`)}
                        sx={{ 
                          borderRadius: 2, 
                          fontWeight: 700, 
                          textTransform: 'none',
                          color: 'oklch(55% 0.18 160)',
                          '&:hover': { transform: 'scale(1.05)', bgcolor: 'transparent' }
                        }}
                      >
                        Xem EHR
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Box>

        {error && (
          <Alert severity="error" sx={{ mt: 3, borderRadius: 2 }}>
            {error}
          </Alert>
        )}
    </PatientPageShell>
  );
}
