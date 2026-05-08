import { useState, useEffect } from 'react'
import {
  Box, Typography, Button, Paper, TextField, InputAdornment,
  IconButton, Chip, Avatar, Tooltip, Zoom, Fade, useTheme, alpha,
  Dialog, DialogTitle, DialogContent, DialogActions,
  FormControl, InputLabel, Select, MenuItem, FormHelperText
} from '@mui/material'
import {
  Add, Search, Edit, Delete, LocalHospital, FilterList,
  Refresh, CheckCircle, Cancel
} from '@mui/icons-material'
import { DataGrid, GridToolbarContainer, GridToolbarExport } from '@mui/x-data-grid'
import adminApi from '../../api/adminApi'
import DepartmentDialog from './DepartmentDialog'

// Custom Toolbar for DataGrid
function CustomToolbar() {
  return (
    <GridToolbarContainer sx={{ p: 2, gap: 1 }}>
      <GridToolbarExport 
        variant="outlined" 
        size="small"
        sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600 }}
      />
    </GridToolbarContainer>
  )
}

export default function DepartmentManagement() {
  const theme = useTheme()
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const [totalElements, setTotalElements] = useState(0)
  
  // Dialog state
  const [openDialog, setOpenDialog] = useState(false)
  const [editingDept, setEditingDept] = useState(null)

  // Delete confirmation
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  const fetchDepartments = async () => {
    setLoading(true)
    try {
      const response = await adminApi.getDepartments({
        page: paginationModel.page,
        size: paginationModel.pageSize,
        search: search
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
  }

  useEffect(() => {
    fetchDepartments()
  }, [paginationModel, search])

  const handleOpenDialog = (dept = null) => {
    setEditingDept(dept)
    setOpenDialog(true)
  }

  const handleSave = async (data) => {
    if (editingDept) {
      await adminApi.updateDepartment(editingDept.id, data)
    } else {
      await adminApi.createDepartment(data)
    }
    setOpenDialog(false)
    fetchDepartments()
  }

  const handleDelete = async () => {
    try {
      const response = await adminApi.deleteDepartment(deletingId)
      if (response.data.success) {
        setOpenDeleteDialog(false)
        fetchDepartments()
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Không thể xóa chuyên khoa này'
      alert(msg)
    }
  }

  const columns = [
    {
      field: 'imageUrl',
      headerName: 'Hình ảnh',
      width: 100,
      renderCell: (params) => (
        <Avatar 
          src={params.value} 
          variant="rounded" 
          sx={{ 
            width: 48, 
            height: 48, 
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
          }}
        >
          <LocalHospital sx={{ color: 'primary.main' }} />
        </Avatar>
      )
    },
    { 
      field: 'code', 
      headerName: 'Mã', 
      width: 100,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.secondary' }}>
          {params.value}
        </Typography>
      )
    },
    { 
      field: 'name', 
      headerName: 'Tên chuyên khoa', 
      flex: 1,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 700 }}>
          {params.value}
        </Typography>
      )
    },
    { 
      field: 'description', 
      headerName: 'Mô tả', 
      flex: 1.5,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ 
          color: 'text.secondary',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 1,
          WebkitBoxOrient: 'vertical',
        }}>
          {params.value || 'Chưa có mô tả'}
        </Typography>
      )
    },
    { 
      field: 'status', 
      headerName: 'Trạng thái', 
      width: 150,
      renderCell: (params) => {
        const isActive = params.value === 'ACTIVE'
        return (
          <Chip
            icon={isActive ? <CheckCircle /> : <Cancel />}
            label={isActive ? 'Hoạt động' : 'Ngừng hoạt động'}
            color={isActive ? 'success' : 'default'}
            size="small"
            sx={{ 
              fontWeight: 700,
              borderRadius: '8px',
              '& .MuiChip-icon': { fontSize: '1rem' }
            }}
          />
        )
      }
    },
    {
      field: 'actions',
      headerName: 'Hành động',
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Chỉnh sửa" TransitionComponent={Zoom}>
            <IconButton 
              size="small" 
              onClick={() => handleOpenDialog(params.row)}
              sx={{ color: 'primary.main', bgcolor: alpha(theme.palette.primary.main, 0.1) }}
            >
              <Edit fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Xóa" TransitionComponent={Zoom}>
            <IconButton 
              size="small" 
              onClick={() => {
                setDeletingId(params.row.id)
                setOpenDeleteDialog(true)
              }}
              sx={{ color: 'error.main', bgcolor: alpha(theme.palette.error.main, 0.1) }}
            >
              <Delete fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      )
    }
  ]

  return (
    <Box sx={{ p: 2 }}>
      {/* Header Area */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900, color: '#1e293b', mb: 0.5 }}>
            Quản lý Chuyên khoa
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
            Quản lý danh mục khoa/phòng trong hệ thống
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
          sx={{
            borderRadius: '14px',
            px: 3,
            py: 1.5,
            fontWeight: 800,
            textTransform: 'none',
            boxShadow: '0 8px 24px rgba(8, 187, 163, 0.25)',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 12px 30px rgba(8, 187, 163, 0.35)',
            },
            transition: 'all 0.3s'
          }}
        >
          Thêm chuyên khoa mới
        </Button>
      </Box>

      {/* Search & Filters */}
      <Paper 
        elevation={0}
        sx={{ 
          p: 2.5, 
          mb: 3, 
          borderRadius: '20px', 
          bgcolor: 'white',
          border: '1px solid rgba(0,0,0,0.05)',
          display: 'flex',
          gap: 2,
          alignItems: 'center'
        }}
      >
        <TextField
          placeholder="Tìm kiếm theo tên chuyên khoa..."
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ 
            flexGrow: 1,
            '& .MuiOutlinedInput-root': {
              borderRadius: '12px',
              bgcolor: '#f8fafc',
              '& fieldset': { borderColor: 'transparent' },
              '&:hover fieldset': { borderColor: alpha(theme.palette.primary.main, 0.2) },
              '&.Mui-focused fieldset': { borderColor: theme.palette.primary.main },
            }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: 'text.secondary' }} />
              </InputAdornment>
            ),
          }}
        />
        <IconButton sx={{ bgcolor: '#f1f5f9', borderRadius: '12px' }}>
          <FilterList />
        </IconButton>
        <IconButton 
          onClick={fetchDepartments}
          sx={{ bgcolor: '#f1f5f9', borderRadius: '12px' }}
        >
          <Refresh />
        </IconButton>
      </Paper>

      {/* DataGrid Table */}
      <Paper 
        elevation={0}
        sx={{ 
          height: 650, 
          width: '100%', 
          borderRadius: '24px', 
          overflow: 'hidden',
          bgcolor: 'white',
          border: '1px solid rgba(0,0,0,0.05)',
          boxShadow: '0 10px 40px rgba(0,0,0,0.02)'
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
          pageSizeOptions={[5, 10, 25]}
          disableRowSelectionOnClick
          slots={{ toolbar: CustomToolbar }}
          sx={{
            border: 'none',
            '& .MuiDataGrid-columnHeaders': {
              bgcolor: '#f8fafc',
              color: '#64748b',
              fontWeight: 800,
              fontSize: '0.85rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            },
            '& .MuiDataGrid-cell': {
              borderColor: '#f1f5f9',
              py: 2
            },
            '& .MuiDataGrid-row:hover': {
              bgcolor: alpha(theme.palette.primary.main, 0.02),
            },
            '& .MuiDataGrid-footerContainer': {
              borderTop: '1px solid #f1f5f9'
            }
          }}
        />
      </Paper>

      {/* Create/Edit Dialog */}
      <DepartmentDialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        onSave={handleSave}
        department={editingDept}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
        PaperProps={{ sx: { borderRadius: '20px', p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Xác nhận xóa</DialogTitle>
        <DialogContent>
          <Typography>
            Bạn có chắc chắn muốn xóa chuyên khoa này? Thao tác này không thể hoàn tác.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenDeleteDialog(false)} sx={{ fontWeight: 700 }}>Hủy</Button>
          <Button 
            onClick={handleDelete} 
            variant="contained" 
            color="error"
            sx={{ borderRadius: '10px', fontWeight: 800 }}
          >
            Xác nhận xóa
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
