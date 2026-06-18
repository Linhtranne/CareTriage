import { Grid, useTheme } from '@mui/material'
import { Schedule, PendingActions, PlayArrow, Assignment } from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import DashboardCard from '../../../components/common/dashboard-card'

export interface DashboardStats {
  totalToday: number
  waiting: number
  inProgress: number
  pendingTicketTotal: number
}

interface DashboardStatsGridProps {
  stats: DashboardStats
  loading: boolean
}

export default function DashboardStatsGrid({ stats, loading }: Readonly<DashboardStatsGridProps>) {
  const { t } = useTranslation()
  const theme = useTheme()

  const STATS_CONFIG = [
    { 
      title: t('dashboard.doctor.total_today'), 
      value: stats.totalToday, 
      icon: Schedule, 
      color: theme.palette.primary.main
    },
    { 
      title: t('dashboard.doctor.waiting'), 
      value: stats.waiting, 
      icon: PendingActions, 
      color: theme.palette.warning.main
    },
    { 
      title: t('dashboard.doctor.in_progress'), 
      value: stats.inProgress, 
      icon: PlayArrow, 
      color: theme.palette.success.main
    },
    { 
      title: t('dashboard.doctor.pending_tickets'), 
      value: stats.pendingTicketTotal, 
      icon: Assignment, 
      color: theme.palette.info.main
    },
  ]

  return (
    <Grid container spacing={4} sx={{ mb: 10, width: '100%', alignItems: 'stretch' }}>
      {STATS_CONFIG.map((stat) => (
        <Grid size={{ xs: 12, sm: 6, md: 3 }} key={stat.title} sx={{ display: 'flex', flexGrow: 1 }}>
          <DashboardCard
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
            loading={loading}
            onClick={() => {}}
          />
        </Grid>
      ))}
    </Grid>
  )
}
