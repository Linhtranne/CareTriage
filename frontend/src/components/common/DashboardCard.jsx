import { Box, Paper, Typography, alpha } from '@mui/material'
import { ChevronRight } from 'lucide-react'

const DashboardCard = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  color = '#10b981', 
  onClick, 
  loading = false
}) => {

  return (
    <Paper
      onClick={onClick}
      role={onClick ? 'button' : 'article'}
      tabIndex={onClick ? 0 : undefined}
      sx={{
        p: 2.5,
        height: '100%',
        cursor: onClick ? 'pointer' : 'default',
        borderRadius: 4,
        border: `1px solid ${alpha(color, 0.1)}`,
        transition: 'all 0.2s ease',
        position: 'relative',
        overflow: 'hidden',
        background: `linear-gradient(135deg, ${alpha(color, 0.03)} 0%, #ffffff 100%)`,
        '&:hover': onClick ? {
          transform: 'translateY(-2px)',
          boxShadow: `0 14px 32px ${alpha(color, 0.12)}`,
          borderColor: color
        } : {},
        '&:focus-visible': {
          outline: 'none',
          boxShadow: `0 0 0 4px ${alpha(color, 0.16)}`,
          borderColor: color
        }
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: 2.5,
            bgcolor: alpha(color, 0.1),
            color: color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {Icon && <Icon size={22} />}
        </Box>
        {onClick && <ChevronRight size={18} color="#94a3b8" />}
      </Box>

      <Box>
        <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary', mb: 0.5, letterSpacing: '0.01em' }}>
          {title}
        </Typography>
        <Typography variant="h4" sx={{ fontWeight: 900, color: '#0f172a', mb: 0.5 }}>
          {loading ? '...' : value}
        </Typography>
        {subtitle && (
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500, display: 'block' }}>
            {subtitle}
          </Typography>
        )}
      </Box>

      {/* Decorative background element */}
      <Box
        sx={{
          position: 'absolute',
          right: -20,
          bottom: -20,
          opacity: 0.05,
          color: color,
          pointerEvents: 'none'
        }}
      >
        {Icon && <Icon size={120} strokeWidth={1} />}
      </Box>
    </Paper>
  )
}

export default DashboardCard
