import { Box, Typography, Button } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { MedicalServices, Chat, CalendarMonth, ArrowForward } from '@mui/icons-material'

export default function Landing() {
  const navigate = useNavigate()

  return (
    <Box sx={{ minHeight: '100vh' }}>
      {/* Navbar */}
      <Box
        component="nav"
        sx={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          px: 4, py: 2, backgroundColor: '#fff',
          borderBottom: '1px solid #e2e8f0',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <MedicalServices sx={{ color: 'primary.main', fontSize: 32 }} />
          <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
            CareTriage
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" onClick={() => navigate('/login')}>
            Đăng nhập
          </Button>
          <Button variant="contained" onClick={() => navigate('/register')}>
            Đăng ký
          </Button>
        </Box>
      </Box>

      {/* Hero */}
      <Box
        sx={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', textAlign: 'center',
          minHeight: '70vh', px: 4,
          background: 'linear-gradient(180deg, #effefa 0%, #f8fafc 100%)',
        }}
      >
        <Typography
          variant="h2"
          sx={{ fontWeight: 800, mb: 2, maxWidth: 700, lineHeight: 1.2 }}
        >
          Trợ lý AI{' '}
          <Box component="span" sx={{ color: 'primary.main' }}>Sơ chẩn</Box>{' '}
          & Phân luồng Bệnh nhân
        </Typography>
        <Typography
          variant="h6"
          sx={{ color: 'text.secondary', mb: 4, maxWidth: 600, fontWeight: 400 }}
        >
          Mô tả triệu chứng của bạn, AI sẽ giúp bạn xác định tình trạng sức khỏe
          và đề xuất chuyên khoa phù hợp nhất.
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained" size="large"
            startIcon={<Chat />} endIcon={<ArrowForward />}
            onClick={() => navigate('/register')}
            sx={{ px: 4, py: 1.5, fontSize: '1.1rem' }}
          >
            Kiểm tra triệu chứng ngay
          </Button>
          <Button
            variant="outlined" size="large"
            startIcon={<CalendarMonth />}
            onClick={() => navigate('/register')}
            sx={{ px: 4, py: 1.5 }}
          >
            Đặt lịch khám
          </Button>
        </Box>
      </Box>

      {/* Features */}
      <Box
        sx={{
          display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
          gap: 4, px: 4, py: 8, maxWidth: 1100, mx: 'auto',
        }}
      >
        {[
          { icon: <Chat sx={{ fontSize: 40 }} />, title: 'AI Sơ chẩn', desc: 'Chatbot AI phân tích triệu chứng bằng ngôn ngữ tự nhiên, hỏi thêm câu hỏi phụ để đưa ra khuyến nghị chính xác.' },
          { icon: <MedicalServices sx={{ fontSize: 40 }} />, title: 'Phân luồng thông minh', desc: 'Hệ thống tự động đề xuất chuyên khoa phù hợp và tạo ticket gửi trực tiếp đến bác sĩ.' },
          { icon: <CalendarMonth sx={{ fontSize: 40 }} />, title: 'Đặt lịch trực tuyến', desc: 'Đặt lịch khám với bác sĩ chuyên khoa, theo dõi trạng thái và quản lý hồ sơ bệnh án.' },
        ].map((f) => (
          <Box
            key={f.title}
            sx={{
              p: 4, borderRadius: 4, backgroundColor: '#fff',
              border: '1px solid #e2e8f0', textAlign: 'center',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 10px 25px rgba(0,0,0,0.08)' },
            }}
          >
            <Box sx={{ color: 'primary.main', mb: 2 }}>{f.icon}</Box>
            <Typography variant="h5" sx={{ mb: 1 }}>{f.title}</Typography>
            <Typography color="text.secondary">{f.desc}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  )
}
