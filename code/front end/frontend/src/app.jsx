import { Suspense } from 'react'
import { Box, CircularProgress } from '@mui/material'
import AppRoutes from './routes/app-routes'

const FallbackLoader = () => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: '#f8fafc',
    }}
  >
    <CircularProgress size={60} sx={{ color: '#10b981' }} />
  </Box>
)

export default function App() {
  return (
    <Suspense fallback={<FallbackLoader />}>
      <AppRoutes />
    </Suspense>
  )
}
