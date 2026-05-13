import { Outlet, useLocation } from 'react-router-dom'
import Navbar from '../public/Navbar'
import Footer from '../public/Footer'
import { Box } from '@mui/material'

export default function PublicLayout() {
  const location = useLocation();
  const isAuthPage = ['/login', '/register'].includes(location.pathname);

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {!isAuthPage && <Navbar />}
      <Box component="main" sx={{ flexGrow: 1 }}>
        <Outlet />
      </Box>
      {!isAuthPage && <Footer />}
    </Box>
  )
}
