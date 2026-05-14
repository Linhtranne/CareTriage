import { useState, useEffect } from 'react'
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Box, IconButton, Typography,
  FormControl, InputLabel, Select, MenuItem,
  CircularProgress, alpha, useTheme, Fade,
  Avatar, Zoom
} from '@mui/material'
import { Close } from '@mui/icons-material'
import { X, Upload, CheckCircle, Info, Image as ImageIcon } from 'lucide-react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { motion, AnimatePresence } from 'framer-motion'

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
  const [selectedFile, setSelectedFile] = useState(null)
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
        setSelectedFile(null)
        const timer = setTimeout(() => setImagePreview(department.imageUrl || ''), 0)
        return () => clearTimeout(timer)
      }

      reset({
        code: '',
        name: '',
        description: '',
        imageUrl: '',
        status: 'ACTIVE'
      })
      setSelectedFile(null)
      const timer = setTimeout(() => setImagePreview(''), 0)
      return () => clearTimeout(timer)
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
      let finalImageUrl = data.imageUrl

      // If a new file was selected, upload it first
      if (selectedFile) {
        const uploadRes = await adminApi.uploadDepartmentImage(selectedFile)
        if (uploadRes.data.success) {
          finalImageUrl = uploadRes.data.data
        }
      }

      await onSave({ ...data, imageUrl: finalImageUrl })
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
        setServerError('File quá lớn. Tối đa 5MB.')
        return
      }
      setSelectedFile(file)
      const url = URL.createObjectURL(file)
      setImagePreview(url)
      setServerError('')
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <Dialog 
          open={open} 
          onClose={handleClose}
          maxWidth="md"
          fullWidth
          TransitionComponent={Zoom}
          TransitionProps={{ timeout: 400 }}
          slotProps={{ paper: { sx: { borderRadius: 6, overflow: 'hidden', boxShadow: '0 40px 80px rgba(0,0,0,0.15)' } } }}
        >
          <DialogTitle sx={{ bgcolor: 'primary.main', color: '#fff', fontWeight: 900, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {isEdit ? 'Chỉnh sửa chuyên khoa' : 'Thêm chuyên khoa mới'}
            <IconButton onClick={handleClose} sx={{ color: '#fff' }}>
              <Close />
            </IconButton>
          </DialogTitle>

          <form onSubmit={handleSubmit(onFormSubmit)}>
            <DialogContent sx={{ 
              p: 4,
              '& .MuiInputBase-root': { fontWeight: 700, bgcolor: '#f1f5f9', borderRadius: '12px' },
              '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
              '& .MuiInputLabel-root': { fontWeight: 800, color: '#334155', background: 'transparent' },
              '& .MuiInputLabel-root.Mui-focused': { color: 'primary.main', background: 'transparent' },
              '& .Mui-focused .MuiOutlinedInput-notchedOutline': { border: '2px solid', borderColor: 'primary.main' },
              '& legend': { display: 'none' }
            }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                
                {/* Image Upload Area */}
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 3,
                  p: 2.5,
                  borderRadius: 4,
                  border: '1px dashed',
                  borderColor: alpha(theme.palette.divider, 0.3),
                  bgcolor: alpha(theme.palette.primary.main, 0.02)
                }}>
                  <Avatar
                    src={imagePreview}
                    variant="rounded"
                    sx={{ 
                      width: 64, 
                      height: 64, 
                      borderRadius: 3,
                      bgcolor: alpha(theme.palette.primary.main, 0.05),
                      boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.05)'
                    }}
                  >
                    <ImageIcon size={24} color={theme.palette.primary.main} />
                  </Avatar>
                  
                  <Box>
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
                        size="small"
                        startIcon={<Upload size={16} />}
                        sx={{ 
                          borderRadius: 3, 
                          textTransform: 'none', 
                          fontWeight: 700,
                          borderColor: 'rgba(0,0,0,0.15)',
                          color: 'text.primary',
                          '&:hover': { bgcolor: 'rgba(0,0,0,0.02)', borderColor: 'rgba(0,0,0,0.3)' }
                        }}
                      >
                        Tải ảnh lên
                      </Button>
                    </label>
                    <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'text.secondary' }}>
                      Định dạng JPG, PNG. Tối đa 5MB.<br/>(Nếu để trống, hệ thống sẽ tự sinh avatar chữ)
                    </Typography>
                  </Box>
                </Box>

                {serverError && (
                  <Fade in>
                    <Box sx={{ 
                      p: 1.5, 
                      bgcolor: alpha(theme.palette.error.main, 0.05), 
                      borderRadius: 3,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      color: 'error.main'
                    }}>
                      <Info size={16} />
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
                        size="small"
                        error={!!errors.code}
                        helperText={errors.code?.message}
                        disabled={isEdit}
                        required
                        placeholder="VD: CARD"
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
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
                        size="small"
                        error={!!errors.name}
                        helperText={errors.name?.message}
                        required
                        placeholder="VD: Tim mạch"
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
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
                      label="Mô tả"
                      fullWidth
                      size="small"
                      multiline
                      rows={3}
                      placeholder="Mô tả ngắn gọn về chuyên khoa..."
                      error={!!errors.description}
                      helperText={errors.description?.message}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                    />
                  )}
                />

                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}>
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

            <DialogActions sx={{ p: 4, pt: 0 }}>
              <Button onClick={handleClose} disabled={loading} sx={{ fontWeight: 800 }}>Hủy</Button>
              <Button 
                type="submit"
                variant="contained" 
                disabled={loading}
                disableElevation
                sx={{ fontWeight: 900, px: 4, borderRadius: 3 }}
              >
                {loading ? <CircularProgress size={20} color="inherit" /> : (isEdit ? 'Cập nhật' : 'Thêm mới')}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      )}
    </AnimatePresence>
  )
}
