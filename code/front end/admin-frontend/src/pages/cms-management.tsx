import { useState, useEffect } from 'react'
import {
  Box, Container, Typography, TextField, Button, Grid,
  Paper, Stack, Alert, CircularProgress, Tabs, Tab,
  Card, CardContent, Divider, Fade
} from '@mui/material'
import { 
  Save, Refresh, Translate, Language, Dashboard, 
  SettingsSuggest, Web, ViewQuilt 
} from '@mui/icons-material'
import landingApi from '../services/landing-service'

export default function CMSManagement() {
  const [lang, setLang] = useState('vi')
  const [content, setContent] = useState({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const fetchContent = async (l) => {
    setLoading(true)
    try {
      const res = await landingApi.getContent(l)
      setContent(res.data?.data || {})
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchContent(lang)
    }, 0)

    return () => clearTimeout(timer)
  }, [lang])

  const handleSave = async () => {
    setSaving(true)
    setMessage('')
    try {
      await landingApi.updateContent(content, lang)
      setMessage('Cập nhật nội dung thành công!')
      setTimeout(() => setMessage(''), 5000)
    } catch {
      setMessage('Lỗi khi cập nhật nội dung.')
    } finally {
      setSaving(false)
    }
  }

  const updateField = (key, val) => {
    setContent({ ...content, [key]: val })
  }

  const sections = [
    { 
      id: 'hero', 
      label: 'Hero Section', 
      icon: <Dashboard />,
      desc: 'Cấu hình tiêu đề chính, phụ và nút kêu gọi hành động ở đầu trang.',
      fields: [
        { key: 'title', label: 'Tiêu đề chính', multiline: false },
        { key: 'subtitle', label: 'Tiêu đề phụ', multiline: false },
        { key: 'description', label: 'Mô tả chi tiết', multiline: true, rows: 3 },
        { key: 'action', label: 'Nhãn nút hành động', multiline: false },
      ]
    },
    { 
      id: 'problems', 
      label: 'Vấn đề & Thách thức', 
      icon: <SettingsSuggest />,
      desc: 'Nội dung mô tả các khó khăn của hệ thống y tế hiện tại.',
      fields: [
        { key: 'title', label: 'Tiêu đề section', multiline: false },
        { key: 'subtitle', label: 'Mô tả ngắn', multiline: true, rows: 2 },
      ]
    },
    { 
      id: 'solutions', 
      label: 'Giải pháp CareTriage', 
      icon: <ViewQuilt />,
      desc: 'Giới thiệu các tính năng và giá trị cốt lõi của ứng dụng.',
      fields: [
        { key: 'title', label: 'Tiêu đề section', multiline: false },
        { key: 'subtitle', label: 'Mô tả ngắn', multiline: true, rows: 2 },
      ]
    },
    { 
      id: 'departments', 
      label: 'Danh mục Chuyên khoa', 
      icon: <Web />,
      desc: 'Tiêu đề và giới thiệu cho phần danh sách các chuyên khoa.',
      fields: [
        { key: 'title', label: 'Tiêu đề section', multiline: false },
        { key: 'subtitle', label: 'Mô tả ngắn', multiline: true, rows: 2 },
      ]
    }
  ]

  return (
    <Container maxWidth="lg" sx={{ py: 4, position: 'relative', zIndex: 1 }}>
      {/* ── Header ────────────────────────────────────────────────── */}
      <Box sx={{ mb: 5 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="center" spacing={3}>
          <Box>
            <Typography variant="h3" sx={{ fontWeight: 900, color: 'text.primary', mb: 1, letterSpacing: '-0.02em' }}>
              Content Management
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
              Tùy chỉnh nội dung hiển thị trên Landing Page của CareTriage
            </Typography>
          </Box>
          
          <Paper 
            elevation={0}
            sx={{ 
              p: 0.5, 
              borderRadius: '16px', 
              bgcolor: 'color-mix(in srgb, var(--color-surface-50) 50%, transparent)',
              backdropFilter: 'blur(10px)',
              border: '1px solid color-mix(in srgb, var(--color-primary-500) 15%, transparent)',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <Tabs 
              value={lang} 
              onChange={(e, v) => setLang(v)}
              sx={{
                minHeight: 44,
                '& .MuiTabs-indicator': { height: '100%', borderRadius: '12px', zIndex: 0, bgcolor: 'primary.main', opacity: 0.1 },
                '& .MuiTab-root': { 
                  minHeight: 44, borderRadius: '12px', zIndex: 1, px: 3,
                  fontWeight: 700, transition: 'all 0.2s',
                  '&.Mui-selected': { color: 'primary.main' }
                }
              }}
            >
              <Tab icon={<Language sx={{ fontSize: 18 }} />} iconPosition="start" label="Tiếng Việt" value="vi" />
              <Tab icon={<Translate sx={{ fontSize: 18 }} />} iconPosition="start" label="English" value="en" />
            </Tabs>
          </Paper>
        </Stack>
      </Box>

      {message && (
        <Fade in={!!message}>
          <Alert 
            severity={message.includes('Lỗi') ? 'error' : 'success'} 
            variant="filled"
            sx={{ mb: 4, borderRadius: '16px', fontWeight: 600, boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}
          >
            {message}
          </Alert>
        </Fade>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', py: 15, gap: 2 }}>
          <CircularProgress size={50} thickness={4} sx={{ color: 'primary.main' }} />
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, animate: 'pulse 1.5s infinite' }}>
            Đang tải dữ liệu...
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={4}>
          {sections.map((section) => (
            <Grid item xs={12} key={section.id}>
              <Card 
                elevation={0}
                sx={{ 
                  borderRadius: '24px', 
                  border: '1px solid color-mix(in srgb, var(--color-primary-500) 8%, transparent)',
                  background: 'color-mix(in srgb, var(--color-surface-50) 70%, transparent)',
                  backdropFilter: 'blur(20px)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: '0 12px 40px rgba(0,0,0,0.04)',
                    borderColor: 'color-mix(in srgb, var(--color-primary-500) 20%, transparent)'
                  }
                }}
              >
                <CardContent sx={{ p: 4 }}>
                  <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
                    <Box sx={{ 
                      p: 1, borderRadius: '12px', 
                      bgcolor: 'color-mix(in srgb, var(--color-primary-500) 10%, transparent)', color: 'primary.main',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      {section.icon}
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 800 }}>{section.label}</Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 4, ml: 6 }}>
                    {section.desc}
                  </Typography>
                  
                  <Divider sx={{ mb: 4, opacity: 0.5 }} />

                  <Grid container spacing={4}>
                    {section.fields.map((field) => {
                      const fullKey = `${section.id}.${field.key}`
                      return (
                        <Grid item xs={12} md={field.multiline ? 12 : 6} key={field.key}>
                          <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', ml: 1, mb: 1, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {field.label}
                          </Typography>
                          <TextField 
                            fullWidth 
                            placeholder={`Nhập ${field.label.toLowerCase()}...`}
                            value={content[fullKey] || ''}
                            onChange={(e) => updateField(fullKey, e.target.value)}
                            multiline={field.multiline}
                            rows={field.rows || 1}
                            variant="outlined"
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                borderRadius: '16px',
                                bgcolor: 'color-mix(in srgb, var(--color-surface-50) 80%, transparent)',
                                transition: 'all 0.2s',
                                '& fieldset': { borderColor: 'rgba(0,0,0,0.08)' },
                                '&:hover fieldset': { borderColor: 'color-mix(in srgb, var(--color-primary-500) 30%, transparent)' },
                                '&.Mui-focused fieldset': { borderWidth: '2px', borderColor: 'primary.main' }
                              }
                            }}
                          />
                        </Grid>
                      )
                    })}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* ── Sticky Action Bar ─────────────────────────────────────── */}
      <Box sx={{ 
        position: 'sticky', 
        bottom: 30, 
        mt: 8, 
        display: 'flex', 
        justifyContent: 'center',
        zIndex: 10
      }}>
        <Paper 
          elevation={20}
          sx={{ 
            px: 4, py: 2, 
            borderRadius: '100px', 
            bgcolor: 'rgba(15, 23, 42, 0.9)', 
            backdropFilter: 'blur(16px)',
            display: 'flex',
            gap: 2,
            border: '1px solid color-mix(in srgb, var(--color-surface-50) 10%, transparent)'
          }}
        >
          <Button 
            variant="text" 
            startIcon={<Refresh />} 
            onClick={() => fetchContent(lang)}
            sx={{ color: 'color-mix(in srgb, var(--color-surface-50) 70%, transparent)', borderRadius: '100px', px: 3, '&:hover': { color: '#fff', bgcolor: 'color-mix(in srgb, var(--color-surface-50) 5%, transparent)' } }}
          >
            Làm mới
          </Button>
          <Divider orientation="vertical" flexItem sx={{ bgcolor: 'color-mix(in srgb, var(--color-surface-50) 10%, transparent)', my: 1 }} />
          <Button 
            variant="contained" 
            size="large" 
            startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <Save />}
            onClick={handleSave} 
            disabled={saving || loading}
            sx={{ 
              px: 6, 
              borderRadius: '100px',
              bgcolor: 'var(--color-primary-500)',
              fontWeight: 800,
              boxShadow: '0 8px 24px color-mix(in srgb, var(--color-primary-500) 30%, transparent)',
              '&:hover': { bgcolor: 'var(--color-primary-600)', boxShadow: '0 12px 32px color-mix(in srgb, var(--color-primary-500) 40%, transparent)' },
              '&.Mui-disabled': { bgcolor: 'color-mix(in srgb, var(--color-surface-50) 10%, transparent)', color: 'color-mix(in srgb, var(--color-surface-50) 30%, transparent)' }
            }}
          >
            {saving ? 'Đang lưu...' : 'Lưu tất cả thay đổi'}
          </Button>
        </Paper>
      </Box>

      {/* Global CSS for minor refinements */}
      <style>{`
        @keyframes pulse {
          0% { opacity: 0.6; }
          50% { opacity: 1; }
          100% { opacity: 0.6; }
        }
      `}</style>
    </Container>
  )
}
