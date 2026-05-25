import { Suspense } from 'react'
import { Box, CircularProgress } from '@mui/material'
import AppRoutes from './routes/app-routes'
import { DESIGN_TOKENS } from './constants/design-tokens'

const LOADER_SIZE = 60

const FallbackLoader = () => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: DESIGN_TOKENS.colors.surface[50],
    }}
  >
    <CircularProgress size={LOADER_SIZE} sx={{ color: DESIGN_TOKENS.colors.semantic.success }} />
  </Box>
)

export default function App() {
  return (
    <Suspense fallback={<FallbackLoader />}>
      <AppRoutes />
    </Suspense>
  )
}
