import { useEffect, useState, useMemo } from 'react'
import {
  Box, Container, Typography, Paper, Table, TableHead, TableBody, TableRow, TableCell,
  Button, Chip, CircularProgress, Dialog, DialogTitle, DialogContent, Stack, TextField,
  MenuItem, Alert, IconButton, InputAdornment, Tooltip, Avatar, Grid,
  Zoom
} from '@mui/material'
import {
  Search, Filter, RefreshCw, ChevronRight, MessageSquare,
  Clock, User, Stethoscope, AlertTriangle, CheckCircle2,
  Calendar, ArrowRight
} from 'lucide-react'
import triageTicketApi from '../../api/triageTicketApi'
import appointmentApi from '../../api/appointmentApi'
import publicApi from '../../api/publicApi'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import PatientPageShell from '../../components/patient/PatientPageShell'

export default function TriageTicketInbox() {
  const [loading, setLoading] = useState(true)
  const [tickets, setTickets] = useState([])
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [chatHistory, setChatHistory] = useState([])
  const [detailOpen, setDetailOpen] = useState(false)
  const [departments, setDepartments] = useState([])

  // Filter States
  const [searchTerm, setSearchTerm] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('ALL')

  // Appointment Form States
  const [appointmentDate, setAppointmentDate] = useState('')
  const [appointmentTime, setAppointmentTime] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState('')
  const [createSuccess, setCreateSuccess] = useState('')

  const loadTickets = async () => {
    setLoading(true)
    try {
      const res = await triageTicketApi.listPending({ page: 0, size: 50 })
      setTickets(res.data?.data?.content || [])
    } catch (error) {
      console.error("Failed to load tickets", error)
    } finally {
      setLoading(false)
    }
  }

  const loadDepartments = async () => {
    try {
      const res = await publicApi.getDepartments({ page: 0, size: 200 })
      setDepartments(res.data?.data?.content || [])
    } catch (error) {
      console.error("Failed to load departments", error)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- bootstrap inbox data and departments on mount
    loadTickets()
    loadDepartments()
  }, [])

  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      const matchesSearch = (t.requesterName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.ticketNumber?.toLowerCase().includes(searchTerm.toLowerCase()))
      const matchesPriority = priorityFilter === 'ALL' || t.priority === priorityFilter
      return matchesSearch && matchesPriority
    })
  }, [tickets, searchTerm, priorityFilter])

  const handleOpenDetail = async (ticket) => {
    setSelectedTicket(ticket)
    setDetailOpen(true)
    setCreateError('')
    setCreateSuccess('')
    setAppointmentDate('')
    setAppointmentTime('')
    setDepartmentId(ticket.suggestedDepartmentId || '')

    try {
      const [detailRes, chatRes] = await Promise.all([
        triageTicketApi.getDetail(ticket.id),
        triageTicketApi.getChatHistory(ticket.id)
      ])
      setSelectedTicket(detailRes.data?.data)
      setChatHistory(chatRes.data?.data || [])
    } catch (error) {
      console.error("Failed to load ticket details", error)
    }
  }

  const handleCreateAppointment = async () => {
    if (!selectedTicket) return
    if (!appointmentDate || !appointmentTime || !departmentId) {
      setCreateError('Vui lòng chọn đầy đủ ngày, giờ và chuyên khoa khám')
      return
    }

    setCreateLoading(true)
    setCreateError('')
    setCreateSuccess('')
    try {
      await appointmentApi.createFromTicket({
        ticketId: selectedTicket.id,
        appointmentDate,
        appointmentTime,
        departmentId: Number(departmentId)
      })
      setCreateSuccess('Đã tạo lịch hẹn thành công cho bệnh nhân')
      setTimeout(() => {
        setDetailOpen(false)
        loadTickets()
      }, 2000)
    } catch (error) {
      setCreateError(error.response?.data?.message || 'Không thể tạo lịch hẹn. Vui lòng kiểm tra lại thá» i gian.')
    } finally {
      setCreateLoading(false)
    }
  }

  const getPriorityInfo = (priority) => {
    switch (priority) {
      case 'URGENT': case 'CRITICAL':
        return { label: 'Khẩn cấp', color: 'error', bg: 'oklch(96% 0.05 10 / 0.5)', textColor: 'oklch(50% 0.15 10)', icon: <AlertTriangle size={14} /> }
      case 'HIGH':
        return { label: 'Cao', color: 'warning', bg: 'oklch(96% 0.05 40 / 0.5)', textColor: 'oklch(55% 0.18 40)', icon: <AlertTriangle size={14} /> }
      case 'MEDIUM':
        return { label: 'Trung bình', color: 'info', bg: 'oklch(96% 0.05 220 / 0.5)', textColor: 'oklch(55% 0.15 220)', icon: <Clock size={14} /> }
      default:
        return { label: 'Thường', color: 'default', bg: 'oklch(96% 0.02 160 / 0.5)', textColor: 'oklch(50% 0.02 160)', icon: <CheckCircle2 size={14} /> }
    }
  }

  return (
    <PatientPageShell
      title="Ticket Inbox"
      description="Quản lý và phân loại phiếu tư vấn từ AI Triage"
      maxWidth="xl"
      transparent={true}
    >
      {/* Action Bar */}
      <Stack direction="row" spacing={2} sx={{ mb: 4, mt: -2 }} justifyContent="flex-end">
        <Tooltip title="Làm mới danh sách">
          <IconButton 
            onClick={loadTickets} 
            sx={{ 
              bgcolor: 'oklch(100% 0 0 / 0.5)', 
              backdropFilter: 'blur(8px)',
              border: '1px solid oklch(92% 0.02 160)',
              boxShadow: '0 4px 12px oklch(20% 0.05 160 / 0.03)',
              '&:hover': { bgcolor: 'oklch(100% 0 0 / 0.8)', transform: 'rotate(180deg)' },
              transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            <RefreshCw size={20} color="oklch(50% 0.15 160)" />
          </IconButton>
        </Tooltip>
      </Stack>

      {/* Filter Bar */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5, mb: 4, borderRadius: 6, 
          bgcolor: 'oklch(100% 0 0 / 0.15)',
          backdropFilter: 'blur(30px)',
          border: '1px solid oklch(100% 0 0 / 0.2)',
          boxShadow: 'none',
          display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center'
        }}
      >
        <TextField
          placeholder="Tìm tên bệnh nhân hoặc mã phiếu..."
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ 
            flexGrow: 1, 
            minWidth: 280,
            '& .MuiOutlinedInput-root': {
              borderRadius: 4,
              bgcolor: 'oklch(100% 0 0 / 0.1)',
              '& fieldset': { borderColor: 'oklch(92% 0.02 160 / 0.3)' },
              '&:hover fieldset': { borderColor: 'oklch(65% 0.15 160 / 0.5)' },
              '&.Mui-focused fieldset': { borderColor: 'oklch(65% 0.15 160)' }
            }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search size={18} color="oklch(50% 0.02 160)" />
              </InputAdornment>
            ),
          }}
        />
        <TextField
          select
          size="small"
          label="Mức độ ưu tiên"
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          sx={{ 
            minWidth: 160,
            '& .MuiOutlinedInput-root': {
              borderRadius: 4,
              bgcolor: 'oklch(100% 0 0 / 0.1)',
              '& fieldset': { borderColor: 'oklch(92% 0.02 160 / 0.3)' },
              '&:hover fieldset': { borderColor: 'oklch(65% 0.15 160 / 0.5)' }
            }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Filter size={18} color="oklch(50% 0.02 160)" />
              </InputAdornment>
            ),
          }}
        >
          <MenuItem value="ALL">Tất cả</MenuItem>
          <MenuItem value="CRITICAL">Khẩn cấp</MenuItem>
          <MenuItem value="HIGH">Cao</MenuItem>
          <MenuItem value="MEDIUM">Trung bình</MenuItem>
          <MenuItem value="LOW">Bình thường</MenuItem>
        </TextField>
        <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto', fontWeight: 600 }}>
          {filteredTickets.length} phiếu đang chờ
        </Typography>
      </Paper>

      {/* Tickets Table */}
      <Box
        sx={{
          '& .MuiTable-root': {
            borderCollapse: 'separate',
            borderSpacing: '0 12px',
          }
        }}
      >
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, color: 'oklch(40% 0.02 160)', border: 0, pb: 1 }}>Mã phiếu</TableCell>
              <TableCell sx={{ fontWeight: 600, color: 'oklch(40% 0.02 160)', border: 0, pb: 1 }}>Bệnh nhân</TableCell>
              <TableCell sx={{ fontWeight: 600, color: 'oklch(40% 0.02 160)', border: 0, pb: 1 }}>Triệu chứng sơ bộ</TableCell>
              <TableCell sx={{ fontWeight: 600, color: 'oklch(40% 0.02 160)', border: 0, pb: 1 }}>Ưu tiên</TableCell>
              <TableCell sx={{ fontWeight: 600, color: 'oklch(40% 0.02 160)', border: 0, pb: 1 }}>Thời gian nhận</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600, color: 'oklch(40% 0.02 160)', border: 0, pb: 1 }}>Hành động</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} align="center" sx={{ py: 8 }}><CircularProgress /></TableCell></TableRow>
            ) : filteredTickets.length > 0 ? (
              filteredTickets.map((t) => {
                const pInfo = getPriorityInfo(t.priority)
                return (
                  <TableRow 
                    key={t.id} 
                    sx={{ 
                      transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                      '& td': { 
                        bgcolor: 'oklch(100% 0 0 / 0.4)', 
                        backdropFilter: 'blur(8px)',
                        borderTop: '1px solid oklch(92% 0.02 160)',
                        borderBottom: '1px solid oklch(92% 0.02 160)',
                        py: 3,
                        '&:first-of-type': { 
                          borderLeft: '1px solid oklch(92% 0.02 160)',
                          borderRadius: '16px 0 0 16px' 
                        },
                        '&:last-of-type': { 
                          borderRight: '1px solid oklch(92% 0.02 160)',
                          borderRadius: '0 16px 16px 0' 
                        }
                      },
                      '&:hover td': { 
                        bgcolor: 'oklch(100% 0 0 / 0.8)',
                        borderColor: 'oklch(65% 0.15 160)',
                        boxShadow: '0 10px 30px oklch(20% 0.05 160 / 0.03)'
                      }
                    }}
                  >
                    <TableCell sx={{ fontWeight: 700, color: 'oklch(55% 0.18 160)' }}>#{t.ticketNumber}</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar sx={{ width: 40, height: 40, fontSize: 16, bgcolor: 'oklch(96% 0.05 160)', color: 'oklch(55% 0.18 160)', border: '2px solid white' }}>
                          {t.requesterName?.charAt(0)}
                        </Avatar>
                        <Typography variant="body1" sx={{ fontWeight: 600, color: 'oklch(20% 0.05 160)' }}>{t.requesterName}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ maxWidth: 300 }}>
                      <Typography variant="body2" noWrap sx={{ color: 'oklch(40% 0.02 160)', fontWeight: 400 }}>
                        {t.description || 'Không có mô tả'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={pInfo.label}
                        icon={pInfo.icon}
                        sx={{ 
                          fontWeight: 600, 
                          borderRadius: 2, 
                          px: 1,
                          bgcolor: pInfo.bg,
                          color: pInfo.textColor,
                          border: `1px solid ${pInfo.textColor}20`
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: 'oklch(50% 0.02 160)', fontWeight: 600 }}>
                        {t.createdAt ? format(new Date(t.createdAt), 'HH:mm - dd/MM', { locale: vi }) : '-'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        variant="contained"
                        disableElevation
                        size="small"
                        endIcon={<ChevronRight size={16} />}
                        onClick={() => handleOpenDetail(t)}
                        sx={{ 
                          borderRadius: 3, 
                          textTransform: 'none', 
                          fontWeight: 600,
                          bgcolor: 'oklch(60% 0.18 160)',
                          '&:hover': { bgcolor: 'oklch(55% 0.18 160)' }
                        }}
                      >
                        Xử lý
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 10 }}>
                  <Box sx={{ opacity: 0.5 }}>
                    <Search size={48} />
                    <Typography sx={{ mt: 2, fontWeight: 600 }}>Không tìm thấy phiếu nào</Typography>
                  </Box>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Box>

      {/* Detail Dialog */}
      <Dialog
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        fullWidth
        maxWidth="lg"
        TransitionComponent={Zoom}
        PaperProps={{ 
          sx: { 
            borderRadius: 10, 
            overflow: 'hidden',
            bgcolor: 'oklch(100% 0 0 / 0.3)',
            backdropFilter: 'blur(50px)',
            border: '1px solid oklch(100% 0 0 / 0.2)',
            boxShadow: 'none'
          } 
        }}
      >
        <DialogTitle sx={{ px: 4, pt: 3, pb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Box sx={{ p: 1.5, bgcolor: 'oklch(60% 0.18 160)', color: 'white', borderRadius: 3, display: 'flex', boxShadow: '0 10px 20px oklch(60% 0.18 160 / 0.2)' }}>
              <Stethoscope size={28} />
            </Box>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: 'oklch(20% 0.05 160)' }}>Chi tiết phiếu phân luồng</Typography>
              <Typography variant="caption" sx={{ color: 'oklch(50% 0.02 160)', fontWeight: 600 }}>Mã định danh: #{selectedTicket?.ticketNumber}</Typography>
            </Box>
          </Stack>
          {selectedTicket && (
            <Chip
              label={getPriorityInfo(selectedTicket.priority).label}
              sx={{ 
                fontWeight: 600, 
                borderRadius: 2,
                bgcolor: getPriorityInfo(selectedTicket.priority).bg,
                color: getPriorityInfo(selectedTicket.priority).textColor,
                border: `1px solid ${getPriorityInfo(selectedTicket.priority).textColor}20`
              }}
            />
          )}
        </DialogTitle>
        <DialogContent sx={{ p: 0, overflow: 'hidden' }}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, minHeight: 600 }}>
            {/* Left Column: Info & Summary */}
            <Box sx={{ 
              width: { xs: '100%', lg: '33.33%' }, 
              p: 3, 
              borderRight: '1px solid oklch(100% 0 0 / 0.1)', 
              borderColor: 'divider',
              display: 'flex', 
              flexDirection: 'column', 
              gap: 3,
              bgcolor: 'oklch(100% 0 0 / 0.1)'
            }}>
              <Box sx={{ p: 2.5, bgcolor: 'oklch(100% 0 0 / 0.2)', borderRadius: 5, border: '1px solid oklch(100% 0 0 / 0.1)', boxShadow: 'none' }}>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1, color: 'oklch(30% 0.05 160)' }}>
                  <User size={18} /> Thông tin bệnh nhân
                </Typography>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'oklch(50% 0.02 160)', fontWeight: 600 }}>Họ và tên</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 700, color: 'oklch(20% 0.05 160)' }}>{selectedTicket?.requesterName}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'oklch(50% 0.02 160)', fontWeight: 600 }}>Triệu chứng khai báo</Typography>
                    <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'oklch(30% 0.05 160)', lineHeight: 1.6 }}>"{selectedTicket?.description}"</Typography>
                  </Box>
                </Stack>
              </Box>

              <Box sx={{ p: 2.5, bgcolor: 'oklch(96% 0.05 200 / 0.2)', borderRadius: 5, border: '1px solid oklch(85% 0.1 200 / 0.2)' }}>
                <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700, color: 'oklch(40% 0.15 200)', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <MessageSquare size={18} /> Kết luận AI
                </Typography>
                <Box sx={{ 
                  color: 'oklch(20% 0.1 200)', 
                  fontSize: '0.875rem',
                  lineHeight: 1.7, 
                  fontWeight: 600,
                  '& p': { m: 0, mb: 1.5 },
                  '& p:last-child': { mb: 0 },
                  '& ul, & ol': { pl: 2.5, mt: 1 },
                  '& li': { mb: 0.5 },
                  '& h3': { fontSize: '1rem', fontWeight: 900, mb: 1, mt: 0.5, color: 'oklch(20% 0.1 200)' }
                }}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {selectedTicket?.aiSummary || "Đang phân tích dữ liệu..."}
                  </ReactMarkdown>
                </Box>
              </Box>

              <Box sx={{ p: 2.5, border: '1px solid oklch(100% 0 0 / 0.1)', borderRadius: 5, bgcolor: 'oklch(100% 0 0 / 0.2)' }}>
                <Typography variant="subtitle2" sx={{ mb: 2.5, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1, color: 'oklch(30% 0.05 160)' }}>
                  <Calendar size={18} /> Chuyển đổi thành lịch hẹn
                </Typography>
                {createError && <Alert severity="error" sx={{ mb: 2, borderRadius: 3, bgcolor: 'oklch(96% 0.05 10 / 0.2)', border: '1px solid oklch(50% 0.15 10 / 0.3)', color: 'oklch(40% 0.15 10)' }}>{createError}</Alert>}
                {createSuccess && <Alert severity="success" sx={{ mb: 2, borderRadius: 3, bgcolor: 'oklch(96% 0.05 160 / 0.2)', border: '1px solid oklch(55% 0.18 160 / 0.3)', color: 'oklch(40% 0.18 160)' }}>{createSuccess}</Alert>}
                <Stack spacing={2.5}>
                  <TextField
                    label="Ngày khám"
                    type={appointmentDate ? "date" : "text"}
                    onFocus={(e) => (e.target.type = 'date')}
                    onBlur={(e) => { if (!e.target.value) e.target.type = 'text' }}
                    size="small"
                    value={appointmentDate}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 4, bgcolor: 'oklch(100% 0 0 / 0.1)', '& fieldset': { borderColor: 'oklch(100% 0 0 / 0.1)' } } }}
                  />
                  <TextField
                    label="Giờ khám"
                    type={appointmentTime ? "time" : "text"}
                    onFocus={(e) => (e.target.type = 'time')}
                    onBlur={(e) => { if (!e.target.value) e.target.type = 'text' }}
                    size="small"
                    value={appointmentTime}
                    onChange={(e) => setAppointmentTime(e.target.value)}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 4, bgcolor: 'oklch(100% 0 0 / 0.1)', '& fieldset': { borderColor: 'oklch(100% 0 0 / 0.1)' } } }}
                  />
                  <TextField
                    select
                    label="Chuyên khoa khám"
                    size="small"
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                    fullWidth
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 4, bgcolor: 'oklch(100% 0 0 / 0.1)', '& fieldset': { borderColor: 'oklch(100% 0 0 / 0.1)' } } }}
                  >
                    {departments.map((d) => (
                      <MenuItem key={d.id} value={d.id} sx={{ fontWeight: 600 }}>{d.name}</MenuItem>
                    ))}
                  </TextField>
                  <Button 
                    variant="contained" 
                    fullWidth 
                    onClick={handleCreateAppointment} 
                    disabled={createLoading}
                    startIcon={<ArrowRight size={20} />}
                    sx={{ 
                      py: 1.5, 
                      borderRadius: 4, 
                      fontWeight: 600, 
                      textTransform: 'none', 
                      bgcolor: 'oklch(60% 0.18 160)',
                      boxShadow: '0 10px 30px oklch(60% 0.18 160 / 0.3)',
                      '&:hover': { bgcolor: 'oklch(55% 0.18 160)' }
                    }}
                  >
                    {createLoading ? 'Đang xử lý...' : 'Xác nhận tạo lịch hẹn'}
                  </Button>
                </Stack>
              </Box>
            </Box>

            {/* Right Column: Chat History */}
            <Box sx={{ 
              width: { xs: '100%', lg: '66.66%' }, 
              p: 3, 
              display: 'flex', 
              flexDirection: 'column',
              bgcolor: 'oklch(100% 0 0 / 0.1)'
            }}>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                <MessageSquare size={16} /> Chi tiết hội thoại tư vấn
              </Typography>
              <Box sx={{ 
                flexGrow: 1, 
                p: 3, 
                bgcolor: 'oklch(100% 0 0 / 0.1)', 
                borderRadius: 8, 
                border: '1px solid oklch(100% 0 0 / 0.1)',
                maxHeight: 600, 
                overflowY: 'auto',
                display: 'flex', 
                flexDirection: 'column', 
                gap: 2,
                position: 'relative'
              }}>
                {chatHistory.length === 0 ? (
                  <Box sx={{ 
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    opacity: 0.4 
                  }}>
                    <MessageSquare size={64} strokeWidth={1} />
                    <Typography sx={{ mt: 2, fontWeight: 700, color: 'oklch(40% 0.02 160)' }}>Chưa có dữ liệu hội thoại</Typography>
                    <Typography variant="caption">Hệ thống đang đồng bộ tin nhắn từ AI Triage...</Typography>
                  </Box>
                ) : chatHistory.map((m) => {
                  const isUser = m.senderType === 'USER'
                  return (
                    <Box 
                      key={m.id} 
                      sx={{ 
                        alignSelf: isUser ? 'flex-end' : 'flex-start',
                        maxWidth: '85%'
                      }}
                    >
                      <Stack direction={isUser ? 'row-reverse' : 'row'} spacing={1} alignItems="flex-end">
                        {!isUser && (
                          <Avatar sx={{ width: 24, height: 24, bgcolor: '#10b981', fontSize: 10 }}>AI</Avatar>
                        )}
                        <Box 
                          sx={{ 
                            p: 2.5, 
                            borderRadius: isUser ? '28px 28px 4px 28px' : '28px 28px 28px 4px',
                            bgcolor: isUser ? 'oklch(60% 0.18 160 / 0.8)' : 'oklch(100% 0 0 / 0.3)',
                            color: isUser ? '#fff' : 'oklch(20% 0.05 160)',
                            boxShadow: 'none',
                            border: '1px solid oklch(100% 0 0 / 0.1)',
                          }}
                        >
                          <Box sx={{ 
                            '& p': { m: 0, mb: 1.5, lineHeight: 1.6 },
                            '& p:last-child': { mb: 0 },
                            '& ul, & ol': { pl: 2.5, mt: 1 },
                            '& li': { mb: 0.5 },
                            '& strong': { fontWeight: 800 },
                            '& h3': { fontSize: '1rem', fontWeight: 900, mb: 1, mt: 0.5, color: isUser ? '#fff' : 'oklch(20% 0.05 160)' },
                            fontSize: '0.875rem',
                            fontWeight: 500
                          }}>
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {m.content}
                            </ReactMarkdown>
                          </Box>
                        </Box>
                      </Stack>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          display: 'block', mt: 0.5, px: 1,
                          textAlign: isUser ? 'right' : 'left',
                          color: 'text.disabled', fontSize: 10
                        }}
                      >
                        {m.createdAt ? format(new Date(m.createdAt), 'HH:mm', { locale: vi }) : ''}
                      </Typography>
                    </Box>
                  )
                })}
              </Box>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </PatientPageShell>
  )
}
