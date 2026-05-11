import React, { useEffect, useState } from 'react'
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  Paper,
  Stack,
  Typography,
  Alert
} from '@mui/material'
import { CalendarDays, ChevronRight } from 'lucide-react'
import { format, isValid } from 'date-fns'
import { vi, enUS } from 'date-fns/locale'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import triageTicketApi from '../../api/triageTicketApi'
import PatientPageShell from '../../components/patient/PatientPageShell'

const normalizeCode = (value) => String(value || '').trim().toUpperCase().replace(/\s+/g, '_')

const getStatusTone = (status) => {
  const code = normalizeCode(status)

  if (code === 'TRIAGED') return { color: 'success', bg: '#f0fdf4', text: '#166534' }
  if (code === 'IN_TRIAGE') return { color: 'info', bg: '#eff6ff', text: '#1d4ed8' }
  if (code === 'REJECTED') return { color: 'error', bg: '#fef2f2', text: '#b91c1c' }
  if (code === 'CLOSED') return { color: 'default', bg: '#f8fafc', text: '#475569' }

  return { color: 'warning', bg: '#fffbeb', text: '#b45309' }
}

const getPriorityTone = (priority) => {
  const code = normalizeCode(priority)

  if (['CRITICAL', 'EMERGENCY', 'URGENT'].includes(code)) return { color: 'error', bg: '#fef2f2', text: '#b91c1c' }
  if (code === 'HIGH') return { color: 'warning', bg: '#fff7ed', text: '#c2410c' }
  if (['MEDIUM', 'MODERATE'].includes(code)) return { color: 'info', bg: '#eff6ff', text: '#1d4ed8' }
  if (['LOW', 'ROUTINE', 'NORMAL'].includes(code)) return { color: 'default', bg: '#f8fafc', text: '#475569' }

  return { color: 'success', bg: '#f0fdf4', text: '#166534' }
}

const resolveSenderLabel = (senderType, t) => {
  const code = normalizeCode(senderType)

  if (['USER', 'PATIENT'].includes(code)) return t('triage.sender_patient')
  if (['STAFF', 'DOCTOR', 'NURSE', 'CLINICIAN'].includes(code)) return t('triage.sender_staff')
  if (['AI', 'SYSTEM', 'BOT'].includes(code)) return t('triage.sender_ai')

  return senderType || t('triage.sender_ai')
}

export default function TriageTickets() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [tickets, setTickets] = useState([])
  const [listError, setListError] = useState('')
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [chatHistory, setChatHistory] = useState([])
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState('')

  const dateLocale = i18n.language === 'vi' ? vi : enUS

  const loadTickets = async () => {
    setLoading(true)
    setListError('')
    try {
      const res = await triageTicketApi.listMyTickets({ page: 0, size: 20 })
      setTickets(res.data?.data?.content || [])
    } catch (error) {
      console.error('Failed to load triage tickets', error)
      setTickets([])
      setListError(t('triage.list_load_failed'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTickets()
  }, [])

  const handleOpenDetail = async (ticket) => {
    setSelectedTicket(ticket)
    setChatHistory([])
    setDetailError('')
    setDetailLoading(true)
    setDetailOpen(true)

    try {
      const [detailRes, chatRes] = await Promise.all([
        triageTicketApi.getMyTicketDetail(ticket.id),
        triageTicketApi.getMyTicketChatHistory(ticket.id)
      ])

      const detailData = detailRes.data?.data
      setSelectedTicket(detailData ? { ...ticket, ...detailData } : ticket)
      setChatHistory(Array.isArray(chatRes.data?.data) ? chatRes.data.data : [])
    } catch (error) {
      console.error('Failed to load triage ticket detail', error)
      setChatHistory([])
      setDetailError(t('triage.detail_load_failed'))
    } finally {
      setDetailLoading(false)
    }
  }

  const statusChip = (status) => {
    const tone = getStatusTone(status)
    const code = normalizeCode(status)
    const label = t(`triage.status_labels.${code}`, status || '-')

    return (
      <Chip
        size="small"
        label={label}
        color={tone.color}
        sx={{
          fontWeight: 800,
          borderRadius: 999,
          bgcolor: tone.bg,
          color: tone.text,
          '& .MuiChip-label': { px: 1.25 }
        }}
      />
    )
  }

  const priorityChip = (priority) => {
    const tone = getPriorityTone(priority)
    const code = normalizeCode(priority)
    const label = t(`triage.priority_labels.${code}`, priority || '-')

    return (
      <Chip
        size="small"
        label={`${t('triage.priority')}: ${label}`}
        color={tone.color}
        sx={{
          fontWeight: 700,
          bgcolor: tone.bg,
          color: tone.text,
          borderRadius: 999,
          '& .MuiChip-label': { px: 1.25 }
        }}
      />
    )
  }

  const formatDateTime = (value) => {
    if (!value) return '-'
    const date = new Date(value)
    if (!isValid(date)) return '-'
    return format(date, 'dd/MM/yyyy HH:mm', { locale: dateLocale })
  }

  const handleCardKeyDown = (event, ticket) => {
    if (event.target !== event.currentTarget) return
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleOpenDetail(ticket)
    }
  }

  const handleCloseDetail = () => {
    setDetailOpen(false)
    setSelectedTicket(null)
    setChatHistory([])
    setDetailError('')
    setDetailLoading(false)
  }

  const handleRetryDetail = () => {
    if (selectedTicket?.id) handleOpenDetail(selectedTicket)
  }

  return (
    <PatientPageShell
      title={t('triage.title')}
      subtitle={t('triage.subtitle')}
      maxWidth="xl"
      actions={
        <Button
          variant="contained"
          startIcon={<CalendarDays size={18} />}
          onClick={() => navigate('/patient/appointments/book-appointment')}
          sx={{
            borderRadius: 3,
            bgcolor: '#10b981',
            '&:hover': { bgcolor: '#059669' },
            fontWeight: 700,
            px: 3,
            py: 1.2,
            boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
            width: 'auto',
            minWidth: 0,
            alignSelf: 'flex-end',
          }}
        >
          {t('appointments.book_now')}
        </Button>
      }
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {!loading && listError ? (
          <Alert
            severity="error"
            variant="outlined"
            action={
              <Button onClick={loadTickets} size="small" sx={{ fontWeight: 700, textTransform: 'none' }}>
                {t('triage.retry')}
              </Button>
            }
            sx={{ borderRadius: 3 }}
          >
            {listError}
          </Alert>
        ) : null}
        {loading ? (
          <Paper
            variant="outlined"
            sx={{
              p: 4,
              borderRadius: 4,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: 220
            }}
          >
            <CircularProgress />
          </Paper>
        ) : tickets.length > 0 ? (
          <Grid container spacing={2.5}>
            {tickets.map((ticket) => (
              <Grid item xs={12} md={6} key={ticket.id}>
                <Paper
                  variant="outlined"
                  role="button"
                  tabIndex={0}
                  aria-haspopup="dialog"
                  onClick={() => handleOpenDetail(ticket)}
                  onKeyDown={(event) => handleCardKeyDown(event, ticket)}
                  sx={{
                    p: { xs: 2, sm: 2.5 },
                    borderRadius: 4,
                    cursor: 'pointer',
                    borderColor: 'rgba(8, 187, 163, 0.12)',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 12px 28px rgba(8, 187, 163, 0.08)',
                      borderColor: '#08bba3'
                    },
                    '&:focus-visible': {
                      outline: 'none',
                      borderColor: '#08bba3',
                      boxShadow: '0 0 0 4px rgba(8, 187, 163, 0.16)'
                    }
                  }}
                >
                  <Stack spacing={2}>
                    <Stack direction="row" spacing={2} justifyContent="space-between" alignItems="flex-start">
                      <Box sx={{ minWidth: 0 }}>
                        <Typography
                          variant="overline"
                          sx={{
                            display: 'block',
                            fontWeight: 800,
                            letterSpacing: '0.08em',
                            color: 'text.secondary'
                          }}
                        >
                          {t('triage.ticket_no')} {ticket.ticketNumber}
                        </Typography>
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 900,
                            lineHeight: 1.2,
                            mt: 0.5,
                            pr: 1
                          }}
                        >
                          {ticket.title || t('triage.detail_title')}
                        </Typography>
                      </Box>
                      {statusChip(ticket.status)}
                    </Stack>

                    <Typography
                      variant="body2"
                      sx={{
                        color: 'text.secondary',
                        lineHeight: 1.65,
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}
                    >
                      {ticket.description || '-'}
                    </Typography>

                    <Stack direction="row" flexWrap="wrap" gap={1}>
                      {priorityChip(ticket.priority)}
                      {ticket.categoryName && (
                        <Chip
                          size="small"
                          label={ticket.categoryName}
                          variant="outlined"
                          sx={{ fontWeight: 700, borderRadius: 999 }}
                        />
                      )}
                      {ticket.severity && (
                        <Chip
                          size="small"
                          label={`${t('triage.severity')}: ${ticket.severity}`}
                          variant="outlined"
                          sx={{ fontWeight: 700, borderRadius: 999 }}
                        />
                      )}
                    </Stack>

                    <Divider />

                    <Stack
                      direction={{ xs: 'column', sm: 'row' }}
                      spacing={1}
                      justifyContent="space-between"
                      alignItems={{ xs: 'flex-start', sm: 'center' }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.75,
                          color: 'text.secondary',
                          fontWeight: 700
                        }}
                      >
                        <CalendarDays size={14} />
                        {formatDateTime(ticket.createdAt)}
                      </Typography>
                      <Button
                        variant="text"
                        size="small"
                        endIcon={<ChevronRight size={16} />}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleOpenDetail(ticket)
                        }}
                        sx={{
                          p: 0,
                          minWidth: 0,
                          alignSelf: { xs: 'flex-start', sm: 'center' },
                          textTransform: 'none',
                          fontWeight: 800,
                          color: '#0f766e'
                        }}
                      >
                        {t('triage.open_detail')}
                      </Button>
                    </Stack>
                  </Stack>
                </Paper>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Paper
            variant="outlined"
            sx={{
              p: { xs: 3, md: 4 },
              borderRadius: 4,
              borderColor: 'rgba(8, 187, 163, 0.12)',
              bgcolor: 'rgba(255, 255, 255, 0.85)'
            }}
          >
            <Stack spacing={2} alignItems="flex-start">
              <Typography variant="h6" sx={{ fontWeight: 900 }}>
                {t('triage.no_tickets')}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                {t('triage.empty_desc')}
              </Typography>
              <Button
                variant="contained"
                onClick={() => navigate('/patient/appointments/book-appointment')}
                sx={{
                  borderRadius: 3,
                  bgcolor: '#10b981',
                  '&:hover': { bgcolor: '#059669' },
                  fontWeight: 700,
                  px: 3,
                  py: 1.2,
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.25)'
                }}
              >
                {t('appointments.book_now')}
              </Button>
            </Stack>
          </Paper>
        )}
      </Box>

      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} fullWidth maxWidth="md" aria-labelledby="triage-detail-title" PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle id="triage-detail-title" sx={{ pb: 1.5 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 900, lineHeight: 1.2 }}>
                {t('triage.detail_title')}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                {selectedTicket?.ticketNumber ? `${t('triage.ticket_no')} ${selectedTicket.ticketNumber}` : ''}
              </Typography>
            </Box>
            {selectedTicket && statusChip(selectedTicket.status)}
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          {detailLoading ? (
            <Box sx={{ py: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <CircularProgress />
              <Typography variant="body2" color="text.secondary">
                {t('triage.detail_loading')}
              </Typography>
            </Box>
          ) : detailError ? (
            <Alert
              severity="error"
              variant="outlined"
              action={
                <Button onClick={handleRetryDetail} size="small" sx={{ fontWeight: 700, textTransform: 'none' }}>
                  {t('triage.retry')}
                </Button>
              }
              sx={{ borderRadius: 3 }}
            >
              {detailError}
            </Alert>
          ) : selectedTicket && (
            <Grid container spacing={2.5}>
              <Grid item xs={12} md={4}>
                <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, bgcolor: '#f8fafc', borderColor: 'rgba(8, 187, 163, 0.12)' }}>
                  <Stack spacing={1.5}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                        {t('triage.status')}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 800, mt: 0.25 }}>
                        {t(`triage.status_labels.${normalizeCode(selectedTicket.status)}`, selectedTicket.status || '-')}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                        {t('triage.priority')}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 800, mt: 0.25 }}>
                        {t(`triage.priority_labels.${normalizeCode(selectedTicket.priority)}`, selectedTicket.priority || '-')}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                        {t('triage.severity')}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 800, mt: 0.25 }}>
                        {selectedTicket.severity || '-'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                        {t('triage.category')}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 800, mt: 0.25 }}>
                        {selectedTicket.categoryName || '-'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                        {t('triage.triage_officer')}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 800, mt: 0.25 }}>
                        {selectedTicket.triageOfficerName || '-'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                        {t('triage.created_at')}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 800, mt: 0.25 }}>
                        {formatDateTime(selectedTicket.createdAt)}
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>
              </Grid>

              <Grid item xs={12} md={8}>
                <Stack spacing={2.5}>
                  <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, bgcolor: '#ffffff' }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                      {t('triage.summary')}
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 900, mt: 0.5 }}>
                      {selectedTicket.title || '-'}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1.5, lineHeight: 1.75, color: 'text.secondary' }}>
                      {selectedTicket.description || '-'}
                    </Typography>
                  </Paper>

                  <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, bgcolor: '#ffffff' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 2 }}>
                      {t('triage.chat_history')}
                    </Typography>
                    <Stack spacing={1.5}>
                      {chatHistory.length === 0 ? (
                        <Typography variant="body2" color="text.secondary">
                          {t('triage.no_chat_history')}
                        </Typography>
                      ) : (
                        chatHistory.map((message) => {
                          const fromPatient = ['USER', 'PATIENT'].includes(normalizeCode(message.senderType))

                          return (
                            <Box
                              key={message.id}
                              sx={{
                                alignSelf: fromPatient ? 'flex-end' : 'flex-start',
                                maxWidth: { xs: '100%', sm: '88%' },
                                p: 1.5,
                                borderRadius: 3,
                                bgcolor: fromPatient ? '#ecfdf5' : '#f8fafc',
                                border: '1px solid rgba(8, 187, 163, 0.08)'
                              }}
                            >
                              <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary' }}>
                                {resolveSenderLabel(message.senderType, t)}
                              </Typography>
                              <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
                                {message.content || '-'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                {formatDateTime(message.createdAt)}
                              </Typography>
                            </Box>
                          )
                        })
                      )}
                    </Stack>
                  </Paper>
                </Stack>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2.5 }}>
          <Button
            onClick={handleCloseDetail}
            variant="contained"
            sx={{
              borderRadius: 3,
              bgcolor: '#10b981',
              '&:hover': { bgcolor: '#059669' },
              fontWeight: 700,
              px: 3
            }}
          >
            {t('triage.close')}
          </Button>
        </DialogActions>
      </Dialog>
    </PatientPageShell>
  )
}
