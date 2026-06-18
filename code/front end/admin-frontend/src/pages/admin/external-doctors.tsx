/* eslint-disable no-magic-numbers, project-rules/no-hardcoded-color, project-rules/no-hardcoded-text, @typescript-eslint/no-explicit-any, no-undef, unused-imports/no-unused-vars, unused-imports/no-unused-imports */
import React, { useState, useEffect, useMemo } from 'react'
import {
  Box, Typography, Card, CardContent, Button, Snackbar, Alert, Stack, Chip, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  IconButton, Menu, MenuItem, ListItemIcon, ListItemText, Checkbox
} from '@mui/material'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import { Sync, Add, CheckCircle, MoreVert, Visibility, Delete } from '@mui/icons-material'
import externalDoctorApi from '../../services/external-doctor-service'

const SourceActionMenu = ({ row, syncing, onSync }: any) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  return (
    <>
      <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} size="small"><MoreVert /></IconButton>
      <Menu anchorEl={anchorEl} open={open} onClose={() => setAnchorEl(null)}>
        <MenuItem onClick={() => { setAnchorEl(null); onSync(row.id); }} disabled={syncing === row.id}>
          <ListItemIcon>{syncing === row.id ? <CircularProgress size={16} /> : <Sync fontSize="small" />}</ListItemIcon>
          <ListItemText>Cào Data</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
};

const DoctorActionMenu = ({ row, onView, onDelete }: any) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  return (
    <>
      <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} size="small"><MoreVert /></IconButton>
      <Menu anchorEl={anchorEl} open={open} onClose={() => setAnchorEl(null)}>
        <MenuItem onClick={() => { setAnchorEl(null); onView(row); }}>
          <ListItemIcon><Visibility fontSize="small" /></ListItemIcon>
          <ListItemText>Chi tiết</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { setAnchorEl(null); onDelete(row.id); }}>
          <ListItemIcon><Delete color="error" fontSize="small" /></ListItemIcon>
          <ListItemText sx={{ color: 'error.main' }}>Xóa</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
};

export default function ExternalDoctors() {
  const [sources, setSources] = useState<any[]>([])
  const [doctors, setDoctors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState<number | null>(null)
  
  const [openDialog, setOpenDialog] = useState(false)
  const [selectionModel, setSelectionModel] = useState<any[]>([])

  const [newSource, setNewSource] = useState({ sourceName: '', baseUrl: '', allowedDomain: '', apiEndpoint: '/api/v1/crawl/custom', city: '' })
  
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' })

  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false)
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null)
  
  const [syncResult, setSyncResult] = useState<{ open: boolean, imported: number, updated: number } | null>(null)

  const handleDeleteDoctor = async (id: number) => {
    if (!globalThis.confirm('Bạn có chắc chắn muốn xóa bác sĩ này?')) return;
    try {
      await externalDoctorApi.deleteDoctor(id)
      setSnackbar({ open: true, message: 'Xóa bác sĩ thành công', severity: 'success' })
      fetchData()
    } catch (err: any) {
      console.error(err)
      setSnackbar({ open: true, message: 'Lỗi xóa bác sĩ', severity: 'error' })
    }
  }

  const handleDeleteAllDoctors = async () => {
    try {
      await externalDoctorApi.deleteAllDoctors()
      setSnackbar({ open: true, message: 'Xóa tất cả thành công', severity: 'success' })
      setConfirmDeleteAll(false)
      fetchData()
    } catch (err: any) {
      console.error(err)
      setSnackbar({ open: true, message: 'Lỗi xóa tất cả dữ liệu', severity: 'error' })
    }
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      const [sourcesRes, doctorsRes] = await Promise.all([
        externalDoctorApi.getSources(),
        externalDoctorApi.getAllDoctors()
      ])
      setSources(sourcesRes.data || [])
      setDoctors(doctorsRes.data || [])
    } catch (err: any) {
      console.error(err)
      setSnackbar({ open: true, message: 'Lỗi tải dữ liệu', severity: 'error' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleSync = async (sourceId: number) => {
    setSyncing(sourceId)
    try {
      const res = await externalDoctorApi.triggerSync(sourceId)
      
      // Show result dialog
      setSyncResult({
        open: true,
        imported: res.data.doctorsImported || 0,
        updated: res.data.doctorsUpdated || 0
      })
      
      // Refresh data immediately
      await fetchData()
    } catch (err: any) {
      console.error(err)
      setSnackbar({ open: true, message: 'Lỗi kích hoạt Crawler', severity: 'error' })
    } finally {
      setSyncing(null)
    }
  }

  const handleBulkApprove = async () => {
    if (selectionModel.length === 0) return;
    try {
      await externalDoctorApi.bulkApprove(selectionModel)
      setSnackbar({ open: true, message: `Đã duyệt ${selectionModel.length} bác sĩ!`, severity: 'success' })
      setSelectionModel([])
      fetchData()
    } catch (err: any) {
      console.error(err)
      setSnackbar({ open: true, message: 'Lỗi khi duyệt', severity: 'error' })
    }
  }

  const handleApproveAll = async () => {
    try {
      await externalDoctorApi.approveAll()
      setSnackbar({ open: true, message: 'Đã duyệt toàn bộ bác sĩ chờ duyệt!', severity: 'success' })
      setSelectionModel([])
      fetchData()
    } catch (err: any) {
      console.error(err)
      setSnackbar({ open: true, message: 'Lỗi khi duyệt tất cả', severity: 'error' })
    }
  }

  const handleCreateSource = async () => {
    try {
      await externalDoctorApi.createSource(newSource)
      setSnackbar({ open: true, message: 'Thêm nguồn thành công', severity: 'success' })
      setOpenDialog(false)
      fetchData()
    } catch (err: any) {
      console.error(err)
      setSnackbar({ open: true, message: 'Lỗi thêm nguồn dữ liệu', severity: 'error' })
    }
  }

  const handleToggleSelect = (id: number) => {
    setSelectionModel(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelectionModel(doctors.map(d => d.id))
    } else {
      setSelectionModel([])
    }
  }

  const columns: GridColDef[] = useMemo(() => [
    {
      field: 'select',
      headerName: '',
      width: 50,
      sortable: false,
      filterable: false,
      renderHeader: () => (
        <Checkbox 
          checked={doctors.length > 0 && selectionModel.length === doctors.length}
          indeterminate={selectionModel.length > 0 && selectionModel.length < doctors.length}
          onChange={handleSelectAll}
        />
      ),
      renderCell: (params) => (
        <Checkbox 
          checked={selectionModel.includes(params.row.id)}
          onChange={() => handleToggleSelect(params.row.id)}
        />
      )
    },
    { field: 'id', headerName: 'ID', width: 70 },
    { 
      field: 'avatarUrl', 
      headerName: 'Ảnh', 
      width: 70,
      renderCell: (params) => (
        <Box sx={{ width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', mt: 0.5 }}>
          <img src={params.value || 'https://via.placeholder.com/40'} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </Box>
      )
    },
    { field: 'fullName', headerName: 'Họ Tên', width: 200, flex: 1 },
    { field: 'specialization', headerName: 'Chuyên Khoa', width: 150, flex: 1 },
    { field: 'hospitalName', headerName: 'Bệnh Viện/Nơi Công Tác', width: 250, flex: 1.5 },
    { field: 'sourceId', headerName: 'Source ID', width: 100 },
    { 
      field: 'verificationStatus', 
      headerName: 'Trạng Thái', 
      width: 150,
      renderCell: (params) => (
        <Chip 
          label={params.value === 'VERIFIED' ? 'Đã duyệt' : 'Chưa duyệt'} 
          color={params.value === 'VERIFIED' ? 'success' : 'warning'}
          size="small"
        />
      )
    },
    {
      field: 'actions',
      headerName: 'Thao tác',
      width: 80,
      renderCell: (params) => (
        <DoctorActionMenu 
          row={params.row} 
          onView={setSelectedDoctor} 
          onDelete={handleDeleteDoctor} 
        />
      )
    }
  ], [setSelectedDoctor, handleDeleteDoctor, selectionModel, doctors])

  const sourceColumns: GridColDef[] = useMemo(() => [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'sourceName', headerName: 'Tên Nguồn', width: 200, flex: 1 },
    { field: 'baseUrl', headerName: 'URL', width: 250, flex: 1.5 },
    { field: 'city', headerName: 'Khu Vực', width: 120, flex: 0.5 },
    { 
      field: 'isActive', 
      headerName: 'Trạng Thái', 
      width: 120,
      renderCell: (params) => (
        <Chip 
          label={params.value ? 'Hoạt động' : 'Đã tắt'} 
          color={params.value ? 'success' : 'default'}
          size="small"
        />
      )
    },
    {
      field: 'actions',
      headerName: 'Thao tác',
      width: 80,
      renderCell: (params) => (
        <SourceActionMenu 
          row={params.row} 
          syncing={syncing} 
          onSync={handleSync} 
        />
      )
    }
  ], [syncing, handleSync])

  return (
    <Box sx={{ p: 4, height: '100%', display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Typography variant="h4" sx={{ fontWeight: 800, color: '#039786' }}>
        Quản lý Nguồn Bác Sĩ Ngoại Vi
      </Typography>

      <Card sx={{ borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', mb: 2 }}>
            <Typography variant="h6" fontWeight={700} sx={{ m: 0 }}>Danh sách Nguồn Dữ Liệu</Typography>
            <Button variant="outlined" startIcon={<Add />} onClick={() => setOpenDialog(true)}>
              Thêm Nguồn Mới
            </Button>
          </Box>
          <Box sx={{ height: 400, width: '100%' }}>
            <DataGrid
              rows={sources}
              columns={sourceColumns}
              loading={loading}
              disableRowSelectionOnClick
              initialState={{
                pagination: { paginationModel: { pageSize: 5 } },
              }}
              pageSizeOptions={[5, 10, 25]}
            />
          </Box>
        </CardContent>
      </Card>

      <Card sx={{ borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', flex: 1 }}>
        <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', mb: 2 }}>
            <Typography variant="h6" fontWeight={700} sx={{ m: 0 }}>Dữ Liệu Bác Sĩ Đã Cào</Typography>
            <Stack direction="row" spacing={2}>
              <Button variant="contained" color="success" onClick={handleBulkApprove} disabled={selectionModel.length === 0}>
                Duyệt đã chọn ({selectionModel.length})
              </Button>
              <Button variant="outlined" color="success" onClick={handleApproveAll} disabled={doctors.length === 0}>
                Duyệt tất cả
              </Button>
              <Button variant="outlined" color="error" onClick={() => setConfirmDeleteAll(true)} disabled={doctors.length === 0}>
                Xóa Tất Cả
              </Button>
            </Stack>
          </Box>
          <Box sx={{ flex: 1, minHeight: 400, width: '100%' }}>
            <DataGrid
              rows={doctors}
              columns={columns}
              loading={loading}
              disableRowSelectionOnClick
              initialState={{
                pagination: { paginationModel: { pageSize: 10 } },
              }}
              pageSizeOptions={[10, 25, 50]}
            />
          </Box>
        </CardContent>
      </Card>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Thêm Nguồn Dữ Liệu Mới</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <TextField label="Tên Nguồn (vd: Bệnh viện XYZ)" fullWidth value={newSource.sourceName} onChange={e => setNewSource({...newSource, sourceName: e.target.value})} />
            <TextField label="Đường dẫn gốc (Base URL)" fullWidth value={newSource.baseUrl} onChange={e => setNewSource({...newSource, baseUrl: e.target.value})} />
            <TextField label="Domain cho phép (vd: xyz.com)" fullWidth value={newSource.allowedDomain} onChange={e => setNewSource({...newSource, allowedDomain: e.target.value})} />
            <TextField label="Khu vực / Tỉnh thành" fullWidth value={newSource.city} onChange={e => setNewSource({...newSource, city: e.target.value})} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Hủy</Button>
          <Button variant="contained" onClick={handleCreateSource}>Tạo Mới</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
      </Snackbar>

      {/* Alert Delete All Dialog */}
      <Dialog open={confirmDeleteAll} onClose={() => setConfirmDeleteAll(false)}>
        <DialogTitle>Xóa tất cả dữ liệu bác sĩ</DialogTitle>
        <DialogContent>
          <Typography>Bạn có chắc chắn muốn xóa toàn bộ dữ liệu bác sĩ đã cào không? Hành động này không thể hoàn tác.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteAll(false)}>Hủy</Button>
          <Button color="error" variant="contained" onClick={handleDeleteAllDoctors}>Đồng ý xóa</Button>
        </DialogActions>
      </Dialog>

      {/* Doctor Detail Dialog */}
      <Dialog open={!!selectedDoctor} onClose={() => setSelectedDoctor(null)} maxWidth="md" fullWidth>
        <DialogTitle>Chi tiết Bác sĩ</DialogTitle>
        <DialogContent dividers>
          {selectedDoctor && (
            <Stack spacing={2}>
              <Stack direction="row" spacing={3} alignItems="center">
                <Box sx={{ width: 100, height: 100, borderRadius: '50%', overflow: 'hidden', border: '2px solid #039786' }}>
                  <img src={selectedDoctor.avatarUrl || 'https://via.placeholder.com/100'} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </Box>
                <Box>
                  <Typography variant="h5" fontWeight="bold">{selectedDoctor.fullName}</Typography>
                  <Typography variant="subtitle1" color="text.secondary">{selectedDoctor.specialization}</Typography>
                </Box>
              </Stack>
              <Typography><strong>Nơi công tác:</strong> {selectedDoctor.hospitalName}</Typography>
              <Typography><strong>Địa chỉ:</strong> {selectedDoctor.address || 'Không có'}</Typography>
              <Typography><strong>Nguồn:</strong> {selectedDoctor.profileUrl}</Typography>
              <Box sx={{ mt: 2 }}>
                <Typography fontWeight={700} gutterBottom>Tiểu sử / Nội dung khám:</Typography>
                <Box 
                  sx={{ 
                    p: 2, 
                    bgcolor: '#f5f5f5', 
                    borderRadius: 2, 
                    maxHeight: 300, 
                    overflowY: 'auto',
                    whiteSpace: 'pre-wrap'
                  }}
                >
                  {selectedDoctor.bio || 'Không có tiểu sử'}
                </Box>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedDoctor(null)}>Đóng</Button>
        </DialogActions>
      </Dialog>

      {/* Sync Result Alert Dialog */}
      <Dialog open={syncResult?.open || false} onClose={() => setSyncResult(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#039786' }}>
          <CheckCircle /> Cào dữ liệu hoàn tất
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body1" gutterBottom>Hệ thống đã thu thập xong dữ liệu từ nguồn này.</Typography>
          <Box sx={{ bgcolor: '#f0f9f8', p: 2, borderRadius: 2, mt: 2 }}>
            <Typography variant="body2" fontWeight={700}>Kết quả:</Typography>
            <Typography variant="body2">• Thêm mới: <strong style={{ color: 'green' }}>{syncResult?.imported}</strong> bác sĩ</Typography>
            <Typography variant="body2">• Cập nhật: <strong style={{ color: 'blue' }}>{syncResult?.updated}</strong> bác sĩ</Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={() => setSyncResult(null)}>Xác nhận</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
