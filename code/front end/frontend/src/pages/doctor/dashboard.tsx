import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Box,
  Button,
  CircularProgress,
  Alert,
  Grid,
} from '@mui/material'
import { Refresh } from '@mui/icons-material'
import { useTranslation } from 'react-i18next'

import appointmentApi from '../../services/appointment-service'
import triageTicketApi from '../../services/triage-ticket-service'
import PatientPageShell from '../../components/patient/patient-page-shell'

import { DASHBOARD_CONSTANTS } from '../../features/doctor-dashboard/constants/dashboard-constants'
import DashboardStatsGrid, { DashboardStats } from '../../features/doctor-dashboard/components/dashboard-stats-grid'
import TodayScheduleIsland, { AppointmentPreviewItem } from '../../features/doctor-dashboard/components/today-schedule-island'
import PendingTriageIsland, { TriageTicketPreviewItem } from '../../features/doctor-dashboard/components/pending-triage-island'

export default function Dashboard() {
  const { t, i18n } = useTranslation()
  const [appointments, setAppointments] = useState<AppointmentPreviewItem[]>([])
  const [pendingTickets, setPendingTickets] = useState<TriageTicketPreviewItem[]>([])
  const [pendingTicketTotal, setPendingTicketTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const loadDashboardData = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true)
    else setRefreshing(true)

    setError('')
    try {
      const [appointmentRes, ticketRes] = await Promise.all([
        appointmentApi.getDoctorTodayAppointments(),
        triageTicketApi.listPending({ page: 0, size: DASHBOARD_CONSTANTS.TICKET_FETCH_SIZE }),
      ])

      const todayAppointments = appointmentRes?.data?.data || []
      const ticketContent = ticketRes || []

      setAppointments(todayAppointments)
      setPendingTickets(ticketContent)
      setPendingTicketTotal(ticketContent.length)
    } catch {
      setError(t('dashboard.doctor.error_load'))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [t])

  useEffect(() => {
    const timer = setTimeout(() => loadDashboardData(true), 0)
    return () => clearTimeout(timer)
  }, [loadDashboardData])

  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        loadDashboardData()
      }
    }, DASHBOARD_CONSTANTS.REFRESH_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [loadDashboardData])

  const stats: DashboardStats = useMemo(() => {
    const totalToday = appointments.length
    const waiting = appointments.filter(
      (a) => a.status === 'PENDING' || a.status === 'CONFIRMED'
    ).length
    const inProgress = appointments.filter((a) => a.status === 'IN_PROGRESS').length

    return {
      totalToday,
      waiting,
      inProgress,
      pendingTicketTotal,
    }
  }, [appointments, pendingTicketTotal])

  const appointmentPreview = appointments.slice(0, DASHBOARD_CONSTANTS.PREVIEW_ITEM_COUNT)
  const ticketPreview = pendingTickets.slice(0, DASHBOARD_CONSTANTS.PREVIEW_ITEM_COUNT)

  return (
    <PatientPageShell
      title={t('dashboard.doctor.title')}
      subtitle={new Date().toLocaleDateString(i18n.language === 'vi' ? 'vi-VN' : 'en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })}
      maxWidth={false}
      transparent={true}
      badge={t('dashboard.doctor.badge', 'Khu vực bác sĩ')}
      actions={
        <Button
          variant="outlined"
          startIcon={refreshing ? <CircularProgress size={16} color="inherit" /> : <Refresh />}
          onClick={() => loadDashboardData()}
          disabled={loading || refreshing}
          sx={{ borderRadius: 3, px: 2.5, fontWeight: 700, textTransform: 'none' }}
        >
          {t('common.refresh')}
        </Button>
      }
    >
      <Box sx={{ mt: -2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>
            {error}
          </Alert>
        )}

        <DashboardStatsGrid stats={stats} loading={loading} />

        <Grid container spacing={6}>
          <Grid size={{ xs: 12, lg: 7 }}>
            <TodayScheduleIsland appointments={appointmentPreview} loading={loading} />
          </Grid>
          <Grid size={{ xs: 12, lg: 5 }}>
            <PendingTriageIsland tickets={ticketPreview} loading={loading} />
          </Grid>
        </Grid>
      </Box>
    </PatientPageShell>
  )
}
