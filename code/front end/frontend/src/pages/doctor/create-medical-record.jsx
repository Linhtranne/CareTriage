import { useState } from 'react';
import {
  Typography,
  Box,
  Grid,
  Button,
  IconButton,
  Autocomplete,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stack,
  Alert,
  CircularProgress,
  TextField,
} from '@mui/material';
import {
  Plus,
  Trash2,
  Save,
  ChevronLeft,
  Stethoscope,
  Pill,
  Calendar,
  ClipboardList,
  Activity,
  FileText,
  AlertCircle
} from 'lucide-react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import medicalRecordApi from '../../services/medical-record-service';
import DoctorPageShell from '../../components/doctor/doctor-page-shell';
import CustomTextField from '../../components/common/custom-text-field';
import InteractiveParticles from '../../components/common/interactive-particles';
import { motion, AnimatePresence } from 'framer-motion';

// Validation Schema
const schema = yup.object().shape({
  symptoms: yup.string().required('Vui lÃ²ng nháº­p triá»‡u chá»©ng lÃ¢m sÃ ng'),
  diagnosis: yup.string().required('Vui lÃ²ng nháº­p cháº©n Ä‘oÃ¡n'),
  treatmentPlan: yup.string(),
  notes: yup.string(),
  followUpDate: yup.string().nullable(),
  medicines: yup.array().of(
    yup.object().shape({
      name: yup.string().required('TÃªn thuá»‘c khÃ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng'),
      quantity: yup.number().typeError('Pháº£i lÃ  sá»‘').positive('Sá»‘ lÆ°á»£ng > 0').required('Báº¯t buá»™c'),
      unit: yup.string().required('Báº¯t buá»™c'),
      dosage: yup.string().required('Báº¯t buá»™c')
    })
  )
});

const MOCK_DRUGS = [
  'Paracetamol 500mg', 'Amoxicillin 500mg', 'Ibuprofen 400mg', 'Ceftriaxone 1g',
  'Metformin 500mg', 'Amlodipine 5mg', 'Atorvastatin 20mg', 'Omeprazole 20mg',
  'Salbutamol inhaler', 'Gliclazide 30mg', 'Losartan 50mg', 'Augmentin 625mg'
];

const UNITS = ['ViÃªn', 'GÃ³i', 'Chai', 'á»ng', 'TuÃ½p'];

export default function CreateMedicalRecord() {
  const navigate = useNavigate();
  const { appointmentId } = useParams();
  const location = useLocation();
  const patientName = new URLSearchParams(location.search).get('patientName') || 'Bá»‡nh nhÃ¢n';

  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      symptoms: '',
      diagnosis: '',
      treatmentPlan: '',
      notes: '',
      medicines: [{ name: '', quantity: 1, unit: 'ViÃªn', dosage: 'NgÃ y uá»‘ng 2 láº§n, má»—i láº§n 1 viÃªn sau Äƒn' }]
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
      setServerError(err.response?.data?.message || 'CÃ³ lá»—i xáº£y ra khi lÆ°u há»“ sÆ¡.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DoctorPageShell
      title={patientName}
      subtitle="Láº­p há»“ sÆ¡ bá»‡nh Ã¡n chi tiáº¿t vÃ  kÃª Ä‘Æ¡n thuá»‘c cho bá»‡nh nhÃ¢n."
      badge="Clinical Workspace"
      actions={
        <Button
          variant="text"
          startIcon={<ChevronLeft size={20} />}
          onClick={() => navigate('/doctor/appointments')}
          sx={{ 
            fontWeight: 950, 
            color: 'oklch(60% 0.02 250)', 
            textTransform: 'none',
            transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            '&:hover': { transform: 'translateX(-4px)', color: 'oklch(20% 0.05 250)', bgcolor: 'transparent' }
          }}
        >
          Quay láº¡i danh sÃ¡ch
        </Button>
      }
    >
      <Box sx={{ position: 'relative', mb: 8 }}>
        <Box sx={{ 
          position: 'absolute', top: -100, left: -40, right: -40, bottom: -40, 
          borderRadius: 12, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 
        }}>
          <InteractiveParticles mode="neural" color="16, 185, 129" />
        </Box>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={4}>
            {/* Main Column */}
            <Grid size={{ xs: 12, lg: 8 }} >
              <Stack spacing={4}>
                {/* Clinical Info */}
                <Box sx={{ 
                  p: 6, borderRadius: 8, bgcolor: 'white', 
                  border: '1px solid oklch(92% 0.02 250)',
                  boxShadow: '0 20px 40px oklch(20% 0.05 250 / 0.03)',
                  position: 'relative', zIndex: 1
                }}>
                  <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 4 }}>
                    <Box sx={{ 
                      p: 1.5, borderRadius: 3, bgcolor: 'oklch(96% 0.01 160)', color: 'oklch(65% 0.15 160)' 
                    }}>
                      <Stethoscope size={24} strokeWidth={2.5} />
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 900, color: 'oklch(20% 0.05 250)', letterSpacing: '-0.02em' }}>
                      ThÃ´ng tin lÃ¢m sÃ ng
                    </Typography>
                  </Stack>

                  <Stack spacing={4}>
                    <Controller
                      name="symptoms"
                      control={control}
                      render={({ field }) => (
                        <CustomTextField
                          {...field}
                          label="Triá»‡u chá»©ng lÃ¢m sÃ ng"
                          multiline
                          rows={3}
                          error={errors.symptoms?.message}
                          icon={<Activity />}
                          placeholder="Nháº­p cÃ¡c triá»‡u chá»©ng bá»‡nh nhÃ¢n mÃ´ táº£..."
                        />
                      )}
                    />

                    <Controller
                      name="diagnosis"
                      control={control}
                      render={({ field }) => (
                        <CustomTextField
                          {...field}
                          label="Cháº©n Ä‘oÃ¡n bá»‡nh"
                          error={errors.diagnosis?.message}
                          icon={<ClipboardList />}
                          placeholder="VÃ­ dá»¥: ViÃªm há»ng cáº¥p, CÃºm A..."
                        />
                      )}
                    />

                    <Controller
                      name="treatmentPlan"
                      control={control}
                      render={({ field }) => (
                        <CustomTextField
                          {...field}
                          label="PhÃ¡c Ä‘á»“ Ä‘iá»u trá»‹"
                          multiline
                          rows={2}
                          icon={<FileText />}
                          placeholder="HÆ°á»›ng Ä‘iá»u trá»‹, lá»i dáº·n chung..."
                        />
                      )}
                    />
                  </Stack>
                </Box>

                {/* Prescription */}
                <Box sx={{ 
                  p: 6, borderRadius: 8, bgcolor: 'white', 
                  border: '1px solid oklch(92% 0.02 250)',
                  boxShadow: '0 20px 40px oklch(20% 0.05 250 / 0.03)',
                  position: 'relative', zIndex: 1
                }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Box sx={{ 
                        p: 1.5, borderRadius: 3, bgcolor: 'oklch(96% 0.01 160)', color: 'oklch(65% 0.15 160)' 
                      }}>
                        <Pill size={24} strokeWidth={2.5} />
                      </Box>
                      <Typography variant="h5" sx={{ fontWeight: 900, color: 'oklch(20% 0.05 250)', letterSpacing: '-0.02em' }}>
                        ÄÆ¡n thuá»‘c
                      </Typography>
                    </Stack>
                    <Button 
                      startIcon={<Plus size={18} strokeWidth={2.5} />} 
                      onClick={() => append({ name: '', quantity: 1, unit: 'ViÃªn', dosage: '' })}
                      sx={{ 
                        borderRadius: 3, textTransform: 'none', fontWeight: 950, 
                        color: 'oklch(65% 0.15 160)', bgcolor: 'oklch(96% 0.01 160)',
                        px: 3,
                        transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                        '&:hover': { transform: 'translateY(-2px)', bgcolor: 'oklch(92% 0.02 160)' }
                      }}
                    >
                      ThÃªm thuá»‘c
                    </Button>
                  </Stack>
                  
                  <TableContainer sx={{ border: '1px solid oklch(94% 0.02 250)', borderRadius: 4, overflow: 'hidden' }}>
                    <Table>
                      <TableHead sx={{ bgcolor: 'oklch(98% 0.01 250)' }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 950, color: 'oklch(40% 0.02 250)', textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.1em' }}>TÃªn thuá»‘c</TableCell>
                          <TableCell sx={{ fontWeight: 950, color: 'oklch(40% 0.02 250)', textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.1em' }}>SL</TableCell>
                          <TableCell sx={{ fontWeight: 950, color: 'oklch(40% 0.02 250)', textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.1em' }}>ÄÆ¡n vá»‹</TableCell>
                          <TableCell sx={{ fontWeight: 950, color: 'oklch(40% 0.02 250)', textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.1em' }}>Liá»u dÃ¹ng & CÃ¡ch dÃ¹ng</TableCell>
                          <TableCell align="right"></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        <AnimatePresence>
                          {fields.map((field, index) => (
                            <TableRow 
                              component={motion.tr}
                              key={field.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              sx={{ '&:last-child td': { border: 0 } }}
                            >
                              <TableCell sx={{ py: 2 }}>
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
                                          placeholder="TÃ¬m thuá»‘c..." 
                                          size="small" 
                                          error={!!errors.medicines?.[index]?.name}
                                          sx={{ 
                                            '& .MuiOutlinedInput-root': { 
                                              borderRadius: 2.5,
                                              bgcolor: 'oklch(98% 0.01 250)',
                                              '& fieldset': { borderColor: 'oklch(92% 0.02 250)' }
                                            }
                                          }}
                                        />
                                      )}
                                    />
                                  )}
                                />
                              </TableCell>
                              <TableCell>
                                <Controller
                                  name={`medicines.${index}.quantity`}
                                  control={control}
                                  render={({ field }) => (
                                    <TextField 
                                      {...field} 
                                      type="number" 
                                      size="small" 
                                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5, bgcolor: 'oklch(98% 0.01 250)', '& fieldset': { borderColor: 'oklch(92% 0.02 250)' } } }} 
                                    />
                                  )}
                                />
                              </TableCell>
                              <TableCell>
                                <Controller
                                  name={`medicines.${index}.unit`}
                                  control={control}
                                  render={({ field }) => (
                                    <Autocomplete
                                      options={UNITS}
                                      value={field.value}
                                      onChange={(e, val) => field.onChange(val)}
                                      renderInput={(params) => <TextField {...params} size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5, bgcolor: 'oklch(98% 0.01 250)', '& fieldset': { borderColor: 'oklch(92% 0.02 250)' } } }} />}
                                    />
                                  )}
                                />
                              </TableCell>
                              <TableCell>
                                <Controller
                                  name={`medicines.${index}.dosage`}
                                  control={control}
                                  render={({ field }) => (
                                    <TextField 
                                      {...field} 
                                      fullWidth 
                                      size="small" 
                                      placeholder="LÆ°u Ã½ liá»u dÃ¹ng..." 
                                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5, bgcolor: 'oklch(98% 0.01 250)', '& fieldset': { borderColor: 'oklch(92% 0.02 250)' } } }} 
                                    />
                                  )}
                                />
                              </TableCell>
                              <TableCell align="right">
                                <IconButton 
                                  onClick={() => remove(index)} 
                                  disabled={fields.length === 1}
                                  sx={{ 
                                    color: 'oklch(60% 0.15 20)', 
                                    bgcolor: 'oklch(98% 0.01 20)',
                                    '&:hover': { bgcolor: 'oklch(94% 0.02 20)' }
                                  }}
                                >
                                  <Trash2 size={18} />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          ))}
                        </AnimatePresence>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              </Stack>
            </Grid>

            {/* Sidebar Column */}
            <Grid size={{ xs: 12, lg: 4 }} >
              <Stack spacing={4}>
                <Box sx={{ 
                  p: 6, borderRadius: 8, bgcolor: 'white', 
                  border: '1px solid oklch(92% 0.02 250)',
                  boxShadow: '0 20px 40px oklch(20% 0.05 250 / 0.03)',
                  position: 'relative', zIndex: 1
                }}>
                  <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 4 }}>
                    <Box sx={{ 
                      p: 1.5, borderRadius: 3, bgcolor: 'oklch(96% 0.01 160)', color: 'oklch(65% 0.15 160)' 
                    }}>
                      <Calendar size={24} strokeWidth={2.5} />
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 900, color: 'oklch(20% 0.05 250)', letterSpacing: '-0.02em' }}>
                      ThÃ´ng tin bá»• sung
                    </Typography>
                  </Stack>

                  <Stack spacing={4}>
                    <Controller
                      name="followUpDate"
                      control={control}
                      render={({ field }) => (
                        <CustomTextField
                          {...field}
                          label="NgÃ y tÃ¡i khÃ¡m"
                          type="date"
                          icon={<Calendar />}
                        />
                      )}
                    />
                    <Controller
                      name="notes"
                      control={control}
                      render={({ field }) => (
                        <CustomTextField
                          {...field}
                          label="Ghi chÃº ná»™i bá»™"
                          multiline
                          rows={3}
                          icon={<FileText />}
                          placeholder="Ghi chÃº thÃªm cho bÃ¡c sÄ©..."
                        />
                      )}
                    />
                  </Stack>
                </Box>

                <Box sx={{ 
                  p: 6, borderRadius: 8, bgcolor: 'oklch(98% 0.01 250)', 
                  border: '1px solid oklch(92% 0.02 250)',
                  position: 'relative', zIndex: 1
                }}>
                  {serverError && (
                    <Alert 
                      severity="error" 
                      icon={<AlertCircle size={20} />}
                      sx={{ mb: 4, borderRadius: 4, fontWeight: 700 }}
                    >
                      {serverError}
                    </Alert>
                  )}
                  
                  <Typography variant="body2" sx={{ mb: 4, color: 'oklch(50% 0.02 250)', lineHeight: 1.6, fontWeight: 500 }}>
                    XÃ¡c nháº­n thÃ´ng tin bá»‡nh Ã¡n vÃ  Ä‘Æ¡n thuá»‘c. Sau khi lÆ°u, tráº¡ng thÃ¡i lá»‹ch háº¹n sáº½ chuyá»ƒn thÃ nh <strong style={{ color: 'oklch(20% 0.05 250)' }}>HoÃ n thÃ nh</strong>.
                  </Typography>

                  <Stack spacing={2}>
                    <Button
                      fullWidth
                      variant="contained"
                      type="submit"
                      disabled={loading}
                      startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Save size={20} strokeWidth={2.5} />}
                      sx={{ 
                        borderRadius: 4, 
                        py: 2, 
                        fontWeight: 950, 
                        bgcolor: 'oklch(65% 0.15 160)', 
                        boxShadow: '0 20px 40px oklch(65% 0.15 160 / 0.25)',
                        transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                        '&:hover': { 
                          bgcolor: 'oklch(55% 0.15 160)',
                          transform: 'translateY(-4px)',
                          boxShadow: '0 30px 60px oklch(65% 0.15 160 / 0.35)'
                        }
                      }}
                    >
                      LÆ°u há»“ sÆ¡ bá»‡nh Ã¡n
                    </Button>
                    <Button
                      fullWidth
                      variant="text"
                      onClick={() => navigate('/doctor/appointments')}
                      sx={{ 
                        py: 1.5, 
                        fontWeight: 950, 
                        color: 'oklch(60% 0.02 250)',
                        transition: 'all 0.3s ease',
                        '&:hover': { color: 'oklch(20% 0.05 250)', bgcolor: 'oklch(96% 0.01 250)' }
                      }}
                    >
                      Há»§y bá»
                    </Button>
                  </Stack>
                </Box>
              </Stack>
            </Grid>
          </Grid>
        </form>
      </Box>
    </DoctorPageShell>
  );
}
