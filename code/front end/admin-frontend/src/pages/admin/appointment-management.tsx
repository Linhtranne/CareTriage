import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
} from '@mui/material';
import { Edit as EditIcon } from '@mui/icons-material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import appointmentApi from '../../services/appointment-service';

const STATUS_COLORS: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
  PENDING: 'warning',
  CONFIRMED: 'info',
  CHECKED_IN: 'secondary',
  IN_PROGRESS: 'primary',
  COMPLETED: 'success',
  CANCELLED: 'error',
  NO_SHOW: 'error',
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  CHECKED_IN: 'Đã điểm danh',
  IN_PROGRESS: 'Đang khám',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
  NO_SHOW: 'Không đến',
};

export default function AppointmentManagement() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [dateFilter, setDateFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [updateDialog, setUpdateDialog] = useState<{ open: boolean, appointmentId: number | null, currentStatus: string }>({
    open: false,
    appointmentId: null,
    currentStatus: ''
  });
  const [newStatus, setNewStatus] = useState<string>('');
  const [statusNotes, setStatusNotes] = useState<string>('');
  const [updating, setUpdating] = useState<boolean>(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (dateFilter) params.date = dateFilter;
      if (statusFilter) params.status = statusFilter;
      if (typeFilter === 'external') params.isExternal = true;
      if (typeFilter === 'internal') params.isExternal = false;

      const res = await appointmentApi.getAllAppointmentsForAdmin(params);
      setAppointments(res.data?.data || []);
    } catch (error) {
      setSnackbar({ open: true, message: 'Lỗi khi tải danh sách lịch hẹn', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [dateFilter, statusFilter, typeFilter]);

  const handleUpdateStatus = async () => {
    if (!updateDialog.appointmentId) return;
    setUpdating(true);
    try {
      await appointmentApi.updateStatusByAdmin(updateDialog.appointmentId, {
        status: newStatus,
        notes: statusNotes
      });
      setSnackbar({ open: true, message: 'Cập nhật trạng thái thành công', severity: 'success' });
      setUpdateDialog({ open: false, appointmentId: null, currentStatus: '' });
      fetchAppointments();
    } catch (error: any) {
      setSnackbar({ open: true, message: error.response?.data?.message || 'Lỗi khi cập nhật trạng thái', severity: 'error' });
    } finally {
      setUpdating(false);
    }
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 70 },
    {
      field: 'appointmentDate',
      headerName: 'Ngày',
      width: 120,
      renderCell: (params) => {
        if (!params.value) return '';
        const d = new Date(params.value);
        return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
      },
    },
    {
      field: 'appointmentTime',
      headerName: 'Giờ',
      width: 100,
      renderCell: (params) => {
        const time = params.value;
        if (!time) return '';
        // handle array time like [8, 30]
        if (Array.isArray(time)) {
          return `${time[0].toString().padStart(2, '0')}:${time[1].toString().padStart(2, '0')}`;
        }
        return time.substring(0, 5);
      },
    },
    {
      field: 'patientName',
      headerName: 'Bệnh Nhân',
      width: 200,
    },
    {
      field: 'patientPhone',
      headerName: 'SĐT',
      width: 120,
    },
    {
      field: 'doctorName',
      headerName: 'Bác Sĩ',
      flex: 1,
      minWidth: 200,
    },
    {
      field: 'departmentName',
      headerName: 'Chuyên Khoa',
      width: 150,
    },
    {
      field: 'isExternal',
      headerName: 'Loại Bác Sĩ',
      width: 130,
      renderCell: (params) => {
        const isExternal = params.row.doctorName?.includes('(External)');
        return (
          <Chip
            label={isExternal ? 'Bác Sĩ Ngoài' : 'Nội Bộ'}
            color={isExternal ? 'secondary' : 'primary'}
            variant="outlined"
            size="small"
          />
        );
      },
    },
    {
      field: 'status',
      headerName: 'Trạng Thái',
      width: 140,
      renderCell: (params) => (
        <Chip
          label={STATUS_LABELS[params.value] || params.value}
          color={STATUS_COLORS[params.value] || 'default'}
          size="small"
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'Thao tác',
      width: 100,
      renderCell: (params) => (
        <IconButton 
          color="primary" 
          onClick={() => {
            setUpdateDialog({ open: true, appointmentId: params.row.id, currentStatus: params.row.status });
            setNewStatus(params.row.status);
            setStatusNotes('');
          }}
        >
          <EditIcon />
        </IconButton>
      ),
    },
  ];

  return (
    <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 3, height: '100%' }}>
      <Typography variant="h5" fontWeight={700}>Quản lý Đặt Lịch</Typography>

      <Card sx={{ borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <CardContent>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 3 }}>
            <TextField
              label="Ngày khám"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              size="small"
              sx={{ minWidth: 200 }}
            />
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Trạng Thái</InputLabel>
              <Select
                value={statusFilter}
                label="Trạng Thái"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="">Tất cả</MenuItem>
                {Object.keys(STATUS_LABELS).map((key) => (
                  <MenuItem key={key} value={key}>{STATUS_LABELS[key]}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Loại Bác Sĩ</InputLabel>
              <Select
                value={typeFilter}
                label="Loại Bác Sĩ"
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <MenuItem value="">Tất cả</MenuItem>
                <MenuItem value="internal">Bác sĩ Nội Bộ</MenuItem>
                <MenuItem value="external">Bác sĩ Ngoài</MenuItem>
              </Select>
            </FormControl>
          </Stack>

          <Box sx={{ flex: 1, minHeight: 600, width: '100%' }}>
            <DataGrid
              rows={appointments}
              columns={columns}
              loading={loading}
              disableRowSelectionOnClick
              initialState={{
                pagination: { paginationModel: { pageSize: 15 } },
              }}
              pageSizeOptions={[15, 25, 50]}
            />
          </Box>
        </CardContent>
      </Card>

      <Dialog open={updateDialog.open} onClose={() => setUpdateDialog({ ...updateDialog, open: false })} maxWidth="xs" fullWidth>
        <DialogTitle>Cập Nhật Trạng Thái</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Trạng Thái Mới</InputLabel>
              <Select
                value={newStatus}
                label="Trạng Thái Mới"
                onChange={(e) => setNewStatus(e.target.value)}
              >
                {Object.keys(STATUS_LABELS).map((key) => (
                  <MenuItem key={key} value={key}>{STATUS_LABELS[key]}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Ghi chú (Bắt buộc nếu Hủy)"
              fullWidth
              multiline
              rows={3}
              value={statusNotes}
              onChange={(e) => setStatusNotes(e.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUpdateDialog({ ...updateDialog, open: false })}>Hủy</Button>
          <Button variant="contained" onClick={handleUpdateStatus} disabled={updating}>
            Cập Nhật
          </Button>
        </DialogActions>
      </Dialog>
      
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
