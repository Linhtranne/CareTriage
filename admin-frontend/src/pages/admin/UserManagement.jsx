import { useState, useEffect, useCallback } from 'react'
import {
  Box, Typography, TextField, InputAdornment, Chip, IconButton, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions, Button, FormControl,
  InputLabel, Select, MenuItem, Alert, Snackbar, Card, CardContent,
  ToggleButtonGroup, ToggleButton, Avatar, Stack, useTheme, alpha, Divider, Grid, Zoom,
  Menu, Drawer, ListItemIcon, ListItemText,
} from '@mui/material'
import {
  Search, Edit, Visibility, MoreVert,
  AdminPanelSettings, LocalHospital, Person, FilterList,
  CheckCircle, Cancel, Close, Lock, LockOpen,
  Cake, Wc, Home, Bloodtype, Warning, HistoryEdu,
  WorkspacePremium, Timeline, School,
  LocalHospital as HospitalIcon,
} from '@mui/icons-material'
import { Tabs, Tab } from '@mui/material'

import { DataGrid } from '@mui/x-data-grid'
import adminApi from '../../api/adminApi'
import useAuthStore from '../../store/authStore'

const ROLES = ['PATIENT', 'DOCTOR', 'ADMIN']

const roleConfig = {
  PATIENT: { color: 'info', icon: <Person sx={{ fontSize: 16 }} />, label: 'Bệnh nhân' },
  DOCTOR: { color: 'success', icon: <LocalHospital sx={{ fontSize: 16 }} />, label: 'Bác sĩ' },
  ADMIN: { color: 'warning', icon: <AdminPanelSettings sx={{ fontSize: 16 }} />, label: 'Quản trị' },
}

const ProfileInfoItem = ({ icon, label, value }) => (
  <Box sx={{ mb: 2 }}>
    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 0.5, opacity: 0.8 }}>
      {icon}
      <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </Typography>
    </Stack>
    <Typography variant="body2" sx={{ fontWeight: 700, pl: 3.5 }}>
      {value || '---'}
    </Typography>
  </Box>
)

export default function UserManagement() {
  const theme = useTheme()

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
  const [editDialog, setEditDialog] = useState({ open: false, user: null })
  const [actionMenu, setActionMenu] = useState({ anchorEl: null, user: null })
  const [selectedRole, setSelectedRole] = useState('')
  const [activeTab, setActiveTab] = useState(0)
  const [editForm, setEditForm] = useState({})
  const [saving, setSaving] = useState(false)

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
    } catch {
      setSnackbar({ open: true, message: 'Failed to load users', severity: 'error' })
    } finally {
      setLoading(false)
    }
  }, [paginationModel.page, paginationModel.pageSize, searchDebounced, roleFilter])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers()
    }, 0)

    return () => clearTimeout(timer)
  }, [fetchUsers])

  const openDetailDrawer = (user) => {
    setActiveTab(0)
    setDetailDialog({ open: true, user })
  }

  const openActionMenu = (event, user) => {
    setActionMenu({ anchorEl: event.currentTarget, user })
  }

  const closeActionMenu = () => {
    setActionMenu({ anchorEl: null, user: null })
  }

  const handleActionMenu = (action) => {
    if (!actionMenu.user) return
    action(actionMenu.user)
    closeActionMenu()
  }

  const isActionMenuSelf = Boolean(
    actionMenu.user && (
      String(actionMenu.user.id) === String(currentUser?.id) ||
      actionMenu.user.email === currentUser?.email ||
      actionMenu.user.username === currentUser?.username
    ),
  )

  const openEditDialog = (user) => {
    setEditDialog({ open: true, user })
    setEditForm({ ...user })
  }

  const openRoleDialog = (user) => {
    setRoleDialog({ open: true, user })
    const currentRole = (user.roles?.[0] || 'PATIENT').replace('ROLE_', '').toUpperCase()
    setSelectedRole(currentRole)
  }

  const openToggleDialog = (user) => {
    setToggleDialog({ open: true, user })
  }

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

  // Handle update profile
  const handleUpdateProfile = async () => {
    if (!editDialog.user) return
    setSaving(true)
    try {
      await adminApi.updateProfile(editDialog.user.id, editForm)
      setSnackbar({ open: true, message: 'Cập nhật hồ sơ thành công', severity: 'success' })
      setEditDialog({ open: false, user: null })
      fetchUsers()
    } catch (err) {
      setSnackbar({ open: true, message: err.response?.data?.message || 'Lỗi cập nhật hồ sơ', severity: 'error' })
    } finally {
      setSaving(false)
    }
  }

  // DataGrid columns
  const columns = [
    {
      field: 'id',
      headerName: 'ID',
      width: 80,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.secondary', opacity: 0.6 }}>
          #{params.value}
        </Typography>
      )
    },
    {
      field: 'fullName',
      headerName: 'Người dùng',
      flex: 2.5,
      minWidth: 320,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', width: '100%' }}>
          <Stack direction="row" spacing={2.5} sx={{ alignItems: 'center' }}>
            <Avatar
              src={params.row.avatarUrl}
              sx={{
                width: 52, height: 52,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                fontSize: '1.2rem',
                fontWeight: 900,
                boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.3)}`,
                border: '2px solid #fff'
              }}
            >
              {params.row.fullName?.[0]?.toUpperCase() || '?'}
            </Avatar>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 900, lineHeight: 1.1, color: 'text.primary', fontSize: '1.05rem' }}>
                {params.row.fullName}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, fontSize: '0.8rem' }}>
                {params.row.email}
              </Typography>
            </Box>
          </Stack>
        </Box>
      ),
    },
    {
      field: 'username',
      headerName: 'Username',
      flex: 1.2,
      minWidth: 180,
      hide: true,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main', bgcolor: alpha(theme.palette.primary.main, 0.05), px: 1.5, py: 0.5, borderRadius: 2 }}>
          @{params.value}
        </Typography>
      )
    },
    {
      field: 'phone',
      headerName: 'Số điện thoại',
      flex: 1.2,
      minWidth: 180,
      hide: true,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 700, letterSpacing: '0.05em' }}>
          {params.value || '---'}
        </Typography>
      )
    },
    {
      field: 'roles',
      headerName: 'Vai trò',
      flex: 1.5,
      minWidth: 220,
      renderCell: (params) => {
        const roles = params.value || []
        return (
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
            {roles.map((role) => {
              const cleanRole = role.replace('ROLE_', '').toUpperCase()
              const cfg = roleConfig[cleanRole] || { color: 'primary', label: role }
              const colorKey = cfg.color || 'primary'
              const baseColor = theme.palette[colorKey]?.main || theme.palette.primary.main || '#08BBA3'
              return (
                <Chip
                  key={role}
                  label={cfg.label}
                  size="small"
                  icon={cfg.icon}
                  sx={{ 
                    fontWeight: 900, 
                    fontSize: '0.65rem',
                    bgcolor: alpha(baseColor, 0.1),
                    color: baseColor,
                    border: `1px solid ${alpha(baseColor, 0.2)}`,
                    borderRadius: '8px',
                    height: 26,
                    '& .MuiChip-icon': { color: 'inherit', fontSize: 14 }
                  }}
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
      flex: 1.2,
      minWidth: 160,
      renderCell: (params) => {
        const baseColor = params.value ? theme.palette.success.main : theme.palette.error.main
        return (
          <Chip
            label={params.value ? 'Hoạt động' : 'Đã khóa'}
            size="small"
            variant="filled"
            icon={params.value ? <CheckCircle sx={{ fontSize: 14 }} /> : <Cancel sx={{ fontSize: 14 }} />}
            sx={{ 
              fontWeight: 900,
              fontSize: '0.7rem',
              bgcolor: alpha(baseColor, 0.15),
              color: baseColor,
              border: `1px solid ${alpha(baseColor, 0.3)}`,
              borderRadius: '10px',
              height: 28,
              px: 1.5,
              '& .MuiChip-icon': { color: 'inherit' }
            }}
          />
        )
      },
    },
    {
      field: 'createdAt',
      headerName: 'Ngày tạo',
      flex: 1.2,
      minWidth: 160,
      renderCell: (params) => {
        if (!params.value) return '---'
        const date = new Date(params.value)
        return (
          <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary' }}>
            {date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
          </Typography>
        )
      },
    },
    {
      field: 'actions',
      headerName: 'Thao tác',
      flex: 1.8,
      minWidth: 200,
      sortable: false,
      filterable: false,
      renderCell: (params) => {
        return (
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Tooltip title="Tác vụ">
              <IconButton
                size="small"
                onClick={(event) => {
                  event.stopPropagation()
                  openActionMenu(event, params.row)
                }}
                sx={{
                  color: 'text.secondary',
                  bgcolor: alpha(theme.palette.primary.main, 0.06),
                  '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.14), transform: 'translateY(-2px)' },
                  transition: 'all 0.2s',
                }}
              >
                <MoreVert fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        )
      },
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
      <Card 
        sx={{ 
          mb: 4, 
          background: 'rgba(255, 255, 255, 0.4)',
          backdropFilter: 'blur(30px) saturate(180%)',
          border: '1px solid rgba(255, 255, 255, 0.5)', 
          borderRadius: 4,
          boxShadow: '0 8px 32px rgba(0,0,0,0.05)',
        }}
      >
        <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} sx={{ alignItems: 'center' }}>
            <TextField
              placeholder="Tìm kiếm theo tên, email, username..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              size="small"
              sx={{ 
                flex: 1, 
                minWidth: 320,
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'rgba(255, 255, 255, 0.5)',
                  borderRadius: 3,
                  transition: 'all 0.3s',
                  '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.8)' },
                  '&.Mui-focused': { 
                    bgcolor: '#fff',
                    boxShadow: `0 0 0 4px ${alpha(theme.palette.primary.main, 0.1)}`,
                  }
                }
              }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: 'primary.main', fontSize: 22 }} />
                    </InputAdornment>
                  ),
                },
              }}
            />
            <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                <FilterList sx={{ fontSize: 20 }} />
                <Typography variant="body2" sx={{ fontWeight: 700 }}>LỌC THEO VAI TRÒ</Typography>
              </Box>
              <ToggleButtonGroup
                value={roleFilter}
                exclusive
                onChange={(_, val) => setRoleFilter(val || '')}
                size="small"
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.4)',
                  borderRadius: '12px',
                  p: 0.5,
                  '& .MuiToggleButton-root': {
                    textTransform: 'none',
                    fontWeight: 800,
                    fontSize: '0.75rem',
                    px: 2,
                    py: 0.8,
                    borderRadius: '10px !important',
                    border: 'none',
                    color: 'text.secondary',
                    '&.Mui-selected': {
                      bgcolor: 'primary.main',
                      color: '#fff',
                      boxShadow: '0 4px 12px rgba(8, 187, 163, 0.3)',
                      '&:hover': { bgcolor: 'primary.dark' },
                    },
                    '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.8)' },
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

      <Card 
        sx={{ 
          height: 800,
          overflow: 'hidden',
          background: 'rgba(255, 255, 255, 0.4)',
          backdropFilter: 'blur(30px) saturate(180%)',
          border: '1px solid rgba(255, 255, 255, 0.5)',
          borderRadius: 4,
          boxShadow: '0 12px 40px rgba(0,0,0,0.06)',
        }}
      >
        <DataGrid
          rows={users}
          columns={columns}
          loading={loading}
          rowCount={totalElements}
          getRowHeight={() => 112}
          getEstimatedRowHeight={() => 112}
          columnHeaderHeight={68}
          density="standard"
          paginationMode="server"
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[5, 10, 20, 50]}
          disableRowSelectionOnClick
          onRowClick={(params) => openDetailDrawer(params.row)}
          disableVirtualization
          getRowId={(row) => row.id}
          sx={{
            height: '100%',
            border: 'none',
            '& .MuiDataGrid-columnHeaders': {
              background: `linear-gradient(90deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
              borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.1)}`,
            },
            '& .MuiDataGrid-columnHeaderTitle': {
              fontWeight: 900,
              fontSize: '0.7rem',
              color: 'primary.dark',
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
            },
            '& .MuiDataGrid-row': {
              transition: 'background-color 0.2s',
              overflow: 'visible !important',
              cursor: 'pointer',
              '&:hover': {
                bgcolor: alpha(theme.palette.primary.main, 0.04),
              },
            },
            '& .MuiDataGrid-cell': {
              borderBottom: `1px solid ${alpha(theme.palette.divider, 0.04)}`,
              display: 'flex',
              alignItems: 'center',
              fontSize: '0.9rem',
              fontWeight: 500,
              lineHeight: 'normal !important',
              outline: 'none !important',
              overflow: 'visible !important',
              whiteSpace: 'normal !important',
              wordBreak: 'break-word !important',
            },
            '& .MuiDataGrid-footerContainer': {
              borderTop: `1px solid ${alpha(theme.palette.divider, 0.05)}`,
              bgcolor: 'rgba(255, 255, 255, 0.2)',
            }
          }}
        />
      </Card>

      <Menu
        anchorEl={actionMenu.anchorEl}
        open={Boolean(actionMenu.anchorEl)}
        onClose={closeActionMenu}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              minWidth: 240,
              borderRadius: 3,
              overflow: 'hidden',
              boxShadow: '0 20px 40px rgba(0,0,0,0.14)',
              border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
            },
          },
        }}
      >
        <MenuItem onClick={() => handleActionMenu(openDetailDrawer)} dense>
          <ListItemIcon sx={{ minWidth: 36 }}>
            <Visibility fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Xem chi tiết" primaryTypographyProps={{ fontWeight: 700 }} />
        </MenuItem>
        <MenuItem onClick={() => handleActionMenu(openEditDialog)} dense>
          <ListItemIcon sx={{ minWidth: 36 }}>
            <Edit fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Chỉnh sửa hồ sơ" primaryTypographyProps={{ fontWeight: 700 }} />
        </MenuItem>
        <MenuItem onClick={() => handleActionMenu(openRoleDialog)} dense disabled={isActionMenuSelf}>
          <ListItemIcon sx={{ minWidth: 36, color: isActionMenuSelf ? 'text.disabled' : 'warning.main' }}>
            <AdminPanelSettings fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Thay đổi vai trò" primaryTypographyProps={{ fontWeight: 700 }} />
        </MenuItem>
        <MenuItem onClick={() => handleActionMenu(openToggleDialog)} dense disabled={isActionMenuSelf}>
          <ListItemIcon sx={{ minWidth: 36, color: isActionMenuSelf ? 'text.disabled' : actionMenu.user?.isActive ? 'error.main' : 'success.main' }}>
            {actionMenu.user?.isActive ? <Lock fontSize="small" /> : <LockOpen fontSize="small" />}
          </ListItemIcon>
          <ListItemText
            primary={actionMenu.user?.isActive ? 'Khóa tài khoản' : 'Kích hoạt lại'}
            primaryTypographyProps={{ fontWeight: 700 }}
          />
        </MenuItem>
      </Menu>

      {/* ===== Role Change Dialog (T-018) ===== */}
      <Dialog
        open={roleDialog.open}
        onClose={() => setRoleDialog({ open: false, user: null })}
        maxWidth="xs"
        fullWidth
        slotProps={{ 
          paper: { 
            sx: { 
              borderRadius: 5,
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.4)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            } 
          } 
        }}
      >
        <DialogTitle sx={{ fontWeight: 900, fontSize: '1.25rem', color: 'primary.main', pb: 1, pt: 3, px: 4 }}>
          Thay đổi vai trò
          <IconButton
            onClick={() => setRoleDialog({ open: false, user: null })}
            sx={{ position: 'absolute', right: 16, top: 16, color: 'text.secondary' }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ px: 4 }}>
          {roleDialog.user && (
            <Box sx={{ mb: 1, mt: 1 }}>
              <Stack direction="row" spacing={2} sx={{ mb: 3, p: 2, bgcolor: alpha(theme.palette.primary.main, 0.05), borderRadius: 3, alignItems: 'center' }}>
                <Avatar sx={{ background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`, width: 48, height: 48, fontWeight: 800 }}>
                  {roleDialog.user.fullName?.[0]?.toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1.2 }}>
                    {roleDialog.user.fullName}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                    {roleDialog.user.email}
                  </Typography>
                </Box>
              </Stack>
              <Alert 
                severity="warning" 
                icon={<AdminPanelSettings />}
                sx={{ 
                  mb: 3, 
                  borderRadius: 3, 
                  fontWeight: 600,
                  '& .MuiAlert-message': { fontSize: '0.85rem' }
                }}
              >
                Lưu ý: Việc thay đổi vai trò sẽ thay đổi toàn bộ quyền hạn truy cập các chức năng của người dùng này trong hệ thống.
              </Alert>
              <FormControl fullWidth>
                <InputLabel sx={{ fontWeight: 600 }}>Chọn vai trò mới</InputLabel>
                <Select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  label="Chọn vai trò mới"
                  sx={{ 
                    borderRadius: 3,
                    '& .MuiSelect-select': { fontWeight: 700 }
                  }}
                >
                  {ROLES.map((role) => {
                    const cfg = roleConfig[role]
                    return (
                      <MenuItem key={role} value={role} sx={{ py: 1.5 }}>
                        <Stack direction="row" sx={{ alignItems: 'center' }} spacing={1.5}>
                          <Box sx={{ color: theme.palette[cfg.color].main, display: 'flex' }}>{cfg.icon}</Box>
                          <Typography sx={{ fontWeight: 700 }}>{cfg.label}</Typography>
                        </Stack>
                      </MenuItem>
                    )
                  })}
                </Select>
              </FormControl>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 4, pb: 4, pt: 1 }}>
          <Button 
            onClick={() => setRoleDialog({ open: false, user: null })} 
            variant="text"
            sx={{ fontWeight: 800, px: 3, borderRadius: 2, color: 'text.secondary' }}
          >
            Hủy bỏ
          </Button>
          <Button
            onClick={handleRoleChange}
            variant="contained"
            disabled={
              !selectedRole || 
              (String(roleDialog.user?.id) === String(currentUser?.id)) || 
              (roleDialog.user?.email === currentUser?.email) || 
              (roleDialog.user?.roles?.[0]?.replace('ROLE_', '').toUpperCase() === selectedRole)
            }
            sx={{ 
              fontWeight: 800, 
              px: 4, 
              borderRadius: 3,
              boxShadow: `0 8px 16px ${alpha(theme.palette.primary.main, 0.3)}`,
            }}
          >
            Lưu thay đổi
          </Button>
        </DialogActions>
      </Dialog>

      {/* ===== Toggle Active Dialog ===== */}
      <Dialog
        open={toggleDialog.open}
        onClose={() => setToggleDialog({ open: false, user: null })}
        maxWidth="xs"
        fullWidth
        slotProps={{ 
          paper: { 
            sx: { 
              borderRadius: 5,
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.4)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            } 
          } 
        }}
      >
        <DialogTitle sx={{ fontWeight: 900, fontSize: '1.25rem', color: toggleDialog.user?.isActive ? 'error.main' : 'success.main', pb: 1, pt: 3, px: 4 }}>
          {toggleDialog.user?.isActive ? 'Xác nhận khóa tài khoản' : 'Xác nhận kích hoạt'}
          <IconButton
            onClick={() => setToggleDialog({ open: false, user: null })}
            sx={{ position: 'absolute', right: 16, top: 16, color: 'text.secondary' }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ px: 4 }}>
          {toggleDialog.user && (
            <Box sx={{ mt: 2 }}>
              <Box sx={{ 
                p: 3, 
                borderRadius: 4, 
                bgcolor: alpha(toggleDialog.user.isActive ? theme.palette.error.main : theme.palette.success.main, 0.05),
                border: '1px dashed',
                borderColor: alpha(toggleDialog.user.isActive ? theme.palette.error.main : theme.palette.success.main, 0.3),
                textAlign: 'center'
              }}>
                <Avatar 
                  sx={{ 
                    mx: 'auto', 
                    mb: 2, 
                    width: 64, 
                    height: 64, 
                    bgcolor: toggleDialog.user.isActive ? 'error.main' : 'success.main',
                    boxShadow: `0 8px 20px ${alpha(toggleDialog.user.isActive ? theme.palette.error.main : theme.palette.success.main, 0.3)}`
                  }}
                >
                  {toggleDialog.user.isActive ? <Lock sx={{ fontSize: 32 }} /> : <LockOpen sx={{ fontSize: 32 }} />}
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
                  {toggleDialog.user.fullName}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  {toggleDialog.user.isActive 
                    ? 'Người dùng này sẽ bị chặn truy cập vào toàn bộ hệ thống ngay lập tức.' 
                    : 'Người dùng sẽ có thể truy cập lại vào hệ thống bình thường.'}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 4, pb: 4, pt: 2 }}>
          <Button 
            onClick={() => setToggleDialog({ open: false, user: null })} 
            variant="text"
            sx={{ fontWeight: 800, px: 3, borderRadius: 2, color: 'text.secondary' }}
          >
            Hủy bỏ
          </Button>
          <Button
            onClick={handleToggleActive}
            variant="contained"
            color={toggleDialog.user?.isActive ? 'error' : 'success'}
            sx={{ 
              fontWeight: 900, 
              px: 4, 
              borderRadius: 3,
              boxShadow: `0 8px 16px ${alpha(toggleDialog.user?.isActive ? theme.palette.error.main : theme.palette.success.main, 0.3)}`,
            }}
          >
            {toggleDialog.user?.isActive ? 'Xác nhận khóa' : 'Xác nhận mở'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ===== User Detail Drawer (Master-Detail) ===== */}
      <Drawer
        anchor="right"
        open={detailDialog.open}
        onClose={() => setDetailDialog({ open: false, user: null })}
        ModalProps={{ keepMounted: true }}
        PaperProps={{
          sx: {
            width: { xs: '100vw', sm: 560, md: 640 },
            maxWidth: '100vw',
            borderTopLeftRadius: { xs: 0, sm: 6 },
            borderBottomLeftRadius: { xs: 0, sm: 6 },
            overflow: 'hidden',
            background: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 40px 80px rgba(0,0,0,0.15)',
          },
        }}
      >
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ height: 120, background: 'linear-gradient(135deg, #08BBA3 0%, #064E3B 100%)', position: 'relative' }}>
            <IconButton
              onClick={() => setDetailDialog({ open: false, user: null })}
              sx={{ position: 'absolute', right: 16, top: 16, color: '#fff', bgcolor: 'rgba(0,0,0,0.2)', '&:hover': { bgcolor: 'rgba(0,0,0,0.4)' } }}
            >
              <Close />
            </IconButton>
          </Box>

          <DialogContent sx={{ p: 0, mt: -6, flex: 1, overflowY: 'auto' }}>
            {detailDialog.user && (
              <Box>
                <Box sx={{ px: 4, display: 'flex', alignItems: 'flex-end', gap: 3, mb: 4 }}>
                  <Avatar
                    src={detailDialog.user.avatarUrl}
                    sx={{
                      width: 120,
                      height: 120,
                      border: '6px solid #fff',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                      bgcolor: 'primary.main',
                      fontSize: '3rem',
                      fontWeight: 900,
                    }}
                  >
                    {detailDialog.user.fullName?.[0]?.toUpperCase()}
                  </Avatar>
                  <Box sx={{ pb: 1, flex: 1 }}>
                    <Typography variant="h4" sx={{ fontWeight: 900, color: 'text.primary' }}>
                      {detailDialog.user.fullName}
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                      <Chip
                        label={`@${detailDialog.user.username}`}
                        size="small"
                        sx={{ fontWeight: 800, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}
                      />
                      <Chip
                        label={detailDialog.user.isActive ? 'Active' : 'Locked'}
                        size="small"
                        color={detailDialog.user.isActive ? 'success' : 'error'}
                        sx={{ fontWeight: 800 }}
                      />
                    </Stack>
                  </Box>
                </Box>

                <Tabs
                  value={activeTab}
                  onChange={(_, v) => setActiveTab(v)}
                  sx={{ px: 4, borderBottom: 1, borderColor: 'divider' }}
                >
                  <Tab label="Tài khoản" sx={{ fontWeight: 800 }} />
                  <Tab label="Hồ sơ chi tiết" sx={{ fontWeight: 800 }} />
                </Tabs>

                <Box sx={{ p: 4 }}>
                  {activeTab === 0 && (
                    <Grid container spacing={4}>
                      <Grid xs={12} md={6}>
                        <Typography variant="overline" sx={{ fontWeight: 900, color: 'text.secondary', display: 'block', mb: 2 }}>Liên hệ</Typography>
                        <ProfileInfoItem icon={<Search fontSize="small" color="primary" />} label="Email" value={detailDialog.user.email} />
                        <ProfileInfoItem icon={<Search fontSize="small" color="primary" />} label="Số điện thoại" value={detailDialog.user.phone} />
                      </Grid>
                      <Grid xs={12} md={6}>
                        <Typography variant="overline" sx={{ fontWeight: 900, color: 'text.secondary', display: 'block', mb: 2 }}>Hệ thống</Typography>
                        <ProfileInfoItem icon={<Search fontSize="small" color="primary" />} label="Ngày tham gia" value={new Date(detailDialog.user.createdAt).toLocaleDateString('vi-VN')} />
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', color: 'text.secondary', display: 'block', mb: 1 }}>Vai trò</Typography>
                          <Stack direction="row" spacing={1}>
                            {(detailDialog.user.roles || []).map(role => (
                              <Chip key={role} label={role.replace('ROLE_', '')} size="small" variant="outlined" sx={{ fontWeight: 800 }} />
                            ))}
                          </Stack>
                        </Box>
                      </Grid>
                    </Grid>
                  )}

                  {activeTab === 1 && (
                    <Box>
                      {detailDialog.user.roles?.includes('ROLE_DOCTOR') ? (
                        <Grid container spacing={3}>
                          <Grid xs={12} sm={6}><ProfileInfoItem icon={<School color="primary" />} label="Học hàm/Học vị" value={detailDialog.user.degrees} /></Grid>
                          <Grid xs={12} sm={6}><ProfileInfoItem icon={<HospitalIcon color="primary" />} label="Bệnh viện" value={detailDialog.user.hospitalName} /></Grid>
                          <Grid xs={12} sm={6}><ProfileInfoItem icon={<WorkspacePremium color="primary" />} label="Chuyên khoa" value={detailDialog.user.specialization} /></Grid>
                          <Grid xs={12} sm={6}><ProfileInfoItem icon={<Timeline color="primary" />} label="Kinh nghiệm" value={`${detailDialog.user.experienceYears || 0} năm`} /></Grid>
                          <Grid xs={12}><ProfileInfoItem icon={<HistoryEdu color="primary" />} label="Tiểu sử" value={detailDialog.user.bio} /></Grid>
                        </Grid>
                      ) : detailDialog.user.roles?.includes('ROLE_PATIENT') ? (
                        <Grid container spacing={3}>
                          <Grid xs={12} sm={6}><ProfileInfoItem icon={<Cake color="primary" />} label="Ngày sinh" value={detailDialog.user.dateOfBirth} /></Grid>
                          <Grid xs={12} sm={6}><ProfileInfoItem icon={<Wc color="primary" />} label="Giới tính" value={detailDialog.user.gender} /></Grid>
                          <Grid xs={12} sm={6}><ProfileInfoItem icon={<Bloodtype color="primary" />} label="Nhóm máu" value={detailDialog.user.bloodType} /></Grid>
                          <Grid xs={12} sm={6}><ProfileInfoItem icon={<Search color="primary" />} label="Số BHYT" value={detailDialog.user.insuranceNumber} /></Grid>
                          <Grid xs={12}><ProfileInfoItem icon={<Home color="primary" />} label="Địa chỉ" value={detailDialog.user.address} /></Grid>
                          <Grid xs={12}><ProfileInfoItem icon={<Warning color="error" />} label="Dị ứng" value={detailDialog.user.allergies} /></Grid>
                          <Grid xs={12}><ProfileInfoItem icon={<HospitalIcon color="warning" />} label="Bệnh lý mãn tính" value={detailDialog.user.chronicConditions} /></Grid>
                        </Grid>
                      ) : (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                          <Typography color="text.secondary" sx={{ fontWeight: 600 }}>Tài khoản này không có thông tin hồ sơ chi tiết.</Typography>
                        </Box>
                      )}
                    </Box>
                  )}
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 4, pt: 0, flexShrink: 0 }}>
            <Button fullWidth onClick={() => setDetailDialog({ open: false, user: null })} variant="contained" sx={{ fontWeight: 900, borderRadius: 3, py: 1.5 }}>
              Đóng
            </Button>
          </DialogActions>
        </Box>
      </Drawer>

      {/* ===== Edit Profile Dialog (New T-031) ===== */}
      <Dialog
        open={editDialog.open}
        onClose={() => setEditDialog({ open: false, user: null })}
        maxWidth="md"
        fullWidth
        TransitionComponent={Zoom}
        TransitionProps={{ timeout: 400 }}
        slotProps={{ paper: { sx: { borderRadius: 6, overflow: 'hidden', boxShadow: '0 40px 80px rgba(0,0,0,0.15)' } } }}
      >
        <DialogTitle sx={{ bgcolor: 'primary.main', color: '#fff', fontWeight: 900, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Chỉnh sửa hồ sơ người dùng
          <IconButton onClick={() => setEditDialog({ open: false, user: null })} sx={{ color: '#fff' }}><Close /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ 
          p: 4,
          '& .MuiInputBase-root': { fontWeight: 700, bgcolor: '#f1f5f9', borderRadius: '12px' },
          '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
          '& .MuiInputLabel-root': { fontWeight: 800, color: '#334155', background: 'transparent' },
          '& .MuiInputLabel-root.Mui-focused': { color: 'primary.main', background: 'transparent' },
          '& .Mui-focused .MuiOutlinedInput-notchedOutline': { border: '2px solid', borderColor: 'primary.main' },
          '& legend': { display: 'none' } // Also hide the legend gap which might cause weird rendering when border is none
        }}>
          {editDialog.user && (
            <Grid container spacing={3}>
              <Grid xs={12}>
                <Typography variant="subtitle2" sx={{ fontWeight: 900, color: 'primary.main', mb: 2 }}>THÔNG TIN CƠ BẢN</Typography>
                <Grid container spacing={2}>
                  <Grid xs={12} sm={6}><TextField fullWidth label="Họ và tên" value={editForm.fullName || ''} onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })} /></Grid>
                  <Grid xs={12} sm={6}><TextField fullWidth label="Số điện thoại" value={editForm.phone || ''} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} /></Grid>
                  <Grid xs={12}><TextField fullWidth label="Link Avatar" value={editForm.avatarUrl || ''} onChange={(e) => setEditForm({ ...editForm, avatarUrl: e.target.value })} /></Grid>
                </Grid>
              </Grid>

              <Grid xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 900, color: 'primary.main', mb: 2 }}>THÔNG TIN CHI TIẾT ({editDialog.user.roles?.includes('ROLE_DOCTOR') ? 'BÁC SĨ' : 'BỆNH NHÂN'})</Typography>
                <Grid container spacing={2}>
                  {editDialog.user.roles?.includes('ROLE_DOCTOR') ? (
                    <>
                      <Grid xs={12} sm={6}><TextField fullWidth label="Học hàm/Học vị" value={editForm.degrees || ''} onChange={(e) => setEditForm({ ...editForm, degrees: e.target.value })} /></Grid>
                      <Grid xs={12} sm={6}><TextField fullWidth label="Bệnh viện" value={editForm.hospitalName || ''} onChange={(e) => setEditForm({ ...editForm, hospitalName: e.target.value })} /></Grid>
                      <Grid xs={12} sm={8}><TextField fullWidth label="Chuyên khoa" value={editForm.specialization || ''} onChange={(e) => setEditForm({ ...editForm, specialization: e.target.value })} /></Grid>
                      <Grid xs={12} sm={4}><TextField fullWidth type="number" label="Năm kinh nghiệm" value={editForm.experienceYears || ''} onChange={(e) => setEditForm({ ...editForm, experienceYears: e.target.value })} /></Grid>
                      <Grid xs={12}><TextField fullWidth multiline rows={4} label="Tiểu sử" value={editForm.bio || ''} onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })} /></Grid>
                    </>
                  ) : (
                    <>
                      <Grid xs={12} sm={6}><TextField fullWidth type="date" slotProps={{ inputLabel: { shrink: true } }} label="Ngày sinh" value={editForm.dateOfBirth || ''} onChange={(e) => setEditForm({ ...editForm, dateOfBirth: e.target.value })} /></Grid>
                      <Grid xs={12} sm={6}><TextField fullWidth label="Giới tính" value={editForm.gender || ''} onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })} /></Grid>
                      <Grid xs={12} sm={4}><TextField fullWidth label="Nhóm máu" value={editForm.bloodType || ''} onChange={(e) => setEditForm({ ...editForm, bloodType: e.target.value })} /></Grid>
                      <Grid xs={12} sm={8}><TextField fullWidth label="Số BHYT" value={editForm.insuranceNumber || ''} onChange={(e) => setEditForm({ ...editForm, insuranceNumber: e.target.value })} /></Grid>
                      <Grid xs={12}><TextField fullWidth multiline rows={2} label="Địa chỉ" value={editForm.address || ''} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} /></Grid>
                      <Grid xs={12}><TextField fullWidth multiline rows={2} label="Dị ứng" value={editForm.allergies || ''} onChange={(e) => setEditForm({ ...editForm, allergies: e.target.value })} /></Grid>
                      <Grid xs={12}><TextField fullWidth multiline rows={2} label="Bệnh lý mãn tính" value={editForm.chronicConditions || ''} onChange={(e) => setEditForm({ ...editForm, chronicConditions: e.target.value })} /></Grid>
                    </>
                  )}
                </Grid>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 4, pt: 0 }}>
          <Button onClick={() => setEditDialog({ open: false, user: null })} sx={{ fontWeight: 800 }}>Hủy</Button>
          <Button 
            variant="contained" 
            onClick={handleUpdateProfile} 
            disabled={saving}
            sx={{ fontWeight: 900, px: 4, borderRadius: 3 }}
          >
            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
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
