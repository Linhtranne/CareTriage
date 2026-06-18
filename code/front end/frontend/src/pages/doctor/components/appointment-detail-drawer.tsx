import type { ChipProps } from '@mui/material'
import { Avatar, Box, Button, Chip, Divider, Drawer, IconButton, Stack, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { Calendar, Clock, FileText, Phone, User, X } from 'lucide-react'
import { format } from 'date-fns'

import {
  DOCTOR_APPOINTMENT_KEYS,
  DOCTOR_APPOINTMENT_UI,
} from '../../../constants/doctor-appointments'
import type { AppointmentStatus, DoctorAppointment } from '../../../types/doctor-appointments'

const DRAWER_STYLES = {
  headerPadding: 3,
  contentGap: 3,
  contentPadding: 3,
  iconSize: 18,
  closeIconSize: 20,
  spacing: 2,
  detailSpacing: 1,
  sectionSpacing: 4,
  notePadding: 1.5,
  sectionRadius: 2,
  actionSpacing: 1.5,
  phoneGap: 0.5,
} as const

type StatusConfig = {
  chipColor: ChipProps['color']
  label: string
}

type AppointmentDetailDrawerProps = Readonly<{
  appointment: DoctorAppointment | null
  onClose: () => void
  onNavigateToEhr: (appointment: DoctorAppointment) => void
  onUpdateStatus: (appointment: DoctorAppointment, status: AppointmentStatus) => void
  open: boolean
  statusConfig: StatusConfig
}>

const formatAppointmentTime = (appointmentTime?: string | null, emptyLabel = '--:--') => {
  if (!appointmentTime) {
    return emptyLabel
  }

  return appointmentTime.substring(
    DOCTOR_APPOINTMENT_UI.timeSubstringStart,
    DOCTOR_APPOINTMENT_UI.timeSubstringEnd,
  )
}

export default function AppointmentDetailDrawer({
  appointment,
  onClose,
  onNavigateToEhr,
  onUpdateStatus,
  open,
  statusConfig,
}: AppointmentDetailDrawerProps) {
  const { t } = useTranslation()

  if (!appointment) {
    return null
  }

  const copy = {
    actions: {
      detail: t(DOCTOR_APPOINTMENT_KEYS.actions.detail),
      confirm: t(DOCTOR_APPOINTMENT_KEYS.actions.confirm),
      start: t(DOCTOR_APPOINTMENT_KEYS.actions.start),
      complete: t(DOCTOR_APPOINTMENT_KEYS.actions.complete),
      createRecord: t(DOCTOR_APPOINTMENT_KEYS.actions.createRecord),
      markNoShow: t(DOCTOR_APPOINTMENT_KEYS.actions.markNoShow),
    },
    dialog: {
      cancelled: t(DOCTOR_APPOINTMENT_KEYS.dialog.cancelled),
      noteLabel: t(DOCTOR_APPOINTMENT_KEYS.dialog.noteLabel),
    },
    table: {
      time: t(DOCTOR_APPOINTMENT_KEYS.table.time),
      status: t(DOCTOR_APPOINTMENT_KEYS.table.status),
      triageTicket: t(DOCTOR_APPOINTMENT_KEYS.table.triageTicket),
      identifierPrefix: t(DOCTOR_APPOINTMENT_KEYS.table.identifierPrefix),
      reason: t(DOCTOR_APPOINTMENT_KEYS.table.reason),
    },
    fallback: {
      time: t(DOCTOR_APPOINTMENT_KEYS.fallback.time),
      missingPhone: t(DOCTOR_APPOINTMENT_KEYS.fallback.missingPhone),
      unknownReason: t(DOCTOR_APPOINTMENT_KEYS.fallback.unknownReason),
    },
  }

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: DOCTOR_APPOINTMENT_UI.detailDrawerWidth },
          bgcolor: 'background.default',
        },
      }}
    >
      <Box
        sx={{
          p: DRAWER_STYLES.headerPadding,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--color-surface-200)',
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 800, color: 'var(--color-surface-900)' }}>
          {copy.actions.detail}
        </Typography>
        <IconButton onClick={onClose} size="small">
          <X size={DRAWER_STYLES.closeIconSize} />
        </IconButton>
      </Box>

      <Box sx={{ p: DRAWER_STYLES.contentPadding, flex: 1, overflowY: 'auto' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: DRAWER_STYLES.spacing, mb: DRAWER_STYLES.sectionSpacing }}>
          <Avatar
            src={appointment.patientAvatar ?? undefined}
            sx={{
              width: DOCTOR_APPOINTMENT_UI.detailAvatarSize,
              height: DOCTOR_APPOINTMENT_UI.detailAvatarSize,
              bgcolor: 'var(--color-primary-100)',
              color: 'var(--color-primary-600)',
            }}
          >
            <User size={DOCTOR_APPOINTMENT_UI.progressSize} />
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {appointment.patientName}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: 'var(--color-surface-700)',
                display: 'flex',
                alignItems: 'center',
                gap: DRAWER_STYLES.phoneGap,
                mt: 0.5,
              }}
            >
              <Phone size={DRAWER_STYLES.iconSize - DOCTOR_APPOINTMENT_UI.noteIconOffset} />
              {appointment.patientPhone || copy.fallback.missingPhone}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ mb: DRAWER_STYLES.contentGap }} />

        <Stack spacing={DRAWER_STYLES.contentGap}>
          <Box>
            <Typography variant="caption" sx={{ color: 'var(--color-surface-700)', fontWeight: 600, textTransform: 'uppercase' }}>
              {copy.table.time}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: DRAWER_STYLES.detailSpacing, mt: 1 }}>
              <Calendar size={DRAWER_STYLES.iconSize} color="var(--color-primary-500)" />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {format(new Date(appointment.appointmentDate), 'dd/MM/yyyy')}
              </Typography>
              <Clock size={DRAWER_STYLES.iconSize} color="var(--color-primary-500)" style={{ marginLeft: 16 }} />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {formatAppointmentTime(appointment.appointmentTime, copy.fallback.time)}
              </Typography>
            </Box>
          </Box>

          <Box>
            <Typography variant="caption" sx={{ color: 'var(--color-surface-700)', fontWeight: 600, textTransform: 'uppercase' }}>
              {copy.table.status}
            </Typography>
            <Box sx={{ mt: 1 }}>
              <Chip label={statusConfig.label} size="small" color={statusConfig.chipColor} />
            </Box>
          </Box>

          {appointment.triageTicketId ? (
            <Box>
              <Typography variant="caption" sx={{ color: 'var(--color-surface-700)', fontWeight: 600, textTransform: 'uppercase' }}>
                {copy.table.triageTicket}
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: DRAWER_STYLES.detailSpacing,
                  mt: 1,
                  bgcolor: 'var(--color-primary-50)',
                  p: DRAWER_STYLES.notePadding,
                  borderRadius: DRAWER_STYLES.sectionRadius,
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'var(--color-primary-700)' }}>
                  {copy.table.identifierPrefix} {appointment.triageTicketId}
                </Typography>
                {appointment.triagePriority && (
                  <Chip 
                    label={
                      appointment.triagePriority === 'URGENT' || appointment.triagePriority === 'CRITICAL' ? t('triage_tickets.priority_labels.CRITICAL') :
                      appointment.triagePriority === 'HIGH' ? t('triage_tickets.priority_labels.HIGH') :
                      appointment.triagePriority === 'MEDIUM' ? t('triage_tickets.priority_labels.MEDIUM') :
                      t('triage_tickets.priority_labels.LOW')
                    } 
                    size="small" 
                    sx={{ 
                      ml: 'auto',
                      fontWeight: 700, borderRadius: 2, 
                      bgcolor: appointment.triagePriority === 'URGENT' || appointment.triagePriority === 'CRITICAL' ? 'error.main' : 'var(--color-primary-100)', 
                      color: appointment.triagePriority === 'URGENT' || appointment.triagePriority === 'CRITICAL' ? 'white' : 'var(--color-primary-700)'
                    }} 
                  />
                )}
              </Box>
            </Box>
          ) : null}

          <Box>
            <Typography variant="caption" sx={{ color: 'var(--color-surface-700)', fontWeight: 600, textTransform: 'uppercase' }}>
              {copy.table.reason}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                mt: 1,
                bgcolor: 'var(--color-surface-100)',
                p: DRAWER_STYLES.notePadding,
                borderRadius: DRAWER_STYLES.sectionRadius,
              }}
            >
              {appointment.reason || copy.fallback.unknownReason}
            </Typography>
          </Box>

          {appointment.notes ? (
            <Box>
              <Typography variant="caption" sx={{ color: 'var(--color-surface-700)', fontWeight: 600, textTransform: 'uppercase' }}>
                {copy.dialog.noteLabel}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  mt: 1,
                  color: 'warning.dark',
                  bgcolor: 'warning.light',
                  p: DRAWER_STYLES.notePadding,
                  borderRadius: DRAWER_STYLES.sectionRadius,
                }}
              >
                {appointment.notes}
              </Typography>
            </Box>
          ) : null}
        </Stack>
      </Box>

      <Box sx={{ p: DRAWER_STYLES.contentPadding, borderTop: '1px solid var(--color-surface-200)', bgcolor: 'background.paper' }}>
        <Stack direction="column" spacing={DRAWER_STYLES.actionSpacing}>
          {appointment.status === 'PENDING' ? (
            <Button variant="contained" fullWidth onClick={() => onUpdateStatus(appointment, 'CONFIRMED')}>
              {copy.actions.confirm}
            </Button>
          ) : null}

          {appointment.status === 'CONFIRMED' ? (
            <>
              <Button variant="contained" fullWidth onClick={() => onUpdateStatus(appointment, 'IN_PROGRESS')}>
                {copy.actions.start}
              </Button>
              <Button variant="outlined" fullWidth onClick={() => onUpdateStatus(appointment, 'NO_SHOW')}>
                {copy.actions.markNoShow}
              </Button>
            </>
          ) : null}

          {appointment.status === 'IN_PROGRESS' ? (
            <>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => onNavigateToEhr(appointment)}
                startIcon={<FileText size={DOCTOR_APPOINTMENT_UI.smallIconSize} />}
              >
                {copy.actions.createRecord}
              </Button>
              <Button variant="contained" fullWidth onClick={() => onUpdateStatus(appointment, 'COMPLETED')}>
                {copy.actions.complete}
              </Button>
            </>
          ) : null}

          {appointment.status === 'PENDING' || appointment.status === 'CONFIRMED' ? (
            <Button variant="text" fullWidth color="error" onClick={() => onUpdateStatus(appointment, 'CANCELLED')}>
              {copy.dialog.cancelled}
            </Button>
          ) : null}
        </Stack>
      </Box>
    </Drawer>
  )
}
