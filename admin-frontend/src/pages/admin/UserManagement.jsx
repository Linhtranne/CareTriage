import { useState, useEffect, useCallback } from 'react'
import {
  Box, Typography, TextField, InputAdornment, Chip, IconButton, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions, Button, FormControl,
  InputLabel, Select, MenuItem, Alert, Snackbar, Card, CardContent,
  ToggleButtonGroup, ToggleButton, Avatar, Stack, useTheme, alpha,
} from '@mui/material'
import {
  Search, PersonOff, PersonOutlined, Edit, Visibility,
  AdminPanelSettings, LocalHospital, Person, FilterList,
  CheckCircle, Cancel, Close,
} from '@mui/icons-material'

import { DataGrid } from '@mui/x-data-grid'
import adminApi from '../../api/adminApi'

const ROLES = ['PATIENT', 'DOCTOR', 'ADMIN']

const roleConfig = {
  PATIENT: { color: 'info', icon: <Person sx={{ fontSize: 16 }} />, label: 'Bệnh nhân' },
  DOCTOR: { color: 'success', icon: <LocalHospital sx={{ fontSize: 16 }} />, label: 'Bác sĩ' },
  ADMIN: { color: 'warning', icon: <AdminPanelSettings sx={{ fontSize: 16 }} />, label: 'Quản trị' },
}

export default function UserManagement() {
  const theme = useTheme()
  const { t } = useTranslation()

  // Data states
  const [users, setUsers] = useState([])
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(false)
  const currentUser = useAuthStore(state => state.user)

  // Pagination & filter states
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const [search, setSearch] = useState('')
  const [searchDebounced, setSearchDebounced] = useState('')
  const [roleFilter, setRoleFilter] = useState('')

  // Dialog states
  const [roleDialog, setRoleDialog] = useState({ open: false, user: null })
  const [toggleDialog, setToggleDialog] = useState({ open: false, user: null })
  const [detailDialog, setDetailDialog] = useState({ open: false, user: null })
  const [selectedRole, setSelectedRole] = useState('')

  // Notification
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setSearchDebounced(search), 400)
    return () => clearTimeout(timer)
  }, [search])

  // Fetch users
  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const params = {
        page: paginationModel.page,
        size: paginationModel.pageSize,
      }
      if (searchDebounced) params.search = searchDebounced
      if (roleFilter) params.role = roleFilter

      const res = await adminApi.getUsers(params)
      const data = res.data.data
      setUsers(data.content || [])
      setTotalElements(data.totalElements || 0)
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to load users', severity: 'error' })
    } finally {
      setLoading(false)
    }
  }, [paginationModel.page, paginationModel.pageSize, searchDebounced, roleFilter])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  // Handle role change
  const handleRoleChange = async () => {
    if (!roleDialog.user || !selectedRole) return
    try {
      await adminApi.changeRole(roleDialog.user.id, selectedRole)
      setSnackbar({ open: true, message: `Đã thay đổi role thành ${selectedRole}`, severity: 'success' })
      setRoleDialog({ open: false, user: null })
      setSelectedRole('')
      fetchUsers()
    } catch (err) {
      setSnackbar({ open: true, message: err.response?.data?.message || 'Lỗi thay đổi role', severity: 'error' })
    }
  }

  // Handle toggle active
  const handleToggleActive = async () => {
    if (!toggleDialog.user) return
    try {
      await adminApi.toggleActive(toggleDialog.user.id)
      const action = toggleDialog.user.isActive ? 'khóa' : 'kích hoạt'
      setSnackbar({ open: true, message: `Đã ${action} tài khoản`, severity: 'success' })
      setToggleDialog({ open: false, user: null })
      fetchUsers()
    } catch (err) {
      setSnackbar({ open: true, message: err.response?.data?.message || 'Lỗi cập nhật', severity: 'error' })
    }
  }

  // DataGrid columns
  const columns = [
    {
      field: 'id',
      headerName: 'ID',
      width: 70,
    },
    {
      field: 'fullName',
      headerName: 'Người dùng',
      flex: 1.5,
      minWidth: 220,
      renderCell: (params) => (
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ py: 0.5 }}>
          <Avatar
            src={params.row.avatarUrl}
            sx={{
              width: 38, height: 38,
              bgcolor: theme.palette.primary.main,
              fontSize: '0.875rem',
              fontWeight: 600,
            }}
          >
            {params.row.fullName?.[0]?.toUpperCase() || '?'}
          </Avatar>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.3 }}>
              {params.row.fullName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {params.row.email}
            </Typography>
          </Box>
        </Stack>
      ),
    },
    {
      field: 'username',
      headerName: 'Username',
      flex: 0.8,
      minWidth: 120,
    },
    {
      field: 'phone',
      headerName: 'SĐT',
      flex: 0.7,
      minWidth: 110,
      renderCell: (params) => params.value || '—',
    },
    {
      field: 'roles',
      headerName: 'Role',
      flex: 0.8,
      minWidth: 130,
      renderCell: (params) => {
        const roles = params.value || []
        return (
          <Stack direction="row" spacing={0.5} flexWrap="wrap">
            {roles.map((role) => {
              const cfg = roleConfig[role] || { color: 'default', label: role }
              return (
                <Chip
                  key={role}
                  label={cfg.label}
                  color={cfg.color}
                  size="small"
                  icon={cfg.icon}
                  sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                />
              )
            })}
          </Stack>
        )
      },
    },
    {
      field: 'isActive',
      headerName: 'Trạng thái',
      flex: 0.6,
      minWidth: 110,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'Hoạt động' : 'Đã khóa'}
          color={params.value ? 'success' : 'error'}
          variant="outlined"
          size="small"
          icon={params.value ? <CheckCircle sx={{ fontSize: 16 }} /> : <Cancel sx={{ fontSize: 16 }} />}
          sx={{ fontWeight: 600 }}
        />
      ),
    },
    {
      field: 'createdAt',
      headerName: 'Ngày tạo',
      flex: 0.8,
      minWidth: 120,
      renderCell: (params) => {
        if (!params.value) return '—'
        const date = new Date(params.value)
        return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
      },
    },
    {
      field: 'actions',
      headerName: 'Thao tác',
      flex: 0.7,
      minWidth: 130,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="Xem chi tiết">
            <IconButton
              size="small"
              onClick={() => setDetailDialog({ open: true, user: params.row })}
              sx={{ color: theme.palette.info.main }}
            >
              <Visibility fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={params.row.id === currentUser?.id ? "Bạn không thể tự đổi role chính mình" : "Đổi role"}>
            <span>
              <IconButton
                size="small"
                disabled={params.row.id === currentUser?.id}
                onClick={() => {
                  setRoleDialog({ open: true, user: params.row })
                  const currentRole = params.row.roles?.[0] || 'PATIENT'
                  setSelectedRole(currentRole)
                }}
                sx={{ color: theme.palette.warning.main }}
              >
                <Edit fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title={params.row.id === currentUser?.id ? "Bạn không thể tự khóa chính mình" : (params.row.isActive ? 'Khóa tài khoản' : 'Kích hoạt')}>
            <span>
              <IconButton
                size="small"
                disabled={params.row.id === currentUser?.id}
                onClick={() => setToggleDialog({ open: true, user: params.row })}
                sx={{ color: params.row.isActive ? theme.palette.error.main : theme.palette.success.main }}
              >
                {params.row.isActive ? <PersonOff fontSize="small" /> : <PersonOutlined fontSize="small" />}
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      ),
    },
  ]

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Quản lý người dùng
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Tổng cộng {totalElements} người dùng trong hệ thống
          </Typography>
        </Box>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3, border: '1px solid', borderColor: alpha(theme.palette.primary.main, 0.1) }}>
        <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
            <TextField
              placeholder="Tìm kiếm theo tên, email, username..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              size="small"
              sx={{ flex: 1, minWidth: 280 }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                },
              }}
            />
            <Stack direction="row" spacing={1} alignItems="center">
              <FilterList sx={{ color: 'text.secondary', fontSize: 20 }} />
              <ToggleButtonGroup
                value={roleFilter}
                exclusive
                onChange={(_, val) => setRoleFilter(val || '')}
                size="small"
                sx={{
                  '& .MuiToggleButton-root': {
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.8125rem',
                    px: 1.5,
                    borderRadius: '8px !important',
                    border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
                    '&.Mui-selected': {
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      color: theme.palette.primary.main,
                      borderColor: theme.palette.primary.main,
                    },
                  },
                }}
              >
                <ToggleButton value="PATIENT">Bệnh nhân</ToggleButton>
                <ToggleButton value="DOCTOR">Bác sĩ</ToggleButton>
                <ToggleButton value="ADMIN">Admin</ToggleButton>
              </ToggleButtonGroup>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {/* DataGrid */}
      <Card sx={{ overflow: 'hidden' }}>
        <DataGrid
          rows={users}
          columns={columns}
          loading={loading}
          rowCount={totalElements}
          paginationMode="server"
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[5, 10, 20, 50]}
          disableRowSelectionOnClick
          autoHeight
          getRowId={(row) => row.id}
          sx={{
            border: 'none',
            '& .MuiDataGrid-columnHeaders': {
              bgcolor: alpha(theme.palette.primary.main, 0.04),
              borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.1)}`,
            },
            '& .MuiDataGrid-columnHeaderTitle': {
              fontWeight: 700,
              fontSize: '0.8125rem',
              color: theme.palette.text.secondary,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            },
            '& .MuiDataGrid-row': {
              '&:hover': {
                bgcolor: alpha(theme.palette.primary.main, 0.02),
              },
            },
            '& .MuiDataGrid-cell': {
              borderBottom: `1px solid ${alpha(theme.palette.divider, 0.06)}`,
              display: 'flex',
              alignItems: 'center',
            },
          }}
        />
      </Card>

      {/* ===== Role Change Dialog (T-018) ===== */}
      <Dialog
        open={roleDialog.open}
        onClose={() => setRoleDialog({ open: false, user: null })}
        maxWidth="xs"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 3 } } }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
          Thay đổi vai trò
          <IconButton
            onClick={() => setRoleDialog({ open: false, user: null })}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {roleDialog.user && (
            <Box sx={{ mb: 3, mt: 1 }}>
              <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
                <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 42, height: 42 }}>
                  {roleDialog.user.fullName?.[0]?.toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {roleDialog.user.fullName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {roleDialog.user.email}
                  </Typography>
                </Box>
              </Stack>
              <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
                Thay đổi vai trò sẽ ảnh hưởng đến quyền truy cập hệ thống của người dùng.
              </Alert>
              <FormControl fullWidth>
                <InputLabel>Vai trò mới</InputLabel>
                <Select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  label="Vai trò mới"
                >
                  {ROLES.map((role) => {
                    const cfg = roleConfig[role]
                    return (
                      <MenuItem key={role} value={role}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          {cfg.icon}
                          <Typography>{cfg.label} ({role})</Typography>
                        </Stack>
                      </MenuItem>
                    )
                  })}
                </Select>
              </FormControl>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setRoleDialog({ open: false, user: null })} color="inherit">
            Hủy
          </Button>
          <Button
            onClick={handleRoleChange}
            variant="contained"
            disabled={!selectedRole || (roleDialog.user?.roles?.length === 1 && roleDialog.user.roles[0] === selectedRole)}
          >
            Xác nhận
          </Button>
        </DialogActions>
      </Dialog>

      {/* ===== Toggle Active Dialog ===== */}
      <Dialog
        open={toggleDialog.open}
        onClose={() => setToggleDialog({ open: false, user: null })}
        maxWidth="xs"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 3 } } }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
          {toggleDialog.user?.isActive ? 'Khóa tài khoản' : 'Kích hoạt tài khoản'}
          <IconButton
            onClick={() => setToggleDialog({ open: false, user: null })}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {toggleDialog.user && (
            <Box sx={{ mt: 1 }}>
              <Alert
                severity={toggleDialog.user.isActive ? 'error' : 'success'}
                sx={{ mb: 2, borderRadius: 2 }}
              >
                {toggleDialog.user.isActive
                  ? `Bạn sắp khóa tài khoản "${toggleDialog.user.fullName}". Người dùng sẽ không thể đăng nhập.`
                  : `Bạn sắp kích hoạt tài khoản "${toggleDialog.user.fullName}". Người dùng sẽ có thể đăng nhập trở lại.`
                }
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setToggleDialog({ open: false, user: null })} color="inherit">
            Hủy
          </Button>
          <Button
            onClick={handleToggleActive}
            variant="contained"
            color={toggleDialog.user?.isActive ? 'error' : 'success'}
          >
            {toggleDialog.user?.isActive ? 'Khóa tài khoản' : 'Kích hoạt'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ===== User Detail Dialog ===== */}
      <Dialog
        open={detailDialog.open}
        onClose={() => setDetailDialog({ open: false, user: null })}
        maxWidth="sm"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 3 } } }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
          Chi tiết người dùng
          <IconButton
            onClick={() => setDetailDialog({ open: false, user: null })}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {detailDialog.user && (
            <Box sx={{ mt: 1 }}>
              <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
                <Avatar
                  src={detailDialog.user.avatarUrl}
                  sx={{ width: 64, height: 64, bgcolor: theme.palette.primary.main, fontSize: '1.5rem' }}
                >
                  {detailDialog.user.fullName?.[0]?.toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {detailDialog.user.fullName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    @{detailDialog.user.username}
                  </Typography>
                </Box>
              </Stack>
              <Box sx={{
                display: 'grid',
                gridTemplateColumns: '140px 1fr',
                rowGap: 1.5,
                columnGap: 2,
                '& .label': { color: 'text.secondary', fontWeight: 600, fontSize: '0.875rem' },
                '& .value': { fontSize: '0.875rem' },
              }}>
                <Typography className="label">Email</Typography>
                <Typography className="value">{detailDialog.user.email}</Typography>

                <Typography className="label">SĐT</Typography>
                <Typography className="value">{detailDialog.user.phone || '—'}</Typography>

                <Typography className="label">Vai trò</Typography>
                <Box>
                  <Stack direction="row" spacing={0.5}>
                    {(detailDialog.user.roles || []).map((role) => {
                      const cfg = roleConfig[role] || { color: 'default', label: role }
                      return <Chip key={role} label={cfg.label} color={cfg.color} size="small" icon={cfg.icon} />
                    })}
                  </Stack>
                </Box>

                <Typography className="label">Trạng thái</Typography>
                <Chip
                  label={detailDialog.user.isActive ? 'Hoạt động' : 'Đã khóa'}
                  color={detailDialog.user.isActive ? 'success' : 'error'}
                  size="small"
                  variant="outlined"
                  sx={{ width: 'fit-content' }}
                />

                <Typography className="label">2FA Email</Typography>
                <Typography className="value">{detailDialog.user.twoFactorEmail ? 'Bật' : 'Tắt'}</Typography>

                <Typography className="label">2FA SMS</Typography>
                <Typography className="value">{detailDialog.user.twoFactorSms ? 'Bật' : 'Tắt'}</Typography>

                <Typography className="label">Ngày tạo</Typography>
                <Typography className="value">
                  {detailDialog.user.createdAt
                    ? new Date(detailDialog.user.createdAt).toLocaleString('vi-VN')
                    : '—'}
                </Typography>

                <Typography className="label">Cập nhật cuối</Typography>
                <Typography className="value">
                  {detailDialog.user.updatedAt
                    ? new Date(detailDialog.user.updatedAt).toLocaleString('vi-VN')
                    : '—'}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDetailDialog({ open: false, user: null })} variant="outlined">
            Đóng
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          variant="filled"
          sx={{ borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}
