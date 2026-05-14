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
        return { label: 'Khẩn cấp', color: 'error', icon: <AlertTriangle size={14} /> }
      case 'HIGH':
        return { label: 'Cao', color: 'warning', icon: <AlertTriangle size={14} /> }
      case 'MEDIUM':
        return { label: 'Trung bình', color: 'info', icon: <Clock size={14} /> }
      default:
        return { label: 'Thường', color: 'default', icon: <CheckCircle2 size={14} /> }
    }
  }

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, md: 5 } }}>
      {/* Header Section */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
        <Box>
          <Typography variant="h3" sx={{ fontWeight: 900, color: 'text.primary', letterSpacing: '-0.02em' }}>
            Ticket Inbox
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Quản lý và phân loại phiếu tư vấn từ AI Triage
          </Typography>
        </Box>
        <Tooltip title="Làm mới danh sách">
          <IconButton onClick={loadTickets} sx={{ bgcolor: 'background.paper', boxShadow: 1 }}>
            <RefreshCw size={20} />
          </IconButton>
        </Tooltip>
      </Stack>

      {/* Filter Bar */}
      <Paper
        elevation={0}
        sx={{
          p: 2, mb: 3, borderRadius: 4, bgcolor: 'background.paper',
          border: '1px solid', borderColor: 'divider',
          display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center'
        }}
      >
        <TextField
          placeholder="Tìm tên bệnh nhân hoặc mã phiếu..."
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ flexGrow: 1, minWidth: 280 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search size={18} />
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
          sx={{ minWidth: 160 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Filter size={18} />
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
      <Paper
        elevation={0}
        sx={{
          borderRadius: 4, overflow: 'hidden', border: '1px solid', borderColor: 'divider',
          boxShadow: '0 4px 24px rgba(0,0,0,0.04)'
        }}
      >
        <Table>
          <TableHead sx={{ bgcolor: 'grey.50' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Mã phiếu</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Bệnh nhân</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Triệu chứng sơ bộ</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Ưu tiên</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Thời gian nhận</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>Hành động</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} align="center" sx={{ py: 8 }}><CircularProgress /></TableCell></TableRow>
            ) : filteredTickets.length > 0 ? (
              filteredTickets.map((t) => {
                const pInfo = getPriorityInfo(t.priority)
                return (
                  <TableRow key={t.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell sx={{ fontWeight: 600, color: 'primary.main' }}>#{t.ticketNumber}</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Avatar sx={{ width: 32, height: 32, fontSize: 14, bgcolor: 'primary.light' }}>
                          {t.requesterName?.charAt(0)}
                        </Avatar>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{t.requesterName}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ maxWidth: 300 }}>
                      <Typography variant="body2" noWrap sx={{ color: 'text.secondary' }}>
                        {t.description || 'Không có mô tả'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={pInfo.label}
                        color={pInfo.color}
                        icon={pInfo.icon}
                        sx={{ fontWeight: 700, borderRadius: 1.5, px: 0.5 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
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
                        sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
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
      </Paper>

      {/* Detail Dialog */}
      <Dialog
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        fullWidth
        maxWidth="lg"
        TransitionComponent={Zoom}
        PaperProps={{ sx: { borderRadius: 5, overflow: 'hidden' } }}
      >
        <DialogTitle sx={{ px: 4, pt: 3, pb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box sx={{ p: 1, bgcolor: 'primary.main', color: 'white', borderRadius: 2, display: 'flex' }}>
              <Stethoscope size={24} />
            </Box>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800 }}>Chi tiết phiếu phân luồng</Typography>
              <Typography variant="caption" color="text.secondary">Mã định danh: #{selectedTicket?.ticketNumber}</Typography>
            </Box>
          </Stack>
          {selectedTicket && (
            <Chip
              label={getPriorityInfo(selectedTicket.priority).label}
              color={getPriorityInfo(selectedTicket.priority).color}
              sx={{ fontWeight: 800, borderRadius: 2 }}
            />
          )}
        </DialogTitle>
        <DialogContent sx={{ p: 0, overflow: 'hidden' }}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, minHeight: 600 }}>
            {/* Left Column: Info & Summary */}
            <Box sx={{ 
              width: { xs: '100%', lg: '33.33%' }, 
              p: 3, 
              borderRight: '1px solid', 
              borderColor: 'divider',
              display: 'flex', 
              flexDirection: 'column', 
              gap: 3,
              bgcolor: 'rgba(248, 250, 252, 0.5)'
            }}>
              <Box sx={{ p: 2, bgcolor: '#fff', borderRadius: 4, border: '1px solid', borderColor: 'rgba(0,0,0,0.05)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <User size={16} /> Thông tin bệnh nhân
                </Typography>
                <Stack spacing={1.5}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Họ và tên</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{selectedTicket?.requesterName}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Triệu chứng khai báo</Typography>
                    <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>"{selectedTicket?.description}"</Typography>
                  </Box>
                </Stack>
              </Box>

              <Box sx={{ p: 2, bgcolor: '#e0f2fe', borderRadius: 4, border: '1px solid', borderColor: '#bae6fd' }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700, color: '#0369a1', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <MessageSquare size={16} /> Kết luận AI
                </Typography>
                <Typography variant="body2" sx={{ color: '#0c4a6e', lineHeight: 1.6 }}>
                  {selectedTicket?.aiSummary || "Đang phân tích dữ liệu..."}
                </Typography>
              </Box>

              <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 4, bgcolor: '#fff' }}>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Calendar size={16} /> Chuyển đổi thành lịch hẹn
                </Typography>
                {createError && <Alert severity="error" sx={{ mb: 2, borderRadius: 3 }}>{createError}</Alert>}
                {createSuccess && <Alert severity="success" sx={{ mb: 2, borderRadius: 3 }}>{createSuccess}</Alert>}
                <Stack spacing={2}>
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
                  />
                  <TextField
                    select
                    label="Chuyên khoa khám"
                    size="small"
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                    fullWidth
                  >
                    {departments.map((d) => (
                      <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
                    ))}
                  </TextField>
                  <Button 
                    variant="contained" 
                    fullWidth 
                    onClick={handleCreateAppointment} 
                    disabled={createLoading}
                    startIcon={<ArrowRight size={18} />}
                    sx={{ py: 1.2, borderRadius: 3, fontWeight: 700, textTransform: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
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
              bgcolor: '#fff'
            }}>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                <MessageSquare size={16} /> Chi tiết hội thoại tư vấn
              </Typography>
              <Box sx={{ 
                flexGrow: 1, 
                p: 3, 
                bgcolor: '#f8fafc', 
                borderRadius: 8, 
                border: '1px solid', 
                borderColor: 'divider',
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
                    <Typography sx={{ mt: 2, fontWeight: 800 }}>Chưa có dữ liệu hội thoại</Typography>
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
                            p: 2, 
                            borderRadius: isUser ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                            bgcolor: isUser ? 'primary.main' : '#fff',
                            color: isUser ? '#fff' : 'text.primary',
                            boxShadow: isUser ? '0 4px 12px rgba(25, 118, 210, 0.2)' : '0 2px 8px rgba(0,0,0,0.05)',
                            border: isUser ? 'none' : '1px solid',
                            borderColor: 'divider'
                          }}
                        >
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>{m.content}</Typography>
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
    </Container>
  )
}
