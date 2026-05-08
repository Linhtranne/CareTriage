import React, { useEffect, useState } from 'react'
import {
  Box, Container, Typography, Paper, Table, TableHead, TableBody, TableRow, TableCell,
  Button, Chip, CircularProgress, Dialog, DialogTitle, DialogContent, Stack, TextField, MenuItem, Alert
} from '@mui/material'
import triageTicketApi from '../../api/triageTicketApi'
import appointmentApi from '../../api/appointmentApi'
import publicApi from '../../api/publicApi'

export default function TriageTicketInbox() {
  const [loading, setLoading] = useState(true)
  const [tickets, setTickets] = useState([])
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [chatHistory, setChatHistory] = useState([])
  const [detailOpen, setDetailOpen] = useState(false)
  const [departments, setDepartments] = useState([])
  const [appointmentDate, setAppointmentDate] = useState('')
  const [appointmentTime, setAppointmentTime] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState('')
  const [createSuccess, setCreateSuccess] = useState('')

  const loadTickets = async () => {
    setLoading(true)
    try {
      const res = await triageTicketApi.listPending({ page: 0, size: 20 })
      setTickets(res.data?.data?.content || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTickets()
    loadDepartments()
  }, [])

  const loadDepartments = async () => {
    const res = await publicApi.getDepartments({ page: 0, size: 200 })
    setDepartments(res.data?.data?.content || [])
  }

  const handleOpenDetail = async (ticket) => {
    const [detailRes, chatRes] = await Promise.all([
      triageTicketApi.getDetail(ticket.id),
      triageTicketApi.getChatHistory(ticket.id)
    ])
    setSelectedTicket(detailRes.data?.data)
    setChatHistory(chatRes.data?.data || [])
    setCreateError('')
    setCreateSuccess('')
    setAppointmentDate('')
    setAppointmentTime('')
    setDepartmentId('')
    setDetailOpen(true)
  }

  const handleCreateAppointment = async () => {
    if (!selectedTicket) return
    if (!appointmentDate || !appointmentTime || !departmentId) {
      setCreateError('Vui lòng nhập đủ ngày, giờ và chuyên khoa')
      return
    }

    const selectedDate = new Date(`${appointmentDate}T00:00:00`)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (selectedDate < today) {
      setCreateError('Không thể tạo lịch hẹn trong quá khứ')
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
      setCreateSuccess('Tạo lịch hẹn thành công')
    } catch (error) {
      setCreateError(error.response?.data?.message || 'Tạo lịch hẹn thất bại')
    } finally {
      setCreateLoading(false)
    }
  }

  const getPriorityColor = (priority) => {
    if (priority === 'URGENT') return 'error'
    if (priority === 'HIGH') return 'warning'
    if (priority === 'MEDIUM') return 'info'
    return 'default'
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 3 }}>Danh sách phiếu chờ</Typography>
      <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Mã phiếu</TableCell>
              <TableCell>Bệnh nhân</TableCell>
              <TableCell>Triệu chứng sơ bộ</TableCell>
              <TableCell>Ưu tiên</TableCell>
              <TableCell>Thời gian tạo</TableCell>
              <TableCell align="right">Hành động</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} align="center"><CircularProgress /></TableCell></TableRow>
            ) : tickets.length > 0 ? (
              tickets.map((t) => (
                <TableRow key={t.id} hover>
                  <TableCell>{t.ticketNumber}</TableCell>
                  <TableCell>{t.requesterName}</TableCell>
                  <TableCell sx={{ maxWidth: 360 }}>{t.description}</TableCell>
                  <TableCell><Chip size="small" label={t.priority} color={getPriorityColor(t.priority)} /></TableCell>
                  <TableCell>{t.createdAt ? new Date(t.createdAt).toLocaleString('vi-VN') : '-'}</TableCell>
                  <TableCell align="right">
                    <Button variant="outlined" onClick={() => handleOpenDetail(t)}>Xem chi tiết</Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow><TableCell colSpan={6} align="center">Hiện không có phiếu chờ nào cần xử lý</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>Chi tiết phiếu và lịch sử chat</DialogTitle>
        <DialogContent>
          {selectedTicket && (
            <Box sx={{ mb: 2 }}>
              <Typography><strong>Mã phiếu:</strong> {selectedTicket.ticketNumber}</Typography>
              <Typography><strong>Bệnh nhân:</strong> {selectedTicket.requesterName}</Typography>
              <Typography><strong>Mức ưu tiên:</strong> {selectedTicket.priority}</Typography>
            </Box>
          )}

          <Paper variant="outlined" sx={{ p: 2, maxHeight: 420, overflowY: 'auto' }}>
            <Stack spacing={1.5}>
              {chatHistory.length === 0 ? (
                <Typography color="text.secondary">Không có lịch sử chat</Typography>
              ) : chatHistory.map((m) => (
                <Box key={m.id} sx={{ p: 1.5, borderRadius: 2, bgcolor: m.senderType === 'USER' ? '#f1f5f9' : '#ecfeff' }}>
                  <Typography variant="caption" sx={{ fontWeight: 700 }}>{m.senderType}</Typography>
                  <Typography variant="body2">{m.content}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {m.createdAt ? new Date(m.createdAt).toLocaleString('vi-VN') : ''}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Paper>
          <Paper variant="outlined" sx={{ p: 2, mt: 2, borderRadius: 2 }}>
            <Typography sx={{ fontWeight: 700, mb: 1.5 }}>Tạo lịch hẹn từ phiếu</Typography>
            {createError && <Alert severity="error" sx={{ mb: 1.5 }}>{createError}</Alert>}
            {createSuccess && <Alert severity="success" sx={{ mb: 1.5 }}>{createSuccess}</Alert>}
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
              <TextField
                label="Ngày hẹn"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={appointmentDate}
                onChange={(e) => setAppointmentDate(e.target.value)}
                fullWidth
              />
              <TextField
                label="Giờ hẹn"
                type="time"
                InputLabelProps={{ shrink: true }}
                value={appointmentTime}
                onChange={(e) => setAppointmentTime(e.target.value)}
                fullWidth
              />
              <TextField
                select
                label="Chuyên khoa"
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                fullWidth
              >
                {departments.map((d) => (
                  <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
                ))}
              </TextField>
              <Button variant="contained" onClick={handleCreateAppointment} disabled={createLoading}>
                {createLoading ? 'Đang tạo...' : 'Tạo lịch hẹn'}
              </Button>
            </Stack>
          </Paper>
        </DialogContent>
      </Dialog>
    </Container>
  )
}
