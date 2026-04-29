import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Box, Card, CardContent, TextField, Button, Typography,
  InputAdornment, IconButton, CircularProgress, Fade,
} from '@mui/material'
import { Visibility, VisibilityOff } from '@mui/icons-material'
import { keyframes } from '@emotion/react'
import useAuthStore from '../../store/authStore'

// Interactive Particle Visualizer (Canvas API)
function InteractiveParticles({ color = '16, 185, 129' }) {
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
    const particleCount = 600
    const connectionDistance = 80

    class Particle {
      constructor() {
        this.x = Math.random() * width
        this.y = Math.random() * height
        this.vx = (Math.random() - 0.5) * 0.5
        this.vy = (Math.random() - 0.5) * 0.5
        this.radius = Math.random() * 2 + 1
      }

      update() {
        if (mouse.x !== null && mouse.y !== null) {
          const dx = mouse.x - this.x
          const dy = mouse.y - this.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 150) {
            // Repel logic
            this.x -= (dx / dist) * 3
            this.y -= (dy / dist) * 3
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
        ctx.fillStyle = `rgba(${color}, 0.5)`
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

          // Draw lines
          for (let j = i + 1; j < particles.length; j++) {
            const p2 = particles[j]
            const dx = p1.x - p2.x
            const dy = p1.y - p2.y
            const dist = Math.sqrt(dx * dx + dy * dy)
            if (dist < connectionDistance) {
              ctx.beginPath()
              ctx.moveTo(p1.x, p1.y)
              ctx.lineTo(p2.x, p2.y)
              ctx.strokeStyle = `rgba(${color}, ${0.25 * (1 - dist / connectionDistance)})`
              ctx.lineWidth = 1
              ctx.stroke()
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
  }, [color])

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

const shake = keyframes`
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-6px); }
  20%, 40%, 60%, 80% { transform: translateX(6px); }
`

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isShaking, setIsShaking] = useState(false)
  const { login, isLoading } = useAuthStore()
  const navigate = useNavigate()
  const { i18n } = useTranslation()
  
  const [tTitle, setTTitle] = useState('Đăng nhập')
  const [tSubtitle, setTSubtitle] = useState('Hệ thống điều phối y tế CareTriage')
  const [tPassword, setTPassword] = useState('MẬT KHẨU')
  const [tBtn, setTBtn] = useState('ĐĂNG NHẬP')
  const [tAsk, setTAsk] = useState('Chưa có tài khoản?')
  const [tRegister, setTRegister] = useState('ĐĂNG KÝ NGAY')

  useEffect(() => {
    if (!i18n.language || i18n.language.startsWith('vi')) {
      setTTitle('Đăng nhập')
      setTSubtitle('Hệ thống điều phối y tế CareTriage')
      setTPassword('MẬT KHẨU')
      setTBtn('ĐĂNG NHẬP')
      setTAsk('Chưa có tài khoản?')
      setTRegister('ĐĂNG KÝ NGAY')
      return
    }

    const translateText = async (text) => {
      try {
        const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=vi&tl=en&dt=t&q=${encodeURIComponent(text)}`)
        const data = await res.json()
        return data[0].map(item => item[0]).join('')
      } catch (err) {
        return text
      }
    }

    const performTranslation = async () => {
      setTTitle(await translateText('Đăng nhập'))
      setTSubtitle(await translateText('Hệ thống điều phối y tế CareTriage'))
      setTPassword(await translateText('MẬT KHẨU'))
      setTBtn(await translateText('ĐĂNG NHẬP'))
      setTAsk(await translateText('Chưa có tài khoản?'))
      setTRegister(await translateText('ĐĂNG KÝ NGAY'))
    }

    performTranslation()
  }, [i18n.language])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsShaking(false)

    const result = await login(email, password)
    if (result.success) {
      const role = useAuthStore.getState().user?.role?.toLowerCase()
      navigate(`/${role}/dashboard`)
    } else {
      setError(result.message || 'Thông tin đăng nhập không chính xác')
      setIsShaking(true)
      setTimeout(() => setIsShaking(false), 600)
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        background: 'linear-gradient(135deg, #f0fdf4 0%, #effefa 50%, #f8fafc 100%)',
        position: 'relative',
        overflow: 'hidden',
        pr: { xs: 2, md: 10 },
        pl: { xs: 2, md: 0 },
      }}
    >
      <InteractiveParticles color="16, 185, 129" />

      {/* Massive Typography on the left */}
      <Box
        sx={{
          position: 'absolute',
          left: { xs: '-5%', md: '5%' },
          top: '50%',
          transform: 'translateY(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          zIndex: 1,
          userSelect: 'none',
          pointerEvents: 'none',
        }}
      >
        <Typography
          variant="h1"
          sx={{
            fontWeight: 900,
            fontSize: { xs: '15vw', md: '12vw' },
            lineHeight: 0.8,
            color: '#064e3b',
            fontFamily: 'system-ui, sans-serif',
            letterSpacing: '-0.05em',
            textTransform: 'uppercase',
          }}
        >
          Care
        </Typography>
        <Typography
          variant="h1"
          sx={{
            fontWeight: 900,
            fontSize: { xs: '15vw', md: '12vw' },
            lineHeight: 0.8,
            color: '#059669',
            fontFamily: 'system-ui, sans-serif',
            letterSpacing: '-0.05em',
            textTransform: 'uppercase',
            mt: { xs: 1, md: 2 },
          }}
        >
          Triage
        </Typography>
      </Box>

      <Fade in timeout={800}>
        <Card
          sx={{
            maxWidth: 480,
            width: '100%',
            background: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            borderRadius: 4,
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
            zIndex: 2,
            position: 'relative',
            animation: isShaking ? `${shake} 0.6s ease-in-out` : 'none',
          }}
        >
          <CardContent sx={{ p: { xs: 3, md: 4.5 } }}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h4" sx={{ fontWeight: 900, color: '#064e3b', textTransform: 'uppercase', mb: 0.5, letterSpacing: '-0.02em' }}>
                {tTitle}
              </Typography>
              <Typography variant="body2" sx={{ color: '#4b5563', fontWeight: 500 }}>
                {tSubtitle}
              </Typography>
            </Box>

            {error && (
              <Typography
                variant="body2"
                sx={{
                  color: '#ffffff',
                  fontWeight: 600,
                  mb: 3,
                  textAlign: 'center',
                  backgroundColor: '#dc2626',
                  borderRadius: 1,
                  py: 1,
                  animation: `${shake} 0.6s ease-in-out`,
                }}
              >
                {error}
              </Typography>
            )}

            <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <TextField
                id="login-email"
                label="EMAIL"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required fullWidth
                InputProps={{
                  sx: {
                    borderRadius: 2,
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    fontWeight: 600,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      borderColor: '#059669',
                      transform: 'translateY(-2px)',
                    },
                    '&.Mui-focused': {
                      borderColor: '#059669',
                      boxShadow: '0 0 0 4px rgba(16, 185, 129, 0.1)',
                    }
                  }
                }}
                InputLabelProps={{
                  sx: { fontWeight: 700, color: '#064e3b', '&.Mui-focused': { color: '#064e3b' } }
                }}
              />
              <TextField
                id="login-password"
                label={tPassword}
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required fullWidth
                InputProps={{
                  sx: {
                    borderRadius: 2,
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    fontWeight: 600,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      borderColor: '#059669',
                      transform: 'translateY(-2px)',
                    },
                    '&.Mui-focused': {
                      borderColor: '#059669',
                      boxShadow: '0 0 0 4px rgba(16, 185, 129, 0.1)',
                    }
                  },
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" sx={{ color: '#064e3b' }}>
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                InputLabelProps={{
                  sx: { fontWeight: 700, color: '#064e3b', '&.Mui-focused': { color: '#064e3b' } }
                }}
              />

              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={isLoading}
                sx={{
                  py: 1.5,
                  mt: 1,
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '1rem',
                  letterSpacing: '0.05em',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 20px rgba(16, 185, 129, 0.4)',
                  },
                  '&:active': {
                    transform: 'translateY(0)',
                  }
                }}
              >
                {isLoading ? <CircularProgress size={24} color="inherit" /> : tBtn}
              </Button>
            </Box>

            <Typography sx={{ mt: 3, textAlign: 'center', fontWeight: 600 }} color="text.secondary">
              {tAsk}{' '}
              <Link to="/register" style={{ color: '#059669', fontWeight: 800, textDecoration: 'none' }}>
                {tRegister}
              </Link>
            </Typography>
          </CardContent>
        </Card>
      </Fade>
    </Box>
  )
}
