import { useState, useRef } from 'react';
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
  CircularProgress,
  Tabs,
  Tab,
  MenuItem,
  Chip,
  IconButton
} from '@mui/material';
import {
  Brain,
  FileText,
  Upload,
  X,
  CheckCircle2,
  AlertCircle,
  Info
} from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate } from 'react-router-dom';
import ehrApi from '../../api/ehrApi';

// Validation Schema
const schema = yup.object().shape({
  patientId: yup.number()
    .typeError('Mã bệnh nhân phải là số')
    .required('Mã bệnh nhân là bắt buộc')
    .positive('Mã bệnh nhân phải là số dương')
    .integer('Mã bệnh nhân phải là số nguyên'),
  noteType: yup.string().required('Loại ghi chú là bắt buộc'),
  mode: yup.number().default(0),
  text: yup.string().when('mode', {
    is: (val) => val === 0,
    then: (s) => s.required('Vui lòng nhập văn bản lâm sàng').min(10, 'Văn bản phải có ít nhất 10 ký tự'),
    otherwise: (s) => s.optional(),
  }),
});

const NOTE_TYPES = [
  { value: 'ADMISSION', label: 'Ghi chú nhập viện' },
  { value: 'PROGRESS', label: 'Ghi chú tiến triển' },
  { value: 'DISCHARGE', label: 'Ghi chú xuất viện' },
  { value: 'CONSULTATION', label: 'Ghi chú hội chẩn' },
  { value: 'PRESCRIPTION', label: 'Ghi chú đơn thuốc' },
];

export default function EHRUpload() {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const fileInputRef = useRef(null);

  const { control, handleSubmit, formState: { errors }, watch, setValue } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      patientId: '',
      noteType: 'PROGRESS',
      text: '',
      mode: 0
    }
  });

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setValue('mode', newValue);
  };

  const onFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ];
    
    if (!validTypes.includes(selectedFile.type)) {
      setFileError('Chỉ hỗ trợ file PDF hoặc Word (.docx)');
      setFile(null);
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setFileError('Dung lượng file không được vượt quá 10MB');
      setFile(null);
      return;
    }

    setFile(selectedFile);
    setFileError('');
  };

  const onSubmit = async (data) => {
    if (tabValue === 1 && !file) {
      setFileError('Vui lòng chọn file để tải lên');
      return;
    }

    setLoading(true);
    setServerError('');
    try {
      let response;
      if (tabValue === 0) {
        // Text mode
        response = await ehrApi.extractFromText({
          text: data.text,
          patientId: data.patientId,
          noteType: data.noteType
        });
      } else {
        // File mode
        const formData = new FormData();
        formData.append('file', file);
        formData.append('patientId', data.patientId);
        formData.append('noteType', data.noteType);
        response = await ehrApi.extractFromFile(formData);
      }

      // ExtractionResultDto returns clinicalNoteId as the note identifier
      const resultDto = response.data?.data || response.data;
      const noteId = resultDto?.clinicalNoteId;
      if (!noteId) throw new Error('Không thể xác định ID ghi chú từ phản hồi server.');
      navigate(`/doctor/ehr/result/${noteId}`);
    } catch (err) {
      setServerError(err.response?.data?.message || 'Có lỗi xảy ra trong quá trình xử lý AI.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ bgcolor: '#f0fdf4', minHeight: '100vh', py: 4 }}>
      <Container maxWidth="lg">
        <Box sx={{ mb: 4 }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box sx={{ bgcolor: 'rgba(8,187,163,0.1)', p: 1, borderRadius: 3 }}>
              <Brain size={32} color="#08bba3" />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 900, color: '#0f172a' }}>
              Nhập ghi chú lâm sàng
            </Typography>
          </Stack>
        </Box>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={3}>
            {/* Left Column - Input Zone */}
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 0, borderRadius: 4, overflow: 'hidden', border: '1px solid #e2e8f0', bgcolor: '#f8fafc' }}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: '#fff' }}>
                  <Tabs value={tabValue} onChange={handleTabChange} sx={{ px: 2 }}>
                    <Tab 
                      label="Nhập văn bản" 
                      icon={<FileText size={18} />} 
                      iconPosition="start" 
                      sx={{ fontWeight: 700, minHeight: 64 }} 
                    />
                    <Tab 
                      label="Tải file lên" 
                      icon={<Upload size={18} />} 
                      iconPosition="start" 
                      sx={{ fontWeight: 700, minHeight: 64 }} 
                    />
                  </Tabs>
                </Box>

                <Box sx={{ p: 3 }}>
                  {tabValue === 0 ? (
                    <Controller
                      name="text"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          multiline
                          rows={10}
                          placeholder="Nhập ghi chú lâm sàng tại đây...
Ví dụ: Bệnh nhân đau đầu vùng chẩm, đã dùng Paracetamol 500mg nhưng không đỡ. Có triệu chứng buồn nôn, không sốt."
                          error={!!errors.text}
                          helperText={errors.text?.message}
                          sx={{ 
                            '& .MuiOutlinedInput-root': { 
                              borderRadius: 3,
                              bgcolor: '#fff'
                            } 
                          }}
                        />
                      )}
                    />
                  ) : (
                    <Box>
                      <Box
                        onClick={() => fileInputRef.current.click()}
                        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const droppedFile = e.dataTransfer.files[0];
                          if (droppedFile) {
                            onFileChange({ target: { files: [droppedFile] } });
                          }
                        }}
                        sx={{
                          border: '2px dashed #e2e8f0',
                          borderRadius: 4,
                          p: 6,
                          textAlign: 'center',
                          cursor: 'pointer',
                          bgcolor: file ? 'rgba(16, 185, 129, 0.04)' : '#fff',
                          transition: 'all 0.2s',
                          '&:hover': {
                            borderColor: '#08bba3',
                            bgcolor: 'rgba(8, 187, 163, 0.04)'
                          }
                        }}
                      >
                        <input
                          type="file"
                          hidden
                          ref={fileInputRef}
                          onChange={onFileChange}
                          accept=".pdf,.doc,.docx"
                        />
                        {file ? (
                          <Stack spacing={2} alignItems="center">
                            <Box sx={{ bgcolor: 'rgba(16, 185, 129, 0.1)', p: 2, borderRadius: '50%' }}>
                              <CheckCircle2 size={40} color="#10b981" />
                            </Box>
                            <Box>
                              <Typography variant="h6" sx={{ fontWeight: 700 }}>{file.name}</Typography>
                              <Typography variant="body2" color="text.secondary">
                                {(file.size / 1024 / 1024).toFixed(2)} MB • Sẵn sàng để phân tích
                              </Typography>
                            </Box>
                            <Button 
                              size="small" 
                              color="error" 
                              startIcon={<X size={16} />} 
                              onClick={(e) => { e.stopPropagation(); setFile(null); }}
                            >
                              Gỡ bỏ file
                            </Button>
                          </Stack>
                        ) : (
                          <Stack spacing={2} alignItems="center">
                            <Box sx={{ bgcolor: 'rgba(8, 187, 163, 0.1)', p: 2, borderRadius: '50%' }}>
                              <Upload size={40} color="#08bba3" />
                            </Box>
                            <Box>
                              <Typography variant="h6" sx={{ fontWeight: 700 }}>Kéo thả file vào đây</Typography>
                              <Typography variant="body2" color="text.secondary">
                                Hỗ trợ PDF, DOCX (Tối đa 10MB)
                              </Typography>
                            </Box>
                            <Button variant="outlined" sx={{ borderRadius: 2, fontWeight: 700 }}>
                              Chọn file từ máy tính
                            </Button>
                          </Stack>
                        )}
                      </Box>
                      {fileError && (
                        <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>{fileError}</Alert>
                      )}
                    </Box>
                  )}

                  <Grid container spacing={2} sx={{ mt: 3 }}>
                    <Grid item xs={12} sm={6}>
                      <Controller
                        name="patientId"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label="Mã bệnh nhân (Patient ID)"
                            type="number"
                            error={!!errors.patientId}
                            helperText={errors.patientId?.message}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: '#fff' } }}
                          />
                        )}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Controller
                        name="noteType"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            select
                            fullWidth
                            label="Loại ghi chú"
                            error={!!errors.noteType}
                            helperText={errors.noteType?.message}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: '#fff' } }}
                          >
                            {NOTE_TYPES.map((option) => (
                              <MenuItem key={option.value} value={option.value}>
                                {option.label}
                              </MenuItem>
                            ))}
                          </TextField>
                        )}
                      />
                    </Grid>
                  </Grid>
                </Box>
              </Paper>
            </Grid>

            {/* Right Column - Sidebar */}
            <Grid item xs={12} md={4}>
              <Stack spacing={3}>
                <Paper sx={{ p: 3, borderRadius: 4, border: '1px solid #e2e8f0', bgcolor: '#f8fafc' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Info size={20} color="#08bba3" />
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>Thông tin ghi chú</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {NOTE_TYPES.find(t => t.value === watch('noteType'))?.label}: Phân tích sâu các thực thể y khoa như thuốc, triệu chứng và bệnh lý từ văn bản của bác sĩ.
                  </Typography>
                </Paper>

                <Paper sx={{ p: 3, borderRadius: 4, border: '1px solid #e2e8f0', bgcolor: '#f8fafc' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Brain size={20} color="#08bba3" />
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>Trạng thái AI</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {loading ? (
                      <Chip 
                        icon={<CircularProgress size={16} color="inherit" />} 
                        label="Đang xử lý..." 
                        color="warning" 
                        sx={{ fontWeight: 700, borderRadius: 2 }} 
                      />
                    ) : (
                      <Chip 
                        icon={<CheckCircle2 size={16} />} 
                        label="Sẵn sàng" 
                        color="success" 
                        sx={{ fontWeight: 700, borderRadius: 2 }} 
                      />
                    )}
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                    Sử dụng mô hình Med-NLP để trích xuất dữ liệu có cấu trúc.
                  </Typography>
                </Paper>

                <Paper sx={{ p: 3, borderRadius: 4, border: '1px solid #e2e8f0', bgcolor: '#f8fafc' }}>
                  {serverError && (
                    <Alert 
                      severity="error" 
                      icon={<AlertCircle size={20} />}
                      sx={{ mb: 2, borderRadius: 2 }}
                    >
                      {serverError}
                    </Alert>
                  )}
                  <Button
                    fullWidth
                    variant="contained"
                    type="submit"
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Brain size={20} />}
                    sx={{ 
                      borderRadius: 3, 
                      py: 1.5, 
                      fontWeight: 800, 
                      bgcolor: '#10b981', 
                      '&:hover': { 
                        bgcolor: '#059669',
                        boxShadow: '0 4px 12px rgba(8, 187, 163, 0.3)'
                      },
                      transition: 'all 0.2s',
                      boxShadow: '0 4px 10px rgba(16, 185, 129, 0.2)'
                    }}
                  >
                    {loading ? 'Đang trích xuất...' : 'Phân tích với AI'}
                  </Button>
                  <Typography variant="caption" align="center" display="block" sx={{ mt: 2, color: 'text.secondary' }}>
                    Dữ liệu sẽ được bảo mật theo tiêu chuẩn HIPAA.
                  </Typography>
                </Paper>
              </Stack>
            </Grid>
          </Grid>
        </form>
      </Container>
    </Box>
  );
}
