import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Box, Card, CardContent, TextField, Button, Typography,
  InputAdornment, IconButton, CircularProgress, Fade,
} from '@mui/material'
import { Visibility, VisibilityOff } from '@mui/icons-material'
import { keyframes } from '@emotion/react'
import useAuthStore, { getHighestPriorityLandingPage } from '../../store/auth-store'

// Interactive Particle Visualizer (Canvas API)
function InteractiveParticles({ color = 'oklch(68% 0.145 172)' }) {
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
        ctx.fillStyle = `color-mix(in srgb, ${color} 50%, transparent)`
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
              ctx.strokeStyle = `color-mix(in srgb, ${color} ${25 * (1 - dist / connectionDistance)}%, transparent)`
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
  
  // 2FA state
  const [requires2FA, setRequires2FA] = useState(false)
  const [tempToken, setTempToken] = useState('')
  const [otp, setOtp] = useState('')
  
  const { login, verify2FA, isLoading, isAuthenticated, user } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const { t, i18n } = useTranslation()
  
  useEffect(() => {
    if (isAuthenticated && user) {
      const targetPath = getHighestPriorityLandingPage(user)
      if (targetPath.startsWith('http')) {
        window.location.href = targetPath
      } else {
        navigate(targetPath, { replace: true })
      }
    }
  }, [isAuthenticated, user, navigate])

              
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsShaking(false)

    if (!email.trim()) {
      setError(t('auth.email_empty'))
      setIsShaking(true)
      setTimeout(() => setIsShaking(false), 600)
      return
    }

    if (requires2FA) {
      if (!otp.trim()) {
        setError(t('auth.otp_empty'))
        setIsShaking(true)
        setTimeout(() => setIsShaking(false), 600)
        return
      }
      const result = await verify2FA(otp, tempToken)
      if (result.success) {
        const userObj = useAuthStore.getState().user
        const from = location.state?.from?.pathname || getHighestPriorityLandingPage(userObj)
        if (typeof from === 'string' && from.startsWith('http')) {
          window.location.href = from
        } else {
          navigate(from, { replace: true })
        }
      } else {
        setError(result.message || t('auth.otp_invalid'))
        setIsShaking(true)
        setTimeout(() => setIsShaking(false), 600)
      }
      return
    }

    if (!password.trim()) {
      setError(t('auth.password_empty'))
      setIsShaking(true)
      setTimeout(() => setIsShaking(false), 600)
      return
    }

    const result = await login(email, password)
    if (result.success) {
      if (result.requires2FA) {
        setRequires2FA(true)
        setTempToken(result.tempToken)
        return
      }
      
      const userObj = useAuthStore.getState().user
      const from = location.state?.from?.pathname || getHighestPriorityLandingPage(userObj)
      if (typeof from === 'string' && from.startsWith('http')) {
        window.location.href = from
      } else {
        navigate(from, { replace: true })
      }
    } else {
      setError(result.message || t('auth.login_failed'))
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
        background: (theme) => `linear-gradient(135deg, color-mix(in srgb, ${theme.palette.primary.light} 10%, transparent) 0%, color-mix(in srgb, ${theme.palette.primary.light} 5%, transparent) 50%, ${theme.palette.background.default} 100%)`,
        position: 'relative',
        overflow: 'hidden',
        pr: { xs: 2, md: 10 },
        pl: { xs: 2, md: 0 },
      }}
    >
      <InteractiveParticles color="oklch(68% 0.145 172)" />

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
            color: 'primary.900',
            fontFamily: "'Be Vietnam Pro', sans-serif",
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
            color: 'primary.dark',
            fontFamily: "'Be Vietnam Pro', sans-serif",
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
            background: 'color-mix(in srgb, var(--color-surface-50) 80%, transparent)',
            backdropFilter: 'blur(16px)',
            border: '1px solid color-mix(in srgb, var(--color-primary-500) 20%, transparent)',
            borderRadius: 1,
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
            zIndex: 2,
            position: 'relative',
            animation: isShaking ? `${shake} 0.6s ease-in-out` : 'none',
          }}
        >
          <CardContent sx={{ p: { xs: 3, md: 4.5 } }}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h4" sx={{ fontWeight: 900, color: 'primary.900', textTransform: 'uppercase', mb: 0.5, letterSpacing: '-0.02em' }}>
                {requires2FA ? t('auth.two_fa_title') : t('auth.login_title')}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                {requires2FA ? t('auth.two_fa_subtitle') : t('auth.login_subtitle')}
              </Typography>
            </Box>

            {error && (
              <Typography
                variant="body2"
                sx={{
                  color: 'background.paper',
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
              {!requires2FA ? (
                <>
                  <TextField
                    id="login-email"
                    label={t('auth.email_label')}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    fullWidth
                    slotProps={{
                      input: {
                        sx: {
                          borderRadius: 2,
                          border: '1px solid color-mix(in srgb, var(--color-primary-500) 30%, transparent)',
                          backgroundColor: 'color-mix(in srgb, var(--color-surface-50) 90%, transparent)',
                          fontWeight: 600,
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            borderColor: 'primary.dark',
                            transform: 'translateY(-2px)',
                          },
                          '&.Mui-focused': {
                            borderColor: 'primary.dark',
                            boxShadow: '0 0 0 4px color-mix(in srgb, var(--color-primary-500) 10%, transparent)',
                          }
                        }
                      },
                      inputLabel: {
                        sx: { fontWeight: 700, color: 'primary.900', '&.Mui-focused': { color: 'primary.900' } }
                      }
                    }}
                  />
                  <TextField
                    id="login-password"
                    label={t('auth.password')}
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    fullWidth
                    slotProps={{
                      input: {
                        sx: {
                          borderRadius: 2,
                          border: '1px solid color-mix(in srgb, var(--color-primary-500) 30%, transparent)',
                          backgroundColor: 'color-mix(in srgb, var(--color-surface-50) 90%, transparent)',
                          fontWeight: 600,
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            borderColor: 'primary.dark',
                            transform: 'translateY(-2px)',
                          },
                          '&.Mui-focused': {
                            borderColor: 'primary.dark',
                            boxShadow: '0 0 0 4px color-mix(in srgb, var(--color-primary-500) 10%, transparent)',
                          }
                        },
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" sx={{ color: 'primary.900' }}>
                              {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      },
                      inputLabel: {
                        sx: { fontWeight: 700, color: 'primary.900', '&.Mui-focused': { color: 'primary.900' } }
                      }
                    }}
                  />
                </>
              ) : (
                <TextField
                  id="login-otp"
                  label={t('auth.otp_label')}
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  fullWidth
                  autoComplete="one-time-code"
                  slotProps={{
                    input: {
                      sx: {
                        borderRadius: 2,
                        border: '1px solid color-mix(in srgb, var(--color-primary-500) 30%, transparent)',
                        backgroundColor: 'color-mix(in srgb, var(--color-surface-50) 90%, transparent)',
                        fontWeight: 600,
                        letterSpacing: '0.2em',
                        textAlign: 'center',
                        fontSize: '1.2rem',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          borderColor: 'primary.dark',
                          transform: 'translateY(-2px)',
                        },
                        '&.Mui-focused': {
                          borderColor: 'primary.dark',
                          boxShadow: '0 0 0 4px color-mix(in srgb, var(--color-primary-500) 10%, transparent)',
                        }
                      }
                    },
                    inputLabel: {
                      sx: { fontWeight: 700, color: 'primary.900', '&.Mui-focused': { color: 'primary.900' } }
                    }
                  }}
                />
              )}

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
                  background: 'linear-gradient(135deg, var(--color-primary-500) 0%, var(--color-primary-600) 100%)',
                  color: 'background.paper',
                  fontWeight: 800,
                  fontSize: '1rem',
                  letterSpacing: '0.05em',
                  boxShadow: '0 4px 12px color-mix(in srgb, var(--color-primary-500) 25%, transparent)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    background: 'linear-gradient(135deg, var(--color-primary-600) 0%, #047857 100%)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 20px color-mix(in srgb, var(--color-primary-500) 40%, transparent)',
                  },
                  '&:active': {
                    transform: 'translateY(0)',
                  }
                }}
              >
                {isLoading ? <CircularProgress size={24} color="inherit" /> : (requires2FA ? t('auth.verify_btn') : t('auth.login_btn'))}
              </Button>
            </Box>

            {!requires2FA && (
              <Typography sx={{ mt: 3, textAlign: 'center', fontWeight: 600 }} color="text.secondary">
                {t('auth.ask_register')}{' '}
                <Link to="/register" style={{ color: 'primary.dark', fontWeight: 800, textDecoration: 'none' }}>
                  {t('auth.register_now')}
                </Link>
              </Typography>
            )}
          </CardContent>
        </Card>
      </Fade>
    </Box>
  )
}
