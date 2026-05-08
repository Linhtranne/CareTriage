import React, { useEffect, useState } from 'react'
import {
  Box, Container, Typography, Paper, Table, TableHead, TableBody, TableRow, TableCell,
  Button, Chip, CircularProgress, Dialog, DialogTitle, DialogContent, Stack
} from '@mui/material'
import triageTicketApi from '../../api/triageTicketApi'

export default function TriageTickets() {
  const [loading, setLoading] = useState(true)
  const [tickets, setTickets] = useState([])
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [chatHistory, setChatHistory] = useState([])
  const [detailOpen, setDetailOpen] = useState(false)

  const loadTickets = async () => {
    setLoading(true)
    try {
      const res = await triageTicketApi.listMyTickets({ page: 0, size: 20 })
      setTickets(res.data?.data?.content || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTickets()
  }, [])

  const handleOpenDetail = async (ticket) => {
    const [detailRes, chatRes] = await Promise.all([
      triageTicketApi.getMyTicketDetail(ticket.id),
      triageTicketApi.getMyTicketChatHistory(ticket.id)
    ])
    setSelectedTicket(detailRes.data?.data)
    setChatHistory(chatRes.data?.data || [])
    setDetailOpen(true)
  }

  const getStatusColor = (status) => {
    if (status === 'TRIAGED') return 'success'
    if (status === 'IN_TRIAGE') return 'info'
    if (status === 'REJECTED') return 'error'
    if (status === 'CLOSED') return 'default'
    return 'warning'
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 3 }}>Kết quả triage của tôi</Typography>
      <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Mã phiếu</TableCell>
              <TableCell>Tiêu đề</TableCell>
              <TableCell>Mô tả</TableCell>
              <TableCell>Trạng thái</TableCell>
              <TableCell>Mức ưu tiên</TableCell>
              <TableCell>Thời gian tạo</TableCell>
              <TableCell align="right">Hành động</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} align="center"><CircularProgress /></TableCell></TableRow>
            ) : tickets.length > 0 ? (
              tickets.map((t) => (
                <TableRow key={t.id} hover>
                  <TableCell>{t.ticketNumber}</TableCell>
                  <TableCell>{t.title}</TableCell>
                  <TableCell sx={{ maxWidth: 320 }}>{t.description}</TableCell>
                  <TableCell><Chip size="small" label={t.status} color={getStatusColor(t.status)} /></TableCell>
                  <TableCell>{t.priority}</TableCell>
                  <TableCell>{t.createdAt ? new Date(t.createdAt).toLocaleString('vi-VN') : '-'}</TableCell>
                  <TableCell align="right">
                    <Button variant="outlined" onClick={() => handleOpenDetail(t)}>Xem chi tiết</Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow><TableCell colSpan={7} align="center">Bạn chưa có phiếu triage nào</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>Chi tiết phiếu triage</DialogTitle>
        <DialogContent>
          {selectedTicket && (
            <Box sx={{ mb: 2 }}>
              <Typography><strong>Mã phiếu:</strong> {selectedTicket.ticketNumber}</Typography>
              <Typography><strong>Trạng thái:</strong> {selectedTicket.status}</Typography>
              <Typography><strong>Ưu tiên:</strong> {selectedTicket.priority}</Typography>
              <Typography><strong>Mức độ:</strong> {selectedTicket.severity || '-'}</Typography>
              <Typography><strong>Nhân sự triage:</strong> {selectedTicket.triageOfficerName || 'Chưa phân công'}</Typography>
              <Typography><strong>Danh mục:</strong> {selectedTicket.categoryName || '-'}</Typography>
            </Box>
          )}

          <Paper variant="outlined" sx={{ p: 2, maxHeight: 360, overflowY: 'auto' }}>
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
        </DialogContent>
      </Dialog>
    </Container>
  )
}
