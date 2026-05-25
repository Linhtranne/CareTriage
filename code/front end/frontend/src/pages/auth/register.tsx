import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Box, Card, CardContent, TextField, Button, Typography,
  MenuItem, CircularProgress, Fade,
} from '@mui/material'
import { keyframes } from '@emotion/react'
import useAuthStore, { getHighestPriorityLandingPage } from '../../store/auth-store'
import type { RegisterPayload } from '../../types'

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
      x: number
      y: number
      vx: number
      vy: number
      radius: number

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

export default function Register() {
  type RegisterForm = RegisterPayload & { confirmPassword: string }

  const [form, setForm] = useState<RegisterForm>({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'PATIENT'
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isShaking, setIsShaking] = useState(false)
  const { register, isLoading, isAuthenticated, user } = useAuthStore()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()

  useEffect(() => {
    if (isAuthenticated && user) {
      const targetPath = getHighestPriorityLandingPage(user)
      navigate(targetPath, { replace: true })
    }
  }, [isAuthenticated, user, navigate])
  
                    
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setIsShaking(false)

    if (!form.fullName.trim()) {
      setError(t('auth.name_empty'))
      setIsShaking(true)
      setTimeout(() => setIsShaking(false), 600)
      return
    }
    if (!form.email.trim()) {
      setError(t('auth.email_empty'))
      setIsShaking(true)
      setTimeout(() => setIsShaking(false), 600)
      return
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(form.email)) {
      setError(t('auth.email_invalid'))
      setIsShaking(true)
      setTimeout(() => setIsShaking(false), 600)
      return
    }
    if (!form.phone.trim()) {
      setError(t('auth.phone_empty'))
      setIsShaking(true)
      setTimeout(() => setIsShaking(false), 600)
      return
    }
    const phoneRegex = /^(0[3|5|7|8|9])+([0-9]{8})$/
    if (!phoneRegex.test(form.phone)) {
      setError(t('auth.phone_invalid'))
      setIsShaking(true)
      setTimeout(() => setIsShaking(false), 600)
      return
    }
    if (!form.password.trim()) {
      setError(t('auth.password_empty'))
      setIsShaking(true)
      setTimeout(() => setIsShaking(false), 600)
      return
    }

    if (form.password !== form.confirmPassword) {
      setError(t('auth.password_mismatch'))
      setIsShaking(true)
      setTimeout(() => setIsShaking(false), 600)
      return
    }

    const result = await register(form)

    if (result.success) {
      setSuccess(t('auth.register_success'))
      setTimeout(() => navigate('/login'), 2000)
    } else {
      setError(result.message || t('auth.register_failed'))
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
        py: 4,
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
                {t('auth.register_btn')}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                {t('auth.register_subtitle')}
              </Typography>
            </Box>

            {error && (
              <Typography
                variant="body2"
                sx={{
                  color: 'background.paper',
                  fontWeight: 600,
                  mb: 2,
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

            {success && (
              <Typography
                variant="body2"
                sx={{
                  color: 'background.paper',
                  fontWeight: 600,
                  mb: 2,
                  textAlign: 'center',
                  backgroundColor: 'primary.dark',
                  borderRadius: 1,
                  py: 1,
                }}
              >
                {success}
              </Typography>
            )}

            <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <TextField
                id="reg-name" label={t('auth.full_name')} name="fullName"
                value={form.fullName} onChange={handleChange} fullWidth
                slotProps={{
                  input: {
                    sx: {
                      borderRadius: 2, border: '1px solid color-mix(in srgb, var(--color-primary-500) 30%, transparent)', backgroundColor: 'color-mix(in srgb, var(--color-surface-50) 90%, transparent)', fontWeight: 600,
                      transition: 'all 0.3s ease',
                      '&:hover': { borderColor: 'primary.dark', transform: 'translateY(-2px)' },
                      '&.Mui-focused': { borderColor: 'primary.dark', boxShadow: '0 0 0 4px color-mix(in srgb, var(--color-primary-500) 10%, transparent)' }
                    }
                  },
                  inputLabel: { sx: { fontWeight: 700, color: 'primary.900', '&.Mui-focused': { color: 'primary.900' } } }
                }}
              />
              <TextField
                id="reg-email" label={t('auth.email_label')} name="email" type="email"
                value={form.email} onChange={handleChange} fullWidth
                slotProps={{
                  input: {
                    sx: {
                      borderRadius: 2, border: '1px solid color-mix(in srgb, var(--color-primary-500) 30%, transparent)', backgroundColor: 'color-mix(in srgb, var(--color-surface-50) 90%, transparent)', fontWeight: 600,
                      transition: 'all 0.3s ease',
                      '&:hover': { borderColor: 'primary.dark', transform: 'translateY(-2px)' },
                      '&.Mui-focused': { borderColor: 'primary.dark', boxShadow: '0 0 0 4px color-mix(in srgb, var(--color-primary-500) 10%, transparent)' }
                    }
                  },
                  inputLabel: { sx: { fontWeight: 700, color: 'primary.900', '&.Mui-focused': { color: 'primary.900' } } }
                }}
              />
              <TextField
                id="reg-phone" label={t('auth.phone')} name="phone"
                value={form.phone} onChange={handleChange} fullWidth
                slotProps={{
                  input: {
                    sx: {
                      borderRadius: 2, border: '1px solid color-mix(in srgb, var(--color-primary-500) 30%, transparent)', backgroundColor: 'color-mix(in srgb, var(--color-surface-50) 90%, transparent)', fontWeight: 600,
                      transition: 'all 0.3s ease',
                      '&:hover': { borderColor: 'primary.dark', transform: 'translateY(-2px)' },
                      '&.Mui-focused': { borderColor: 'primary.dark', boxShadow: '0 0 0 4px color-mix(in srgb, var(--color-primary-500) 10%, transparent)' }
                    }
                  },
                  inputLabel: { sx: { fontWeight: 700, color: 'primary.900', '&.Mui-focused': { color: 'primary.900' } } }
                }}
              />
              <TextField
                id="reg-role" label={t('auth.role')} name="role"
                value={form.role} onChange={handleChange} select fullWidth
                slotProps={{
                  input: {
                    sx: {
                      borderRadius: 2, border: '1px solid color-mix(in srgb, var(--color-primary-500) 30%, transparent)', backgroundColor: 'color-mix(in srgb, var(--color-surface-50) 90%, transparent)', fontWeight: 600,
                      transition: 'all 0.3s ease',
                      '&:hover': { borderColor: 'primary.dark', transform: 'translateY(-2px)' },
                      '&.Mui-focused': { borderColor: 'primary.dark', boxShadow: '0 0 0 4px color-mix(in srgb, var(--color-primary-500) 10%, transparent)' }
                    }
                  },
                  inputLabel: { sx: { fontWeight: 700, color: 'primary.900', '&.Mui-focused': { color: 'primary.900' } } }
                }}
              >
                <MenuItem value="PATIENT">{t('auth.role_patient')}</MenuItem>
                <MenuItem value="DOCTOR">{t('auth.role_doctor')}</MenuItem>
              </TextField>
              <TextField
                id="reg-password" label={t('auth.password')} name="password" type="password"
                value={form.password} onChange={handleChange} fullWidth
                slotProps={{
                  input: {
                    sx: {
                      borderRadius: 2, border: '1px solid color-mix(in srgb, var(--color-primary-500) 30%, transparent)', backgroundColor: 'color-mix(in srgb, var(--color-surface-50) 90%, transparent)', fontWeight: 600,
                      transition: 'all 0.3s ease',
                      '&:hover': { borderColor: 'primary.dark', transform: 'translateY(-2px)' },
                      '&.Mui-focused': { borderColor: 'primary.dark', boxShadow: '0 0 0 4px color-mix(in srgb, var(--color-primary-500) 10%, transparent)' }
                    }
                  },
                  inputLabel: { sx: { fontWeight: 700, color: 'primary.900', '&.Mui-focused': { color: 'primary.900' } } }
                }}
              />
              <TextField
                id="reg-confirm" label={t('auth.confirm_password')} name="confirmPassword" type="password"
                value={form.confirmPassword} onChange={handleChange} fullWidth
                slotProps={{
                  input: {
                    sx: {
                      borderRadius: 2, border: '1px solid color-mix(in srgb, var(--color-primary-500) 30%, transparent)', backgroundColor: 'color-mix(in srgb, var(--color-surface-50) 90%, transparent)', fontWeight: 600,
                      transition: 'all 0.3s ease',
                      '&:hover': { borderColor: 'primary.dark', transform: 'translateY(-2px)' },
                      '&.Mui-focused': { borderColor: 'primary.dark', boxShadow: '0 0 0 4px color-mix(in srgb, var(--color-primary-500) 10%, transparent)' }
                    }
                  },
                  inputLabel: { sx: { fontWeight: 700, color: 'primary.900', '&.Mui-focused': { color: 'primary.900' } } }
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
                {isLoading ? <CircularProgress size={24} color="inherit" /> : t('auth.register_btn')}
              </Button>
            </Box>

            <Typography sx={{ mt: 3, textAlign: 'center', fontWeight: 600 }} color="text.secondary">
              {t('auth.ask_login')}{' '}
              <Link to="/login" style={{ color: 'primary.dark', fontWeight: 800, textDecoration: 'none' }}>
                {t('auth.login_btn')}
              </Link>
            </Typography>
          </CardContent>
        </Card>
      </Fade>
    </Box>
  )
}
