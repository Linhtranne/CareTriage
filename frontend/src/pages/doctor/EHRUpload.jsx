import { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
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
  IconButton,
  alpha,
  useTheme,
  Divider
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
      'application/msword',
      'image/jpeg',
      'image/png',
      'image/webp'
    ];

    if (!validTypes.includes(selectedFile.type)) {
      setFileError('Chỉ hỗ trợ PDF, Word (.docx) hoặc Hình ảnh (JPG, PNG)');
      setFile(null);
      return;
    }

    if (selectedFile.size > 20 * 1024 * 1024) {
      setFileError('Dung lượng file không được vượt quá 20MB');
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

      // Success toast or direct navigation
      navigate(`/doctor/ehr/result/${noteId}`);
    } catch (err) {
      setServerError(err.response?.data?.message || 'Có lỗi xảy ra trong quá trình xử lý AI.');
    } finally {
      setLoading(false);
    }
  };

  // Pre-styled Input components for high-end feel
  const inputSx = {
    '& .MuiFilledInput-root': {
      borderRadius: 5,
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
    '& .MuiInputLabel-root': {
      color: 'oklch(50% 0.02 160)',
      fontWeight: 600,
      ml: 1,
      '&.Mui-focused': { color: 'oklch(65% 0.15 160)' }
    }
  };

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      sx={{
        bgcolor: 'oklch(98% 0.01 160)',
        minHeight: '100vh',
        py: 6,
        px: { xs: 2, md: 4, lg: 6 }
      }}
    >
      <Box sx={{ mb: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <Box>
          <Typography
            variant="h2"
            sx={{
              fontWeight: 700,
              letterSpacing: '-0.04em',
              color: 'oklch(20% 0.05 160)',
              mb: 1
            }}
          >
            Clinical Intake
          </Typography>
          <Typography variant="h6" sx={{ color: 'oklch(50% 0.02 160)', fontWeight: 500 }}>
            Hệ thống phân tích hồ sơ bệnh án thông minh
          </Typography>
        </Box>
      </Box>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack spacing={4}>
          <Paper
            elevation={0}
            sx={{
              borderRadius: 10,
              overflow: 'hidden',
              border: '1px solid oklch(100% 0 0 / 0.2)',
              bgcolor: 'oklch(100% 0 0 / 0.15)',
              backdropFilter: 'blur(50px)',
              boxShadow: 'none',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <Box sx={{ borderBottom: 1, borderColor: 'oklch(100% 0 0 / 0.1)', bgcolor: 'transparent', display: 'flex', justifyContent: 'space-between', alignItems: 'center', pr: 3 }}>
              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                sx={{
                  px: 3,
                  '& .MuiTabs-indicator': {
                    height: 2,
                    bgcolor: 'oklch(55% 0.18 160)',
                    bottom: 0,
                  },
                  '& .MuiTab-root': {
                    zIndex: 1,
                    minHeight: 80,
                    transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                    '&.Mui-selected': { color: 'oklch(55% 0.18 160)' },
                    '&:hover': { color: 'oklch(55% 0.18 160 / 0.7)' }
                  }
                }}
              >
                <Tab disableRipple label="Văn bản lâm sàng" icon={<FileText size={20} />} iconPosition="start" sx={{ fontWeight: 600, fontSize: '1rem', textTransform: 'none' }} />
                <Tab disableRipple label="Tải tập tin (PDF/DOCX)" icon={<Upload size={20} />} iconPosition="start" sx={{ fontWeight: 600, fontSize: '1rem', textTransform: 'none' }} />
              </Tabs>

              <Stack direction="row" spacing={3} alignItems="center">
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1.5,
                  bgcolor: 'transparent',
                  px: 2,
                  py: 1,
                  borderRadius: 3,
                  animation: loading ? 'none' : 'pulse 3s infinite ease-in-out',
                  '@keyframes pulse': {
                    '0%': { boxShadow: '0 0 0 0 oklch(65% 0.15 160 / 0.2)' },
                    '70%': { boxShadow: '0 0 0 10px oklch(65% 0.15 160 / 0)' },
                    '100%': { boxShadow: '0 0 0 0 oklch(65% 0.15 160 / 0)' }
                  }
                }}>
                  <Brain size={20} color={loading ? 'oklch(50% 0.15 80)' : 'oklch(55% 0.18 160)'} />
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', color: loading ? 'oklch(40% 0.15 80)' : 'oklch(45% 0.18 160)', letterSpacing: '0.05em' }}>
                      {loading ? 'AI PROCESSING' : 'ENGINE ACTIVE'}
                    </Typography>
                  </Box>
                </Box>
                <Button
                  variant="contained"
                  type="submit"
                  disabled={loading}
                  startIcon={loading ? null : <Brain size={22} />}
                  sx={{
                    borderRadius: 4,
                    px: 5,
                    py: 1.5,
                    fontWeight: 600,
                    fontSize: '1rem',
                    bgcolor: 'transparent',
                    color: 'oklch(60% 0.18 160)',
                    border: 'none',
                    boxShadow: 'none',
                     '&:hover': { transform: 'scale(1.05)', color: 'oklch(55% 0.18 160)' },
                    transition: 'all 0.3s'
                  }}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Bắt đầu trích xuất'}
                </Button>
              </Stack>
            </Box>

            <Box sx={{ p: 0 }}>
              <AnimatePresence mode="wait">
                {tabValue === 0 ? (
                  <Box key="text-mode" component={motion.div} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <Controller
                      name="text"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          multiline
                          rows={20}
                          placeholder="Bắt đầu nhập liệu ghi chú lâm sàng..."
                          error={!!errors.text}
                          helperText={errors.text?.message}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 0,
                              bgcolor: 'transparent',
                              fontSize: '1.25rem',
                              lineHeight: 1.8,
                              padding: 6,
                              border: 'none',
                              '& fieldset': { border: 'none' },
                            }
                          }}
                        />
                      )}
                    />
                  </Box>
                ) : (
                  <Box key="file-mode" component={motion.div} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', gap: 3, alignItems: 'stretch', width: '100%' }}>
                      {/* Left: Sidebar (20%) */}
                      <Box
                        onClick={() => fileInputRef.current.click()}
                        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        onDrop={(e) => { e.preventDefault(); e.stopPropagation(); const droppedFile = e.dataTransfer.files[0]; if (droppedFile) onFileChange({ target: { files: [droppedFile] } }); }}
                        sx={{
                          flex: '0 0 20%',
                          minWidth: 260,
                          border: '2px dashed oklch(85% 0.05 160)',
                          borderRadius: 6,
                          cursor: 'pointer',
                          bgcolor: file ? 'oklch(100% 0 0 / 0.15)' : 'oklch(100% 0 0 / 0.05)',
                          transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                          height: 700,
                          p: 3,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          '&:hover': { 
                            borderColor: 'oklch(65% 0.15 160)', 
                            bgcolor: 'oklch(100% 0 0 / 0.2)',
                            transform: 'scale(1.01)'
                          }
                        }}
                      >
                        <input type="file" hidden ref={fileInputRef} onChange={onFileChange} accept=".pdf,.doc,.docx,image/*" />
                        <Box sx={{
                          width: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 3,
                          textAlign: 'center'
                        }}>
                          {file ? (
                            <>
                              <CheckCircle2 size={48} color="oklch(50% 0.15 160)" />
                              <Box sx={{ width: '100%' }}>
                                <Typography
                                  variant="body1"
                                  sx={{
                                    fontWeight: 600,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    width: '100%',
                                    display: 'block',
                                    color: 'oklch(20% 0.05 160)'
                                  }}
                                  title={file.name}
                                >
                                  {file.name}
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'oklch(50% 0.02 160)', fontWeight: 600, mt: 0.5, display: 'block' }}>
                                  {(file.size / 1024 / 1024).toFixed(2)} MB
                                </Typography>
                              </Box>
                              <Button
                                variant="outlined"
                                color="error"
                                size="small"
                                startIcon={<X size={14} />}
                                onClick={(e) => { e.stopPropagation(); setFile(null); }}
                                sx={{
                                  fontWeight: 600,
                                  borderRadius: 2,
                                  textTransform: 'none',
                                  fontSize: '0.75rem',
                                  borderWidth: 2,
                                  '&:hover': { borderWidth: 2 }
                                }}
                              >
                                Xóa/Chọn lại
                              </Button>
                            </>
                          ) : (
                            <>
                              <Upload size={56} color="oklch(65% 0.15 160)" />
                              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'oklch(20% 0.05 160)' }}>Tải hồ sơ lên</Typography>
                              <Button variant="contained" size="small" sx={{ borderRadius: 2, px: 3, fontWeight: 600, bgcolor: 'oklch(65% 0.15 160)', textTransform: 'none' }}>Duyệt file</Button>
                            </>
                          )}
                        </Box>
                      </Box>

                      {/* Right: Preview (80%) */}
                      <Box
                        sx={{
                          flex: '1 1 80%',
                          height: 700,
                          borderRadius: 6,
                          overflow: 'hidden',
                          border: '1px solid oklch(92% 0.02 160)',
                          bgcolor: file ? 'white' : 'oklch(100% 0 0 / 0.05)',
                          position: 'relative',
                          boxShadow: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {!file ? (
                          <Stack alignItems="center" spacing={2} sx={{ opacity: 0.5 }}>
                            <FileText size={64} color="oklch(60% 0.02 160)" strokeWidth={1.5} />
                            <Typography variant="h6" sx={{ fontWeight: 600, color: 'oklch(40% 0.02 160)' }}>
                              Tài liệu sẽ được hiển thị xem trước ở đây
                            </Typography>
                          </Stack>
                        ) : (
                          <>
                            {file.type === 'application/pdf' ? (
                              <iframe
                                src={`${URL.createObjectURL(file)}#view=FitH`}
                                width="100%"
                                height="100%"
                                style={{ border: 'none', display: 'block' }}
                                title="Document Preview"
                              />
                            ) : file.type.startsWith('image/') ? (
                              <Box
                                component="img"
                                src={URL.createObjectURL(file)}
                                sx={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'contain'
                                }}
                                alt="Preview"
                              />
                            ) : (
                              <Stack
                                sx={{ height: '100%', p: 4 }}
                                alignItems="center"
                                justifyContent="center"
                                spacing={3}
                                textAlign="center"
                              >
                                <FileText size={80} color="oklch(80% 0.02 160)" />
                                <Box>
                                  <Typography variant="h5" sx={{ fontWeight: 600, color: 'oklch(20% 0.05 160)', mb: 1 }}>
                                    Xem trước không hỗ trợ cho tệp Word
                                  </Typography>
                                  <Typography variant="body1" sx={{ fontWeight: 600, color: 'oklch(50% 0.02 160)' }}>
                                    AI vẫn có thể trích xuất chính xác nội dung từ tệp .docx này
                                  </Typography>
                                </Box>
                                <Typography variant="caption" sx={{ color: 'oklch(60% 0.02 160)', maxWidth: '80%' }}>
                                  Do giới hạn kỹ thuật của trình duyệt đối với định dạng Microsoft Word. Vui lòng sử dụng PDF nếu bạn muốn xem trước trực tiếp.
                                </Typography>
                              </Stack>
                            )}
                          </>
                        )}
                      </Box>
                    </Box>
                  </Box>
                )}
              </AnimatePresence>

              <Box sx={{ borderTop: 1, borderColor: 'oklch(100% 0 0 / 0.1)', bgcolor: 'transparent', p: 4 }}>
                <Grid container spacing={4} alignItems="stretch">
                  <Grid item xs={12} md={3.5}>
                    <Controller
                      name="patientId"
                      control={control}
                      render={({ field }) => (
                        <TextField {...field} fullWidth variant="filled" label="Mã định danh bệnh nhân (PID)" type="number" error={!!errors.patientId} helperText={errors.patientId?.message} sx={{ ...inputSx, '& .MuiFilledInput-root': { ...inputSx['& .MuiFilledInput-root'], height: 80 } }} />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} md={3.5}>
                    <Controller
                      name="noteType"
                      control={control}
                      render={({ field }) => (
                        <TextField {...field} select fullWidth variant="filled" label="Phân loại ghi chú" error={!!errors.noteType} helperText={errors.noteType?.message} sx={{ ...inputSx, '& .MuiFilledInput-root': { ...inputSx['& .MuiFilledInput-root'], height: 80 } }}>
                          {NOTE_TYPES.map((option) => (<MenuItem key={option.value} value={option.value} sx={{ fontWeight: 600, py: 2, fontSize: '1rem' }}>{option.label}</MenuItem>))}
                        </TextField>
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} md={5}>
                    <Box sx={{
                      bgcolor: 'oklch(65% 0.15 160 / 0.08)',
                      p: 2.5,
                      borderRadius: 5,
                      border: '1px solid oklch(100% 0 0 / 0.1)',
                      height: 80,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2
                    }}>
                      <Info size={28} color="oklch(65% 0.15 160)" />
                      <Typography variant="body2" sx={{ fontWeight: 600, color: 'oklch(30% 0.05 160)', lineHeight: 1.4, fontSize: '0.85rem' }}>
                        Áp dụng AI Engine chuyên biệt cho <strong>{NOTE_TYPES.find(t => t.value === watch('noteType'))?.label}</strong> để tối ưu độ chính xác.
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </Box>
          </Paper>

          {serverError && (
            <Alert severity="error" variant="filled" sx={{ borderRadius: 4, p: 2 }}>{serverError}</Alert>
          )}

          <Typography variant="caption" align="center" sx={{ color: 'oklch(50% 0.02 160)', fontWeight: 600 }}>
            Tuân thủ bảo mật HIPAA & GDPR
          </Typography>
        </Stack>
      </form>
    </Box>
  );
}
