import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  Stack,
  Slider,
  ThemeProvider,
  createTheme,
  alpha,
  LinearProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Activity,
  Stethoscope,
  Database,
  BarChart3,
  Clock,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  Users,
  Zap,
  Maximize2
} from 'lucide-react';

// Custom MUI Theme matching the "Intelligent Corridor" design system
const theme = createTheme({
  palette: {
    primary: {
      main: '#08bba3', // Living Teal
      light: '#20d6bc',
      dark: '#039786',
      contrastText: '#f8fafc',
    },
    secondary: {
      main: '#f43f5e', // Warm Coral
    },
    background: {
      default: '#f0fdf4', // Meadow Mist
      paper: '#f8fafc', // Cloud White
    },
    text: {
      primary: '#1e293b',
      secondary: '#64748b',
    },
  },
  typography: {
    fontFamily: "'Inter', sans-serif",
    h1: { fontWeight: 900, letterSpacing: '-0.03em' },
    h2: { fontWeight: 900, letterSpacing: '-0.02em' },
    h3: { fontWeight: 700, letterSpacing: '-0.01em' },
    h5: { fontWeight: 600, letterSpacing: '-0.01em' },
    body1: { fontWeight: 400, lineHeight: 1.6 },
    button: { textTransform: 'none', fontWeight: 700 },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          padding: '12px 28px',
          borderRadius: 10,
          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 10px 20px -10px rgba(8, 187, 163, 0.5)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        },
      },
    },
  },
});

export default function Hospitals() {
  const [hospitalSize, setHospitalSize] = useState(500); // Daily patients
  const [doctorCount, setDoctorCount] = useState(50);

  // ROI Calculations
  const savedHoursPerDay = useMemo(() => {
    return Math.round(hospitalSize * 0.5); // 30 mins saved per patient triage
  }, [hospitalSize]);

  const productivityBoost = useMemo(() => {
    return Math.min(60, Math.round((savedHoursPerDay / (doctorCount * 8)) * 100));
  }, [savedHoursPerDay, doctorCount]);

  // Animation variants
  const cinematicIn = {
    initial: { opacity: 0, filter: 'blur(10px)', y: 40 },
    whileInView: { opacity: 1, filter: 'blur(0px)', y: 0 },
    viewport: { once: true },
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
  };

  return (
    <ThemeProvider theme={theme}>
      <Box className="bg-[#f0fdf4] min-h-screen selection:bg-primary-100 selection:text-primary-900 overflow-x-hidden">

        {/* Cinematic Hero 2.0 */}
        <section className="relative min-h-screen flex items-center overflow-hidden" style={{ paddingTop: 'clamp(96px, 10vw, 160px)' }}>
          <Box
            component={motion.div}
            className="absolute inset-0 z-0"
            style={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          >
            <img
              src="/images/solutions/hospitals/hero.png"
              alt="Minh họa CareTriage trong bệnh viện"
              className="w-full h-full object-cover opacity-40 blur-[2px]"
            />
            <Box className="absolute inset-0 bg-gradient-to-b from-[#f0fdf4] via-[#f0fdf4]/40 to-white"></Box>
          </Box>

          <Container maxWidth="lg" className="relative z-10">
            <Grid container spacing={8} alignItems="center">
              <Grid item xs={12} lg={7}>
                <motion.div
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                >
                  <Box className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 text-primary-600 font-bold text-sm mb-8 border border-primary-500/20">
                    <Zap className="w-4 h-4 fill-current" /> GIẢI PHÁP SỐ HÓA BỆNH VIỆN
                  </Box>
                  <Typography variant="h1" className="text-6xl md:text-8xl leading-tight mb-8 text-slate-900 tracking-tight">
                    Vận hành bệnh viện<br />
                    <span className="text-primary-500">nhanh hơn, rõ hơn.</span>
                  </Typography>
                  <Typography variant="h5" className="text-slate-600 mb-12 max-w-xl leading-relaxed">
                    CareTriage giúp bệnh viện tiếp nhận, phân luồng và khai thác dữ liệu lâm sàng nhanh hơn, để đội ngũ y bác sĩ dành nhiều thời gian hơn cho bệnh nhân.
                  </Typography>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
                    <Button variant="contained" size="large" endIcon={<ChevronRight />} className="text-lg py-5 px-10">
                      Đặt lịch demo
                    </Button>
                    <Button variant="outlined" size="large" className="text-lg py-5 px-10 border-2">
                      Xem cách tích hợp
                    </Button>
                  </Stack>
                </motion.div>
              </Grid>

              <Grid item xs={12} lg={5} className="hidden lg:block">
                <Box
                  component={motion.div}
                  initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  transition={{ duration: 1.2, delay: 0.3 }}
                  className="relative"
                >
                  {/* Floating Mockup with Overdrive Depth */}
                  <Card className="p-2 rounded-[2rem] bg-white/30 backdrop-blur-3xl border-white/40 shadow-2xl overflow-hidden relative group">
                    <Box className="absolute inset-0 bg-primary-500/5 group-hover:opacity-0 transition-opacity" />
                    <img src="/images/solutions/hospitals/tech-precision.png" className="rounded-[1.5rem] w-full" alt="Minh họa giao diện CareTriage trong bệnh viện" />

                    <Box className="absolute top-8 right-8 flex flex-col gap-3">
                      <Box className="p-3 rounded-xl bg-white/80 backdrop-blur-md shadow-lg border border-white flex items-center gap-3">
                        <Box className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
                        <Typography variant="caption" className="font-bold text-slate-800">HỆ THỐNG ĐANG HOẠT ĐỘNG</Typography>
                      </Box>
                    </Box>
                  </Card>
                </Box>
              </Grid>
            </Grid>
          </Container>
        </section>

        {/* Live Command Center Section */}
        <section className="relative" style={{ padding: 'clamp(80px, 10vw, 128px) 0', backgroundColor: '#fff' }}>
          <Container maxWidth="lg">
            <Box className="mb-24 max-w-3xl" component={motion.div} {...cinematicIn}>
              <Typography variant="h2" className="text-4xl md:text-6xl mb-6 text-slate-900">Trung tâm điều phối thời gian thực</Typography>
              <Typography variant="h6" className="text-slate-500 max-w-2xl leading-relaxed font-normal">
                Mô phỏng cách CareTriage hỗ trợ điều phối bệnh nhân, nhân sự và dữ liệu trong bệnh viện quy mô lớn.
              </Typography>
            </Box>

            <Grid container spacing={6} alignItems="stretch">
              <Grid item xs={12} lg={8}>
                <Card className="h-full p-8 rounded-3xl bg-slate-50 border-none relative overflow-hidden">
                  <Box className="flex justify-between items-center mb-10">
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Box className="w-10 h-10 rounded-xl bg-primary-500 text-white flex items-center justify-center">
                        <Activity className="w-6 h-6" />
                      </Box>
                      <Typography variant="h5" className="font-bold">Phân luồng thời gian thực</Typography>
                    </Stack>
                    <IconButton size="small" aria-label="Phóng to bảng điều phối"><Maximize2 className="w-5 h-5 text-slate-400" /></IconButton>
                  </Box>

                  {/* Mock Triage Stream with tighter density */}
                  <Stack spacing={2}>
                    {[
                      { id: '#TR-8291', status: 'Khẩn cấp', time: '2 phút trước', color: '#ef4444' },
                      { id: '#TR-8292', status: 'Ưu tiên cao', time: '5 phút trước', color: '#f59e0b' },
                      { id: '#TR-8293', status: 'Thông thường', time: '8 phút trước', color: '#10b981' },
                    ].map((item, idx) => (
                      <Box key={idx} component={motion.div} initial={{ x: -20, opacity: 0 }} whileInView={{ x: 0, opacity: 1 }} transition={{ delay: idx * 0.1 }} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 hover:shadow-md transition-shadow">
                        <Stack direction="row" spacing={3} alignItems="center">
                          <Typography className="font-mono text-slate-400 text-sm">{item.id}</Typography>
                          <Box sx={{px: 2, py: 0.5, borderRadius: 10, bgcolor: alpha(item.color, 0.1), color: item.color, fontWeight: 700, fontSize: '0.7rem' }}>
                            {item.status.toUpperCase()}
                          </Box>
                        </Stack>
                        <Typography variant="caption" className="text-slate-400 italic">AI tự phân luồng • {item.time}</Typography>
                      </Box>
                    ))}
                    <Box className="p-4 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center">
                      <Typography variant="caption" className="text-slate-400 font-bold uppercase tracking-widest">Đang chờ lượt phân luồng tiếp theo...</Typography>
                    </Box>
                  </Stack>
                </Card>
              </Grid>

              <Grid item xs={12} lg={4}>
                <Stack spacing={4} className="h-full">
                  <Card className="p-8 rounded-3xl bg-primary-600 text-white border-none relative overflow-hidden flex-1 group">
                    <Box className="absolute -top-6 -right-6 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <TrendingUp className="w-32 h-32" />
                    </Box>
                    <Typography variant="h6" className="font-bold mb-6 uppercase tracking-widest opacity-80 text-sm">Độ chính xác AI</Typography>
                    <Typography variant="h2" className="font-black mb-2 tracking-tighter">98.4%</Typography>
                    <Typography variant="body2" className="opacity-80 leading-relaxed">Độ chính xác trung bình khi phân loại ca khẩn cấp.</Typography>
                    <Box className="mt-8">
                      <LinearProgress variant="determinate" value={98.4} color="inherit" className="h-2 rounded-full bg-white/20" />
                    </Box>
                  </Card>

                  <Card className="p-8 rounded-3xl border-slate-200 bg-white flex-1 relative overflow-hidden group border">
                    <Box className="absolute top-0 right-0 w-24 h-24 bg-primary-500/5 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform" />
                    <Typography variant="h6" className="font-bold mb-6 text-slate-400 uppercase tracking-widest text-sm">Giảm tải nhân sự</Typography>
                    <Typography variant="h2" className="font-black text-slate-900 mb-2 tracking-tighter">-42%</Typography>
                    <Typography variant="body2" className="text-slate-500 leading-relaxed font-medium">Tự động hóa các bước sàng lọc ban đầu.</Typography>
                  </Card>
                </Stack>
              </Grid>
            </Grid>
          </Container>
        </section>

        {/* Interactive ROI Assistant Section */}
        <section className="relative overflow-hidden" style={{ padding: 'clamp(80px, 10vw, 128px) 0', backgroundColor: '#f8fafc' }}>
          <Box className="absolute inset-0 z-0 opacity-30 pointer-events-none">
            <Box className="absolute top-0 right-0 w-1/2 h-full bg-primary-500/5 blur-[120px] rounded-full" />
          </Box>

          <Container maxWidth="lg" className="relative z-10">
            <Grid container spacing={8} alignItems="flex-start">
              <Grid item xs={12} lg={5}>
                <Box component={motion.div} {...cinematicIn}>
                  <Typography variant="h2" className="text-4xl md:text-6xl mb-8 leading-tight">Ước tính hiệu quả đầu tư (ROI)</Typography>
                  <Typography className="text-xl text-slate-500 mb-12">CareTriage giúp bạn xem thời gian tiết kiệm, năng suất và chi phí thay đổi như thế nào khi quy mô bệnh viện tăng lên.</Typography>

                  <Box className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-xl relative">
                    <Stack spacing={10}>
                      <Box>
                        <Typography variant="h6" className="font-bold text-slate-900 mb-8 flex justify-between items-center">
                          Bệnh nhân trung bình mỗi ngày
                          <span className="text-primary-500 bg-primary-50 px-4 py-1 rounded-full text-sm">{hospitalSize} bệnh nhân</span>
                        </Typography>
                        <Slider
                          value={hospitalSize}
                          onChange={(e, v) => setHospitalSize(v)}
                          min={100}
                          max={2000}
                          step={50}
                          sx={{
                            color: '#08bba3',
                            height: 6,
                            '& .MuiSlider-track': { border: 'none' },
                            '& .MuiSlider-thumb': {
                              width: 20,
                              height: 20,
                              backgroundColor: '#fff',
                              border: '2px solid currentColor',
                              '&:hover, &.Mui-focusVisible': {
                                boxShadow: '0 0 0 8px rgba(8, 187, 163, 0.16)',
                              },
                            },
                            '& .MuiSlider-rail': {
                              opacity: 0.2,
                              backgroundColor: '#bfdbfe',
                            }
                          }}
                        />
                      </Box>

                      <Box>
                        <Typography variant="h6" className="font-bold text-slate-900 mb-8 flex justify-between items-center">
                          Số bác sĩ
                          <span className="text-primary-500 bg-primary-50 px-4 py-1 rounded-full text-sm">{doctorCount} bác sĩ</span>
                        </Typography>
                        <Slider
                          value={doctorCount}
                          onChange={(e, v) => setDoctorCount(v)}
                          min={10}
                          max={200}
                          step={10}
                          sx={{
                            color: '#08bba3',
                            height: 6,
                            '& .MuiSlider-thumb': {
                              width: 20,
                              height: 20,
                              backgroundColor: '#fff',
                              border: '2px solid currentColor',
                            },
                            '& .MuiSlider-rail': {
                              opacity: 0.2,
                              backgroundColor: '#bfdbfe',
                            }
                          }}
                        />
                      </Box>
                    </Stack>
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={12} lg={7}>
                <Grid container spacing={3}>
                  {[
                    { label: 'Giờ tiết kiệm mỗi ngày', value: `${savedHoursPerDay} giờ`, sub: 'trên toàn hệ thống', icon: Clock, featured: true },
                    { label: 'Năng suất đội ngũ', value: `+${productivityBoost}%`, sub: 'so với quy trình hiện tại', icon: TrendingUp },
                    { label: 'Giảm chi phí vận hành', value: '30%', sub: 'ước tính theo quy mô này', icon: Zap },
                    { label: 'Hài lòng bệnh nhân', value: '4,9/5', sub: 'theo phản hồi khảo sát', icon: Stethoscope },
                  ].map((card, i) => (
                    <Grid item xs={12} md={card.featured ? 12 : 4} key={i}>
                      <motion.div
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                      >
                        <Card className={card.featured ? "p-8 md:p-10 h-full bg-white border-none shadow-xl hover:shadow-2xl transition-all overflow-hidden" : "p-8 h-full bg-white border-none shadow-xl hover:shadow-2xl transition-all border-b-4 border-b-primary-500"}>
                          {card.featured ? (
                            <Box className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                              <Box>
                                <card.icon className="w-8 h-8 text-primary-500 mb-6" />
                                <Typography variant="h2" className="font-black text-slate-900 mb-1 leading-none">{card.value}</Typography>
                                <Typography variant="body2" className="text-slate-400 font-bold uppercase tracking-wider mb-2">{card.label}</Typography>
                              </Box>
                              <Typography variant="body1" className="text-slate-500 max-w-md">{card.sub}</Typography>
                            </Box>
                          ) : (
                            <>
                              <card.icon className="w-8 h-8 text-primary-500 mb-6" />
                              <Typography variant="h3" className="font-black text-slate-900 mb-1">{card.value}</Typography>
                              <Typography variant="body2" className="text-slate-400 font-bold uppercase tracking-wider mb-2">{card.label}</Typography>
                              <Typography variant="caption" className="text-slate-400 italic">{card.sub}</Typography>
                            </>
                          )}
                        </Card>
                      </motion.div>
                    </Grid>
                  ))}
                </Grid>
              </Grid>
            </Grid>
          </Container>
        </section>

        {/* Dynamic Transition Gradient */}
        <Box className="h-64 bg-gradient-to-b from-slate-50 to-slate-900 pointer-events-none" />

        {/* Technical Precision Showcase 2.0 */}
        <section className="relative overflow-hidden" style={{ padding: 'clamp(80px, 10vw, 128px) 0', backgroundColor: '#0f172a', color: '#fff' }}>
          <Box className="absolute inset-0 z-0">
            <Box className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,#08bba344_0%,transparent_50%)]" />
          </Box>

          <Container maxWidth="lg" className="relative z-10">
            <Box className="mb-20 max-w-2xl" component={motion.div} {...cinematicIn}>
              <Typography variant="h2" className="text-4xl md:text-6xl mb-6 text-white">Kiến trúc dữ liệu an toàn, chuẩn y tế</Typography>
              <Typography variant="h6" className="text-slate-400 max-w-2xl leading-relaxed font-normal">
                Dữ liệu được bảo vệ qua nhiều lớp bảo mật và kết nối theo các chuẩn y tế phổ biến.
              </Typography>
            </Box>

            <Grid container spacing={4}>
              {[
                { title: 'Tuân thủ HIPAA và HL7', desc: 'Bảo vệ dữ liệu bệnh nhân và kết nối với hệ thống y tế theo chuẩn phổ biến.', icon: ShieldCheck },
                { title: 'Trích xuất EHR linh hoạt', desc: 'Xử lý và chuẩn hóa hồ sơ y tế ở quy mô lớn mà vẫn giữ tốc độ ổn định.', icon: Database },
                { title: 'Dự báo nhu cầu nhân lực', desc: 'Ước tính lưu lượng bệnh nhân trong 24 giờ tới để sắp xếp nhân sự chủ động.', icon: BarChart3 },
              ].map((item, i) => (
                <Grid item xs={12} md={i === 0 ? 6 : 3} key={i}>
                  <Box
                    component={motion.div}
                    {...cinematicIn}
                    transition={{ delay: i * 0.15 }}
                    className={i === 0 ? "p-10 rounded-[2.5rem] bg-white/5 backdrop-blur-xl border border-white/10 hover:border-primary-500/50 transition-all min-h-[360px] group flex flex-col items-start text-left" : "p-10 rounded-[2.5rem] bg-white/5 backdrop-blur-xl border border-white/10 hover:border-primary-500/50 transition-all min-h-[320px] group flex flex-col items-center text-center"}
                  >
                    <item.icon className="w-14 h-14 text-primary-500 mb-8 group-hover:scale-110 transition-transform stroke-[1.5]" />
                    <Typography variant="h5" className="font-bold mb-6 text-white">{item.title}</Typography>
                    <Typography className="text-slate-400 leading-relaxed font-normal">{item.desc}</Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Container>
        </section>

        {/* Final Overdrive CTA */}
        <section className="relative overflow-hidden" style={{ padding: 'clamp(96px, 12vw, 160px) 0', backgroundColor: '#0f172a' }}>
          <Container maxWidth="md">
            <Card className="p-16 md:p-24 rounded-[4rem] bg-gradient-to-br from-primary-500 to-emerald-700 text-white relative overflow-hidden shadow-[0_50px_100px_-20px_rgba(8,187,163,0.6)] border-none">
              <Box className="absolute top-0 right-0 w-1/2 h-full bg-white/10 blur-[100px] rounded-full translate-x-1/2" />

              <Box className="relative z-10 text-center">
                <Typography variant="h2" className="text-5xl md:text-7xl mb-10">Sẵn sàng xem CareTriage phù hợp với bệnh viện của bạn?</Typography>
                <Typography variant="h5" className="opacity-80 mb-16 leading-relaxed font-medium">Nhận buổi đánh giá mức độ sẵn sàng số hóa miễn phí cho bệnh viện của bạn.</Typography>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={4} justifyContent="center">
                  <Button variant="contained" className="bg-white text-primary-600 px-12 py-6 text-xl shadow-2xl hover:bg-slate-50">Đặt lịch tư vấn</Button>
                  <Button variant="outlined" className="border-white/50 text-white px-12 py-6 text-xl hover:border-white">Xem cách triển khai</Button>
                </Stack>

                <Box className="mt-20 flex justify-center gap-12 opacity-60">
                  <Tooltip title="Bảo mật đã xác minh"><ShieldCheck className="stroke-[1.5]" /></Tooltip>
                  <Tooltip title="Hỗ trợ toàn cầu"><Users className="stroke-[1.5]" /></Tooltip>
                  <Tooltip title="Triển khai nhanh"><Zap className="stroke-[1.5]" /></Tooltip>
                </Box>
              </Box>
            </Card>
          </Container>
        </section>

        <footer className="py-12 bg-slate-900 border-t border-white/10 text-center text-slate-400 text-sm">
          <Typography variant="caption">© 2026 CareTriage Global Solution • Hạ tầng bệnh viện thông minh</Typography>
        </footer>
      </Box>
    </ThemeProvider>
  );
}
