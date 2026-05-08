import { useState, useEffect } from 'react'
import { Typography, Box, Grid, Card, CardContent, Stack, alpha, useTheme, Skeleton } from '@mui/material'
import { People, PersonAdd, AdminPanelSettings, Insights, LocalHospital, AssignmentLate, CheckCircle } from '@mui/icons-material'
import adminApi from '../../api/adminApi'

export default function Dashboard() {
  const theme = useTheme()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await adminApi.getDashboardStats()
        setData(res.data.data)
      } catch (err) {
        console.error('Failed to fetch dashboard stats', err)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  const stats = [
    { 
      label: 'Tổng người dùng', 
      value: data?.totalUsers || 0, 
      icon: <People />, 
      color: theme.palette.primary.main,
      sub: `${data?.activeUsers || 0} đang hoạt động` 
    },
    { 
      label: 'Bác sĩ', 
      value: data?.totalDoctors || 0, 
      icon: <LocalHospital />, 
      color: theme.palette.success.main,
      sub: 'Đội ngũ chuyên gia' 
    },
    { 
      label: 'Bệnh nhân', 
      value: data?.totalPatients || 0, 
      icon: <PersonAdd />, 
      color: theme.palette.info.main,
      sub: 'Người dùng dịch vụ' 
    },
    { 
      label: 'Triage chờ xử lý', 
      value: data?.pendingTriage || 0, 
      icon: <AssignmentLate />, 
      color: theme.palette.warning.main,
      sub: 'Cần bác sĩ xem xét' 
    },
  ]

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', mb: 1 }}>
          Tổng quan hệ thống
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
          Chào mừng trở lại! Đây là tóm tắt hoạt động của CareTriage hôm nay.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {stats.map((stat, index) => (
          <Grid xs={12} sm={6} md={3} key={index}>
            <Card 
              sx={{ 
                height: '100%',
                background: 'rgba(255, 255, 255, 0.7)',
                backdropFilter: 'blur(10px)',
                border: '1px solid',
                borderColor: alpha(stat.color, 0.1),
                boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                transition: 'transform 0.2s',
                '&:hover': { transform: 'translateY(-4px)' }
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: '12px',
                      bgcolor: alpha(stat.color, 0.1),
                      color: stat.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {stat.icon}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {stat.label}
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 800 }}>
                      {loading ? <Skeleton width="60%" /> : stat.value}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                      {loading ? <Skeleton width="40%" /> : stat.sub}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      
      <Box sx={{ mt: 5, p: 4, borderRadius: 4, background: 'rgba(255, 255, 255, 0.5)', backdropFilter: 'blur(10px)', border: '1px dashed', borderColor: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
        <CheckCircle color="primary" />
        <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
          Hệ thống đang hoạt động ổn định
        </Typography>
      </Box>
    </Box>
  )
}
