import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Box, Typography, Button, TextField, InputAdornment,
  IconButton, Chip, Avatar, Tooltip, Zoom, useTheme, alpha,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Card, CardContent, Stack, Menu, MenuItem, ListItemIcon, ListItemText,
  Drawer, Divider, Grid
} from '@mui/material'
import {
  Add, Search, Edit, Delete, FilterList,
  Refresh, CheckCircle, Cancel, MoreVert, Visibility, Close, Image as ImageIcon
} from '@mui/icons-material'
import { DataGrid, GridToolbarContainer, GridToolbarExport } from '@mui/x-data-grid'
import adminApi from '../../api/adminApi'
import DepartmentDialog from './DepartmentDialog'
import { motion, AnimatePresence } from 'framer-motion'

// Custom Toolbar for DataGrid
function CustomToolbar() {
  const theme = useTheme()
  return (
    <GridToolbarContainer sx={{ p: 1.5, gap: 1 }}>
      <GridToolbarExport 
        variant="outlined" 
        size="small"
        sx={{ 
          borderRadius: 2, 
          textTransform: 'none', 
          fontWeight: 700,
          borderColor: alpha(theme.palette.divider, 0.2),
          color: 'text.secondary',
          '&:hover': {
            borderColor: 'primary.main',
            bgcolor: alpha(theme.palette.primary.main, 0.04)
          }
        }}
      />
    </GridToolbarContainer>
  )
}

// Generative Avatar based on Department Name
const GenerativeAvatar = ({ name, imageUrl }) => {
  const theme = useTheme()
  const gradient = useMemo(() => {
    if (!name) return `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`;
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue1 = Math.abs(hash % 360);
    const hue2 = (hue1 + 45) % 360;
    return `linear-gradient(135deg, oklch(75% 0.12 ${hue1}), oklch(65% 0.15 ${hue2}))`;
  }, [name, theme.palette.primary.main, theme.palette.primary.dark]);

  const initials = useMemo(() => {
    if (!name) return '?';
    const words = name.split(' ').filter(w => w.length > 0);
    if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  }, [name]);

  if (imageUrl) {
    return (
      <Avatar 
        src={imageUrl} 
        variant="rounded" 
        sx={{ 
          width: 52, 
          height: 52, 
          borderRadius: 2, 
          boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.2)}`,
          border: '2px solid #fff'
        }}
      />
    )
  }

  return (
    <Avatar
      variant="rounded"
      sx={{
        width: 52,
        height: 52,
        borderRadius: 2,
        background: gradient,
        fontSize: '1.2rem',
        fontWeight: 900,
        color: 'white',
        boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.2)}`,
        border: '2px solid #fff'
      }}
    >
      {initials}
    </Avatar>
  )
}

export default function DepartmentManagement() {
  const theme = useTheme()
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [searchDebounced, setSearchDebounced] = useState('')
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const [totalElements, setTotalElements] = useState(0)
  
  // Dialog state
  const [openDialog, setOpenDialog] = useState(false)
  const [editingDept, setEditingDept] = useState(null)

  // Action Menu & Details
  const [actionMenu, setActionMenu] = useState({ anchorEl: null, dept: null })
  const [detailDrawer, setDetailDrawer] = useState({ open: false, dept: null })

  // Delete confirmation
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  // Snackbar state
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity })
  }

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }))
  }

  const openActionMenu = (event, dept) => {
    setActionMenu({ anchorEl: event.currentTarget, dept })
  }

  const closeActionMenu = () => {
    setActionMenu({ anchorEl: null, dept: null })
  }

  const handleActionMenu = (action) => {
    if (!actionMenu.dept) return
    action(actionMenu.dept)
    closeActionMenu()
  }

  const openDetailDrawer = (dept) => {
    setDetailDrawer({ open: true, dept })
  }

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setSearchDebounced(search), 400)
    return () => clearTimeout(timer)
  }, [search])

  const fetchDepartments = useCallback(async () => {
    setLoading(true)
    try {
      const response = await adminApi.getDepartments({
        page: paginationModel.page,
        size: paginationModel.pageSize,
        search: searchDebounced
      })
      if (response.data.success) {
        setDepartments(response.data.data.content)
        setTotalElements(response.data.data.totalElements)
      }
    } catch (error) {
      console.error('Error fetching departments:', error)
    } finally {
      setLoading(false)
    }
  }, [paginationModel.page, paginationModel.pageSize, searchDebounced])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDepartments()
    }, 0)
    return () => clearTimeout(timer)
  }, [fetchDepartments])

  const handleOpenDialog = (dept = null) => {
    setEditingDept(dept)
    setOpenDialog(true)
  }

  const handleSave = async (data) => {
    try {
      if (editingDept) {
        await adminApi.updateDepartment(editingDept.id, data)
        showSnackbar('Cập nhật chuyên khoa thành công')
      } else {
        await adminApi.createDepartment(data)
        showSnackbar('Thêm chuyên khoa mới thành công')
      }
      setOpenDialog(false)
      fetchDepartments()
    } catch (error) {
      const msg = error.response?.data?.message || 'Có lỗi xảy ra khi lưu'
      showSnackbar(msg, 'error')
    }
  }

  const handleDelete = async () => {
    try {
      const response = await adminApi.deleteDepartment(deletingId)
      if (response.data.success) {
        setDepartments(prev => prev.filter(d => d.id !== deletingId))
        setOpenDeleteDialog(false)
        showSnackbar('Xóa chuyên khoa thành công')
        setTimeout(fetchDepartments, 500)
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Không thể xóa chuyên khoa này'
      showSnackbar(msg, 'error')
    }
  }

  const columns = [
    {
      field: 'imageUrl',
      headerName: 'Hình ảnh',
      width: 100,
      sortable: false,
      renderCell: (params) => (
        <GenerativeAvatar name={params.row.name} imageUrl={params.value} />
      )
    },
    { 
      field: 'code', 
      headerName: 'Mã', 
      width: 120,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.secondary', opacity: 0.8 }}>
          {params.value}
        </Typography>
      )
    },
    { 
      field: 'name', 
      headerName: 'Tên chuyên khoa', 
      flex: 1.5,
      minWidth: 200,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 900, fontSize: '1.05rem', color: 'text.primary' }}>
          {params.value}
        </Typography>
      )
    },
    { 
      field: 'description', 
      headerName: 'Mô tả', 
      flex: 2,
      minWidth: 250,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ 
          color: 'text.secondary',
          fontWeight: 500,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {params.value || '—'}
        </Typography>
      )
    },
    { 
      field: 'status', 
      headerName: 'Trạng thái', 
      width: 160,
      renderCell: (params) => {
        const isActive = params.value === 'ACTIVE'
        const baseColor = isActive ? theme.palette.success.main : theme.palette.error.main
        return (
          <Chip
            icon={isActive ? <CheckCircle sx={{ fontSize: 14 }} /> : <Cancel sx={{ fontSize: 14 }} />}
            label={isActive ? 'Hoạt động' : 'Ngừng'}
            size="small"
            variant="filled"
            sx={{ 
              fontWeight: 900,
              fontSize: '0.7rem',
              bgcolor: alpha(baseColor, 0.15),
              color: baseColor,
              border: `1px solid ${alpha(baseColor, 0.3)}`,
              borderRadius: '10px',
              height: 28,
              px: 1,
              '& .MuiChip-icon': { color: 'inherit' }
            }}
          />
        )
      }
    },
    {
      field: 'actions',
      headerName: 'Thao tác',
      flex: 1,
      minWidth: 100,
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
    }
  ]

  return (
    <Box>
      {/* Header Area */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Quản lý Chuyên khoa
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Tổng cộng {totalElements} chuyên khoa trong hệ thống
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
          sx={{
            borderRadius: 3,
            px: 3,
            py: 1,
            fontWeight: 800,
            textTransform: 'none',
            boxShadow: `0 8px 16px ${alpha(theme.palette.primary.main, 0.3)}`,
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: `0 12px 20px ${alpha(theme.palette.primary.main, 0.4)}`,
            },
            transition: 'all 0.3s'
          }}
        >
          Thêm chuyên khoa mới
        </Button>
      </Box>

      {/* Search & Filters */}
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
              placeholder="Tìm kiếm chuyên khoa..."
              size="small"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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
            <Box sx={{ flexGrow: 1 }} />
            <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
              <Tooltip title="Bộ lọc">
                <IconButton 
                  sx={{ 
                    bgcolor: 'rgba(255, 255, 255, 0.5)', 
                    borderRadius: 3,
                    border: '1px solid rgba(255, 255, 255, 0.6)',
                    '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.9)' }
                  }}
                >
                  <FilterList fontSize="small" sx={{ color: 'primary.main' }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Làm mới">
                <IconButton 
                  onClick={fetchDepartments}
                  sx={{ 
                    bgcolor: 'rgba(255, 255, 255, 0.5)', 
                    borderRadius: 3,
                    border: '1px solid rgba(255, 255, 255, 0.6)',
                    '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.9)' }
                  }}
                >
                  <Refresh fontSize="small" sx={{ color: 'primary.main' }} />
                </IconButton>
              </Tooltip>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {/* DataGrid Table */}
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
          rows={departments}
          columns={columns}
          loading={loading}
          rowCount={totalElements}
          paginationMode="server"
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[10, 20, 50]}
          disableRowSelectionOnClick
          onRowClick={(params) => openDetailDrawer(params.row)}
          getRowHeight={() => 100}
          getEstimatedRowHeight={() => 100}
          columnHeaderHeight={68}
          density="standard"
          disableVirtualization
          slots={{ toolbar: CustomToolbar }}
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

      {/* Create/Edit Dialog */}
      <DepartmentDialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        onSave={handleSave}
        department={editingDept}
      />

      {/* Action Menu */}
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
              minWidth: 200,
              borderRadius: 3,
              overflow: 'hidden',
              boxShadow: '0 20px 40px rgba(0,0,0,0.14)',
              border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
            },
          },
        }}
      >
        <MenuItem onClick={() => handleActionMenu(handleOpenDialog)} dense>
          <ListItemIcon sx={{ minWidth: 36 }}>
            <Edit fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Chỉnh sửa" primaryTypographyProps={{ fontWeight: 700 }} />
        </MenuItem>
        <MenuItem onClick={() => handleActionMenu((dept) => { setDeletingId(dept.id); setOpenDeleteDialog(true); })} dense>
          <ListItemIcon sx={{ minWidth: 36 }}>
            <Delete fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText primary="Xóa chuyên khoa" primaryTypographyProps={{ fontWeight: 700, color: 'error.main' }} />
        </MenuItem>
      </Menu>

      {/* Detail Drawer */}
      <Drawer
        anchor="right"
        open={detailDrawer.open}
        onClose={() => setDetailDrawer({ open: false, dept: null })}
        ModalProps={{ keepMounted: true }}
        PaperProps={{
          sx: {
            width: { xs: '100vw', sm: 480, md: 540 },
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
          <Box sx={{ height: 120, background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`, position: 'relative' }}>
            <IconButton
              onClick={() => setDetailDrawer({ open: false, dept: null })}
              sx={{ position: 'absolute', right: 16, top: 16, color: '#fff', bgcolor: 'rgba(0,0,0,0.2)', '&:hover': { bgcolor: 'rgba(0,0,0,0.4)' } }}
            >
              <Close />
            </IconButton>
          </Box>

          <DialogContent sx={{ p: 0, mt: -6, flex: 1, overflowY: 'auto' }}>
            {detailDrawer.dept && (
              <Box>
                <Box sx={{ px: 4, display: 'flex', alignItems: 'flex-end', gap: 3, mb: 4 }}>
                  <Box sx={{ p: 1, bgcolor: '#fff', borderRadius: 3, boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
                    <GenerativeAvatar name={detailDrawer.dept.name} imageUrl={detailDrawer.dept.imageUrl} />
                  </Box>
                  <Box sx={{ pb: 1, flex: 1 }}>
                    <Typography variant="h4" sx={{ fontWeight: 900, color: 'text.primary' }}>
                      {detailDrawer.dept.name}
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mt: 1 }}>
                      <Chip
                        label={detailDrawer.dept.code}
                        size="small"
                        sx={{ fontWeight: 800, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}
                      />
                      <Chip
                        label={detailDrawer.dept.status === 'ACTIVE' ? 'Hoạt động' : 'Ngừng'}
                        size="small"
                        color={detailDrawer.dept.status === 'ACTIVE' ? 'success' : 'error'}
                        sx={{ fontWeight: 800 }}
                      />
                    </Stack>
                  </Box>
                </Box>

                <Box sx={{ p: 4, pt: 0 }}>
                  <Typography variant="overline" sx={{ fontWeight: 900, color: 'text.secondary', display: 'block', mb: 2 }}>
                    Mô tả chuyên khoa
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500, color: 'text.primary', mb: 4, lineHeight: 1.6 }}>
                    {detailDrawer.dept.description || 'Chưa có thông tin mô tả chi tiết.'}
                  </Typography>

                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, borderRadius: 3, bgcolor: alpha(theme.palette.primary.main, 0.05), border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}` }}>
                        <ImageIcon color="primary" />
                        <Box>
                          <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary' }}>
                            Trạng thái hình ảnh
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            {detailDrawer.dept.imageUrl ? 'Đã thiết lập ảnh tùy chỉnh' : 'Sử dụng Avatar mặc định'}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 4, pt: 0, flexShrink: 0 }}>
            <Button fullWidth onClick={() => setDetailDrawer({ open: false, dept: null })} variant="contained" sx={{ fontWeight: 900, borderRadius: 3, py: 1.5 }}>
              Đóng
            </Button>
          </DialogActions>
        </Box>
      </Drawer>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
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
        <DialogTitle sx={{ fontWeight: 900, fontSize: '1.25rem', color: 'error.main', pb: 1, pt: 3, px: 4 }}>
          Xác nhận xóa
          <IconButton
            onClick={() => setOpenDeleteDialog(false)}
            sx={{ position: 'absolute', right: 16, top: 16, color: 'text.secondary' }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ px: 4 }}>
          <Box sx={{ mt: 2 }}>
            <Box sx={{ 
              p: 3, 
              borderRadius: 4, 
              bgcolor: alpha(theme.palette.error.main, 0.05),
              border: '1px dashed',
              borderColor: alpha(theme.palette.error.main, 0.3),
              textAlign: 'center'
            }}>
              <Avatar 
                sx={{ 
                  mx: 'auto', 
                  mb: 2, 
                  width: 64, 
                  height: 64, 
                  bgcolor: 'error.main',
                  boxShadow: `0 8px 20px ${alpha(theme.palette.error.main, 0.3)}`
                }}
              >
                <Delete sx={{ fontSize: 32 }} />
              </Avatar>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
                Xóa chuyên khoa
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                Bạn có chắc chắn muốn xóa chuyên khoa này? Thao tác này không thể hoàn tác và có thể ảnh hưởng đến các bác sĩ thuộc khoa này.
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 4, pb: 4, pt: 2 }}>
          <Button 
            onClick={() => setOpenDeleteDialog(false)} 
            variant="text"
            sx={{ fontWeight: 800, px: 3, borderRadius: 2, color: 'text.secondary' }}
          >
            Hủy bỏ
          </Button>
          <Button 
            onClick={handleDelete} 
            variant="contained" 
            color="error"
            disableElevation
            sx={{ 
              fontWeight: 900, 
              px: 4, 
              borderRadius: 3,
              boxShadow: `0 8px 16px ${alpha(theme.palette.error.main, 0.3)}`,
            }}
          >
            Xác nhận xóa
          </Button>
        </DialogActions>
      </Dialog>
      {/* Snackbar Notifications */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity} 
          variant="filled"
          sx={{ width: '100%', borderRadius: 3, fontWeight: 700 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}
