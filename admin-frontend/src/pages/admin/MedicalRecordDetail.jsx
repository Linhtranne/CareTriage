import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, Typography, Card, CardContent, Grid, Divider, 
  Chip, Button, IconButton, Avatar, Paper, Skeleton,
  Alert, Stack, useTheme
} from '@mui/material';
import { 
  Printer, Download, ArrowLeft, Calendar, User, 
  Stethoscope, Pill, ClipboardList, Activity,
  FileText, ImageIcon, Clock, ChevronRight
} from 'lucide-react';
import medicalRecordApi from '../../api/medicalRecordApi';

const SectionHeader = ({ icon: Icon, title, color = '#10b981' }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
    <Box sx={{ 
      p: 1, 
      borderRadius: 1.5, 
      bgcolor: `${color}15`, 
      color: color,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <Icon size={20} />
    </Box>
    <Typography variant="h6" sx={{ fontWeight: 800, color: '#1e293b', textTransform: 'uppercase', fontSize: '0.9rem', letterSpacing: '0.05em' }}>
      {title}
    </Typography>
  </Box>
);

const InfoItem = ({ label, value, fullWidth = false }) => (
  <Grid xs={12} md={fullWidth ? 12 : 6} lg={fullWidth ? 12 : 4}>
    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, display: 'block', mb: 0.5 }}>
      {label}
    </Typography>
    <Typography variant="body2" sx={{ fontWeight: 700, color: '#334155' }}>
      {value || '---'}
    </Typography>
  </Grid>
);

export default function MedicalRecordDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [record, setRecord] = useState(null);

  useEffect(() => {
    const fetchRecord = async () => {
      try {
        setLoading(true);
        const res = await medicalRecordApi.getRecordById(id);
        if (res.data.success) {
          setRecord(res.data.data);
        } else {
          setError(res.data.message || 'Không thể tải hồ sơ');
        }
      } catch (err) {
        console.error('Error fetching record:', err);
        setError('Lỗi kết nối máy chủ');
      } finally {
        setLoading(false);
      }
    };
    fetchRecord();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <Box sx={{ p: 4 }}>
        <Skeleton variant="text" width="40%" height={60} sx={{ mb: 4 }} />
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 4 }} />
          </Grid>
          <Grid item xs={12} md={8}>
            <Skeleton variant="rectangular" height={600} sx={{ borderRadius: 4 }} />
          </Grid>
        </Grid>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Button startIcon={<ArrowLeft />} onClick={() => navigate(-1)}>Quay lại</Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200, mx: 'auto' }}>
      {/* Print View Styles */}
      <style>
        {`
          @media print {
            body { background: white !important; }
            .no-print { display: none !important; }
            .print-only { display: block !important; }
            .MuiCard-root { border: none !important; box-shadow: none !important; }
            .MuiPaper-root { border: none !important; box-shadow: none !important; }
            @page { margin: 1.5cm; }
          }
          .print-only { display: none; }
        `}
      </style>

      {/* Header Actions */}
      <Box className="no-print" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate(-1)} sx={{ bgcolor: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <ArrowLeft size={20} />
          </IconButton>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 900, color: '#1e293b' }}>
              Chi tiết Hồ sơ bệnh án
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
              Mã hồ sơ: #MR-{id.toString().padStart(6, '0')}
            </Typography>
          </Box>
        </Box>
        <Stack direction="row" spacing={1.5}>
          <Button 
            variant="outlined" 
            startIcon={<Printer size={18} />}
            onClick={handlePrint}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
          >
            In hồ sơ
          </Button>
          <Button 
            variant="contained" 
            startIcon={<Download size={18} />}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' } }}
          >
            Xuất PDF
          </Button>
        </Stack>
      </Box>

      <Grid container spacing={3}>
        {/* Left Column: Summary & Patient Info */}
        <Grid xs={12} md={4}>
          <Stack spacing={3}>
            {/* Patient Profile Card */}
            <Card sx={{ borderRadius: 4, overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              <Box sx={{ p: 3, bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'center' }}>
                <Avatar sx={{ width: 80, height: 80, mx: 'auto', mb: 2, bgcolor: '#10b981', fontSize: '1.5rem', fontWeight: 900 }}>
                  {record.patientName?.charAt(0)}
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#1e293b' }}>{record.patientName}</Typography>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                  ID Bệnh nhân: P-{record.patientId?.toString().padStart(5, '0')}
                </Typography>
              </Box>
              <CardContent sx={{ p: 3 }}>
                <SectionHeader icon={User} title="Thông tin hành chính" />
                <Grid container spacing={2}>
                  <InfoItem label="Giới tính" value={record.patientGender || 'Nam'} />
                  <InfoItem label="Ngày sinh" value={record.patientDob || '15/05/1990'} />
                  <InfoItem label="Số điện thoại" value={record.patientPhone || '0912345678'} />
                  <InfoItem label="Địa chỉ" value={record.patientAddress || 'Hà Nội, Việt Nam'} fullWidth />
                </Grid>
              </CardContent>
            </Card>

            {/* Exam Summary Card */}
            <Card sx={{ borderRadius: 4, border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              <CardContent sx={{ p: 3 }}>
                <SectionHeader icon={Stethoscope} title="Thông tin lượt khám" color="#3b82f6" />
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Calendar size={18} color="#64748b" />
                    <Box>
                      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>Ngày khám</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{new Date(record.createdAt).toLocaleString('vi-VN')}</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <User size={18} color="#64748b" />
                    <Box>
                      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>Bác sĩ phụ trách</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>BS. {record.doctorName}</Typography>
                      <Typography variant="caption" sx={{ color: '#3b82f6', fontWeight: 700 }}>{record.doctorSpecialization}</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Activity size={18} color="#64748b" />
                    <Box>
                      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>Chuyên khoa</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{record.departmentName}</Typography>
                    </Box>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid>

        {/* Right Column: Medical Details */}
        <Grid xs={12} md={8}>
          <Card sx={{ borderRadius: 4, border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', mb: 3 }}>
            <CardContent sx={{ p: 4 }}>
              {/* Lý do khám & Bệnh sử */}
              <Box sx={{ mb: 4 }}>
                <SectionHeader icon={ClipboardList} title="Lý do khám & Bệnh sử" color="#8b5cf6" />
                <Paper variant="outlined" sx={{ p: 2, bgcolor: '#fbfcfe', borderStyle: 'dashed', borderColor: '#d1d5db', borderRadius: 2 }}>
                  <Typography variant="body1" sx={{ color: '#334155', lineHeight: 1.6 }}>
                    {record.symptoms}
                  </Typography>
                </Paper>
              </Box>

              <Divider sx={{ mb: 4 }} />

              {/* Chỉ số sinh tồn */}
              <Box sx={{ mb: 4 }}>
                <SectionHeader icon={Activity} title="Chỉ số sinh tồn" color="#ef4444" />
                <Grid container spacing={2}>
                  {record.vitalSigns ? (
                    record.vitalSigns.split(',').map((sign, index) => (
                      <Grid xs={6} sm={3} key={index}>
                        <Box sx={{ p: 2, textAlign: 'center', bgcolor: '#fff5f5', borderRadius: 2, border: '1px solid #fee2e2' }}>
                          <Typography variant="caption" sx={{ color: '#b91c1c', fontWeight: 700, textTransform: 'uppercase' }}>
                            {sign.split(':')[0]}
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 900, color: '#7f1d1d' }}>
                            {sign.split(':')[1]}
                          </Typography>
                        </Box>
                      </Grid>
                    ))
                  ) : (
                    <Typography variant="body2" sx={{ color: '#64748b', fontStyle: 'italic', pl: 2 }}>Không có dữ liệu chỉ số sinh tồn</Typography>
                  )}
                </Grid>
              </Box>

              <Divider sx={{ mb: 4 }} />

              {/* Chẩn đoán xác định */}
              <Box sx={{ mb: 4 }}>
                <SectionHeader icon={FileText} title="Chẩn đoán xác định" color="#10b981" />
                <Box sx={{ p: 2.5, bgcolor: '#f0fdf4', borderLeft: '4px solid #10b981', borderRadius: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#065f46' }}>
                    {record.diagnosis}
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ mb: 4 }} />

              {/* Phác đồ điều trị */}
              <Box sx={{ mb: 4 }}>
                <SectionHeader icon={ClipboardList} title="Phác đồ điều trị" color="#0369a1" />
                <Typography variant="body2" sx={{ p: 2, bgcolor: '#f0f9ff', borderRadius: 2, color: '#0c4a6e', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
                  {record.treatmentPlan}
                </Typography>
              </Box>

              <Divider sx={{ mb: 4 }} />

              {/* Đơn thuốc */}
              <Box sx={{ mb: 4 }}>
                <SectionHeader icon={Pill} title="Đơn thuốc (Toa thuốc)" color="#f59e0b" />
                <Paper variant="outlined" sx={{ overflow: 'hidden', borderRadius: 3 }}>
                  <Box sx={{ p: 2, bgcolor: '#fffbeb', borderBottom: '1px solid #fef3c7', display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#92400e' }}>Danh mục thuốc</Typography>
                    <Typography variant="caption" sx={{ color: '#b45309', fontWeight: 700 }}>Rx Only</Typography>
                  </Box>
                  <Box sx={{ p: 3 }}>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-line', lineHeight: 1.8, color: '#451a03', fontFamily: 'monospace' }}>
                      {record.prescription || 'Không có đơn thuốc'}
                    </Typography>
                  </Box>
                </Paper>
              </Box>

              {/* Kết quả cận lâm sàng (Placeholder as requested in task) */}
              <Box sx={{ mb: 4 }}>
                <SectionHeader icon={ImageIcon} title="Kết quả cận lâm sàng & Hình ảnh" color="#6366f1" />
                <Grid container spacing={2}>
                  <Grid xs={12} sm={6}>
                    <Paper variant="outlined" sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, cursor: 'pointer', '&:hover': { bgcolor: '#f8fafc' } }}>
                      <ImageIcon size={32} color="#6366f1" />
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>X-Quang Ngực Thẳng.jpg</Typography>
                        <Typography variant="caption" color="text.secondary">2.4 MB • 15/05/2026</Typography>
                      </Box>
                    </Paper>
                  </Grid>
                  <Grid xs={12} sm={6}>
                    <Paper variant="outlined" sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, cursor: 'pointer', '&:hover': { bgcolor: '#f8fafc' } }}>
                      <FileText size={32} color="#ef4444" />
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>XetNghiemMau_TongQuat.pdf</Typography>
                        <Typography variant="caption" color="text.secondary">1.1 MB • 15/05/2026</Typography>
                      </Box>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>

              {/* Lời dặn & Tái khám */}
              <Box sx={{ mt: 6, p: 3, bgcolor: '#f8fafc', borderRadius: 4, border: '1px solid #e2e8f0' }}>
                <Grid container spacing={3}>
                  <Grid xs={12} md={8}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>Ghi chú của bác sĩ:</Typography>
                    <Typography variant="body2" color="text.secondary">{record.notes || 'Không có ghi chú thêm'}</Typography>
                  </Grid>
                  <Grid xs={12} md={4}>
                    <Box sx={{ p: 2, bgcolor: '#fff1f2', borderRadius: 2, border: '1px solid #fecdd3', textAlign: 'center' }}>
                      <Typography variant="caption" sx={{ color: '#e11d48', fontWeight: 800, textTransform: 'uppercase' }}>Hẹn tái khám</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 900, color: '#9f1239' }}>
                        {record.followUpDate ? new Date(record.followUpDate).toLocaleDateString('vi-VN') : 'Không hẹn'}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Footer / Signature for print */}
      <Box className="print-only" sx={{ mt: 8, display: 'flex', justifyContent: 'flex-end' }}>
        <Box sx={{ textAlign: 'center', minWidth: 250 }}>
          <Typography variant="body2">Ngày ...... tháng ...... năm ......</Typography>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, mt: 1 }}>BÁC SĨ ĐIỀU TRỊ</Typography>
          <Box sx={{ height: 100 }} />
          <Typography variant="body1" sx={{ fontWeight: 900 }}>{record.doctorName}</Typography>
        </Box>
      </Box>
    </Box>
  );
}
