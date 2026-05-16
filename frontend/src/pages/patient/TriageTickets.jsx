import { useEffect, useState } from 'react'
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
  Alert,
  alpha
} from '@mui/material'
import { CalendarDays, ChevronRight, Info } from 'lucide-react'
import { format, isValid } from 'date-fns'
import { vi, enUS } from 'date-fns/locale'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import triageTicketApi from '../../api/triageTicketApi'
import PatientPageShell from '../../components/patient/PatientPageShell'

const normalizeCode = (value) => String(value || '').trim().toUpperCase().replace(/\s+/g, '_')

const getStatusTone = (status) => {
  const code = normalizeCode(status)

  if (code === 'TRIAGED') return { bgcolor: alpha('#10b981', 0.1), color: '#10b981' }
  if (code === 'IN_TRIAGE') return { bgcolor: alpha('#2563eb', 0.1), color: '#2563eb' }
  if (code === 'REJECTED') return { bgcolor: alpha('#ef4444', 0.1), color: '#ef4444' }
  if (code === 'CLOSED') return { bgcolor: 'oklch(95% 0.01 250)', color: 'oklch(50% 0.02 250)' }

  return { bgcolor: alpha('#f59e0b', 0.1), color: '#f59e0b' }
}

const getPriorityTone = (priority) => {
  const code = normalizeCode(priority)

  if (['CRITICAL', 'EMERGENCY', 'URGENT'].includes(code)) return { bgcolor: alpha('#ef4444', 0.1), color: '#ef4444' }
  if (code === 'HIGH') return { bgcolor: alpha('#f59e0b', 0.1), color: '#f59e0b' }
  if (['MEDIUM', 'MODERATE'].includes(code)) return { bgcolor: alpha('#2563eb', 0.1), color: '#2563eb' }
  if (['LOW', 'ROUTINE', 'NORMAL'].includes(code)) return { bgcolor: 'oklch(95% 0.01 250)', color: 'oklch(50% 0.02 250)' }

  return { bgcolor: alpha('#10b981', 0.1), color: '#10b981' }
}

const resolveSenderLabel = (senderType, t) => {
  const code = normalizeCode(senderType)

  if (['USER', 'PATIENT'].includes(code)) return t('triage_tickets.sender_patient')
  if (['STAFF', 'DOCTOR', 'NURSE', 'CLINICIAN'].includes(code)) return t('triage_tickets.sender_staff')
  if (['AI', 'SYSTEM', 'BOT'].includes(code)) return t('triage_tickets.sender_ai')

  return senderType || t('triage_tickets.sender_ai')
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
      setListError(t('triage_tickets.list_load_failed'))
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
      let parsedMetadata = null
      if (detailData?.metadata) {
        try {
          parsedMetadata = JSON.parse(detailData.metadata)
        } catch (e) {
          console.error("Failed to parse metadata", e)
        }
      }
      setSelectedTicket(detailData ? { ...ticket, ...detailData, parsedMetadata } : ticket)
      setChatHistory(Array.isArray(chatRes.data?.data) ? chatRes.data.data : [])
    } catch (error) {
      console.error('Failed to load triage ticket detail', error)
      setChatHistory([])
      setDetailError(t('triage_tickets.detail_load_failed'))
    } finally {
      setDetailLoading(false)
    }
  }

  const statusChip = (status) => {
    const tone = getStatusTone(status)
    const code = normalizeCode(status)
    const label = t(`triage.status_labels.${code}`, status || '-')

    return (
      <Box
        sx={{
          px: 1.5, py: 0.5, borderRadius: '6px', 
          bgcolor: tone.bgcolor, color: tone.color,
          fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.02em'
        }}
      >
        {label}
      </Box>
    )
  }

  const priorityChip = (priority) => {
    const tone = getPriorityTone(priority)
    const code = normalizeCode(priority)
    const label = t(`triage.priority_labels.${code}`, priority || '-')

    return (
      <Box
        sx={{
          px: 1.5, py: 0.5, borderRadius: '6px', 
          bgcolor: tone.bgcolor, color: tone.color,
          fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.02em'
        }}
      >
        {label}
      </Box>
    )
  }

  const formatDateTime = (value) => {
    if (!value) return '-'
    const date = new Date(value)
    if (!isValid(date)) return '-'
    return format(date, 'dd MMMM, yyyy HH:mm', { locale: dateLocale })
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

  return (
    <PatientPageShell
      title={t('triage_tickets.title')}
      subtitle={t('triage_tickets.subtitle')}
      maxWidth={false}
      transparent={true}
      actions={
        <Button
          variant="contained"
          startIcon={<CalendarDays size={20} />}
          onClick={() => navigate('/patient/appointments/book-appointment')}
          sx={{
            borderRadius: 4,
            bgcolor: '#10b981',
            '&:hover': { bgcolor: '#059669' },
            fontWeight: 700,
            px: 4,
            py: 1.5,
            boxShadow: '0 10px 30px rgba(16, 185, 129, 0.2)',
            textTransform: 'none',
          }}
        >
          {t('appointments.book_now')}
        </Button>
      }
    >
      <Box sx={{ width: '100%' }}>
        {!loading && listError ? (
          <Alert
            severity="error"
            variant="outlined"
            action={
              <Button onClick={loadTickets} size="small" sx={{ fontWeight: 950, textTransform: 'none' }}>
                {t('triage_tickets.retry')}
              </Button>
            }
            sx={{ borderRadius: 4, mb: 4 }}
          >
            {listError}
          </Alert>
        ) : null}

        {loading ? (
          <Box sx={{ py: 20, display: 'flex', justifyContent: 'center' }}>
            <CircularProgress size={60} thickness={2} sx={{ color: 'oklch(65% 0.15 160)' }} />
          </Box>
        ) : tickets.length > 0 ? (
          <Grid container spacing={4}>
            {tickets.map((ticket) => (
              <Grid item xs={12} md={6} xl={4} key={ticket.id}>
                <Box
                  onClick={() => handleOpenDetail(ticket)}
                  onKeyDown={(event) => handleCardKeyDown(event, ticket)}
                  sx={{
                    p: 4,
                    borderRadius: 6,
                    border: '1px solid oklch(95% 0.01 250)',
                    bgcolor: 'white',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.02)',
                    '&:hover': {
                      transform: 'translateY(-6px)',
                      boxShadow: '0 15px 40px rgba(0,0,0,0.05)',
                      borderColor: '#10b981'
                    }
                  }}
                >
                  <Stack spacing={3}>
                    <Stack direction="row" spacing={2} justifyContent="space-between" alignItems="flex-start">
                      <Box>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: 'oklch(60% 0.02 250)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          #{ticket.ticketNumber}
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 700, color: 'oklch(20% 0.05 250)', mt: 0.5, letterSpacing: '-0.02em' }}>
                          {ticket.title || t('triage_tickets.detail_title')}
                        </Typography>
                      </Box>
                      {statusChip(ticket.status)}
                    </Stack>

                    <Typography variant="body1" sx={{ color: 'oklch(50% 0.02 250)', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {ticket.description || '-'}
                    </Typography>

                    <Stack direction="row" spacing={1.5}>
                      {priorityChip(ticket.priority)}
                      {ticket.categoryName && (
                        <Box sx={{ px: 1.5, py: 0.5, borderRadius: '6px', bgcolor: 'oklch(98% 0.01 250)', border: '1px solid oklch(92% 0.02 250)', fontSize: '0.75rem', fontWeight: 700, color: 'oklch(40% 0.02 250)', textTransform: 'uppercase' }}>
                          {ticket.categoryName}
                        </Box>
                      )}
                    </Stack>

                    <Divider sx={{ borderColor: 'oklch(94% 0.02 250)' }} />

                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ color: 'oklch(60% 0.02 250)' }}>
                        <CalendarDays size={16} />
                        <Typography variant="caption" sx={{ fontWeight: 800 }}>
                          {formatDateTime(ticket.createdAt)}
                        </Typography>
                      </Stack>
                      <Button
                        variant="text"
                        size="small"
                        endIcon={<ChevronRight size={16} className="chevron-icon" />}
                        sx={{ 
                          fontWeight: 700, 
                          color: '#10b981', 
                          textTransform: 'none',
                          px: 0,
                          '&:hover': {
                            bgcolor: 'transparent',
                            '& .chevron-icon': { transform: 'translateX(4px)' }
                          }
                        }}
                      >
                        {t('triage_tickets.open_detail')}
                      </Button>
                    </Stack>
                  </Stack>
                </Box>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Box sx={{ textAlign: 'center', py: 16 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'oklch(20% 0.05 250)', mb: 2, letterSpacing: '-0.02em' }}>
              {t('triage_tickets.no_tickets')}
            </Typography>
            <Typography variant="body1" sx={{ color: 'oklch(50% 0.02 250)', mb: 4, fontWeight: 500 }}>
              {t('triage_tickets.empty_desc')}
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate('/patient/appointments/book-appointment')}
              sx={{ 
                borderRadius: 4, px: 6, py: 1.8, 
                bgcolor: '#10b981', fontWeight: 700,
                boxShadow: '0 10px 30px rgba(16, 185, 129, 0.2)'
              }}
            >
              {t('appointments.book_now')}
            </Button>
          </Box>
        )}
      </Box>

      <Dialog 
        open={detailOpen} 
        onClose={handleCloseDetail} 
        fullWidth 
        maxWidth="lg"
        PaperProps={{ 
          sx: { 
            borderRadius: 8, 
            bgcolor: 'white', 
            backgroundImage: 'none',
            maxHeight: '90vh'
          } 
        }}
      >
        <DialogTitle sx={{ p: 4, borderBottom: '1px solid oklch(95% 0.01 250)' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, color: 'oklch(60% 0.02 250)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {t('triage_tickets.detail_title')}
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 700, color: 'oklch(20% 0.05 250)', mt: 1, letterSpacing: '-0.03em' }}>
                {selectedTicket?.ticketNumber ? `Ticket #${selectedTicket.ticketNumber}` : ''}
              </Typography>
            </Box>
            {selectedTicket && statusChip(selectedTicket.status)}
          </Stack>
        </DialogTitle>

        <DialogContent sx={{ p: 4 }}>
          {detailLoading ? (
            <Box sx={{ py: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
              <CircularProgress size={40} thickness={4} sx={{ color: 'oklch(65% 0.15 160)' }} />
              <Typography variant="body1" sx={{ fontWeight: 800, color: 'oklch(40% 0.02 250)' }}>
                {t('triage_tickets.detail_loading')}
              </Typography>
            </Box>
          ) : detailError ? (
            <Alert severity="error" variant="outlined" sx={{ borderRadius: 4 }}>{detailError}</Alert>
          ) : selectedTicket && (
            <Grid container spacing={6}>
              <Grid item xs={12} lg={4}>
                <Stack spacing={4}>
                  <Box sx={{ p: 4, borderRadius: 5, bgcolor: 'oklch(99% 0.01 250)', border: '1px solid oklch(96% 0.01 250)' }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'oklch(60% 0.02 250)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                      <Info size={18} /> Chi tiết phân loại
                    </Typography>
                    <Stack spacing={3}>
                      <Box>
                        <Typography variant="caption" sx={{ color: 'oklch(60% 0.02 250)', fontWeight: 600 }}>Ưu tiên / Mức độ</Typography>
                        <Stack direction="row" spacing={1.5} sx={{ mt: 1 }}>
                          {priorityChip(selectedTicket.priority)}
                          <Box sx={{ px: 1.5, py: 0.5, borderRadius: '6px', bgcolor: 'oklch(94% 0.02 250)', fontSize: '0.75rem', fontWeight: 700 }}>{selectedTicket.severity || '-'}</Box>
                        </Stack>
                      </Box>
                      <Box>
                        <Typography variant="caption" sx={{ color: 'oklch(60% 0.02 250)', fontWeight: 600 }}>Danh mục phân loại</Typography>
                        <Typography variant="h6" sx={{ fontWeight: 700, mt: 0.5, fontSize: '1rem' }}>{selectedTicket.categoryName || '-'}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" sx={{ color: 'oklch(60% 0.02 250)', fontWeight: 600 }}>Nhân viên phụ trách</Typography>
                        <Typography variant="h6" sx={{ fontWeight: 700, mt: 0.5, fontSize: '1rem' }}>{selectedTicket.triageOfficerName || '-'}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" sx={{ color: 'oklch(60% 0.02 250)', fontWeight: 600 }}>Ngày khởi tạo</Typography>
                        <Typography variant="h6" sx={{ fontWeight: 700, mt: 0.5, fontSize: '1rem' }}>{formatDateTime(selectedTicket.createdAt)}</Typography>
                      </Box>
                    </Stack>
                  </Box>

                  {selectedTicket.parsedMetadata && (
                    <Box sx={{ p: 4, borderRadius: 6, border: '2px dashed oklch(92% 0.02 250)' }}>
                      <Typography variant="caption" sx={{ fontWeight: 900, color: 'oklch(60% 0.02 250)', textTransform: 'uppercase', letterSpacing: '0.1em', mb: 2, display: 'block' }}>
                        AI Analysis
                      </Typography>
                      {selectedTicket.parsedMetadata.possible_conditions?.map((c, i) => (
                        <Box key={i} sx={{ px: 2, py: 1, borderRadius: 2, bgcolor: 'oklch(96% 0.01 160)', color: 'oklch(65% 0.15 160)', fontWeight: 950, fontSize: '0.8rem', mb: 1 }}>
                          {c}
                        </Box>
                      ))}
                    </Box>
                  )}
                </Stack>
              </Grid>

              <Grid item xs={12} lg={8}>
                <Stack spacing={6}>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'oklch(20% 0.05 250)', mb: 2, letterSpacing: '-0.02em' }}>
                      {selectedTicket.title || '-'}
                    </Typography>
                    <Typography variant="body1" sx={{ color: 'oklch(40% 0.02 250)', lineHeight: 1.8, fontWeight: 500 }}>
                      {selectedTicket.description || '-'}
                    </Typography>
                  </Box>

                  <Divider sx={{ borderColor: 'oklch(94% 0.02 250)' }} />

                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'oklch(20% 0.05 250)', mb: 4, letterSpacing: '-0.02em' }}>
                      Lịch sử tương tác
                    </Typography>
                    <Stack spacing={3}>
                      {chatHistory.length === 0 ? (
                        <Typography variant="body1" sx={{ color: 'oklch(60% 0.02 250)', fontStyle: 'italic' }}>
                          {t('triage_tickets.no_chat_history')}
                        </Typography>
                      ) : (
                        chatHistory.map((message) => {
                          const fromPatient = ['USER', 'PATIENT'].includes(normalizeCode(message.senderType))
                          return (
                            <Box
                              key={message.id}
                              sx={{
                                alignSelf: fromPatient ? 'flex-end' : 'flex-start',
                                maxWidth: '85%',
                                p: 3,
                                borderRadius: fromPatient ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                                bgcolor: fromPatient ? '#10b981' : 'oklch(96% 0.01 250)',
                                color: fromPatient ? 'white' : 'oklch(20% 0.05 250)',
                                border: '1px solid oklch(92% 0.02 250)',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
                              }}
                            >
                              <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.9 }}>
                                {resolveSenderLabel(message.senderType, t)}
                              </Typography>
                              <Box sx={{ 
                                  mt: 1, 
                                  '& p': { m: 0, mb: 1.5, lineHeight: 1.7 },
                                  '& p:last-child': { mb: 0 },
                                  '& ul, & ol': { mt: 1, mb: 1.5, pl: 2.5 },
                                  '& li': { mb: 0.8 },
                                  '& strong': { fontWeight: 800 },
                                  '& h3': { fontSize: '1.1rem', fontWeight: 900, mb: 1.5, mt: 1, color: fromPatient ? 'white' : 'oklch(20% 0.05 250)' },
                                  fontSize: '0.95rem',
                                  fontWeight: 500
                                }}>
                                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {message.content}
                                  </ReactMarkdown>
                                </Box>
                              <Typography variant="caption" sx={{ display: 'block', mt: 1.5, opacity: 0.7, fontWeight: 600 }}>
                                {formatDateTime(message.createdAt)}
                              </Typography>
                            </Box>
                          )
                        })
                      )}
                    </Stack>
                  </Box>
                </Stack>
              </Grid>
            </Grid>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 4, borderTop: '1px solid oklch(94% 0.02 250)' }}>
          <Button
            onClick={handleCloseDetail}
            variant="contained"
            sx={{
              borderRadius: 4,
              bgcolor: 'oklch(20% 0.05 250)',
              '&:hover': { bgcolor: 'black' },
              fontWeight: 700,
              textTransform: 'none',
              px: 6,
              py: 1.5
            }}
          >
            Đóng
          </Button>
        </DialogActions>
      </Dialog>
    </PatientPageShell>
  )
}
