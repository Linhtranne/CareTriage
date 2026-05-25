import { Box, Typography, Button, Fade, Grid, Card, CardContent, Paper } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import {
  MedicalServices, Chat, ArrowForward, Description, Biotech, Storage, Security, VerifiedUser,
} from '@mui/icons-material'
import { keyframes } from '@emotion/react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

// Interactive Particle Visualizer (Canvas API)
function InteractiveParticles({ mode = 'neural', color = '16, 185, 129' }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let animationFrameId
    let isVisible = true

    const parent = canvas.parentElement

    let width = (canvas.width = parent.clientWidth)
    let height = (canvas.height = parent.clientHeight)

    const handleResize = () => {
      width = (canvas.width = parent.clientWidth)
      height = (canvas.height = parent.clientHeight)
    }
    window.addEventListener('resize', handleResize)

    const mouse = { x: null, y: null }
    const handleMouseMove = (e) => {
      const rect = parent.getBoundingClientRect()
      mouse.x = e.clientX - rect.left
      mouse.y = e.clientY - rect.top
    }
    const handleMouseLeave = () => {
      mouse.x = null
      mouse.y = null
    }
    parent.addEventListener('mousemove', handleMouseMove)
    parent.addEventListener('mouseleave', handleMouseLeave)

    const observer = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting
    }, { threshold: 0.01 })
    if (canvas) observer.observe(canvas)

    const particles = []
    const particleCount = 50
    const connectionDistance = 100

    class Particle {
      constructor() {
        this.x = Math.random() * width
        this.y = Math.random() * height
        this.vx = (Math.random() - 0.5) * 0.4
        this.vy = (Math.random() - 0.5) * 0.4
        this.radius = Math.random() * 1.5 + 1
      }

      update() {
        if (mouse.x !== null && mouse.y !== null) {
          const dx = mouse.x - this.x
          const dy = mouse.y - this.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 120) {
            if (mode === 'repel') {
              this.x -= (dx / dist) * 2
              this.y -= (dy / dist) * 2
            } else if (mode === 'attract') {
              this.x += (dx / dist) * 2
              this.y += (dy / dist) * 2
            } else if (mode === 'neural') {
              // Faintly drift towards mouse
              this.x += (dx / dist) * 0.3
              this.y += (dy / dist) * 0.3
            }
          }
        }

        this.x += this.vx
        this.y += this.vy

        if (this.x < 0 || this.x > width) this.vx *= -1
        if (this.y < 0 || this.y > height) this.vy *= -1
      }

      draw() {
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${color}, 0.4)`
        ctx.fill()
      }
    }

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle())
    }

    const animate = () => {
      if (isVisible) {
        ctx.clearRect(0, 0, width, height)
        for (let i = 0; i < particles.length; i++) {
          const p1 = particles[i]
          p1.update()
          p1.draw()

          if (mode === 'neural') {
            for (let j = i + 1; j < particles.length; j++) {
              const p2 = particles[j]
              const dx = p1.x - p2.x
              const dy = p1.y - p2.y
              const dist = Math.sqrt(dx * dx + dy * dy)
              if (dist < connectionDistance) {
                ctx.beginPath()
                ctx.moveTo(p1.x, p1.y)
                ctx.lineTo(p2.x, p2.y)
                ctx.strokeStyle = `rgba(${color}, ${0.15 * (1 - dist / connectionDistance)})`
                ctx.lineWidth = 0.8
                ctx.stroke()
              }
            }
          }
        }
      }
      animationFrameId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', handleResize)
      parent.removeEventListener('mousemove', handleMouseMove)
      parent.removeEventListener('mouseleave', handleMouseLeave)
      cancelAnimationFrame(animationFrameId)
      if (canvas) observer.unobserve(canvas)
    }
  }, [mode, color])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
        zIndex: 0, pointerEvents: 'none', willChange: 'transform',
      }}
    />
  )
}

// Morphing Matrix Particle System ( Snaps to medical symbols on Hover )
function MorphingParticles({ color = '16, 185, 129', shape = 'cross' }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let animationFrameId
    let isVisible = true

    const parent = canvas.parentElement
    let width = (canvas.width = parent.clientWidth)
    let height = (canvas.height = parent.clientHeight)

    const handleResize = () => {
      width = (canvas.width = parent.clientWidth)
      height = (canvas.height = parent.clientHeight)
    }
    window.addEventListener('resize', handleResize)

    let isHovered = false
    const handleMouseEnter = () => { isHovered = true }
    const handleMouseLeave = () => { isHovered = false }
    parent.addEventListener('mouseenter', handleMouseEnter)
    parent.addEventListener('mouseleave', handleMouseLeave)

    const observer = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting
    }, { threshold: 0.01 })
    if (canvas) observer.observe(canvas)

    const particleCount = 700 // Heavy count for immersive background
    const particles = []

    class Particle {
      constructor() {
        this.x = Math.random() * width
        this.y = Math.random() * height
        this.vx = (Math.random() - 0.5) * 0.6
        this.vy = (Math.random() - 0.5) * 0.6
        this.radius = Math.random() * 1.5 + 1
        this.isMorpher = Math.random() > 0.4 // 60% form shapes, 40% stay cosmic

        // Generate shape offsets relative to center
        if (shape === 'cross') {
          const inVertical = Math.random() > 0.5
          if (inVertical) {
            this.offsetX = (Math.random() - 0.5) * 100
            this.offsetY = (Math.random() - 0.5) * 320
          } else {
            this.offsetX = (Math.random() - 0.5) * 320
            this.offsetY = (Math.random() - 0.5) * 100
          }
        } else {
          // Heart parametric formulas
          const t = Math.random() * Math.PI * 2
          const scale = 14 + Math.random() * 5
          this.offsetX = 16 * Math.pow(Math.sin(t), 3) * scale
          this.offsetY = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * scale
        }
      }

      update(cx, cy) {
        if (this.isMorpher && isHovered) {
          const targetX = cx + this.offsetX
          const targetY = cy + this.offsetY

          this.x += (targetX - this.x) * 0.06
          this.y += (targetY - this.y) * 0.06
        } else {
          this.x += this.vx
          this.y += this.vy

          if (this.x < 0 || this.x > width) this.vx *= -1
          if (this.y < 0 || this.y > height) this.vy *= -1
        }
      }

      draw() {
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${color}, 0.35)`
        ctx.fill()
      }
    }

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle())
    }

    const animate = () => {
      if (isVisible) {
        ctx.clearRect(0, 0, width, height)
        const cx = width / 2
        const cy = height / 2
        for (let i = 0; i < particles.length; i++) {
          particles[i].update(cx, cy)
          particles[i].draw()
        }
      }
      animationFrameId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', handleResize)
      parent.removeEventListener('mouseenter', handleMouseEnter)
      parent.removeEventListener('mouseleave', handleMouseLeave)
      cancelAnimationFrame(animationFrameId)
      if (canvas) observer.unobserve(canvas)
    }
  }, [color, shape])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
        zIndex: 0, pointerEvents: 'none', willChange: 'transform',
      }}
    />
  )
}

// Scroll Reveal Component
function Reveal({ children, delay = 0 }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true)
        observer.unobserve(ref.current)
      }
    }, { threshold: 0.1 })

    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(40px)',
        transition: `opacity 1.5s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s, transform 1.5s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s`,
      }}
    >
      {children}
    </div>
  )
}

// Animations
const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-12px); }
`

const slideTrack = keyframes`
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
`

const slideInLeft = keyframes`
  0% { opacity: 0; transform: translateX(-50px); }
  100% { opacity: 1; transform: translateX(0); }
`

export default function Landing() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [chatStep, setChatStep] = useState(0)

  const explorerItems = [
    {
      title: t('problems.wait'),
      description: t('problems.wait_desc'),
      bgVideo: '/assets/bg_video_1.mp4',
      media: (
        <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
          <video src="/assets/waiting_overload.mp4" autoPlay loop muted playsInline
            style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0, zIndex: 1 }}
            onError={(e) => e.target.style.opacity = 0}
          />
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%' }}>
            <Typography variant="h1" sx={{ color: 'rgba(239, 68, 68, 0.15)', fontWeight: 900, fontSize: '12rem' }}>⏰</Typography>
          </Box>
        </Box>
      )
    },
    {
      title: t('problems.specialty'),
      description: t('problems.specialty_desc'),
      bgVideo: '/assets/bg_video_2.mp4',
      media: (
        <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
          <video src="/assets/specialty_error.mp4" autoPlay loop muted playsInline
            style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0, zIndex: 1 }}
            onError={(e) => e.target.style.opacity = 0}
          />
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%' }}>
            <Typography variant="h1" sx={{ color: 'rgba(239, 68, 68, 0.15)', fontWeight: 900, fontSize: '12rem' }}>⚠️</Typography>
          </Box>
        </Box>
      )
    },
    {
      title: t('problems.triage247'),
      description: t('problems.triage247_desc'),
      media: (
        <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
          <video src="/assets/ai_triage.mp4" autoPlay loop muted playsInline
            style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0, zIndex: 1 }}
            onError={(e) => e.target.style.opacity = 0}
          />
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%' }}>
            <Typography variant="h1" sx={{ color: 'rgba(16, 185, 129, 0.15)', fontWeight: 900, fontSize: '12rem' }}>🤖</Typography>
          </Box>
        </Box>
      )
    },
    {
      title: t('problems.ehr_sync'),
      description: t('problems.ehr_sync_desc'),
      media: (
        <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
          <video src="/assets/ehr_sync.mp4" autoPlay loop muted playsInline
            style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0, zIndex: 1 }}
            onError={(e) => e.target.style.opacity = 0}
          />
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%' }}>
            <Typography variant="h1" sx={{ color: 'rgba(16, 185, 129, 0.15)', fontWeight: 900, fontSize: '12rem' }}>⚡</Typography>
          </Box>
        </Box>
      )
    }
  ];

  const ehrFeatures = [
    { icon: <Biotech />, title: t('ehr.ner'), desc: t('ehr.ner_desc') },
    { icon: <Description />, title: t('ehr.format'), desc: t('ehr.format_desc') },
    { icon: <Storage />, title: t('ehr.struct'), desc: t('ehr.struct_desc') },
    { icon: <Security />, title: t('ehr.security'), desc: t('ehr.security_desc') },
    { icon: <VerifiedUser />, title: t('ehr.nlp'), desc: t('ehr.nlp_desc') }
  ]



  // Simulated Chat Interval
  useEffect(() => {
    const interval = setInterval(() => {
      setChatStep((prev) => (prev < 3 ? prev + 1 : 0))
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  return (
    <Box
      sx={{
        minHeight: '100vh',
        maxWidth: '100vw',
        background: 'linear-gradient(135deg, #f0fdf4 0%, #effefa 50%, #f8fafc 100%)',
        color: '#1e293b',
        pb: 8, position: 'relative', overflowX: 'hidden',
      }}
    >
      <InteractiveParticles mode="neural" />

      {/* Floating Soft Shapes (Background) */}
      <Box
        sx={{
          position: 'absolute', top: '-10%', right: '-10%',
          width: 500, height: 500, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, rgba(255,255,255,0) 70%)',
          filter: 'blur(50px)', pointerEvents: 'none',
        }}
      />

      {/* Hero Section */}
      <Fade in timeout={800}>
        <Box
          sx={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', textAlign: 'center',
            minHeight: 'calc(100vh - 75px)', px: 4, position: 'relative', zIndex: 1,
            borderRadius: 0,
            overflow: 'hidden',
            background: 'rgba(255, 255, 255, 0.12)',
            backdropFilter: 'blur(10px)',
            border: 'none',
            width: '100%',
            py: 10
          }}
        >
          <Box
            component="video"
            src="/assets/bg_video_1.mp4"
            autoPlay loop muted playsInline
            sx={{
              position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
              objectFit: 'cover', zIndex: 0, opacity: 0.12, pointerEvents: 'none'
            }}
          />
          {/* Floating Icon */}
          <Box sx={{ animation: `${float} 4s ease-in-out infinite`, mb: 3, position: 'relative', zIndex: 1 }}>
            <svg width="90" height="90" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="3" width="18" height="18" rx="6" fill="#10B981" fillOpacity="0.15" />
              <path d="M12 7V17M7 12H17" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Box>

          <Typography
            variant="h2"
            sx={{
              fontWeight: 900, mb: 3, maxWidth: 950, lineHeight: 1.15,
              color: '#064e3b', letterSpacing: '-1px',
              fontSize: { xs: '2.8rem', md: '4rem' },
              animation: `${slideInLeft} 1s cubic-bezier(0.16, 1, 0.3, 1)`,
            }}
          >
            {t('hero.title')} <br />
            <Box component="span" sx={{ color: '#059669', textShadow: '0 4px 20px rgba(16, 185, 129, 0.15)' }}>
              {t('hero.subtitle')}
            </Box>
          </Typography>

          <Typography
            variant="h6"
            sx={{ color: '#4b5563', mb: 5, maxWidth: 750, fontWeight: 500, fontSize: '1.2rem' }}
          >
            {t('hero.description')}
          </Typography>

          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Button
              variant="contained" size="large"
              startIcon={<Chat />} endIcon={<ArrowForward />}
              onClick={() => navigate('/register')}
              aria-label={t('hero.action')}
              sx={{
                px: 6, py: 2, fontSize: '1.1rem', borderRadius: 4,
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                boxShadow: '0 10px 25px rgba(16, 185, 129, 0.3)',
                '&:hover': {
                  transform: 'translateY(-3px) scale(1.02)',
                  boxShadow: '0 15px 30px rgba(16, 185, 129, 0.4)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              {t('hero.action')}
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate('/about')}
              aria-label={t('about_page.hero_title')}
              sx={{
                px: 5,
                py: 2,
                fontSize: '1.05rem',
                borderRadius: 4,
                borderColor: 'rgba(5, 150, 105, 0.6)',
                color: '#065f46',
                background: 'rgba(255, 255, 255, 0.45)',
                backdropFilter: 'blur(8px)',
                '&:hover': {
                  borderColor: '#047857',
                  background: 'rgba(16, 185, 129, 0.1)',
                  transform: 'translateY(-2px)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              {t('about_page.hero_title')}
            </Button>
          </Box>
        </Box>
      </Fade>

      {/* AI Triage Section (Full Width Background) */}
      <Reveal>
        <Box id="ai-tech" sx={{
          mb: 16,
          position: 'relative',
          borderRadius: 0,
          overflow: 'hidden',
          background: 'rgba(255, 255, 255, 0.12)',
          backdropFilter: 'blur(10px)',
          border: 'none',
          py: 12, px: { xs: 2, md: 4 },
          width: '100%',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
          <Box
            component="video"
            src="/assets/bg_video_2.mp4"
            autoPlay loop muted playsInline
            sx={{
              position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
              objectFit: 'cover', zIndex: 0, opacity: 0.1, pointerEvents: 'none'
            }}
          />

          <Box sx={{ maxWidth: 1200, mx: 'auto', position: 'relative', zIndex: 1 }}>
            <InteractiveParticles mode="repel" />
            <Typography variant="h3" sx={{ fontWeight: 900, color: '#064e3b', mb: 3, textAlign: 'center' }}>
              {t('triage.title')}
            </Typography>
            <Typography variant="body1" sx={{ color: '#4b5563', mb: 6, textAlign: 'center', maxWidth: 800, mx: 'auto', fontSize: '1.1rem' }}>
              {t('triage.description')}
            </Typography>

            {/* Feature Grid */}
            <Grid container spacing={3} sx={{ mb: 6 }}>
              {[
                { icon: <Chat />, title: t('triage.step1'), text: t('triage.step1_desc') },
                { icon: <ArrowForward />, title: t('triage.step2'), text: t('triage.step2_desc') },
                { icon: <MedicalServices />, title: t('triage.step3'), text: t('triage.step3_desc') },
              ].map((item, idx) => (
                <Grid size={{ xs: 12, md: 4 }} key={idx}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 3.5, borderRadius: 4, textAlign: 'center',
                      background: 'rgba(255, 255, 255, 0.6)',
                      backdropFilter: 'blur(12px)',
                      border: '1px solid rgba(16, 185, 129, 0.15)',
                      height: '100%',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      '&:hover': { transform: 'translateY(-5px)', transition: 'all 0.3s ease' },
                    }}
                  >
                    <Box sx={{ color: '#059669', display: 'flex', mb: 2 }}>{item.icon}</Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#064e3b', mb: 1 }}>
                      {item.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {item.text}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>

            <Box sx={{ textAlign: 'center', mb: 5 }}>
              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate('/features/ai-triage')}
                aria-label={t('triage.title')}
                sx={{
                  borderColor: '#059669',
                  color: '#047857',
                  px: 4,
                  py: 1.5,
                  borderWidth: '2px',
                  '&:hover': {
                    borderColor: '#047857',
                    background: 'rgba(16, 185, 129, 0.08)',
                    transform: 'translateY(-2px)'
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                {t('triage.title')}
              </Button>
            </Box>

            {/* Live Simulated Dialogue Box Centered Below */}
            <Box sx={{ maxWidth: 600, mx: 'auto' }}>
              <Card
                sx={{
                  background: 'rgba(255, 255, 255, 0.6)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255, 255, 255, 0.4)',
                  borderRadius: 6, p: 1,
                  boxShadow: '0 30px 60px rgba(0,0,0,0.05)',
                }}
              >
                <Box sx={{ display: 'flex', gap: 1, p: 2, borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#ff5f56' }} />
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#ffbd2e' }} />
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#27c93f' }} />
                </Box>

                <CardContent sx={{ minHeight: 360, height: 360, overflowY: 'auto', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', gap: 2.5, p: 3 }}>

                  {chatStep >= 0 && (
                    <Paper elevation={0} sx={{ p: 2, alignSelf: 'flex-end', maxWidth: '80%', background: '#059669', color: '#fff', borderRadius: '16px 16px 4px 16px', boxShadow: '0 4px 10px rgba(5, 150, 105, 0.15)' }}>
                      <Typography variant="body2">{t('triage.chat_patient1')}</Typography>
                    </Paper>
                  )}

                  {chatStep >= 1 && (
                    <Fade in timeout={500}>
                      <Paper elevation={0} sx={{ p: 2, alignSelf: 'flex-start', maxWidth: '85%', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', color: '#064e3b', borderRadius: '16px 16px 16px 4px' }}>
                        <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                          {t('triage.chat_ai1')}
                        </Typography>
                      </Paper>
                    </Fade>
                  )}

                  {chatStep >= 2 && (
                    <Fade in timeout={500}>
                      <Paper elevation={0} sx={{ p: 2, alignSelf: 'flex-end', maxWidth: '80%', background: '#059669', color: '#fff', borderRadius: '16px 16px 4px 16px', boxShadow: '0 4px 10px rgba(5, 150, 105, 0.15)' }}>
                        <Typography variant="body2">{t('triage.chat_patient2')}</Typography>
                      </Paper>
                    </Fade>
                  )}

                  {chatStep >= 3 && (
                    <Fade in timeout={500}>
                      <Paper elevation={0} sx={{ p: 2, alignSelf: 'flex-start', maxWidth: '85%', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', color: '#064e3b', borderRadius: '16px 16px 16px 4px' }}>
                        <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                          {t('triage.chat_ai2')}
                        </Typography>
                      </Paper>
                    </Fade>
                  )}
                </CardContent>
              </Card>
            </Box>
          </Box>
        </Box>
      </Reveal>

      {/* EHR Section (Continuous Slider) */}
      <Reveal>
        <Box id="doctors" sx={{ mt: 8, mb: 4, position: 'relative', width: '100%' }}>
          <Box sx={{ maxWidth: 1200, mx: 'auto', px: 3, position: 'relative', zIndex: 1 }}>
            <InteractiveParticles mode="attract" />
            <Typography variant="h3" sx={{ fontWeight: 900, color: '#064e3b', mb: 3, textAlign: 'center', position: 'relative', zIndex: 1 }}>
              {t('ehr.title')}
            </Typography>
            <Typography variant="body1" sx={{ color: '#4b5563', mb: 6, textAlign: 'center', maxWidth: 800, mx: 'auto', fontSize: '1.1rem' }}>
              {t('ehr.description')}
            </Typography>
          </Box>

          <Box
            sx={{
              width: '100%',
              overflow: 'hidden',
              position: 'relative',
              py: 3,
              '&::before, &::after': {
                content: '""', position: 'absolute', top: 0, width: 100, height: '100%', zIndex: 2,
                pointerEvents: 'none',
              },
              '&::before': { left: 0, background: 'linear-gradient(to right, #f0fdf4 0%, rgba(255,255,255,0) 100%)' },
              '&::after': { right: 0, background: 'linear-gradient(to left, #f0fdf4 0%, rgba(255,255,255,0) 100%)' }
            }}
          >
            <Box
              sx={{
                display: 'flex', width: 'max-content',
                animation: `${slideTrack} 22s linear infinite`,
                '&:hover': { animationPlayState: 'paused' },
              }}
            >
              {[...ehrFeatures, ...ehrFeatures].map((item, idx) => (
                <Paper
                  key={idx}
                  elevation={0}
                  sx={{
                    p: 3.5, width: 300, mx: 2.5, borderRadius: 5,
                    background: 'rgba(255, 255, 255, 0.7)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(16, 185, 129, 0.15)',
                    boxShadow: '0 15px 35px rgba(0,0,0,0.02)',
                    flexShrink: 0,
                    '&:hover': { transform: 'translateY(-10px)', transition: 'all 0.3s ease' },
                  }}
                >
                  <Box sx={{ color: '#059669', display: 'flex', mb: 2 }}>
                    {item.icon}
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#064e3b', mb: 1 }}>
                    {item.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                    {item.desc}
                  </Typography>
                </Paper>
              ))}
            </Box>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6, gap: 2.5, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate('/features/ehr-engine')}
              aria-label={t('ehr.title')}
              sx={{
                borderColor: '#059669', color: '#059669', px: 5, py: 1.5, fontSize: '1.05rem',
                borderWidth: '2px',
                '&:hover': {
                  borderColor: '#047857',
                  color: '#047857',
                  background: 'rgba(16, 185, 129, 0.05)',
                  borderWidth: '2px',
                  transform: 'scale(1.05)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              {t('ehr.title')}
            </Button>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/register')}
              aria-label={t('ehr.action')}
              sx={{
                px: 5,
                py: 1.5,
                fontSize: '1.05rem',
                borderRadius: 3,
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                boxShadow: '0 10px 24px rgba(16, 185, 129, 0.3)',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 14px 28px rgba(16, 185, 129, 0.35)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              {t('ehr.action')}
            </Button>
          </Box>
        </Box>
      </Reveal>

      {/* Alternating Feature Rows Section */}
      <Box id="patients">
        {explorerItems.map((item, idx) => (
          <Reveal key={idx} delay={idx * 0.1}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', md: idx % 2 === 0 ? 'row' : 'row-reverse' },
                gap: { xs: 4, md: 8 },
                maxWidth: 1536,
                width: '95%',
                mx: 'auto',
                py: { xs: 6, md: 10 },
                alignItems: 'center',
                position: 'relative',
                zIndex: 1,
              }}
            >
              {/* Text Content */}
              <Box sx={{ flex: 1, px: { xs: 2, md: 4 } }}>
                <Typography variant="h3" sx={{ fontWeight: 900, color: '#064e3b', mb: 3, fontSize: { xs: '2rem', md: '2.8rem' } }}>
                  {item.title}
                </Typography>
                <Typography variant="body1" sx={{ color: '#4b5563', lineHeight: 1.8, fontSize: '1.15rem' }}>
                  {item.description}
                </Typography>
              </Box>

              {/* Media Container */}
              <Box
                sx={{
                  flex: 1.5,
                  height: { xs: '300px', md: '50vh' },
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 5,
                  overflow: 'hidden',
                  background: 'rgba(255, 255, 255, 0.5)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(16, 185, 129, 0.15)',
                  boxShadow: '0 20px 50px rgba(0,0,0,0.05)',
                }}
              >
                {item.media}
              </Box>
            </Box>
          </Reveal>
        ))}
      </Box>

      {/* Section 1: The Problem (Full Width) */}
      <Reveal>
        <Box
          sx={{
            width: '100%', py: { xs: 8, md: 12 }, px: { xs: 3, md: 6 },
            background: 'linear-gradient(180deg, #f8fafc 0%, #fef2f2 100%)',
            borderTop: '1px solid rgba(239, 68, 68, 0.1)',
            borderBottom: '1px solid rgba(239, 68, 68, 0.1)',
            position: 'relative',
          }}
        >
          <MorphingParticles color="239, 68, 68" shape="cross" />
          <Box sx={{ maxWidth: 1536, mx: 'auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
            <Typography variant="h3" sx={{ fontWeight: 900, color: '#991b1b', mb: 4 }}>
              {t('problems.title')}
            </Typography>
            <Typography variant="h5" sx={{ color: '#7f1d1d', mb: 6, fontWeight: 600, lineHeight: 1.6, maxWidth: 850, mx: 'auto' }}>
              {t('problems.subtitle')}
            </Typography>

            <Grid container spacing={4} sx={{ textAlign: 'left' }}>
              {[
                { title: t('problems.wait'), text: t('problems.wait_desc') },
                { title: t('problems.specialty'), text: t('problems.specialty_desc') },
                { title: t('problems.records'), text: t('problems.records_desc') }
              ].map((item, idx) => (
                <Grid size={{ xs: 12, md: 4 }} key={idx}>
                  <Box sx={{ p: 3, background: '#ffffff', borderRadius: 4, boxShadow: '0 10px 30px rgba(153, 27, 27, 0.03)', border: '1px solid rgba(239, 68, 68, 0.05)' }}>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#b91c1c', mb: 1.5 }}>{item.title}</Typography>
                    <Typography variant="body2" sx={{ color: '#7f1d1d', lineHeight: 1.6 }}>{item.text}</Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Box>
      </Reveal>

      {/* Section 2: The Solution (Full Width) */}
      <Reveal>
        <Box
          sx={{
            width: '100%', py: { xs: 8, md: 12 }, px: { xs: 3, md: 6 },
            background: 'linear-gradient(180deg, #fef2f2 0%, #f0fdf4 100%)',
            borderBottom: '1px solid rgba(16, 185, 129, 0.1)',
            position: 'relative',
          }}
        >
          <MorphingParticles color="16, 185, 129" shape="heart" />
          <Box sx={{ maxWidth: 1536, mx: 'auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
            <Typography variant="h3" sx={{ fontWeight: 900, color: '#047857', mb: 4 }}>
              {t('solutions.title')}
            </Typography>
            <Typography variant="h5" sx={{ color: '#065f46', mb: 6, fontWeight: 600, lineHeight: 1.6, maxWidth: 850, mx: 'auto' }}>
              {t('solutions.subtitle')}
            </Typography>

            <Grid container spacing={4} sx={{ textAlign: 'left' }}>
              {[
                { title: t('solutions.triage'), text: t('solutions.triage_desc') },
                { title: t('solutions.routing'), text: t('solutions.routing_desc') },
                { title: t('solutions.ehr'), text: t('solutions.ehr_desc') }
              ].map((item, idx) => (
                <Grid size={{ xs: 12, md: 4 }} key={idx}>
                  <Box sx={{ p: 3, background: '#ffffff', borderRadius: 4, boxShadow: '0 10px 30px rgba(16, 185, 129, 0.03)', border: '1px solid rgba(16, 185, 129, 0.05)' }}>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#059669', mb: 1.5 }}>{item.title}</Typography>
                    <Typography variant="body2" sx={{ color: '#065f46', lineHeight: 1.6 }}>{item.text}</Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Box>
      </Reveal>

    </Box>
  )
}
