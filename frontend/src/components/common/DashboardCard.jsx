import { Box, Typography, alpha } from '@mui/material'
import { motion } from 'framer-motion'

const DashboardCard = ({
  title,
  value,
  icon: Icon,
  color = '#10b981',
  loading = false,
  onClick,
}) => {
  return (
    <motion.div
      whileHover={{ y: -10, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      style={{ height: '100%', width: '100%', display: 'flex' }} // Force flex and full width
    >
      <Box
        onClick={onClick}
        role={onClick ? 'button' : 'article'}
        sx={{
          p: 3, // Reduced padding
          flex: 1,
          width: '100%',
          minHeight: 200, // Compact height
          cursor: onClick ? 'pointer' : 'default',
          borderRadius: '48px', // More natural for a shorter pill
          border: '1px solid oklch(100% 0 0 / 0.15)',
          backdropFilter: 'blur(20px) saturate(200%)',
          bgcolor: 'oklch(100% 0 0 / 0.08)',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center',
          gap: 2, // Reduced gap
          transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
          '&:hover': {
            borderColor: alpha(color, 0.4),
            bgcolor: alpha(color, 0.08),
            boxShadow: `0 40px 80px ${alpha(color, 0.15)}, inset 0 0 30px ${alpha(color, 0.08)}`,
            '& .icon-wrapper': {
              transform: 'scale(1.1) translateY(-8px)',
              bgcolor: color,
              color: 'white',
              boxShadow: `0 20px 40px ${alpha(color, 0.4)}`,
            },
            '& .glow-orb': {
              opacity: 0.8,
              transform: 'scale(1.4)',
            }
          }
        }}
      >
        {/* Glow Orb Background Effect */}
        <Box
          className="glow-orb"
          sx={{
            position: 'absolute',
            top: '-20%',
            left: '-20%',
            width: '140%',
            height: '140%',
            background: `radial-gradient(circle at 50% 50%, ${alpha(color, 0.2)} 0%, transparent 70%)`,
            opacity: 0.3,
            transition: 'all 0.8s ease',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />

        <Box
          className="icon-wrapper"
          sx={{
            zIndex: 1,
            width: 72, // Slightly larger
            height: 72,
            borderRadius: '24px',
            bgcolor: alpha(color, 0.1),
            color: color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {Icon && <Icon sx={{ fontSize: 36 }} />}
        </Box>

        <Box sx={{ zIndex: 1, textAlign: 'center' }}>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 800,
              color: 'oklch(50% 0.02 250)',
              mb: 1,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              display: 'block',
              fontSize: '0.75rem'
            }}
          >
            {title}
          </Typography>
          <Typography
            variant="h2"
            sx={{
              fontWeight: 900,
              color: 'oklch(20% 0.05 250)',
              letterSpacing: '-0.02em',
              lineHeight: 1
            }}
          >
            {loading ? '...' : value}
          </Typography>
        </Box>
      </Box>
    </motion.div>
  )
}

export default DashboardCard
