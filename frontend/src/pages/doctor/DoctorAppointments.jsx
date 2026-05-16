import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Typography,
  Box,
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
  Stack,
  alpha
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
  AlertCircle,
  CalendarDays,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import appointmentApi from '../../api/appointmentApi';
import PatientPageShell from '../../components/patient/PatientPageShell';

const STATUS_MAP = {
  PENDING: { label: 'Chờ xác nhận', color: 'warning', icon: <Clock size={14} />, bg: 'rgba(245, 158, 11, 0.1)', textColor: '#d97706' },
  CONFIRMED: { label: 'Chờ khám', color: 'info', icon: <Clock size={14} />, bg: 'rgba(59, 130, 246, 0.1)', textColor: '#2563eb' },
  IN_PROGRESS: { label: 'Đang khám', color: 'primary', icon: <RefreshCw size={14} className="animate-spin" />, bg: 'rgba(16, 185, 129, 0.1)', textColor: '#059669' },
  COMPLETED: { label: 'Hoàn thành', color: 'success', icon: <CheckCircle2 size={14} />, bg: 'rgba(16, 185, 129, 0.1)', textColor: '#059669' },
  CANCELLED: { label: 'Đã hủy', color: 'error', icon: <XCircle size={14} />, bg: 'rgba(239, 68, 68, 0.1)', textColor: '#dc2626' },
  NO_SHOW: { label: 'Vắng mặt', color: 'default', icon: <AlertCircle size={14} />, bg: 'rgba(148, 163, 184, 0.1)', textColor: '#475569' }
};

export default function DoctorAppointments() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0); // 0: Hôm nay, 1: Yêu cầu mới, 2: Đang khám, 3: Hoàn thành, 4: Tất cả
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

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      let res;
      if (tabValue === 0) {
        // Today's appointments
        res = await appointmentApi.getDoctorTodayAppointments();
      } else if (tabValue === 1) {
        // All Pending (All dates)
        res = await appointmentApi.getDoctorAppointments({ status: 'PENDING' });
      } else {
        // All appointments (for other tabs we'll filter client-side or we could fetch specific status)
        res = await appointmentApi.getDoctorAppointments();
      }
      
      const appts = res.data?.data || (Array.isArray(res.data) ? res.data : []);
      setAppointments(appts);
    } catch (err) {
      console.error('Failed to fetch appointments', err);
      setError('Không thể tải danh sách lịch hẹn.');
    } finally {
      setLoading(false);
    }
  }, [tabValue]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const filteredAppointments = useMemo(() => {
    let result = appointments;

    // Filter by Tab logic (T-033)
    if (tabValue === 2) result = result.filter(a => a.status === 'IN_PROGRESS');
    else if (tabValue === 3) result = result.filter(a => a.status === 'COMPLETED');
    // Tab 0 and 1 are already handled by API fetch but we can refine here if needed
    if (tabValue === 0) result = result.filter(a => {
        const today = format(new Date(), 'yyyy-MM-dd');
        return a.appointmentDate === today;
    });

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
      fetchAppointments();
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
        size="small" 
        icon={config.icon}
        sx={{ 
          fontWeight: 600, 
          borderRadius: 2,
          bgcolor: config.bg,
          color: config.textColor,
          border: 'none',
          '& .MuiChip-icon': { color: config.textColor }
        }}
      />
    );
  };

  return (
    <PatientPageShell
      title="Quản lý lịch hẹn"
      subtitle={format(new Date(), "'Ngày' dd 'tháng' MM, yyyy", { locale: vi })}
      maxWidth={false}
      transparent={true}
      badge="Khu vực bác sĩ"
      actions={
        <Button 
          variant="outlined" 
          startIcon={<RefreshCw size={18} className={loading ? "animate-spin" : ""} />} 
          onClick={fetchAppointments}
          disabled={loading}
          sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 600, px: 2.5 }}
        >
          Làm mới
        </Button>
      }
    >
      <Box sx={{ mt: -1 }}>
        <Box sx={{ mb: 4, display: 'flex', flexWrap: 'wrap', gap: 3, alignItems: 'center', justifyContent: 'space-between' }}>
          <Tabs 
            value={tabValue} 
            onChange={(e, v) => setTabValue(v)} 
            sx={{ 
              minHeight: 48,
              '& .MuiTab-root': { 
                fontWeight: 600, 
                textTransform: 'none', 
                fontSize: '0.95rem',
                minWidth: 120,
                color: '#64748b',
                transition: 'all 0.2s'
              },
              '& .Mui-selected': { color: '#10b981 !important' },
              '& .MuiTabs-indicator': { height: 3, borderRadius: '3px 3px 0 0', bgcolor: '#10b981' }
            }}
          >
            <Tab icon={<CalendarDays size={18} />} iconPosition="start" label="Hôm nay" />
            <Tab icon={<AlertCircle size={18} />} iconPosition="start" label="Yêu cầu mới" />
            <Tab icon={<RefreshCw size={18} />} iconPosition="start" label="Đang khám" />
            <Tab icon={<CheckCircle2 size={18} />} iconPosition="start" label="Hoàn thành" />
            <Tab icon={<Calendar size={18} />} iconPosition="start" label="Tất cả" />
          </Tabs>

          <TextField
            size="small"
            placeholder="Tìm bệnh nhân, SĐT..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={18} color="#94a3b8" />
                </InputAdornment>
              ),
              sx: { 
                borderRadius: 3, 
                width: 320,
                bgcolor: 'white',
                '& fieldset': { borderColor: '#e2e8f0' },
                '&:hover fieldset': { borderColor: '#10b981 !important' }
              }
            }}
          />
        </Box>

        <TableContainer sx={{ overflow: 'visible' }}>
          <Table sx={{ minWidth: 1000, borderCollapse: 'separate', borderSpacing: '0 12px', mt: -1.5 }}>
            <TableHead>
              <TableRow sx={{ '& th': { border: 'none', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em', px: 3 } }}>
                <TableCell>Thời gian</TableCell>
                <TableCell>Thông tin bệnh nhân</TableCell>
                <TableCell>Lý do & Ghi chú</TableCell>
                <TableCell align="center">Trạng thái</TableCell>
                <TableCell align="right">Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 12 }}>
                    <CircularProgress size={42} thickness={5} sx={{ color: '#10b981' }} />
                    <Typography variant="body2" sx={{ mt: 2, color: '#94a3b8', fontWeight: 600 }}>Đang tải danh sách...</Typography>
                  </TableCell>
                </TableRow>
              ) : filteredAppointments.length > 0 ? (
                filteredAppointments.map((appt) => (
                  <TableRow 
                    key={appt.id} 
                    sx={{ 
                      '& td': { 
                        bgcolor: 'white', 
                        borderTop: '1px solid #f1f5f9',
                        borderBottom: '1px solid #f1f5f9',
                        px: 3,
                        py: 2,
                        transition: 'all 0.2s'
                      },
                      '& td:first-of-type': { borderLeft: '1px solid #f1f5f9', borderRadius: '16px 0 0 16px' },
                      '& td:last-of-type': { borderRight: '1px solid #f1f5f9', borderRadius: '0 16px 16px 0' },
                      '&:hover td': { bgcolor: 'rgba(16, 185, 129, 0.02)', borderColor: '#10b981' }
                    }}
                  >
                    <TableCell>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>
                          {appt.appointmentTime ? appt.appointmentTime.substring(0, 5) : '--:--'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 400 }}>
                          {format(new Date(appt.appointmentDate), 'dd/MM/yyyy')}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar 
                          src={appt.patientAvatar} 
                          sx={{ 
                            width: 48, height: 48, 
                            bgcolor: '#f1f5f9', 
                            color: '#10b981',
                            border: '2px solid white',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                          }}
                        >
                          <User size={24} />
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1e293b' }}>{appt.patientName}</Typography>
                          <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#64748b', fontWeight: 600 }}>
                            <Phone size={12} /> {appt.patientPhone}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ maxWidth: 320 }}>
                      <Typography variant="body2" sx={{ color: '#334155', fontWeight: 600, mb: 0.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {appt.reason}
                      </Typography>
                      {appt.notes && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#10b981' }}>
                          <FileText size={12} />
                          <Typography variant="caption" sx={{ fontWeight: 600, fontStyle: 'italic' }}>
                            Ghi chú: {appt.notes}
                          </Typography>
                        </Box>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      {renderStatusChip(appt.status)}
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1.5} justifyContent="flex-end">
                        {appt.status === 'PENDING' && (
                          <Button 
                            variant="contained" 
                            size="small" 
                            startIcon={<CheckCircle2 size={16} />}
                            onClick={() => handleOpenStatusDialog(appt, 'CONFIRMED')}
                            sx={{ bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' }, borderRadius: 2.5, textTransform: 'none', fontWeight: 600, px: 2 }}
                          >
                            Xác nhận
                          </Button>
                        )}
                        {appt.status === 'CONFIRMED' && (
                          <>
                            <Button 
                              variant="contained" 
                              size="small" 
                              startIcon={<Play size={16} />}
                              onClick={() => handleOpenStatusDialog(appt, 'IN_PROGRESS')}
                              sx={{ bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' }, borderRadius: 2.5, textTransform: 'none', fontWeight: 600, px: 2 }}
                            >
                              Bắt đầu
                            </Button>
                            <Tooltip title="Vắng mặt">
                              <IconButton 
                                size="small" 
                                sx={{ bgcolor: '#f1f5f9', '&:hover': { bgcolor: '#e2e8f0' } }}
                                onClick={() => handleOpenStatusDialog(appt, 'NO_SHOW')}
                              >
                                <AlertCircle size={18} color="#64748b" />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                        {appt.status === 'IN_PROGRESS' && (
                          <>
                            <Button 
                              variant="outlined" 
                              size="small" 
                              startIcon={<FileText size={16} />}
                              onClick={() => navigate(`/doctor/medical-records/create/${appt.id}?patientName=${encodeURIComponent(appt.patientName)}`)}
                              sx={{ borderRadius: 2.5, textTransform: 'none', fontWeight: 600, px: 2, borderColor: '#10b981', color: '#10b981', '&:hover': { bgcolor: 'rgba(16, 185, 129, 0.05)', borderColor: '#059669' } }}
                            >
                              Lập hồ sơ
                            </Button>
                            <Button 
                              variant="contained" 
                              size="small" 
                              startIcon={<CheckCircle2 size={16} />}
                              onClick={() => handleOpenStatusDialog(appt, 'COMPLETED')}
                              sx={{ bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' }, borderRadius: 2.5, textTransform: 'none', fontWeight: 600, px: 2 }}
                            >
                              Hoàn thành
                            </Button>
                          </>
                        )}
                        {(appt.status === 'PENDING' || appt.status === 'CONFIRMED') && (
                          <IconButton 
                            size="small" 
                            sx={{ color: '#ef4444', bgcolor: 'rgba(239, 68, 68, 0.05)', '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.1)' } }}
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
                  <TableCell colSpan={5} align="center" sx={{ py: 15 }}>
                    <Box sx={{ color: '#94a3b8' }}>
                      <CalendarDays size={64} strokeWidth={1} style={{ marginBottom: 16, opacity: 0.5 }} />
                      <Typography variant="h6" sx={{ fontWeight: 600, color: '#475569' }}>Trống lịch hẹn</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>Không có lịch hẹn nào thỏa mãn điều kiện lọc của bạn.</Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Status Update Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={() => !actionLoading && setDialogOpen(false)} 
        fullWidth 
        maxWidth="xs"
        PaperProps={{ sx: { borderRadius: 5, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 600, fontSize: '1.25rem', pb: 1 }}>
          {targetStatus === 'IN_PROGRESS' && 'Bắt đầu ca khám'}
          {targetStatus === 'COMPLETED' && 'Kết thúc ca khám'}
          {targetStatus === 'CANCELLED' && 'Hủy lịch hẹn'}
          {targetStatus === 'CONFIRMED' && 'Xác nhận lịch hẹn'}
          {targetStatus === 'NO_SHOW' && 'Đánh dấu vắng mặt'}
        </DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 3 }}>{error}</Alert>}
          <Typography variant="body2" sx={{ mb: 2, color: '#64748b', fontWeight: 500 }}>
            Hệ thống sẽ cập nhật trạng thái cho bệnh nhân <strong>{selectedAppt?.patientName}</strong>.
          </Typography>
          <TextField
            fullWidth
            label={targetStatus === 'CANCELLED' ? "Lý do hủy (bắt buộc)" : "Ghi chú của bác sĩ"}
            multiline
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={targetStatus === 'CANCELLED' ? "Vui lòng nhập lý do để bệnh nhân nắm rõ..." : "Nhập ghi chú hoặc dặn dò sơ bộ..."}
            sx={{ mt: 1, '& .MuiOutlinedInput-root': { borderRadius: 4, bgcolor: '#f8fafc' } }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, pt: 1 }}>
          <Button onClick={() => setDialogOpen(false)} disabled={actionLoading} sx={{ fontWeight: 600, color: '#64748b', textTransform: 'none' }}>Đóng</Button>
          <Button 
            variant="contained" 
            onClick={handleUpdateStatus} 
            disabled={actionLoading}
            sx={{ 
              borderRadius: 3, 
              fontWeight: 600, 
              px: 4,
              textTransform: 'none',
              bgcolor: targetStatus === 'CANCELLED' ? '#ef4444' : '#10b981',
              boxShadow: `0 4px 12px ${alpha(targetStatus === 'CANCELLED' ? '#ef4444' : '#10b981', 0.2)}`,
              '&:hover': { bgcolor: targetStatus === 'CANCELLED' ? '#dc2626' : '#059669' }
            }}
          >
            {actionLoading ? <CircularProgress size={20} color="inherit" /> : 'Xác nhận'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog 
        open={snackbar.open} 
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        PaperProps={{ sx: { borderRadius: 4, overflow: 'hidden' } }}
      >
        <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 2, bgcolor: snackbar.severity === 'success' ? '#f0fdf4' : '#fef2f2', color: snackbar.severity === 'success' ? '#15803d' : '#991b1b' }}>
          {snackbar.severity === 'success' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
          <Typography variant="body1" sx={{ fontWeight: 600 }}>{snackbar.message}</Typography>
          <IconButton size="small" onClick={() => setSnackbar({ ...snackbar, open: false })} color="inherit">
            <XCircle size={18} />
          </IconButton>
        </Box>
      </Dialog>
    </PatientPageShell>
  );
}
