import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  TextField,
  Button,
  IconButton,
  Autocomplete,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  Stack,
  Alert,
  CircularProgress,
  Breadcrumbs,
  Link
} from '@mui/material';
import {
  Plus,
  Trash2,
  Save,
  ChevronLeft,
  Stethoscope,
  Pill,
  FileText,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import medicalRecordApi from '../../api/medicalRecordApi';
import appointmentApi from '../../api/appointmentApi';

// Validation Schema
const schema = yup.object().shape({
  symptoms: yup.string().required('Vui lòng nhập triệu chứng lâm sàng'),
  diagnosis: yup.string().required('Vui lòng nhập chẩn đoán'),
  treatmentPlan: yup.string(),
  notes: yup.string(),
  followUpDate: yup.string().nullable(),
  medicines: yup.array().of(
    yup.object().shape({
      name: yup.string().required('Tên thuốc không được để trống'),
      quantity: yup.number().typeError('Phải là số').positive('Số lượng > 0').required('Bắt buộc'),
      unit: yup.string().required('Bắt buộc'),
      dosage: yup.string().required('Bắt buộc')
    })
  )
});

// Mock drug list for Autocomplete (T-037 Step 3)
const MOCK_DRUGS = [
  'Paracetamol 500mg', 'Amoxicillin 500mg', 'Ibuprofen 400mg', 'Ceftriaxone 1g',
  'Metformin 500mg', 'Amlodipine 5mg', 'Atorvastatin 20mg', 'Omeprazole 20mg',
  'Salbutamol inhaler', 'Gliclazide 30mg', 'Losartan 50mg', 'Augmentin 625mg'
];

const UNITS = ['Viên', 'Gói', 'Chai', 'Ống', 'Tuýp'];

export default function CreateMedicalRecord() {
  const navigate = useNavigate();
  const { appointmentId } = useParams();
  const location = useLocation();
  const patientName = new URLSearchParams(location.search).get('patientName') || 'Bệnh nhân';

  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  const { control, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      symptoms: '',
      diagnosis: '',
      treatmentPlan: '',
      notes: '',
      medicines: [{ name: '', quantity: 1, unit: 'Viên', dosage: 'Ngày uống 2 lần, mỗi lần 1 viên sau ăn' }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "medicines"
  });

  const onSubmit = async (data) => {
    setLoading(true);
    setServerError('');
    try {
      // Format prescription from medicines array
      const prescriptionStr = data.medicines
        .map(m => `- ${m.name}: ${m.quantity} ${m.unit} (${m.dosage})`)
        .join('\n');

      const payload = {
        appointmentId: parseInt(appointmentId),
        symptoms: data.symptoms,
        diagnosis: data.diagnosis,
        treatmentPlan: data.treatmentPlan,
        prescription: prescriptionStr,
        notes: data.notes,
        followUpDate: data.followUpDate
      };

      await medicalRecordApi.createRecord(payload);
      navigate('/doctor/appointments');
    } catch (err) {
      setServerError(err.response?.data?.message || 'Có lỗi xảy ra khi lưu hồ sơ.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Breadcrumbs sx={{ mb: 2 }}>
          <Link component="button" onClick={() => navigate('/doctor/appointments')} sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary', textDecoration: 'none' }}>
            <ChevronLeft size={16} /> Danh sách khám
          </Link>
          <Typography color="text.primary">Lập hồ sơ bệnh án</Typography>
        </Breadcrumbs>
        <Typography variant="h4" sx={{ fontWeight: 900, color: '#1e293b' }}>
          Hồ sơ bệnh án: {patientName}
        </Typography>
      </Box>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={3}>
          {/* Main Info Section */}
          <Grid item xs={12} md={8}>
            <Stack spacing={3}>
              <Paper sx={{ p: 3, borderRadius: 4, border: '1px solid #e2e8f0' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Stethoscope size={20} color="#10b981" />
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>Thông tin lâm sàng</Typography>
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Controller
                      name="symptoms"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Triệu chứng lâm sàng"
                          multiline
                          rows={3}
                          error={!!errors.symptoms}
                          helperText={errors.symptoms?.message}
                          placeholder="Nhập các triệu chứng bệnh nhân mô tả..."
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Controller
                      name="diagnosis"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Chẩn đoán bệnh"
                          error={!!errors.diagnosis}
                          helperText={errors.diagnosis?.message}
                          placeholder="Ví dụ: Viêm họng cấp, Cúm A..."
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Controller
                      name="treatmentPlan"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Phác đồ điều trị"
                          multiline
                          rows={2}
                          placeholder="Hướng điều trị, lời dặn chung..."
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                        />
                      )}
                    />
                  </Grid>
                </Grid>
              </Paper>

              <Paper sx={{ p: 3, borderRadius: 4, border: '1px solid #e2e8f0' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Pill size={20} color="#10b981" />
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>Đơn thuốc</Typography>
                  </Box>
                  <Button 
                    startIcon={<Plus size={18} />} 
                    onClick={() => append({ name: '', quantity: 1, unit: 'Viên', dosage: '' })}
                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
                  >
                    Thêm thuốc
                  </Button>
                </Box>
                
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700, width: '40%' }}>Tên thuốc</TableCell>
                        <TableCell sx={{ fontWeight: 700, width: '15%' }}>SL</TableCell>
                        <TableCell sx={{ fontWeight: 700, width: '15%' }}>Đơn vị</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Liều dùng & Cách dùng</TableCell>
                        <TableCell align="right"></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {fields.map((field, index) => (
                        <TableRow key={field.id}>
                          <TableCell sx={{ py: 1.5, border: 0 }}>
                            <Controller
                              name={`medicines.${index}.name`}
                              control={control}
                              render={({ field: { onChange, value } }) => (
                                <Autocomplete
                                  freeSolo
                                  options={MOCK_DRUGS}
                                  value={value}
                                  onChange={(e, val) => onChange(val)}
                                  onInputChange={(e, val) => onChange(val)}
                                  renderInput={(params) => (
                                    <TextField 
                                      {...params} 
                                      placeholder="Tìm thuốc..." 
                                      size="small" 
                                      error={!!errors.medicines?.[index]?.name}
                                    />
                                  )}
                                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                />
                              )}
                            />
                          </TableCell>
                          <TableCell sx={{ border: 0 }}>
                            <Controller
                              name={`medicines.${index}.quantity`}
                              control={control}
                              render={({ field }) => (
                                <TextField {...field} type="number" size="small" error={!!errors.medicines?.[index]?.quantity} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                              )}
                            />
                          </TableCell>
                          <TableCell sx={{ border: 0 }}>
                            <Controller
                              name={`medicines.${index}.unit`}
                              control={control}
                              render={({ field }) => (
                                <Autocomplete
                                  options={UNITS}
                                  {...field}
                                  onChange={(e, val) => field.onChange(val)}
                                  renderInput={(params) => <TextField {...params} size="small" />}
                                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                />
                              )}
                            />
                          </TableCell>
                          <TableCell sx={{ border: 0 }}>
                            <Controller
                              name={`medicines.${index}.dosage`}
                              control={control}
                              render={({ field }) => (
                                <TextField {...field} fullWidth size="small" placeholder="Lưu ý liều dùng..." error={!!errors.medicines?.[index]?.dosage} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                              )}
                            />
                          </TableCell>
                          <TableCell align="right" sx={{ border: 0 }}>
                            <IconButton color="error" onClick={() => remove(index)} disabled={fields.length === 1}>
                              <Trash2 size={18} />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Stack>
          </Grid>

          {/* Sidebar Section */}
          <Grid item xs={12} md={4}>
            <Stack spacing={3}>
              <Paper sx={{ p: 3, borderRadius: 4, border: '1px solid #e2e8f0' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Calendar size={20} color="#10b981" />
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>Thông tin thêm</Typography>
                </Box>
                <Stack spacing={2.5}>
                  <Controller
                    name="followUpDate"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Ngày tái khám"
                        type="date"
                        InputLabelProps={{ shrink: true }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                      />
                    )}
                  />
                  <Controller
                    name="notes"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Ghi chú nội bộ"
                        multiline
                        rows={3}
                        placeholder="Ghi chú thêm cho bác sĩ..."
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                      />
                    )}
                  />
                </Stack>
              </Paper>

              <Paper sx={{ p: 3, borderRadius: 4, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                {serverError && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{serverError}</Alert>}
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Sau khi lưu, trạng thái lịch hẹn sẽ chuyển thành <strong>Hoàn thành</strong>. Dữ liệu này sẽ được lưu vĩnh viễn vào hồ sơ bệnh nhân.
                </Typography>
                <Button
                  fullWidth
                  variant="contained"
                  type="submit"
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Save size={20} />}
                  sx={{ 
                    borderRadius: 3, 
                    py: 1.5, 
                    fontWeight: 800, 
                    bgcolor: '#10b981', 
                    '&:hover': { bgcolor: '#059669' },
                    boxShadow: '0 8px 20px rgba(16, 185, 129, 0.25)'
                  }}
                >
                  Lưu hồ sơ bệnh án
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => navigate('/doctor/appointments')}
                  sx={{ mt: 2, borderRadius: 3, py: 1, fontWeight: 700, color: '#64748b', borderColor: '#e2e8f0' }}
                >
                  Hủy bỏ
                </Button>
              </Paper>
            </Stack>
          </Grid>
        </Grid>
      </form>
    </Container>
  );
}
