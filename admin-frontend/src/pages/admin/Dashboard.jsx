import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import 'chart.js/auto'
import { Doughnut, Line } from 'react-chartjs-2'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Grid,
  Paper,
  Skeleton,
  Stack,
  Typography,
  alpha,
  useTheme,
} from '@mui/material'
import {
  CheckCircle,
  EventAvailable,
  EventBusy,
  Groups,
  LocalHospital,
  PieChart,
  Refresh,
  Schedule,
  ShowChart,
  TrendingDown,
  TrendingUp,
} from '@mui/icons-material'
import adminApi from '../../api/adminApi'

const PERIOD_OPTIONS = [
  { value: 'today', label: 'Hôm nay' },
  { value: '7d', label: '7 ngày' },
  { value: '30d', label: '30 ngày' },
]

const STATUS_META = {
  PENDING: { label: 'Chờ xác nhận', color: '#d97706' },
  CONFIRMED: { label: 'Đã xác nhận', color: '#2563eb' },
  CHECKED_IN: { label: 'Đã check-in', color: '#0ea5e9' },
  IN_PROGRESS: { label: 'Đang khám', color: '#8b5cf6' },
  COMPLETED: { label: 'Hoàn tất', color: '#16a34a' },
  CANCELLED: { label: 'Đã huỷ', color: '#ef4444' },
  NO_SHOW: { label: 'Vắng mặt', color: '#6b7280' },
}

const ROLE_META = {
  SUPER_ADMIN: { label: 'Super Admin', color: '#7c3aed' },
  ADMIN: { label: 'Quản trị viên', color: '#2563eb' },
  CONTENT_ADMIN: { label: 'Nội dung', color: '#db2777' },
  DOCTOR: { label: 'Bác sĩ', color: '#0f766e' },
  PATIENT: { label: 'Bệnh nhân', color: '#f59e0b' },
}

const EMPTY_OBJECT = {}
const numberFormatter = new Intl.NumberFormat('vi-VN')
const percentFormatter = new Intl.NumberFormat('vi-VN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

function formatNumber(value) {
  return numberFormatter.format(Number(value || 0))
}

function formatPercent(value) {
  return `${percentFormatter.format(Number(value || 0))}%`
}

function formatSignedCount(value) {
  const numeric = Number(value || 0)
  const prefix = numeric > 0 ? '+' : ''
  return `${prefix}${numberFormatter.format(numeric)}`
}

function formatSignedRate(value) {
  const numeric = Number(value || 0)
  const prefix = numeric > 0 ? '+' : ''
  return `${prefix}${percentFormatter.format(numeric)}pp`
}

function formatDateLabel(dateString) {
  if (!dateString) return ''
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit' }).format(new Date(`${dateString}T00:00:00`))
}

function formatDateRange(startDate, endDate) {
  if (!startDate || !endDate) return ''
  const start = new Date(`${startDate}T00:00:00`)
  const end = new Date(`${endDate}T00:00:00`)
  const formatter = new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit' })
  return `${formatter.format(start)} - ${formatter.format(end)}`
}

function formatTimestamp(timestamp) {
  if (!timestamp) return ''
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp))
}

function getDeltaTone(value, reverse = false, theme) {
  const numeric = Number(value || 0)
  if (!numeric) return theme.palette.text.secondary
  const positiveIsGood = reverse ? numeric < 0 : numeric > 0
  return positiveIsGood ? theme.palette.success.main : theme.palette.error.main
}

function DeltaValue({ value, reverse = false, unit = 'count' }) {
  const theme = useTheme()
  const numeric = Number(value || 0)
  const icon = numeric < 0 ? <TrendingDown sx={{ fontSize: 16 }} /> : <TrendingUp sx={{ fontSize: 16 }} />
  const tone = getDeltaTone(numeric, reverse, theme)
  const label = unit === 'rate' ? formatSignedRate(numeric) : formatSignedCount(numeric)

  return (
    <Stack direction="row" spacing={0.5} alignItems="center" sx={{ color: tone }}>
      {icon}
      <Typography variant="caption" sx={{ fontWeight: 800, color: 'inherit' }}>
        {label}
      </Typography>
    </Stack>
  )
}

function DashboardMetricCard({ title, value, subtitle, accent, icon, delta, deltaUnit = 'count', deltaReverse = false }) {
  const theme = useTheme()
  const deltaTone = getDeltaTone(delta, deltaReverse, theme)

  return (
    <Paper
      sx={{
        p: 2.5,
        height: '100%',
        borderRadius: 4,
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(248,250,252,0.9) 100%)',
        border: `1px solid ${alpha(accent, 0.12)}`,
        boxShadow: '0 16px 40px rgba(15, 23, 42, 0.06)',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          inset: 'auto 0 0 0',
          height: 4,
          background: `linear-gradient(90deg, ${alpha(accent, 0.8)}, ${alpha(accent, 0.25)})`,
        }}
      />
      <Stack direction="row" spacing={2} alignItems="flex-start" justifyContent="space-between">
        <Stack spacing={1} sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="overline" sx={{ letterSpacing: '0.08em', fontWeight: 800, color: 'text.secondary' }}>
            {title}
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 900, lineHeight: 1.05 }}>
            {value}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
            {subtitle}
          </Typography>
          {delta !== null && delta !== undefined && (
            <Stack direction="row" spacing={0.75} alignItems="center" sx={{ color: deltaTone }}>
              <DeltaValue value={delta} reverse={deltaReverse} unit={deltaUnit} />
            </Stack>
          )}
        </Stack>
        <Box
          sx={{
            width: 52,
            height: 52,
            borderRadius: 3,
            bgcolor: alpha(accent, 0.12),
            color: accent,
            display: 'grid',
            placeItems: 'center',
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>
      </Stack>
    </Paper>
  )
}

function SnapshotCard({ title, value, icon, color, subtitle }) {
  return (
    <Paper
      sx={{
        p: 2,
        borderRadius: 3,
        background: alpha(color, 0.05),
        border: `1px solid ${alpha(color, 0.12)}`,
        boxShadow: 'none',
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            bgcolor: alpha(color, 0.12),
            color,
            display: 'grid',
            placeItems: 'center',
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase' }}>
            {title}
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 900, lineHeight: 1.1 }}>
            {value}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
            {subtitle}
          </Typography>
        </Box>
      </Stack>
    </Paper>
  )
}

function DashboardSkeleton() {
  return (
    <Stack spacing={3}>
      <Paper sx={{ p: 3, borderRadius: 4 }}>
        <Stack spacing={1.5}>
          <Skeleton variant="text" width="32%" height={44} />
          <Skeleton variant="text" width="52%" height={26} />
          <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
            <Skeleton variant="rounded" width={86} height={32} />
            <Skeleton variant="rounded" width={92} height={32} />
            <Skeleton variant="rounded" width={92} height={32} />
            <Skeleton variant="rounded" width={118} height={36} />
          </Stack>
        </Stack>
      </Paper>

      <Grid container spacing={2}>
        {Array.from({ length: 4 }).map((_, index) => (
          <Grid xs={12} sm={6} lg={3} key={index}>
            <Paper sx={{ p: 2.5, borderRadius: 4 }}>
              <Stack spacing={1.5}>
                <Skeleton variant="rounded" width={44} height={44} />
                <Skeleton variant="text" width="60%" height={24} />
                <Skeleton variant="text" width="35%" height={54} />
                <Skeleton variant="text" width="50%" height={22} />
              </Stack>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2}>
        <Grid xs={12} lg={8}>
          <Paper sx={{ p: 2.5, borderRadius: 4 }}>
            <Stack spacing={2}>
              <Skeleton variant="text" width="32%" height={28} />
              <Skeleton variant="rounded" height={320} />
            </Stack>
          </Paper>
        </Grid>
        <Grid xs={12} lg={4}>
          <Paper sx={{ p: 2.5, borderRadius: 4 }}>
            <Stack spacing={2}>
              <Skeleton variant="text" width="42%" height={28} />
              <Skeleton variant="rounded" height={320} />
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid xs={12} lg={5}>
          <Paper sx={{ p: 2.5, borderRadius: 4 }}>
            <Stack spacing={2}>
              <Skeleton variant="text" width="34%" height={28} />
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} variant="rounded" height={40} />
              ))}
            </Stack>
          </Paper>
        </Grid>
        <Grid xs={12} lg={7}>
          <Paper sx={{ p: 2.5, borderRadius: 4 }}>
            <Stack spacing={2}>
              <Skeleton variant="text" width="38%" height={28} />
              <Grid container spacing={1.5}>
                {Array.from({ length: 6 }).map((_, index) => (
                  <Grid xs={6} md={4} key={index}>
                    <Skeleton variant="rounded" height={96} />
                  </Grid>
                ))}
              </Grid>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Stack>
  )
}

export default function Dashboard() {
  const theme = useTheme()
  const [period, setPeriod] = useState('7d')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [lastUpdated, setLastUpdated] = useState('')
  const requestVersionRef = useRef(0)
  const hasLoadedRef = useRef(false)

  const activePeriod = PERIOD_OPTIONS.find((option) => option.value === period) || PERIOD_OPTIONS[1]
  const dashboard = data ?? EMPTY_OBJECT
  const operations = dashboard.operationalKpis ?? EMPTY_OBJECT

  const fetchStats = useCallback(async () => {
    const requestVersion = requestVersionRef.current + 1
    requestVersionRef.current = requestVersion

    if (hasLoadedRef.current) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }

    setError('')

    try {
      const res = await adminApi.getDashboardStats({ period })
      if (requestVersion !== requestVersionRef.current) {
        return
      }

      setData(res?.data?.data || null)
      setLastUpdated(res?.data?.timestamp || '')
      hasLoadedRef.current = true
    } catch (err) {
      if (requestVersion !== requestVersionRef.current) {
        return
      }

      console.error('Failed to fetch dashboard stats', err)
      setError('Không thể tải dashboard điều hành. Vui lòng thử lại sau.')
    } finally {
      if (requestVersion === requestVersionRef.current) {
        setLoading(false)
        setRefreshing(false)
      }
    }
  }, [period])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchStats()
  }, [fetchStats])

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchStats()
      }
    }, 60000)

    return () => window.clearInterval(intervalId)
  }, [fetchStats])

  const statusItems = useMemo(() => {
    const source = operations.appointmentsByStatus || dashboard.appointmentsByStatus || {}
    return Object.entries(STATUS_META).map(([status, meta]) => ({
      status,
      label: meta.label,
      color: meta.color,
      value: Number(source?.[status] || 0),
    }))
  }, [dashboard.appointmentsByStatus, operations.appointmentsByStatus])

  const trendPoints = useMemo(() => {
    const source = operations.appointmentTrend || dashboard.recentAppointmentTrend || []
    return source.map((point) => ({
      date: point?.date,
      label: formatDateLabel(point?.date),
      count: Number(point?.count || 0),
    }))
  }, [dashboard.recentAppointmentTrend, operations.appointmentTrend])

  const roleItems = useMemo(() => {
    const source = dashboard.usersByRole || {}
    return Object.entries(ROLE_META).map(([role, meta]) => ({
      role,
      label: meta.label,
      color: meta.color,
      value: Number(source?.[role] || 0),
    }))
  }, [dashboard.usersByRole])

  const maxRoleValue = useMemo(() => Math.max(...roleItems.map((item) => item.value), 0), [roleItems])

  const lineChartData = useMemo(() => ({
    labels: trendPoints.map((point) => point.label),
    datasets: [
      {
        label: 'Lượt hẹn',
        data: trendPoints.map((point) => point.count),
        borderColor: theme.palette.primary.main,
        backgroundColor: alpha(theme.palette.primary.main, 0.16),
        fill: true,
        tension: 0.35,
        pointRadius: 3,
        pointHoverRadius: 5,
        pointBackgroundColor: theme.palette.primary.main,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
      },
    ],
  }), [theme.palette.primary.main, trendPoints])

  const lineChartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: theme.palette.background.paper,
        titleColor: theme.palette.text.primary,
        bodyColor: theme.palette.text.primary,
        borderColor: alpha(theme.palette.divider, 0.2),
        borderWidth: 1,
        padding: 12,
        displayColors: false,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: theme.palette.text.secondary, maxRotation: 0, autoSkip: true },
      },
      y: {
        beginAtZero: true,
        grid: { color: alpha(theme.palette.divider, 0.45) },
        ticks: { color: theme.palette.text.secondary, precision: 0 },
      },
    },
  }), [theme.palette.background.paper, theme.palette.divider, theme.palette.text.primary, theme.palette.text.secondary])

  const doughnutChartData = useMemo(() => ({
    labels: statusItems.map((item) => item.label),
    datasets: [
      {
        data: statusItems.map((item) => item.value),
        backgroundColor: statusItems.map((item) => alpha(item.color, 0.9)),
        borderColor: '#fff',
        borderWidth: 2,
        hoverOffset: 6,
      },
    ],
  }), [statusItems])

  const doughnutChartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    cutout: '66%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          color: theme.palette.text.secondary,
          padding: 16,
        },
      },
      tooltip: {
        backgroundColor: theme.palette.background.paper,
        titleColor: theme.palette.text.primary,
        bodyColor: theme.palette.text.primary,
        borderColor: alpha(theme.palette.divider, 0.2),
        borderWidth: 1,
        padding: 12,
      },
    },
  }), [theme.palette.background.paper, theme.palette.divider, theme.palette.text.primary, theme.palette.text.secondary])

  const totalStatusCount = useMemo(() => statusItems.reduce((sum, item) => sum + item.value, 0), [statusItems])

  const metricCards = useMemo(() => {
    const completionRateDelta = operations.deltaCompletionRate ?? 0
    const noShowRateDelta = operations.deltaNoShowRate ?? 0

    return [
      {
        title: 'Lượt hẹn trong kỳ',
        value: formatNumber(operations.totalAppointments || 0),
        subtitle: `${operations.periodLabel || activePeriod.label} · ${formatDateRange(operations.startDate, operations.endDate) || activePeriod.label}`,
        accent: theme.palette.primary.main,
        icon: <EventAvailable sx={{ fontSize: 26 }} />,
        delta: operations.deltaAppointments || 0,
        deltaUnit: 'count',
      },
      {
        title: 'Tỷ lệ hoàn tất',
        value: formatPercent(operations.completionRate || 0),
        subtitle: `${operations.comparisonLabel || 'so với kỳ trước'}`,
        accent: theme.palette.success.main,
        icon: <CheckCircle sx={{ fontSize: 26 }} />,
        delta: completionRateDelta,
        deltaUnit: 'rate',
      },
      {
        title: 'Tỷ lệ vắng mặt',
        value: formatPercent(operations.noShowRate || 0),
        subtitle: `${operations.comparisonLabel || 'so với kỳ trước'}`,
        accent: theme.palette.warning.main,
        icon: <EventBusy sx={{ fontSize: 26 }} />,
        delta: noShowRateDelta,
        deltaUnit: 'rate',
        deltaReverse: true,
      },
      {
        title: 'Chờ triage',
        value: formatNumber(operations.pendingTriageNow ?? dashboard.pendingTriage ?? 0),
        subtitle: 'Live backlog',
        accent: theme.palette.error.main,
        icon: <LocalHospital sx={{ fontSize: 26 }} />,
        delta: null,
      },
    ]
  }, [activePeriod.label, dashboard.pendingTriage, operations, theme.palette.error.main, theme.palette.primary.main, theme.palette.success.main, theme.palette.warning.main])

  const systemSnapshot = useMemo(() => ([
    {
      title: 'Tổng người dùng',
      value: formatNumber(dashboard.totalUsers || 0),
      subtitle: `${formatNumber(dashboard.activeUsers || 0)} đang hoạt động`,
      icon: <Groups sx={{ fontSize: 20 }} />,
      color: theme.palette.primary.main,
    },
    {
      title: 'Bác sĩ',
      value: formatNumber(dashboard.totalDoctors || 0),
      subtitle: 'Đội ngũ chuyên môn',
      icon: <LocalHospital sx={{ fontSize: 20 }} />,
      color: theme.palette.success.main,
    },
    {
      title: 'Bệnh nhân',
      value: formatNumber(dashboard.totalPatients || 0),
      subtitle: 'Người dùng dịch vụ',
      icon: <Groups sx={{ fontSize: 20 }} />,
      color: theme.palette.info.main,
    },
    {
      title: 'Tổng lịch hẹn',
      value: formatNumber(dashboard.totalAppointments || 0),
      subtitle: 'Toàn hệ thống',
      icon: <EventAvailable sx={{ fontSize: 20 }} />,
      color: theme.palette.secondary.main,
    },
    {
      title: 'Live backlog',
      value: formatNumber(dashboard.pendingTriage || 0),
      subtitle: 'Chờ triage ngay lúc này',
      icon: <LocalHospital sx={{ fontSize: 20 }} />,
      color: theme.palette.error.main,
    },
  ]), [dashboard.activeUsers, dashboard.pendingTriage, dashboard.totalAppointments, dashboard.totalDoctors, dashboard.totalPatients, dashboard.totalUsers, theme.palette.error.main, theme.palette.info.main, theme.palette.primary.main, theme.palette.secondary.main, theme.palette.success.main])

  const showInitialSkeleton = loading && !data
  const systemHealthy = Boolean(data) && !error

  if (showInitialSkeleton) {
    return <DashboardSkeleton />
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {error && (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={fetchStats}>
              Thử lại
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      <Paper
        sx={{
          p: 3,
          borderRadius: 4,
          background: 'linear-gradient(135deg, rgba(255,255,255,0.96) 0%, rgba(248,250,252,0.92) 100%)',
          border: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
          boxShadow: '0 18px 50px rgba(15, 23, 42, 0.06)',
        }}
      >
        <Stack spacing={2}>
          <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', lg: 'center' }} justifyContent="space-between">
            <Box sx={{ minWidth: 0 }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                <Chip
                  size="small"
                  icon={systemHealthy ? <CheckCircle sx={{ fontSize: 16 }} /> : <Schedule sx={{ fontSize: 16 }} />}
                  label={systemHealthy ? 'Operational' : 'Updating'}
                  sx={{
                    fontWeight: 800,
                    bgcolor: systemHealthy ? alpha(theme.palette.success.main, 0.12) : alpha(theme.palette.warning.main, 0.12),
                    color: systemHealthy ? theme.palette.success.main : theme.palette.warning.main,
                  }}
                />
                <Chip
                  size="small"
                  icon={<Schedule sx={{ fontSize: 16 }} />}
                  label={lastUpdated ? `Cập nhật ${formatTimestamp(lastUpdated)}` : 'Chưa có dữ liệu'}
                  sx={{
                    fontWeight: 700,
                    bgcolor: alpha(theme.palette.text.primary, 0.04),
                    color: 'text.secondary',
                  }}
                />
              </Stack>
              <Typography variant="h4" sx={{ fontWeight: 900, lineHeight: 1.1, mb: 0.75 }}>
                Operations cockpit
              </Typography>
              <Typography variant="body1" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                {operations.periodLabel || activePeriod.label} · {formatDateRange(operations.startDate, operations.endDate) || activePeriod.label} · {operations.comparisonLabel || 'so với kỳ trước'}
              </Typography>
            </Box>

            <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent={{ xs: 'flex-start', lg: 'flex-end' }}>
              {PERIOD_OPTIONS.map((option) => (
                <Chip
                  key={option.value}
                  label={option.label}
                  onClick={() => setPeriod(option.value)}
                  variant={period === option.value ? 'filled' : 'outlined'}
                  color={period === option.value ? 'primary' : 'default'}
                  aria-label={`Lọc dashboard theo ${option.label}`}
                  title={`Lọc dashboard theo ${option.label}`}
                  sx={{
                    fontWeight: 800,
                    cursor: 'pointer',
                    borderRadius: 999,
                    px: 0.5,
                  }}
                />
              ))}
              <Button
                variant="outlined"
                onClick={fetchStats}
                startIcon={refreshing ? <CircularProgress size={16} color="inherit" /> : <Refresh />}
                disabled={loading || refreshing}
                aria-label="Làm mới số liệu dashboard"
                title="Làm mới số liệu dashboard"
                sx={{
                  borderRadius: 999,
                  px: 2,
                  fontWeight: 800,
                  textTransform: 'none',
                }}
              >
                Làm mới
              </Button>
            </Stack>
          </Stack>
        </Stack>
      </Paper>

      <Grid container spacing={2}>
        {metricCards.map((card) => (
          <Grid xs={12} sm={6} xl={3} key={card.title}>
            <DashboardMetricCard
              title={card.title}
              value={card.value}
              subtitle={card.subtitle}
              accent={card.accent}
              icon={card.icon}
              delta={card.delta}
              deltaUnit={card.deltaUnit}
              deltaReverse={card.deltaReverse}
            />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2}>
        <Grid xs={12} lg={8}>
          <Paper
            sx={{
              p: 3,
              height: '100%',
              borderRadius: 4,
              background: 'linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(248,250,252,0.92) 100%)',
              border: `1px solid ${alpha(theme.palette.primary.main, 0.06)}`,
              boxShadow: '0 18px 50px rgba(15, 23, 42, 0.05)',
            }}
          >
            <Stack spacing={2}>
              <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="space-between">
                <Stack direction="row" spacing={1.25} alignItems="center">
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 2,
                      bgcolor: alpha(theme.palette.primary.main, 0.12),
                      color: theme.palette.primary.main,
                      display: 'grid',
                      placeItems: 'center',
                    }}
                  >
                    <ShowChart />
                  </Box>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 900 }}>
                      Xu hướng lịch hẹn
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                      Đường xu hướng theo kỳ đang chọn
                    </Typography>
                  </Box>
                </Stack>
                <Chip
                  size="small"
                  icon={<TrendingUp sx={{ fontSize: 16 }} />}
                  label={operations.comparisonLabel || 'so với kỳ trước'}
                  sx={{
                    fontWeight: 800,
                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                    color: theme.palette.primary.main,
                  }}
                />
              </Stack>

              <Box sx={{ height: 340 }}>
                {trendPoints.length > 0 ? (
                  <Line data={lineChartData} options={lineChartOptions} />
                ) : (
                  <Stack alignItems="center" justifyContent="center" sx={{ height: '100%' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                      Chưa có dữ liệu xu hướng trong kỳ đã chọn.
                    </Typography>
                  </Stack>
                )}
              </Box>
            </Stack>
          </Paper>
        </Grid>

        <Grid xs={12} lg={4}>
          <Paper
            sx={{
              p: 3,
              height: '100%',
              borderRadius: 4,
              background: 'linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(248,250,252,0.92) 100%)',
              border: `1px solid ${alpha(theme.palette.primary.main, 0.06)}`,
              boxShadow: '0 18px 50px rgba(15, 23, 42, 0.05)',
            }}
          >
            <Stack spacing={2} sx={{ height: '100%' }}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.success.main, 0.12),
                    color: theme.palette.success.main,
                    display: 'grid',
                    placeItems: 'center',
                  }}
                >
                  <PieChart />
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 900 }}>
                    Phân bố trạng thái
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                    Trạng thái theo kỳ đang chọn
                  </Typography>
                </Box>
              </Stack>

              <Box sx={{ height: 340 }}>
                {totalStatusCount > 0 ? (
                  <Doughnut data={doughnutChartData} options={doughnutChartOptions} />
                ) : (
                  <Stack alignItems="center" justifyContent="center" sx={{ height: '100%' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                      Chưa có dữ liệu trạng thái lịch hẹn cho kỳ này.
                    </Typography>
                  </Stack>
                )}
              </Box>

              <Stack direction="row" spacing={1} flexWrap="wrap">
                {statusItems.map((item) => (
                  <Chip
                    key={item.status}
                    label={`${item.label}: ${formatNumber(item.value)}`}
                    size="small"
                    sx={{
                      fontWeight: 700,
                      bgcolor: alpha(item.color, 0.1),
                      color: item.color,
                      border: `1px solid ${alpha(item.color, 0.2)}`,
                    }}
                  />
                ))}
              </Stack>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid xs={12} lg={5}>
          <Paper
            sx={{
              p: 3,
              height: '100%',
              borderRadius: 4,
              background: 'linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(248,250,252,0.92) 100%)',
              border: `1px solid ${alpha(theme.palette.primary.main, 0.06)}`,
              boxShadow: '0 18px 50px rgba(15, 23, 42, 0.05)',
            }}
          >
            <Stack spacing={2.2}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.secondary.main, 0.12),
                    color: theme.palette.secondary.main,
                    display: 'grid',
                    placeItems: 'center',
                  }}
                >
                  <Groups />
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 900 }}>
                    Năng lực theo vai trò
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                    Phân phối nhân sự theo vai trò hệ thống
                  </Typography>
                </Box>
              </Stack>

              <Stack spacing={1.8}>
                {roleItems.map((item) => {
                  const width = maxRoleValue > 0 ? (item.value / maxRoleValue) * 100 : 0
                  return (
                    <Box key={item.role}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.75 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {item.label}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 700 }}>
                          {formatNumber(item.value)}
                        </Typography>
                      </Stack>
                      <Box sx={{ height: 10, borderRadius: 999, bgcolor: alpha(item.color, 0.12), overflow: 'hidden' }}>
                        <Box
                          sx={{
                            width: `${width}%`,
                            height: '100%',
                            borderRadius: 999,
                            background: `linear-gradient(90deg, ${alpha(item.color, 0.95)}, ${alpha(item.color, 0.7)})`,
                          }}
                        />
                      </Box>
                    </Box>
                  )
                })}
              </Stack>
            </Stack>
          </Paper>
        </Grid>

        <Grid xs={12} lg={7}>
          <Paper
            sx={{
              p: 3,
              height: '100%',
              borderRadius: 4,
              background: 'linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(248,250,252,0.92) 100%)',
              border: `1px solid ${alpha(theme.palette.primary.main, 0.06)}`,
              boxShadow: '0 18px 50px rgba(15, 23, 42, 0.05)',
            }}
          >
            <Stack spacing={2}>
              <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="space-between">
                <Stack direction="row" spacing={1.25} alignItems="center">
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 2,
                      bgcolor: alpha(theme.palette.info.main, 0.12),
                      color: theme.palette.info.main,
                      display: 'grid',
                      placeItems: 'center',
                    }}
                  >
                    <Schedule />
                  </Box>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 900 }}>
                      Bảng điều hành trực tiếp
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                      Chỉ số live để theo dõi nhanh
                    </Typography>
                  </Box>
                </Stack>
                <Chip
                  size="small"
                  label={operations.periodLabel || activePeriod.label}
                  sx={{
                    fontWeight: 800,
                    bgcolor: alpha(theme.palette.info.main, 0.08),
                    color: theme.palette.info.main,
                  }}
                />
              </Stack>

              <Grid container spacing={1.5}>
                {systemSnapshot.map((item) => (
                  <Grid xs={12} sm={6} md={4} key={item.title}>
                    <SnapshotCard
                      title={item.title}
                      value={item.value}
                      subtitle={item.subtitle}
                      icon={item.icon}
                      color={item.color}
                    />
                  </Grid>
                ))}
              </Grid>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      <Paper
        sx={{
          p: 2.5,
          borderRadius: 4,
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(255,255,255,0.92) 100%)',
          border: `1px solid ${alpha(theme.palette.success.main, 0.18)}`,
          boxShadow: '0 18px 50px rgba(15, 23, 42, 0.04)',
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="center" sx={{ textAlign: 'center' }}>
          <CheckCircle sx={{ color: theme.palette.success.main }} />
          <Typography variant="h6" sx={{ fontWeight: 900, color: theme.palette.success.main }}>
            Hệ thống đang hoạt động ổn định
          </Typography>
        </Stack>
      </Paper>
    </Box>
  )
}
