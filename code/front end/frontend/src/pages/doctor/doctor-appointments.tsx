import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactElement, SyntheticEvent } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import {
  Calendar,
  CalendarDays,
  CheckCircle2,
  Clock,
  FileText,
  Play,
  RefreshCw,
  Search,
  XCircle,
} from 'lucide-react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { useNavigate } from 'react-router-dom'

import TableActionCell from '../../components/common/table-action-cell'
import PatientPageShell from '../../components/patient/patient-page-shell'
import {
  DOCTOR_APPOINTMENT_KEYS,
  DOCTOR_APPOINTMENT_TABS,
  DOCTOR_APPOINTMENT_UI,
} from '../../constants/doctor-appointments'
import appointmentApi from '../../services/appointment-service'
import type {
  AppointmentStatus,
  DoctorAppointment,
  DoctorAppointmentsResponse,
  SnackbarState,
} from '../../types/doctor-appointments'
import AppointmentDetailDrawer from './components/appointment-detail-drawer'

const PAGE_STYLES = {
  bodyMarginTop: '-4px',
  chipFontSize: '0.75rem',
  emptyIconStrokeWidth: 1,
  searchFieldBackground: 'background.paper',
  spacingLarge: '24px',
  spacingSmall: '8px',
  subtitleFontSize: '0.95rem',
  tabIndicatorHeight: '3px',
  titleDateFormat: "'Ngày' dd 'tháng' MM, yyyy",
} as const

const CREATE_RECORD_BASE = '/doctor/medical-records/create'

type StatusPresentation = {
  chipColor: 'default' | 'error' | 'info' | 'primary' | 'success' | 'warning'
  icon: ReactElement
  label: string
}

type DialogState = {
  open: boolean
  selectedAppointment: DoctorAppointment | null
  targetStatus: AppointmentStatus | ''
}

const getAppointmentsFromResponse = (response: DoctorAppointmentsResponse) => {
  const nestedData = response.data?.data
  if (Array.isArray(nestedData)) {
    return nestedData
  }

  if (Array.isArray(response.data)) {
    return response.data
  }

  return []
}

const formatAppointmentTime = (appointmentTime?: string | null, emptyLabel = '--:--') => {
  if (!appointmentTime) {
    return emptyLabel
  }

  return appointmentTime.substring(
    DOCTOR_APPOINTMENT_UI.timeSubstringStart,
    DOCTOR_APPOINTMENT_UI.timeSubstringEnd,
  )
}

export default function DoctorAppointments() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [appointments, setAppointments] = useState<DoctorAppointment[]>([])
  const [loading, setLoading] = useState(true)
  const [tabValue, setTabValue] = useState<number>(DOCTOR_APPOINTMENT_TABS.TODAY)
  const [searchQuery, setSearchQuery] = useState('')
  const [dialogState, setDialogState] = useState<DialogState>({
    open: false,
    selectedAppointment: null,
    targetStatus: '',
  })
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailAppointment, setDetailAppointment] = useState<DoctorAppointment | null>(null)
  const [notes, setNotes] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState('')
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success',
  })

  const copy = {
    pageTitle: t(DOCTOR_APPOINTMENT_KEYS.pageTitle),
    badge: t(DOCTOR_APPOINTMENT_KEYS.badge),
    refresh: t(DOCTOR_APPOINTMENT_KEYS.refresh),
    searchPlaceholder: t(DOCTOR_APPOINTMENT_KEYS.searchPlaceholder),
    emptyTitle: t(DOCTOR_APPOINTMENT_KEYS.emptyTitle),
    emptyDescription: t(DOCTOR_APPOINTMENT_KEYS.emptyDescription),
    loadingList: t(DOCTOR_APPOINTMENT_KEYS.loadingList),
    loadError: t(DOCTOR_APPOINTMENT_KEYS.loadError),
    updateSuccess: t(DOCTOR_APPOINTMENT_KEYS.updateSuccess),
    updateError: t(DOCTOR_APPOINTMENT_KEYS.updateError),
    table: {
      time: t(DOCTOR_APPOINTMENT_KEYS.table.time),
      patient: t(DOCTOR_APPOINTMENT_KEYS.table.patient),
      reason: t(DOCTOR_APPOINTMENT_KEYS.table.reason),
      status: t(DOCTOR_APPOINTMENT_KEYS.table.status),
      actions: t(DOCTOR_APPOINTMENT_KEYS.table.actions),
    },
    tabs: {
      today: t(DOCTOR_APPOINTMENT_KEYS.tabs.today),
      newRequests: t(DOCTOR_APPOINTMENT_KEYS.tabs.newRequests),
      inProgress: t(DOCTOR_APPOINTMENT_KEYS.tabs.inProgress),
      completed: t(DOCTOR_APPOINTMENT_KEYS.tabs.completed),
      all: t(DOCTOR_APPOINTMENT_KEYS.tabs.all),
    },
    actions: {
      detail: t(DOCTOR_APPOINTMENT_KEYS.actions.detail),
      confirm: t(DOCTOR_APPOINTMENT_KEYS.actions.confirm),
      start: t(DOCTOR_APPOINTMENT_KEYS.actions.start),
      complete: t(DOCTOR_APPOINTMENT_KEYS.actions.complete),
      createRecord: t(DOCTOR_APPOINTMENT_KEYS.actions.createRecord),
      markNoShow: t(DOCTOR_APPOINTMENT_KEYS.actions.markNoShow),
      close: t(DOCTOR_APPOINTMENT_KEYS.actions.close),
      confirmAction: t(DOCTOR_APPOINTMENT_KEYS.actions.confirmAction),
    },
    dialog: {
      inProgress: t(DOCTOR_APPOINTMENT_KEYS.dialog.inProgress),
      completed: t(DOCTOR_APPOINTMENT_KEYS.dialog.completed),
      cancelled: t(DOCTOR_APPOINTMENT_KEYS.dialog.cancelled),
      confirmed: t(DOCTOR_APPOINTMENT_KEYS.dialog.confirmed),
      noShow: t(DOCTOR_APPOINTMENT_KEYS.dialog.noShow),
      cancelledReasonLabel: t(DOCTOR_APPOINTMENT_KEYS.dialog.cancelledReasonLabel),
      noteLabel: t(DOCTOR_APPOINTMENT_KEYS.dialog.noteLabel),
      cancelledReasonPlaceholder: t(DOCTOR_APPOINTMENT_KEYS.dialog.cancelledReasonPlaceholder),
      notePlaceholder: t(DOCTOR_APPOINTMENT_KEYS.dialog.notePlaceholder),
      patientMessage: t(DOCTOR_APPOINTMENT_KEYS.dialog.patientMessage),
      notePrefix: t(DOCTOR_APPOINTMENT_KEYS.dialog.notePrefix),
    },
    status: {
      pending: t(DOCTOR_APPOINTMENT_KEYS.status.pending),
      confirmed: t(DOCTOR_APPOINTMENT_KEYS.status.confirmed),
      inProgress: t(DOCTOR_APPOINTMENT_KEYS.status.inProgress),
      completed: t(DOCTOR_APPOINTMENT_KEYS.status.completed),
      cancelled: t(DOCTOR_APPOINTMENT_KEYS.status.cancelled),
      noShow: t(DOCTOR_APPOINTMENT_KEYS.status.noShow),
    },
    fallback: {
      time: t(DOCTOR_APPOINTMENT_KEYS.fallback.time),
      missingPhone: t(DOCTOR_APPOINTMENT_KEYS.fallback.missingPhone),
      unknownReason: t(DOCTOR_APPOINTMENT_KEYS.fallback.unknownReason),
    },
  }

  const statusPresentations: Record<string, StatusPresentation> = {
    PENDING: {
      chipColor: 'warning',
      icon: <Clock size={DOCTOR_APPOINTMENT_UI.chipIconSize} />,
      label: copy.status.pending,
    },
    CONFIRMED: {
      chipColor: 'info',
      icon: <Clock size={DOCTOR_APPOINTMENT_UI.chipIconSize} />,
      label: copy.status.confirmed,
    },
    IN_PROGRESS: {
      chipColor: 'primary',
      icon: <RefreshCw size={DOCTOR_APPOINTMENT_UI.chipIconSize} />,
      label: copy.status.inProgress,
    },
    COMPLETED: {
      chipColor: 'success',
      icon: <CheckCircle2 size={DOCTOR_APPOINTMENT_UI.chipIconSize} />,
      label: copy.status.completed,
    },
    CANCELLED: {
      chipColor: 'error',
      icon: <XCircle size={DOCTOR_APPOINTMENT_UI.chipIconSize} />,
      label: copy.status.cancelled,
    },
    NO_SHOW: {
      chipColor: 'default',
      icon: <XCircle size={DOCTOR_APPOINTMENT_UI.chipIconSize} />,
      label: copy.status.noShow,
    },
  }

  const fetchAppointments = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      let response: DoctorAppointmentsResponse
      if (tabValue === DOCTOR_APPOINTMENT_TABS.TODAY) {
        response = await appointmentApi.getDoctorTodayAppointments()
      } else if (tabValue === DOCTOR_APPOINTMENT_TABS.NEW_REQUESTS) {
        response = await appointmentApi.getDoctorAppointments({ status: 'PENDING' })
      } else {
        response = await appointmentApi.getDoctorAppointments()
      }

      setAppointments(getAppointmentsFromResponse(response))
    } catch (caughtError) {
      console.error('Failed to fetch appointments', caughtError)
      setError(copy.loadError)
    } finally {
      setLoading(false)
    }
  }, [copy.loadError, tabValue])

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchAppointments()
    }, 0)

    return () => clearTimeout(timer)
  }, [fetchAppointments])

  const filteredAppointments = useMemo(() => {
    let nextAppointments = [...appointments]

    if (tabValue === DOCTOR_APPOINTMENT_TABS.IN_PROGRESS) {
      nextAppointments = nextAppointments.filter((appointment) => appointment.status === 'IN_PROGRESS')
    } else if (tabValue === DOCTOR_APPOINTMENT_TABS.COMPLETED) {
      nextAppointments = nextAppointments.filter((appointment) => appointment.status === 'COMPLETED')
    }

    if (tabValue === DOCTOR_APPOINTMENT_TABS.TODAY) {
      const today = format(new Date(), 'yyyy-MM-dd')
      nextAppointments = nextAppointments.filter((appointment) => appointment.appointmentDate === today)
    }

    if (!searchQuery) {
      return nextAppointments
    }

    const normalizedSearchQuery = searchQuery.toLowerCase()
    return nextAppointments.filter((appointment) => {
      const matchesName = appointment.patientName.toLowerCase().includes(normalizedSearchQuery)
      const matchesId = String(appointment.id).includes(normalizedSearchQuery)
      const matchesPhone = appointment.patientPhone?.includes(normalizedSearchQuery) ?? false
      return matchesName || matchesId || matchesPhone
    })
  }, [appointments, searchQuery, tabValue])

  const openStatusDialog = (appointment: DoctorAppointment, targetStatus: AppointmentStatus) => {
    setDialogState({ open: true, selectedAppointment: appointment, targetStatus })
    setNotes(appointment.notes ?? '')
    setDetailOpen(false)
    setError('')
  }

  const closeStatusDialog = () => {
    if (actionLoading) {
      return
    }

    setDialogState({ open: false, selectedAppointment: null, targetStatus: '' })
  }

  const openDetailDrawer = (appointment: DoctorAppointment) => {
    setDetailAppointment(appointment)
    setDetailOpen(true)
  }

  const handleUpdateStatus = async () => {
    if (!dialogState.selectedAppointment || !dialogState.targetStatus) {
      return
    }

    setActionLoading(true)
    setError('')

    try {
      await appointmentApi.updateStatus(dialogState.selectedAppointment.id, {
        status: dialogState.targetStatus,
        notes,
      })
      setDialogState({ open: false, selectedAppointment: null, targetStatus: '' })
      setSnackbar({ open: true, message: copy.updateSuccess, severity: 'success' })
      await fetchAppointments()
    } catch (caughtError) {
      console.error('Failed to update appointment status', caughtError)
      setError(copy.updateError)
    } finally {
      setActionLoading(false)
    }
  }

  const handleTabChange = (_event: SyntheticEvent, value: number) => {
    setTabValue(value)
  }

  const selectedStatusPresentation = dialogState.selectedAppointment
    ? statusPresentations[dialogState.selectedAppointment.status] ?? statusPresentations.PENDING
    : statusPresentations.PENDING

  let dialogTitle = copy.actions.detail
  if (dialogState.targetStatus === 'IN_PROGRESS') {
    dialogTitle = copy.dialog.inProgress
  } else if (dialogState.targetStatus === 'COMPLETED') {
    dialogTitle = copy.dialog.completed
  } else if (dialogState.targetStatus === 'CANCELLED') {
    dialogTitle = copy.dialog.cancelled
  } else if (dialogState.targetStatus === 'CONFIRMED') {
    dialogTitle = copy.dialog.confirmed
  } else if (dialogState.targetStatus === 'NO_SHOW') {
    dialogTitle = copy.dialog.noShow
  }

  const dialogFieldLabel =
    dialogState.targetStatus === 'CANCELLED'
      ? copy.dialog.cancelledReasonLabel
      : copy.dialog.noteLabel

  const dialogPlaceholder =
    dialogState.targetStatus === 'CANCELLED'
      ? copy.dialog.cancelledReasonPlaceholder
      : copy.dialog.notePlaceholder

  return (
    <PatientPageShell
      title={copy.pageTitle}
      subtitle={format(new Date(), PAGE_STYLES.titleDateFormat, { locale: vi })}
      maxWidth={false}
      transparent
      badge={copy.badge}
      actions={
        <Button
          variant="outlined"
          startIcon={loading ? <CircularProgress size={DOCTOR_APPOINTMENT_UI.smallIconSize} color="inherit" /> : <RefreshCw size={DOCTOR_APPOINTMENT_UI.refreshIconSize} />}
          onClick={() => void fetchAppointments()}
          disabled={loading}
        >
          {copy.refresh}
        </Button>
      }
    >
      <Box sx={{ mt: PAGE_STYLES.bodyMarginTop }}>
        <Box
          sx={{
            mb: PAGE_STYLES.spacingLarge,
            display: 'flex',
            flexWrap: 'wrap',
            gap: PAGE_STYLES.spacingLarge,
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            sx={{
              minHeight: DOCTOR_APPOINTMENT_UI.tabMinHeight,
              '& .MuiTab-root': {
                fontWeight: 600,
                textTransform: 'none',
                fontSize: PAGE_STYLES.subtitleFontSize,
                minWidth: DOCTOR_APPOINTMENT_UI.tabMinWidth,
              },
              '& .MuiTabs-indicator': {
                height: PAGE_STYLES.tabIndicatorHeight,
              },
            }}
          >
            <Tab icon={<CalendarDays size={DOCTOR_APPOINTMENT_UI.refreshIconSize} />} iconPosition="start" label={copy.tabs.today} />
            <Tab icon={<Clock size={DOCTOR_APPOINTMENT_UI.refreshIconSize} />} iconPosition="start" label={copy.tabs.newRequests} />
            <Tab icon={<RefreshCw size={DOCTOR_APPOINTMENT_UI.refreshIconSize} />} iconPosition="start" label={copy.tabs.inProgress} />
            <Tab icon={<CheckCircle2 size={DOCTOR_APPOINTMENT_UI.refreshIconSize} />} iconPosition="start" label={copy.tabs.completed} />
            <Tab icon={<Calendar size={DOCTOR_APPOINTMENT_UI.refreshIconSize} />} iconPosition="start" label={copy.tabs.all} />
          </Tabs>

          <TextField
            size="small"
            placeholder={copy.searchPlaceholder}
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={DOCTOR_APPOINTMENT_UI.refreshIconSize} />
                  </InputAdornment>
                ),
              },
            }}
            sx={{
              width: DOCTOR_APPOINTMENT_UI.searchWidth,
              '& .MuiOutlinedInput-root': {
                bgcolor: PAGE_STYLES.searchFieldBackground,
              },
            }}
          />
        </Box>

        {error ? <Alert severity="error" sx={{ mb: PAGE_STYLES.spacingLarge }}>{error}</Alert> : null}

        <TableContainer>
          <Table sx={{ minWidth: DOCTOR_APPOINTMENT_UI.tableMinWidth }}>
            <TableHead>
              <TableRow>
                <TableCell>{copy.table.time}</TableCell>
                <TableCell>{copy.table.patient}</TableCell>
                <TableCell>{copy.table.reason}</TableCell>
                <TableCell align="center">{copy.table.status}</TableCell>
                <TableCell align="right">{copy.table.actions}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: PAGE_STYLES.spacingLarge }}>
                    <CircularProgress size={DOCTOR_APPOINTMENT_UI.progressSize} thickness={DOCTOR_APPOINTMENT_UI.progressThickness} />
                    <Typography variant="body2" sx={{ mt: PAGE_STYLES.spacingSmall, fontWeight: 600 }}>
                      {copy.loadingList}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : filteredAppointments.length > 0 ? (
                filteredAppointments.map((appointment) => {
                  const statusPresentation = statusPresentations[appointment.status] ?? statusPresentations.PENDING

                  return (
                    <TableRow key={appointment.id} hover>
                      <TableCell>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          {formatAppointmentTime(appointment.appointmentTime, copy.fallback.time)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {format(new Date(appointment.appointmentDate), 'dd/MM/yyyy')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {appointment.patientName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {appointment.patientPhone || copy.fallback.missingPhone}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {appointment.reason || copy.fallback.unknownReason}
                        </Typography>
                        {appointment.notes ? (
                          <Typography variant="caption" color="text.secondary">
                            {copy.dialog.notePrefix} {appointment.notes}
                          </Typography>
                        ) : null}
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={statusPresentation.label}
                          color={statusPresentation.chipColor}
                          icon={statusPresentation.icon}
                          size="small"
                          sx={{ fontSize: PAGE_STYLES.chipFontSize }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <TableActionCell>
                          <Button variant="outlined" size="small" onClick={() => openDetailDrawer(appointment)}>
                            {copy.actions.detail}
                          </Button>

                          {appointment.status === 'PENDING' ? (
                            <Button
                              variant="contained"
                              size="small"
                              startIcon={<CheckCircle2 size={DOCTOR_APPOINTMENT_UI.smallIconSize} />}
                              onClick={() => openStatusDialog(appointment, 'CONFIRMED')}
                            >
                              {copy.actions.confirm}
                            </Button>
                          ) : null}

                          {appointment.status === 'CONFIRMED' ? (
                            <>
                              <Button
                                variant="contained"
                                size="small"
                                startIcon={<Play size={DOCTOR_APPOINTMENT_UI.smallIconSize} />}
                                onClick={() => openStatusDialog(appointment, 'IN_PROGRESS')}
                              >
                                {copy.actions.start}
                              </Button>
                              <Tooltip title={copy.actions.markNoShow}>
                                <IconButton size="small" onClick={() => openStatusDialog(appointment, 'NO_SHOW')}>
                                  <XCircle size={DOCTOR_APPOINTMENT_UI.refreshIconSize} />
                                </IconButton>
                              </Tooltip>
                            </>
                          ) : null}

                          {appointment.status === 'IN_PROGRESS' ? (
                            <>
                              <Button
                                variant="outlined"
                                size="small"
                                startIcon={<FileText size={DOCTOR_APPOINTMENT_UI.smallIconSize} />}
                                onClick={() => navigate(`${CREATE_RECORD_BASE}/${appointment.id}?patientName=${encodeURIComponent(appointment.patientName)}`)}
                              >
                                {copy.actions.createRecord}
                              </Button>
                              <Button
                                variant="contained"
                                size="small"
                                startIcon={<CheckCircle2 size={DOCTOR_APPOINTMENT_UI.smallIconSize} />}
                                onClick={() => openStatusDialog(appointment, 'COMPLETED')}
                              >
                                {copy.actions.complete}
                              </Button>
                            </>
                          ) : null}

                          {appointment.status === 'PENDING' || appointment.status === 'CONFIRMED' ? (
                            <IconButton size="small" color="error" onClick={() => openStatusDialog(appointment, 'CANCELLED')}>
                              <XCircle size={DOCTOR_APPOINTMENT_UI.refreshIconSize} />
                            </IconButton>
                          ) : null}
                        </TableActionCell>
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: PAGE_STYLES.spacingLarge }}>
                    <CalendarDays size={DOCTOR_APPOINTMENT_UI.emptyIconSize} strokeWidth={PAGE_STYLES.emptyIconStrokeWidth} />
                    <Typography variant="h6" sx={{ fontWeight: 600, mt: PAGE_STYLES.spacingSmall }}>
                      {copy.emptyTitle}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {copy.emptyDescription}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <Dialog open={dialogState.open} onClose={closeStatusDialog} fullWidth maxWidth="xs" PaperProps={{ sx: { p: PAGE_STYLES.spacingSmall } }}>
        <DialogTitle>{dialogTitle}</DialogTitle>
        <DialogContent>
          {error ? <Alert severity="error" sx={{ mb: PAGE_STYLES.spacingSmall }}>{error}</Alert> : null}
          <Typography variant="body2" color="text.secondary" sx={{ mb: PAGE_STYLES.spacingSmall }}>
            {copy.dialog.patientMessage} <strong>{dialogState.selectedAppointment?.patientName}</strong>.
          </Typography>
          <TextField
            fullWidth
            label={dialogFieldLabel}
            multiline
            rows={DOCTOR_APPOINTMENT_UI.statusDialogRows}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder={dialogPlaceholder}
          />
        </DialogContent>
        <DialogActions sx={{ px: PAGE_STYLES.spacingLarge, pb: PAGE_STYLES.spacingLarge }}>
          <Button onClick={closeStatusDialog} disabled={actionLoading}>
            {copy.actions.close}
          </Button>
          <Button variant="contained" onClick={() => void handleUpdateStatus()} disabled={actionLoading}>
            {actionLoading ? <CircularProgress size={DOCTOR_APPOINTMENT_UI.smallIconSize} color="inherit" /> : copy.actions.confirmAction}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={snackbar.open} onClose={() => setSnackbar((currentState) => ({ ...currentState, open: false }))}>
        <Box sx={{ p: PAGE_STYLES.spacingLarge }}>
          <Typography variant="body1" sx={{ fontWeight: 600 }}>
            {snackbar.message}
          </Typography>
        </Box>
      </Dialog>

      <AppointmentDetailDrawer
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        appointment={detailAppointment}
        statusConfig={selectedStatusPresentation}
        onUpdateStatus={openStatusDialog}
        onNavigateToEhr={(appointment) => {
          navigate(`${CREATE_RECORD_BASE}/${appointment.id}?patientName=${encodeURIComponent(appointment.patientName)}`)
        }}
      />
    </PatientPageShell>
  )
}
