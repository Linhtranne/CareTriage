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
  Tooltip
} from '@mui/material';
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

  const columns = [
    { 
      field: 'patientName', 
      headerName: 'Bệnh nhân', 
      width: 220,
      renderCell: (params) => (
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ height: '100%' }}>
          <Box sx={{ bgcolor: 'rgba(8,187,163,0.1)', p: 0.5, borderRadius: 2 }}>
            <User size={18} color="#08bba3" />
          </Box>
          <Typography sx={{ fontWeight: 700, fontSize: '0.9rem' }}>{params.value}</Typography>
        </Stack>
      )
    },
    { 
      field: 'email', 
      headerName: 'Email', 
      width: 220,
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary">{params.value}</Typography>
      )
    },
    { 
      field: 'totalNotes', 
      headerName: 'Số ghi chú', 
      width: 120,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Chip 
          label={params.value} 
          size="small" 
          sx={{ fontWeight: 800, bgcolor: 'rgba(0,0,0,0.05)' }} 
        />
      )
    },
    {
      field: 'matchedMedications',
      headerName: 'Thuốc active',
      width: 250,
      renderCell: (params) => (
        <Stack direction="row" spacing={0.5} sx={{ overflow: 'hidden', height: '100%', alignItems: 'center' }}>
          {params.value?.slice(0, 2).map((med, idx) => (
            <Chip 
              key={idx} 
              label={med} 
              size="small" 
              variant="outlined"
              sx={{ borderColor: '#3b82f6', color: '#1d4ed8', fontWeight: 600, fontSize: '0.75rem' }} 
            />
          ))}
          {params.value?.length > 2 && (
            <Typography variant="caption" color="text.secondary">+{params.value.length - 2}</Typography>
          )}
        </Stack>
      )
    },
    {
      field: 'matchedConditions',
      headerName: 'Bệnh lý',
      width: 200,
      renderCell: (params) => (
        <Stack direction="row" spacing={0.5} sx={{ overflow: 'hidden', height: '100%', alignItems: 'center' }}>
          {params.value?.slice(0, 2).map((cond, idx) => (
            <Chip 
              key={idx} 
              label={cond} 
              size="small" 
              variant="outlined"
              sx={{ borderColor: '#f59e0b', color: '#92400e', fontWeight: 600, fontSize: '0.75rem' }} 
            />
          ))}
          {params.value?.length > 2 && (
            <Typography variant="caption" color="text.secondary">+{params.value.length - 2}</Typography>
          )}
        </Stack>
      )
    },
    {
      field: 'matchedSymptoms',
      headerName: 'Triệu chứng',
      width: 200,
      renderCell: (params) => (
        <Stack direction="row" spacing={0.5} sx={{ overflow: 'hidden', height: '100%', alignItems: 'center' }}>
          {params.value?.slice(0, 2).map((sym, idx) => (
            <Chip 
              key={idx} 
              label={sym} 
              size="small" 
              variant="outlined"
              sx={{ borderColor: '#ef4444', color: '#b91c1c', fontWeight: 600, fontSize: '0.75rem' }} 
            />
          ))}
        </Stack>
      )
    },
    {
      field: 'actions',
      headerName: 'Hành động',
      width: 140,
      sortable: false,
      renderCell: (params) => (
        <Button
          size="small"
          startIcon={<ExternalLink size={14} />}
          onClick={() => navigate(`/doctor/ehr/summary/${params.row.patientId}`)}
          sx={{ borderRadius: 2, fontWeight: 700, fontSize: '0.75rem' }}
        >
          Xem EHR
        </Button>
      )
    }
  ];

  return (
    <Box sx={{ bgcolor: '#f0fdf4', minHeight: '100vh', py: 4 }}>
      <Container maxWidth="xl">
        <Box sx={{ mb: 4 }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box sx={{ bgcolor: 'rgba(8,187,163,0.1)', p: 1, borderRadius: 3 }}>
              <Search size={32} color="#08bba3" />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 900, color: '#0f172a' }}>
              Tìm kiếm bệnh nhân theo EHR
            </Typography>
          </Stack>
        </Box>

        {/* Zone 1: Search Form */}
        <Paper sx={{ p: 3, borderRadius: 4, border: '1px solid #e2e8f0', bgcolor: '#f8fafc', mb: 3 }}>
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
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: '#fff' } }}
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
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: '#fff' } }}
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
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: '#fff' } }}
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
                      type="date"
                      InputLabelProps={{ shrink: true }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: '#fff' } }}
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
                      type="date"
                      InputLabelProps={{ shrink: true }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: '#fff' } }}
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
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: '#fff' } }}
                    >
                      <MenuItem value="">Tất cả</MenuItem>
                      <MenuItem value="MILD">MILD (Nhẹ)</MenuItem>
                      <MenuItem value="MODERATE">MODERATE (Vừa)</MenuItem>
                      <MenuItem value="SEVERE">SEVERE (Nặng)</MenuItem>
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
                      variant="outlined" 
                      startIcon={<RotateCcw size={18} />} 
                      onClick={onReset}
                      sx={{ borderRadius: 2.5, fontWeight: 700 }}
                    >
                      Xóa bộ lọc
                    </Button>
                    <Button 
                      variant="contained" 
                      type="submit" 
                      disabled={loading}
                      startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <Search size={18} />}
                      sx={{ 
                        borderRadius: 2.5, 
                        fontWeight: 800, 
                        bgcolor: '#10b981', 
                        px: 4,
                        '&:hover': { bgcolor: '#059669', boxShadow: '0 4px 12px rgba(8, 187, 163, 0.3)' } 
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
        <Paper sx={{ borderRadius: 4, overflow: 'hidden', border: '1px solid #e2e8f0', bgcolor: '#fff', position: 'relative' }}>
          {loading && <LinearProgress sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, bgcolor: 'rgba(8,187,163,0.1)', '& .MuiLinearProgress-bar': { bgcolor: '#08bba3' } }} />}
          
          <Box sx={{ height: 600, width: '100%' }}>
            {!searched ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', py: 10 }}>
                <FileSearch size={80} color="#e2e8f0" strokeWidth={1} />
                <Typography color="text.secondary" sx={{ mt: 2, fontWeight: 500 }}>
                  Nhập tiêu chí và tìm kiếm để xem kết quả
                </Typography>
              </Box>
            ) : results.length === 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', py: 10 }}>
                <AlertTriangle size={80} color="#e2e8f0" strokeWidth={1} />
                <Typography color="text.secondary" sx={{ mt: 2, fontWeight: 500 }}>
                  Không tìm thấy bệnh nhân nào khớp với tiêu chí
                </Typography>
              </Box>
            ) : (
              <DataGrid
                rows={results}
                columns={columns}
                getRowId={(row) => row.patientId}
                pageSizeOptions={[10, 25, 50]}
                initialState={{
                  pagination: { paginationModel: { pageSize: 10 } },
                }}
                disableRowSelectionOnClick
                sx={{
                  border: 'none',
                  '& .MuiDataGrid-columnHeaders': {
                    bgcolor: '#f8fafc',
                    color: '#64748b',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    fontSize: '0.75rem',
                    letterSpacing: '0.05em'
                  },
                  '& .MuiDataGrid-cell': {
                    borderBottom: '1px solid #f1f5f9'
                  },
                  '& .MuiDataGrid-footerContainer': {
                    borderTop: '1px solid #e2e8f0',
                    bgcolor: '#f8fafc'
                  }
                }}
              />
            )}
          </Box>
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mt: 3, borderRadius: 2 }}>
            {error}
          </Alert>
        )}
      </Container>
    </Box>
  );
}
