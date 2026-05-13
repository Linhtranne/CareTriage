import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Box, Card, CardContent, TextField, Button, Typography,
  IconButton, InputAdornment, CircularProgress, Fade
} from '@mui/material'
import { Visibility, VisibilityOff } from '@mui/icons-material'
import { keyframes } from '@emotion/react'
import useAuthStore, { getHighestPriorityLandingPage } from '../../store/authStore'

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
    const particleCount = 400
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

    for (let i = 0; i < particleCount; i++) particles.push(new Particle())

    const animate = () => {
      if (isVisible) {
        ctx.clearRect(0, 0, width, height)
        for (let i = 0; i < particles.length; i++) {
          const p1 = particles[i]
          p1.update()
          p1.draw()
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
  
  const { login, isLoading, isAuthenticated, user } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (isAuthenticated && user) {
      const highestRoles = user.roles || []
      const targetPath = getHighestPriorityLandingPage(highestRoles)
      navigate(targetPath, { replace: true })
    }
  }, [isAuthenticated, user, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsShaking(false)

    if (!email.trim() || !password.trim()) {
      setError('Vui lòng điền đầy đủ thông tin')
      setIsShaking(true)
      setTimeout(() => setIsShaking(false), 600)
      return
    }

    const result = await login(email, password)
    if (result.success) {
      const userObj = useAuthStore.getState().user
      const from = location.state?.from?.pathname || getHighestPriorityLandingPage(userObj)
      navigate(from, { replace: true })
    } else {
      setError(result.message || 'Thông tin đăng nhập không chính xác')
      setIsShaking(true)
      setTimeout(() => setIsShaking(false), 600)
    }
  }

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      background: 'linear-gradient(135deg, #f0fdf4 0%, #effefa 50%, #f8fafc 100%)',
      position: 'relative',
      overflow: 'hidden',
      pr: { xs: 2, md: 10 },
    }}>
      <InteractiveParticles />

      {/* Branding background */}
      <Box sx={{
        position: 'absolute',
        left: { xs: '-5%', md: '5%' },
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 1,
        userSelect: 'none',
        pointerEvents: 'none',
      }}>
        <Typography variant="h1" sx={{ fontWeight: 900, fontSize: { xs: '15vw', md: '10vw' }, lineHeight: 0.8, color: '#064e3b', letterSpacing: '-0.05em', textTransform: 'uppercase' }}>
          Care
        </Typography>
        <Typography variant="h1" sx={{ fontWeight: 900, fontSize: { xs: '15vw', md: '10vw' }, lineHeight: 0.8, color: '#059669', letterSpacing: '-0.05em', textTransform: 'uppercase' }}>
          Triage
        </Typography>
        <Typography variant="h6" sx={{ fontWeight: 800, color: '#059669', mt: 2, letterSpacing: '0.2em' }}>
          ADMIN PORTAL
        </Typography>
      </Box>

      <Fade in timeout={800}>
        <Card sx={{
          maxWidth: 450,
          width: '100%',
          background: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          borderRadius: 4,
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
          zIndex: 2,
          animation: isShaking ? `${shake} 0.6s ease-in-out` : 'none',
        }}>
          <CardContent sx={{ p: { xs: 3, md: 5 } }}>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h4" sx={{ fontWeight: 900, color: '#064e3b', mb: 1 }}>
                ĐĂNG NHẬP
              </Typography>
              <Typography variant="body2" sx={{ color: '#4b5563', fontWeight: 600 }}>
                Hệ thống quản trị CareTriage
              </Typography>
            </Box>

            {error && (
              <Box sx={{ mb: 3, p: 1.5, bgcolor: '#fee2e2', border: '1px solid #fecaca', borderRadius: 2 }}>
                <Typography variant="body2" sx={{ color: '#dc2626', fontWeight: 700, textAlign: 'center' }}>
                  {error}
                </Typography>
              </Box>
            )}

            <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <TextField
                label="EMAIL / USERNAME"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                fullWidth
                slotProps={{
                  input: { sx: { borderRadius: 2, bgcolor: 'rgba(255,255,255,0.9)', fontWeight: 600 } },
                  inputLabel: { sx: { fontWeight: 700, color: '#064e3b' } }
                }}
              />
              <TextField
                label="MẬT KHẨU"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                fullWidth
                slotProps={{
                  input: {
                    sx: { borderRadius: 2, bgcolor: 'rgba(255,255,255,0.9)', fontWeight: 600 },
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPassword(!showPassword)} sx={{ color: '#064e3b' }}>
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    )
                  },
                  inputLabel: { sx: { fontWeight: 700, color: '#064e3b' } }
                }}
              />

              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={isLoading}
                sx={{
                  py: 1.8,
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  fontWeight: 800,
                  fontSize: '1rem',
                  boxShadow: '0 8px 20px rgba(16, 185, 129, 0.3)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 12px 25px rgba(16, 185, 129, 0.4)',
                  }
                }}
              >
                {isLoading ? <CircularProgress size={24} color="inherit" /> : 'ĐĂNG NHẬP HỆ THỐNG'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Fade>
    </Box>
  )
}
