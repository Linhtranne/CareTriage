import { useCallback, useEffect, useMemo, useState } from 'react'
import { Alert, Avatar, Box, Button, Chip, CircularProgress, Dialog, DialogContent, DialogTitle, IconButton, InputAdornment, MenuItem, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Tooltip, Typography, Zoom } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { ArrowRight, ChevronRight, Filter, MessageSquare, RefreshCw, Search, Stethoscope } from 'lucide-react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

import TableActionCell from '../../components/common/table-action-cell'
import PatientPageShell from '../../components/patient/patient-page-shell'
import appointmentApi from '../../services/appointment-service'
import publicApi from '../../services/public-service'
import triageTicketApi from '../../services/triage-ticket-service'
import useAuthStore from '../../store/auth-store'

type TriagePriority = 'CRITICAL' | 'HIGH' | 'LOW' | 'MEDIUM' | 'URGENT' | (string & {})

type DepartmentOption = {
  id: number
  name: string
}

type ChatHistoryItem = {
  content: string
  createdAt?: string | null
  id: number
  senderType: 'AI' | 'USER' | (string & {})
}

type TriageTicket = {
  categoryId?: number | null
  confirmedUrgency?: TriagePriority | null
  createdAt?: string | null
  description?: string | null
  doctorConfirmedSummary?: string | null
  doctorNotes?: string | null
  doctorReviewStatus?: string | null
  id: number
  priority: TriagePriority
  requesterName?: string | null
  ticketNumber?: string | null
}

const INBOX_UI = {
  refreshIconSize: 20,
  smallIconSize: 16,
  priorityIconSize: 14,
  loadTicketSize: 50,
  loadingColSpan: 6,
  detailDialogMaxWidth: 'lg',
  detailSummaryRows: 3,
  doctorNotesRows: 2,
  successReloadDelayMs: 1500,
  appointmentReloadDelayMs: 2000,
  initialLoadDelayMs: 0,
  messageAvatarSize: 24,
  messageAvatarFontSize: 10,
} as const

const EMPTY_TIME_FALLBACK = '-'

type PriorityPresentation = {
  chipColor: 'default' | 'error' | 'info' | 'warning'
  label: string
}

const REVIEW_STATUSES = [
  'AI_ANALYSIS_PENDING_REVIEW',
  'DOCTOR_CONFIRMED',
  'DOCTOR_EDITED',
  'NEEDS_MORE_INFORMATION',
  'REJECTED',
] as const

const URGENCY_OPTIONS = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const

const getTicketList = (response: unknown): TriageTicket[] => {
  if (Array.isArray(response)) return response as TriageTicket[]
  const list = (response as { data?: { data?: { content?: TriageTicket[] } } })?.data?.data?.content
  return Array.isArray(list) ? list : []
}

const getDepartments = (response: unknown): DepartmentOption[] => {
  const list = (response as { data?: { data?: { content?: DepartmentOption[] } } })?.data?.data?.content
  return Array.isArray(list) ? list : []
}

const getChatHistory = (response: unknown): ChatHistoryItem[] => {
  if (Array.isArray(response)) return response as ChatHistoryItem[]
  const list = (response as { data?: { data?: ChatHistoryItem[] } })?.data?.data
  return Array.isArray(list) ? list : []
}

const getTicketDetail = (response: unknown): TriageTicket | null => {
  if (response && typeof response === 'object' && !('data' in response)) return response as TriageTicket
  return ((response as { data?: { data?: TriageTicket } })?.data?.data ?? null)
}

export default function TriageTicketInbox() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [tickets, setTickets] = useState<TriageTicket[]>([])
  const [selectedTicket, setSelectedTicket] = useState<TriageTicket | null>(null)
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([])
  const [detailOpen, setDetailOpen] = useState(false)
  const [departments, setDepartments] = useState<DepartmentOption[]>([])
  const [doctorDepartments, setDoctorDepartments] = useState<DepartmentOption[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | TriagePriority>('ALL')
  const [appointmentDate, setAppointmentDate] = useState('')
  const [appointmentTime, setAppointmentTime] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState('')
  const [createSuccess, setCreateSuccess] = useState('')
  const [reviewStatus, setReviewStatus] = useState('DOCTOR_CONFIRMED')
  const [confirmedSummary, setConfirmedSummary] = useState('')
  const [confirmedDeptId, setConfirmedDeptId] = useState('')
  const [confirmedUrgency, setConfirmedUrgency] = useState<TriagePriority>('MEDIUM')
  const [doctorNotes, setDoctorNotes] = useState('')
  const [reviewLoading, setReviewLoading] = useState(false)
  const [reviewError, setReviewError] = useState('')
  const [reviewSuccess, setReviewSuccess] = useState('')

  const loadTickets = useCallback(async () => {
    setLoading(true)
    try {
      const response = await triageTicketApi.listPending({ page: 0, size: INBOX_UI.loadTicketSize })
      setTickets(getTicketList(response))
    } catch (caughtError) {
      console.error('Failed to load tickets', caughtError)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadDepartments = useCallback(async () => {
    try {
      const response = await publicApi.getDepartments({ page: 0, size: 200 })
      setDepartments(getDepartments(response))
      
      if (user?.id) {
        const docResponse = await publicApi.getDoctorById(user.id)
        const docData = (docResponse as { data?: { data?: { departments?: DepartmentOption[] } } })?.data?.data
        if (docData?.departments && Array.isArray(docData.departments)) {
          setDoctorDepartments(docData.departments)
        }
      }
    } catch (caughtError) {
      console.error('Failed to load departments', caughtError)
    }
  }, [user?.id])

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadTickets()
      void loadDepartments()
    }, INBOX_UI.initialLoadDelayMs)

    return () => clearTimeout(timer)
  }, [loadDepartments, loadTickets])

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      const normalizedSearchTerm = searchTerm.toLowerCase()
      const matchesSearch =
        ticket.requesterName?.toLowerCase().includes(normalizedSearchTerm) ||
        ticket.ticketNumber?.toLowerCase().includes(normalizedSearchTerm)
      const matchesPriority = priorityFilter === 'ALL' || ticket.priority === priorityFilter
      return Boolean(matchesSearch) && matchesPriority
    })
  }, [priorityFilter, searchTerm, tickets])

  const getPriorityInfo = (priority: TriagePriority): PriorityPresentation => {
    switch (priority) {
      case 'URGENT':
      case 'CRITICAL':
        return { chipColor: 'error' as const, label: t('doctorReview.inbox.urgencyUrgent') }
      case 'HIGH':
        return { chipColor: 'warning' as const, label: t('doctorReview.inbox.urgencyHigh') }
      case 'MEDIUM':
        return { chipColor: 'info' as const, label: t('doctorReview.inbox.urgencyMedium') }
      default:
        return { chipColor: 'default' as const, label: t('doctorReview.inbox.urgencyLow') }
    }
  }

  const handleOpenDetail = async (ticket: TriageTicket) => {
    setSelectedTicket(ticket)
    setDetailOpen(true)
    setCreateError('')
    setCreateSuccess('')
    setAppointmentDate('')
    setAppointmentTime('')
    
    // Auto-select department if doctor only has one
    if (doctorDepartments.length === 1) {
      setDepartmentId(String(doctorDepartments[0].id))
    } else {
      setDepartmentId('')
    }
    
    setReviewStatus('DOCTOR_CONFIRMED')
    setConfirmedSummary(ticket.description ?? '')
    setConfirmedDeptId(String(ticket.categoryId ?? ''))
    setConfirmedUrgency(ticket.priority ?? 'MEDIUM')
    setDoctorNotes('')
    setReviewError('')
    setReviewSuccess('')

    try {
      const [detailResponse, chatResponse] = await Promise.all([
        triageTicketApi.getDetail(String(ticket.id)),
        triageTicketApi.getChatHistory(String(ticket.id)),
      ])
      const detailedTicket = getTicketDetail(detailResponse)
      if (detailedTicket) {
        setSelectedTicket(detailedTicket)
        setReviewStatus(detailedTicket.doctorReviewStatus || 'DOCTOR_CONFIRMED')
        setConfirmedSummary(
          detailedTicket.doctorConfirmedSummary || detailedTicket.description || '',
        )
        setConfirmedDeptId(String(detailedTicket.categoryId ?? ''))
        setConfirmedUrgency(
          detailedTicket.confirmedUrgency || detailedTicket.priority || 'MEDIUM',
        )
        setDoctorNotes(detailedTicket.doctorNotes || '')
      }
      setChatHistory(getChatHistory(chatResponse))
    } catch (caughtError) {
      console.error('Failed to load ticket details', caughtError)
    }
  }

  const handleDoctorReview = async () => {
    if (!selectedTicket) return
    setReviewLoading(true)
    setReviewError('')
    setReviewSuccess('')

    try {
      const response = await triageTicketApi.doctorReview(String(selectedTicket.id), {
        reviewStatus,
        confirmedSummary,
        confirmedDepartmentId: confirmedDeptId ? Number(confirmedDeptId) : null,
        confirmedUrgency,
        doctorNotes,
      })
      setReviewSuccess(t('doctorReview.inbox.reviewSaved'))
      setSelectedTicket(getTicketDetail(response))
      setTimeout(() => {
        void loadTickets()
      }, INBOX_UI.successReloadDelayMs)
    } catch (caughtError) {
      console.error('Failed to save doctor review', caughtError)
      setReviewError(t('doctorReview.inbox.reviewSaveFailed'))
    } finally {
      setReviewLoading(false)
    }
  }

  const handleCreateAppointment = async () => {
    if (!selectedTicket) return
    if (!appointmentDate || !appointmentTime || !departmentId) {
      setCreateError(t('doctorReview.inbox.appointmentMissingFields'))
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
        departmentId: Number(departmentId),
      })
      setCreateSuccess(t('doctorReview.inbox.appointmentCreated'))
      setTimeout(() => {
        setDetailOpen(false)
        void loadTickets()
      }, INBOX_UI.appointmentReloadDelayMs)
    } catch (caughtError) {
      console.error('Failed to create appointment', caughtError)
      setCreateError(t('doctorReview.inbox.appointmentCreateFailed'))
    } finally {
      setCreateLoading(false)
    }
  }

  const renderTableBody = () => {
    if (loading) {
      return (
        <TableRow>
          <TableCell colSpan={INBOX_UI.loadingColSpan} align="center" sx={{ py: 8 }}>
            <CircularProgress />
          </TableCell>
        </TableRow>
      )
    }

    if (filteredTickets.length > 0) {
      return filteredTickets.map((ticket) => {
        const priorityInfo = getPriorityInfo(ticket.priority)
        return (
          <TableRow key={ticket.id} hover>
            <TableCell sx={{ fontWeight: 700 }}>
              {t('doctorReview.inbox.ticketCodePrefix')}{ticket.ticketNumber}
            </TableCell>
            <TableCell>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar>{ticket.requesterName?.charAt(0)}</Avatar>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {ticket.requesterName}
                </Typography>
              </Stack>
            </TableCell>
            <TableCell>
              <Typography variant="body2">
                {ticket.description || t('doctorReview.inbox.noDescription')}
              </Typography>
            </TableCell>
            <TableCell>
              <Chip size="small" label={priorityInfo.label} color={priorityInfo.chipColor} />
            </TableCell>
            <TableCell>
              <Typography variant="body2" color="text.secondary">
                {ticket.createdAt ? format(new Date(ticket.createdAt), 'HH:mm - dd/MM', { locale: vi }) : EMPTY_TIME_FALLBACK}
              </Typography>
            </TableCell>
            <TableCell align="right">
              <TableActionCell>
                <Button
                  variant="contained"
                  size="small"
                  endIcon={<ChevronRight size={INBOX_UI.smallIconSize} />}
                  onClick={() => void handleOpenDetail(ticket)}
                >
                  {t('doctorReview.inbox.process')}
                </Button>
              </TableActionCell>
            </TableCell>
          </TableRow>
        )
      })
    }

    return (
      <TableRow>
        <TableCell colSpan={INBOX_UI.loadingColSpan} align="center" sx={{ py: 10 }}>
          <Search size={48} />
          <Typography sx={{ mt: 2, fontWeight: 600 }}>{t('doctorReview.inbox.empty')}</Typography>
        </TableCell>
      </TableRow>
    )
  }

  return (
    <PatientPageShell
      title={t('doctorReview.inbox.title')}
      subtitle={t('doctorReview.inbox.subtitle')}
      maxWidth="xl"
      transparent
    >
      <Stack direction="row" spacing={2} sx={{ mb: 4, mt: -2 }} justifyContent="flex-end">
        <Tooltip title={t('doctorReview.inbox.refreshTitle')}>
          <IconButton onClick={() => void loadTickets()}>
            <RefreshCw size={INBOX_UI.refreshIconSize} />
          </IconButton>
        </Tooltip>
      </Stack>

      <Paper sx={{ p: 3, mb: 4, borderRadius: 4 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ alignItems: 'center' }}>
          <TextField
            placeholder={t('doctorReview.inbox.searchPlaceholder')}
            size="small"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            fullWidth
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={INBOX_UI.smallIconSize} />
                  </InputAdornment>
                ),
              },
            }}
          />
          <TextField
            select
            size="small"
            label={t('doctorReview.inbox.priorityLabel')}
            value={priorityFilter}
            onChange={(event) => setPriorityFilter(event.target.value as 'ALL' | TriagePriority)}
            sx={{ minWidth: 220 }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Filter size={INBOX_UI.smallIconSize} />
                  </InputAdornment>
                ),
              },
            }}
          >
            <MenuItem value="ALL">{t('doctorReview.inbox.priorityAll')}</MenuItem>
            <MenuItem value="CRITICAL">{t('doctorReview.inbox.urgencyUrgent')}</MenuItem>
            <MenuItem value="HIGH">{t('doctorReview.inbox.urgencyHigh')}</MenuItem>
            <MenuItem value="MEDIUM">{t('doctorReview.inbox.urgencyMedium')}</MenuItem>
            <MenuItem value="LOW">{t('doctorReview.inbox.urgencyLow')}</MenuItem>
          </TextField>
          <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto', fontWeight: 600 }}>
            {filteredTickets.length} {t('doctorReview.inbox.pendingCount')}
          </Typography>
        </Stack>
      </Paper>

      <Table>
        <TableHead>
          <TableRow>
            <TableCell>{t('doctorReview.inbox.ticketCode')}</TableCell>
            <TableCell>{t('doctorReview.inbox.patient')}</TableCell>
            <TableCell>{t('doctorReview.inbox.symptoms')}</TableCell>
            <TableCell>{t('doctorReview.inbox.priority')}</TableCell>
            <TableCell>{t('doctorReview.inbox.receivedAt')}</TableCell>
            <TableCell align="right">{t('doctorReview.inbox.actions')}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {renderTableBody()}
        </TableBody>
      </Table>

      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} fullWidth maxWidth={INBOX_UI.detailDialogMaxWidth} TransitionComponent={Zoom}>
        <DialogTitle>
          <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
            <Stack direction="row" spacing={2} alignItems="center">
              <Stethoscope size={28} />
              <Box>
                <Typography variant="h5">{t('doctorReview.inbox.detailTitle')}</Typography>
                <Typography variant="caption">
                  {t('doctorReview.inbox.identifierPrefix')} {t('doctorReview.inbox.ticketCodePrefix')}{selectedTicket?.ticketNumber}
                </Typography>
              </Box>
            </Stack>
            {selectedTicket ? (
              <Chip label={getPriorityInfo(selectedTicket.priority).label} color={getPriorityInfo(selectedTicket.priority).chipColor} />
            ) : null}
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 3 }}>
            <Box sx={{ width: { xs: '100%', lg: '45%' }, display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 2 }}>{t('doctorReview.inbox.patientInfo')}</Typography>
                <Typography variant="caption">{t('doctorReview.inbox.patientName')}</Typography>
                <Typography variant="body1" sx={{ fontWeight: 700 }}>{selectedTicket?.requesterName}</Typography>
                <Typography variant="caption" sx={{ mt: 2, display: 'block' }}>{t('doctorReview.inbox.declaredSymptoms')}</Typography>
                <Typography variant="body2">{selectedTicket?.description}</Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" sx={{ mb: 2 }}>{t('doctorReview.inbox.doctorReviewTitle')}</Typography>
                {reviewError ? <Alert severity="error" sx={{ mb: 2 }}>{reviewError}</Alert> : null}
                {reviewSuccess ? <Alert severity="success" sx={{ mb: 2 }}>{reviewSuccess}</Alert> : null}
                <Stack spacing={2}>
                  <TextField select label={t('doctorReview.inbox.reviewStatus')} size="small" value={reviewStatus} onChange={(event) => setReviewStatus(event.target.value)} fullWidth>
                    <MenuItem value={REVIEW_STATUSES[0]}>{t('doctorReview.inbox.reviewStatusPending')}</MenuItem>
                    <MenuItem value={REVIEW_STATUSES[1]}>{t('doctorReview.inbox.reviewStatusConfirmed')}</MenuItem>
                    <MenuItem value={REVIEW_STATUSES[2]}>{t('doctorReview.inbox.reviewStatusEdited')}</MenuItem>
                    <MenuItem value={REVIEW_STATUSES[3]}>{t('doctorReview.inbox.reviewStatusNeedsInfo')}</MenuItem>
                    <MenuItem value={REVIEW_STATUSES[4]}>{t('doctorReview.inbox.reviewStatusRejected')}</MenuItem>
                  </TextField>

                  <TextField select label={t('doctorReview.inbox.confirmedDepartment')} size="small" value={confirmedDeptId} onChange={(event) => setConfirmedDeptId(event.target.value)} fullWidth>
                    <MenuItem value="">{t('doctorReview.inbox.selectDepartment')}</MenuItem>
                    {departments.map((department) => (
                      <MenuItem key={department.id} value={department.id}>{department.name}</MenuItem>
                    ))}
                  </TextField>

                  <TextField select label={t('doctorReview.inbox.confirmedUrgency')} size="small" value={confirmedUrgency} onChange={(event) => setConfirmedUrgency(event.target.value as TriagePriority)} fullWidth>
                    <MenuItem value={URGENCY_OPTIONS[0]}>{t('doctorReview.inbox.urgencyLow')}</MenuItem>
                    <MenuItem value={URGENCY_OPTIONS[1]}>{t('doctorReview.inbox.urgencyMedium')}</MenuItem>
                    <MenuItem value={URGENCY_OPTIONS[2]}>{t('doctorReview.inbox.urgencyHigh')}</MenuItem>
                    <MenuItem value={URGENCY_OPTIONS[3]}>{t('doctorReview.inbox.urgencyUrgent')}</MenuItem>
                  </TextField>

                  <TextField
                    label={t('doctorReview.inbox.confirmedSummary')}
                    multiline
                    rows={INBOX_UI.detailSummaryRows}
                    size="small"
                    value={confirmedSummary}
                    onChange={(event) => setConfirmedSummary(event.target.value)}
                    fullWidth
                  />
                  <TextField
                    label={t('doctorReview.inbox.doctorNotes')}
                    multiline
                    rows={INBOX_UI.doctorNotesRows}
                    size="small"
                    value={doctorNotes}
                    onChange={(event) => setDoctorNotes(event.target.value)}
                    fullWidth
                  />

                  <Button variant="contained" onClick={() => void handleDoctorReview()} disabled={reviewLoading}>
                    {reviewLoading ? t('doctorReview.inbox.savingReview') : t('doctorReview.inbox.saveReview')}
                  </Button>
                </Stack>
              </Box>

              <Box>
                <Typography variant="subtitle2" sx={{ mb: 2 }}>{t('doctorReview.inbox.appointmentSection')}</Typography>
                {createError ? <Alert severity="error" sx={{ mb: 2 }}>{createError}</Alert> : null}
                {createSuccess ? <Alert severity="success" sx={{ mb: 2 }}>{createSuccess}</Alert> : null}
                <Stack spacing={2}>
                  <TextField label={t('doctorReview.inbox.appointmentDate')} type="date" size="small" value={appointmentDate} onChange={(event) => setAppointmentDate(event.target.value)} slotProps={{ inputLabel: { shrink: true } }} fullWidth />
                  <TextField label={t('doctorReview.inbox.appointmentTime')} type="time" size="small" value={appointmentTime} onChange={(event) => setAppointmentTime(event.target.value)} slotProps={{ inputLabel: { shrink: true } }} fullWidth />
                  <TextField select label={t('doctorReview.inbox.actualDepartment')} size="small" value={departmentId} onChange={(event) => setDepartmentId(event.target.value)} fullWidth>
                    {doctorDepartments.map((department) => (
                      <MenuItem key={department.id} value={department.id}>{department.name}</MenuItem>
                    ))}
                  </TextField>
                  <Button variant="contained" fullWidth onClick={() => void handleCreateAppointment()} disabled={createLoading} startIcon={<ArrowRight size={20} />}>
                    {createLoading ? t('doctorReview.inbox.creatingAppointment') : t('doctorReview.inbox.createAppointment')}
                  </Button>
                </Stack>
              </Box>
            </Box>

            <Box sx={{ width: { xs: '100%', lg: '55%' }, display: 'flex', flexDirection: 'column' }}>
              <Typography variant="subtitle2" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <MessageSquare size={16} /> {t('doctorReview.inbox.conversationTitle')}
              </Typography>
              <Box sx={{ flexGrow: 1, p: 3, borderRadius: 4, border: '1px solid var(--color-surface-200)', maxHeight: 600, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2, position: 'relative' }}>
                {chatHistory.length === 0 ? (
                  <Box sx={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.4 }}>
                    <MessageSquare size={64} strokeWidth={1} />
                    <Typography sx={{ mt: 2, fontWeight: 700 }}>{t('doctorReview.inbox.noConversation')}</Typography>
                    <Typography variant="caption">{t('doctorReview.inbox.syncingConversation')}</Typography>
                  </Box>
                ) : (
                  chatHistory.map((message) => {
                    const isUser = message.senderType === 'USER' || message.senderType === 'PATIENT'
                    return (
                      <Box key={message.id} sx={{ alignSelf: isUser ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                        <Stack direction={isUser ? 'row-reverse' : 'row'} spacing={1} alignItems="flex-end">
                          {isUser ? null : <Avatar sx={{ width: INBOX_UI.messageAvatarSize, height: INBOX_UI.messageAvatarSize, fontSize: INBOX_UI.messageAvatarFontSize }}>{t('doctorReview.inbox.aiLabel')}</Avatar>}
                          <Box sx={{ p: 2.5, borderRadius: isUser ? '28px 28px 4px 28px' : '28px 28px 28px 4px', bgcolor: isUser ? 'primary.main' : 'background.paper', color: isUser ? 'primary.contrastText' : 'text.primary', border: '1px solid var(--color-surface-200)' }}>
                            <Box sx={{ '& p': { m: 0, mb: 1.5, lineHeight: 1.6 }, '& p:last-child': { mb: 0 }, '& ul, & ol': { pl: 2.5, mt: 1 }, '& li': { mb: 0.5 }, '& strong': { fontWeight: 800 }, '& h3': { fontSize: '1rem', fontWeight: 900, mb: 1, mt: 0.5 }, fontSize: '0.875rem', fontWeight: 500 }}>
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                            </Box>
                          </Box>
                        </Stack>
                        <Typography variant="caption" sx={{ display: 'block', mt: 0.5, px: 1, textAlign: isUser ? 'right' : 'left', color: 'text.disabled', fontSize: 10 }}>
                          {message.createdAt ? format(new Date(message.createdAt), 'HH:mm', { locale: vi }) : ''}
                        </Typography>
                      </Box>
                    )
                  })
                )}
              </Box>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </PatientPageShell>
  )
}
