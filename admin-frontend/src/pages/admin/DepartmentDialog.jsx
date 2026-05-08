import { useState, useEffect } from 'react'
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Box, IconButton, Typography,
  FormControl, InputLabel, Select, MenuItem,
  CircularProgress, alpha, useTheme, Fade,
  Avatar, Tooltip
} from '@mui/material'
import { X, Upload, CheckCircle, Info, Image as ImageIcon } from 'lucide-react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

const schema = z.object({
  code: z.string().min(1, 'Mã chuyên khoa là bắt buộc').max(20, 'Tối đa 20 ký tự'),
  name: z.string().min(1, 'Tên chuyên khoa là bắt buộc').max(255, 'Tối đa 255 ký tự'),
  description: z.string().max(1000, 'Tối đa 1000 ký tự').optional(),
  imageUrl: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE'])
})

export default function DepartmentDialog({ open, onClose, onSave, department }) {
  const theme = useTheme()
  const [loading, setLoading] = useState(false)
  const [imagePreview, setImagePreview] = useState('')
  const [serverError, setServerError] = useState('')

  const isEdit = !!department

  const { control, handleSubmit, reset, formState: { errors, isDirty }, setValue } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      code: '',
      name: '',
      description: '',
      imageUrl: '',
      status: 'ACTIVE'
    }
  })

  useEffect(() => {
    if (open) {
      if (department) {
        reset({
          code: department.code,
          name: department.name,
          description: department.description || '',
          imageUrl: department.imageUrl || '',
          status: department.status
        })
        setImagePreview(department.imageUrl || '')
      } else {
        reset({
          code: '',
          name: '',
          description: '',
          imageUrl: '',
          status: 'ACTIVE'
        })
        setImagePreview('')
      }
      setServerError('')
    }
  }, [open, department, reset])

  const handleClose = () => {
    if (isDirty) {
      if (window.confirm('Bạn có thay đổi chưa lưu. Bạn có chắc chắn muốn đóng?')) {
        onClose()
      }
    } else {
      onClose()
    }
  }

  const onFormSubmit = async (data) => {
    setLoading(true)
    setServerError('')
    try {
      await onSave(data)
      // Success will be handled by parent closing the dialog
    } catch (error) {
      console.error('Error in dialog submit:', error)
      const msg = error.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại'
      setServerError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File quá lớn. Tối đa 5MB.')
        return
      }
      // Since we don't have an upload API yet, we'll simulate it by keeping the local URL
      // In a real app, you'd upload this file to S3/Cloudinary and get a URL back
      const url = URL.createObjectURL(file)
      setImagePreview(url)
      setValue('imageUrl', url) // Mocking the URL
    }
  }

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      TransitionProps={{
        timeout: 400
      }}
      slotProps={{
        paper: {
          sx: { 
            borderRadius: '24px', 
            p: 1,
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }
        }
      }}
    >
      <DialogTitle sx={{ 
        fontWeight: 900, 
        fontSize: '1.5rem', 
        px: 3, 
        pt: 3,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ 
            p: 1, 
            bgcolor: alpha(theme.palette.primary.main, 0.1), 
            borderRadius: '12px',
            color: 'primary.main',
            display: 'flex'
          }}>
            <ImageIcon size={24} />
          </Box>
          {isEdit ? 'Chỉnh sửa chuyên khoa' : 'Thêm chuyên khoa mới'}
        </Box>
        <IconButton onClick={handleClose} size="small" sx={{ color: 'text.secondary' }}>
          <X size={20} />
        </IconButton>
      </DialogTitle>

      <form onSubmit={handleSubmit(onFormSubmit)}>
        <DialogContent sx={{ px: 3, py: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Image Upload Area */}
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              gap: 2,
              p: 3,
              borderRadius: '20px',
              border: '2px dashed',
              borderColor: alpha(theme.palette.divider, 0.5),
              bgcolor: alpha(theme.palette.background.default, 0.5),
              transition: 'all 0.3s',
              '&:hover': {
                borderColor: theme.palette.primary.main,
                bgcolor: alpha(theme.palette.primary.main, 0.02)
              }
            }}>
              <Avatar
                src={imagePreview}
                variant="rounded"
                sx={{ 
                  width: 100, 
                  height: 100, 
                  borderRadius: '20px',
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  boxShadow: '0 8px 24px rgba(0,0,0,0.1)'
                }}
              >
                <ImageIcon size={40} color={theme.palette.primary.main} />
              </Avatar>
              
              <Box sx={{ textAlign: 'center' }}>
                <input
                  accept="image/*"
                  style={{ display: 'none' }}
                  id="icon-button-file"
                  type="file"
                  onChange={handleImageChange}
                />
                <label htmlFor="icon-button-file">
                  <Button
                    component="span"
                    variant="outlined"
                    startIcon={<Upload size={16} />}
                    sx={{ 
                      borderRadius: '12px', 
                      textTransform: 'none', 
                      fontWeight: 700,
                      px: 3
                    }}
                  >
                    Tải lên hình ảnh
                  </Button>
                </label>
                <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'text.secondary' }}>
                  Định dạng .jpg, .png. Tối đa 5MB.
                </Typography>
              </Box>
            </Box>

            {serverError && (
              <Fade in>
                <Box sx={{ 
                  p: 1.5, 
                  bgcolor: alpha(theme.palette.error.main, 0.1), 
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  color: 'error.main'
                }}>
                  <Info size={18} />
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{serverError}</Typography>
                </Box>
              </Fade>
            )}

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Controller
                name="code"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Mã chuyên khoa"
                    fullWidth
                    error={!!errors.code}
                    helperText={errors.code?.message}
                    disabled={isEdit}
                    required
                    placeholder="VD: CARD"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                  />
                )}
              />
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Tên chuyên khoa"
                    fullWidth
                    error={!!errors.name}
                    helperText={errors.name?.message}
                    required
                    placeholder="VD: Tim mạch"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                  />
                )}
              />
            </Box>

            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Mô tả chuyên khoa"
                  fullWidth
                  multiline
                  rows={4}
                  placeholder="Nhập mô tả chi tiết về chuyên khoa này..."
                  error={!!errors.description}
                  helperText={errors.description?.message}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                />
              )}
            />

            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}>
                  <InputLabel>Trạng thái</InputLabel>
                  <Select {...field} label="Trạng thái">
                    <MenuItem value="ACTIVE">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CheckCircle size={16} color={theme.palette.success.main} />
                        Hoạt động
                      </Box>
                    </MenuItem>
                    <MenuItem value="INACTIVE">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <X size={16} color={theme.palette.text.secondary} />
                        Ngừng hoạt động
                      </Box>
                    </MenuItem>
                  </Select>
                </FormControl>
              )}
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button 
            onClick={handleClose} 
            disabled={loading}
            sx={{ 
              fontWeight: 700, 
              color: 'text.secondary',
              textTransform: 'none',
              fontSize: '1rem',
              px: 3
            }}
          >
            Hủy bỏ
          </Button>
          <Button 
            type="submit"
            variant="contained"
            disabled={loading}
            sx={{ 
              borderRadius: '14px', 
              px: 4, 
              py: 1.2,
              fontWeight: 800,
              fontSize: '1rem',
              textTransform: 'none',
              boxShadow: '0 8px 24px rgba(8, 187, 163, 0.2)',
              minWidth: 140
            }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : (isEdit ? 'Cập nhật' : 'Lưu thông tin')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
