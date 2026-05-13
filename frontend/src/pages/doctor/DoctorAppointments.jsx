import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Tabs,
  Tab,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Tooltip,
  Stack
} from '@mui/material';
import {
  Search,
  RefreshCw,
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  FileText,
  Phone,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import appointmentApi from '../../api/appointmentApi';

const STATUS_MAP = {
  PENDING: { label: 'Chờ xác nhận', color: 'warning', icon: <Clock size={14} /> },
  CONFIRMED: { label: 'Chờ khám', color: 'info', icon: <Clock size={14} /> },
  IN_PROGRESS: { label: 'Đang khám', color: 'primary', icon: <RefreshCw size={14} className="animate-spin" /> },
  COMPLETED: { label: 'Hoàn thành', color: 'success', icon: <CheckCircle2 size={14} /> },
  CANCELLED: { label: 'Đã hủy', color: 'error', icon: <XCircle size={14} /> },
  NO_SHOW: { label: 'Vắng mặt', color: 'default', icon: <AlertCircle size={14} /> }
};

export default function DoctorAppointments() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0); // 0: Tất cả, 1: Chờ khám, 2: Đang khám, 3: Hoàn thành
  const [searchQuery, setSearchQuery] = useState('');
  
  // Status Update Dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [targetStatus, setTargetStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  // Notifications
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const fetchTodayAppointments = useCallback(async () => {
    setLoading(true);
    try {
      // Backend handles "today" logic
      const res = await appointmentApi.getDoctorTodayAppointments();
      setAppointments(res.data);
    } catch (err) {
      console.error('Failed to fetch today appointments', err);
      setError('Không thể tải danh sách lịch hẹn.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch and periodic refresh are required for server data synchronization
    fetchTodayAppointments();

    // Auto-refresh every 5 minutes (T-033 Step 2)
    const interval = setInterval(fetchTodayAppointments, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchTodayAppointments]);

  const filteredAppointments = useMemo(() => {
    let result = appointments;

    // Filter by Tab (T-033 Step 3)
    if (tabValue === 1) result = result.filter(a => a.status === 'CONFIRMED' || a.status === 'PENDING');
    else if (tabValue === 2) result = result.filter(a => a.status === 'IN_PROGRESS');
    else if (tabValue === 3) result = result.filter(a => a.status === 'COMPLETED');

    // Filter by Search (AC-4)
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(a =>
        a.patientName.toLowerCase().includes(q) ||
        a.id.toString().includes(q) ||
        (a.patientPhone && a.patientPhone.includes(q))
      );
    }

    return result;
  }, [appointments, tabValue, searchQuery]);

  const handleOpenStatusDialog = (appt, status) => {
    setSelectedAppt(appt);
    setTargetStatus(status);
    setNotes(appt.notes || '');
    setDialogOpen(true);
    setError('');
  };

  const handleUpdateStatus = async () => {
    setActionLoading(true);
    setError('');
    try {
      await appointmentApi.updateStatus(selectedAppt.id, {
        status: targetStatus,
        notes: notes
      });
      setDialogOpen(false);
      setSnackbar({ open: true, message: 'Cập nhật trạng thái thành công!', severity: 'success' });
      fetchTodayAppointments();
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật trạng thái.');
    } finally {
      setActionLoading(false);
    }
  };

  const renderStatusChip = (status) => {
    const config = STATUS_MAP[status] || STATUS_MAP.PENDING;
    return (
      <Chip 
        label={config.label} 
        color={config.color} 
        size="small" 
        icon={config.icon}
        sx={{ fontWeight: 600, borderRadius: 1.5 }}
      />
    );
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900, color: '#1e293b' }}>Lịch khám hôm nay</Typography>
          <Typography variant="body1" color="text.secondary">
            {format(new Date(), "'Ngày' dd 'tháng' MM, yyyy", { locale: vi })}
          </Typography>
        </Box>
        <Button 
          variant="outlined" 
          startIcon={<RefreshCw size={18} />} 
          onClick={fetchTodayAppointments}
          disabled={loading}
          sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
        >
          Làm mới
        </Button>
      </Box>

      <Paper sx={{ borderRadius: 4, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', justifyContent: 'space-between' }}>
          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ 
            '& .MuiTab-root': { fontWeight: 700, textTransform: 'none', minWidth: 100 },
            '& .Mui-selected': { color: '#10b981 !important' },
            '& .MuiTabs-indicator': { bgcolor: '#10b981' }
          }}>
            <Tab label="Tất cả" />
            <Tab label="Chờ khám" />
            <Tab label="Đang khám" />
            <Tab label="Hoàn thành" />
          </Tabs>

          <TextField
            size="small"
            placeholder="Tìm bệnh nhân, SĐT..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={18} color="#64748b" />
                </InputAdornment>
              ),
              sx: { borderRadius: 2, width: 300 }
            }}
          />
        </Box>

        <TableContainer>
          <Table sx={{ minWidth: 800 }}>
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Giờ hẹn</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Bệnh nhân</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Lý do khám</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Trạng thái</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Hành động</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 10 }}>
                    <CircularProgress size={40} sx={{ color: '#10b981' }} />
                  </TableCell>
                </TableRow>
              ) : filteredAppointments.length > 0 ? (
                filteredAppointments.map((appt) => (
                  <TableRow key={appt.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a' }}>
                        {appt.appointmentTime.substring(0, 5)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {appt.endTime.substring(0, 5)} kết thúc
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar src={appt.patientAvatar} sx={{ width: 40, height: 40, bgcolor: '#f1f5f9', color: '#64748b' }}>
                          <User size={20} />
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{appt.patientName}</Typography>
                          <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                            <Phone size={12} /> {appt.patientPhone}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ maxWidth: 300 }}>
                      <Typography variant="body2" noWrap sx={{ color: '#475569' }}>
                        {appt.reason}
                      </Typography>
                      {appt.notes && (
                        <Typography variant="caption" sx={{ fontStyle: 'italic', color: '#10b981', display: 'block', mt: 0.5 }}>
                          Ghi chú: {appt.notes}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {renderStatusChip(appt.status)}
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        {appt.status === 'PENDING' && (
                          <Button 
                            variant="contained" 
                            size="small" 
                            startIcon={<CheckCircle2 size={14} />}
                            onClick={() => handleOpenStatusDialog(appt, 'CONFIRMED')}
                            sx={{ bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' }, borderRadius: 1.5, textTransform: 'none' }}
                          >
                            Xác nhận
                          </Button>
                        )}
                        {appt.status === 'CONFIRMED' && (
                          <>
                            <Button 
                              variant="contained" 
                              size="small" 
                              startIcon={<Play size={14} />}
                              onClick={() => handleOpenStatusDialog(appt, 'IN_PROGRESS')}
                              sx={{ bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' }, borderRadius: 1.5, textTransform: 'none' }}
                            >
                              Bắt đầu
                            </Button>
                            <Tooltip title="Vắng mặt">
                              <IconButton 
                                size="small" 
                                color="default" 
                                onClick={() => handleOpenStatusDialog(appt, 'NO_SHOW')}
                              >
                                <AlertCircle size={18} />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                        {appt.status === 'IN_PROGRESS' && (
                          <Button 
                            variant="contained" 
                            size="small" 
                            color="success"
                            startIcon={<FileText size={14} />}
                            onClick={() => navigate(`/doctor/medical-records/create/${appt.id}?patientName=${encodeURIComponent(appt.patientName)}`)}
                            sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 700 }}
                          >
                            Lập hồ sơ
                          </Button>
                        )}
                        {(appt.status === 'PENDING' || appt.status === 'CONFIRMED') && (
                          <IconButton 
                            size="small" 
                            color="error" 
                            onClick={() => handleOpenStatusDialog(appt, 'CANCELLED')}
                          >
                            <XCircle size={18} />
                          </IconButton>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 10 }}>
                    <Box sx={{ color: '#94a3b8' }}>
                      <FileText size={48} strokeWidth={1} style={{ marginBottom: 8 }} />
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>Không có lịch hẹn nào</Typography>
                      <Typography variant="body2">Bạn không có lịch hẹn nào thỏa mãn điều kiện lọc.</Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Status Update Dialog */}
      <Dialog open={dialogOpen} onClose={() => !actionLoading && setDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 800 }}>
          {targetStatus === 'IN_PROGRESS' && 'Bắt đầu ca khám'}
          {targetStatus === 'COMPLETED' && 'Kết thúc ca khám'}
          {targetStatus === 'CANCELLED' && 'Hủy lịch hẹn'}
        </DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
            Bạn đang cập nhật trạng thái cho bệnh nhân <strong>{selectedAppt?.patientName}</strong>.
          </Typography>
          <TextField
            fullWidth
            label={targetStatus === 'CANCELLED' ? "Lý do hủy (bắt buộc)" : "Ghi chú của bác sĩ"}
            multiline
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={targetStatus === 'CANCELLED' ? "Vui lòng nhập lý do hủy lịch..." : "Nhập triệu chứng, chẩn đoán sơ bộ..."}
            sx={{ mt: 1, '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setDialogOpen(false)} disabled={actionLoading} sx={{ fontWeight: 700, color: '#64748b' }}>Hủy bỏ</Button>
          <Button 
            variant="contained" 
            onClick={handleUpdateStatus} 
            disabled={actionLoading}
            sx={{ 
              borderRadius: 2, 
              fontWeight: 700, 
              bgcolor: targetStatus === 'CANCELLED' ? '#ef4444' : '#10b981',
              '&:hover': { bgcolor: targetStatus === 'CANCELLED' ? '#dc2626' : '#059669' }
            }}
          >
            {actionLoading ? <CircularProgress size={20} color="inherit" /> : 'Xác nhận'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={snackbar.open} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, bgcolor: snackbar.severity === 'success' ? '#f0fdf4' : '#fef2f2', color: snackbar.severity === 'success' ? '#15803d' : '#991b1b' }}>
          {snackbar.severity === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <Typography variant="body2" sx={{ fontWeight: 600 }}>{snackbar.message}</Typography>
          <IconButton size="small" onClick={() => setSnackbar({ ...snackbar, open: false })} color="inherit">
            <XCircle size={16} />
          </IconButton>
        </Box>
      </Dialog>
    </Container>
  );
}
