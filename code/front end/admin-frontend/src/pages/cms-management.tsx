/* eslint-disable no-magic-numbers */
import React, { useState, useEffect } from 'react'
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
import { useTranslation } from 'react-i18next'
import { ADMIN_CONSTANTS } from '../constants/admin-constants'

interface ContentField {
  key: string;
  label: string;
  multiline: boolean;
  rows?: number;
}

interface ContentSection {
  id: string;
  label: string;
  icon: React.ReactNode;
  desc: string;
  fields: ContentField[];
}

export default function CMSManagement() {
  const { t } = useTranslation()
  const [lang, setLang] = useState<string>('vi')
  const [content, setContent] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState<boolean>(false)
  const [saving, setSaving] = useState<boolean>(false)
  const [message, setMessage] = useState<string>('')

  const fetchContent = async (l: string) => {
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
      setMessage(t('cms.success', 'Cập nhật nội dung thành công!'))
      setTimeout(() => setMessage(''), ADMIN_CONSTANTS.SNACKBAR_DURATION)
    } catch {
      setMessage(t('cms.error', 'Lỗi khi cập nhật nội dung.'))
    } finally {
      setSaving(false)
    }
  }

  const updateField = (key: string, val: string) => {
    setContent((prev) => ({ ...prev, [key]: val }))
  }

  const sections: ContentSection[] = [
    { 
      id: 'hero', 
      label: 'Hero Section', 
      icon: <Dashboard />,
      desc: t('cms.hero.desc', 'Cấu hình tiêu đề chính, phụ và nút kêu gọi hành động ở đầu trang.'),
      fields: [
        { key: 'title', label: t('cms.hero.title', 'Tiêu đề chính'), multiline: false },
        { key: 'subtitle', label: t('cms.hero.subtitle', 'Tiêu đề phụ'), multiline: false },
        { key: 'description', label: t('cms.hero.description', 'Mô tả chi tiết'), multiline: true, rows: 3 },
        { key: 'action', label: t('cms.hero.action', 'Nhãn nút hành động'), multiline: false },
      ]
    },
    { 
      id: 'problems', 
      label: t('cms.problems.label', 'Vấn đề & Thách thức'), 
      icon: <SettingsSuggest />,
      desc: t('cms.problems.desc', 'Nội dung mô tả các khó khăn của hệ thống y tế hiện tại.'),
      fields: [
        { key: 'title', label: t('cms.section.title', 'Tiêu đề section'), multiline: false },
        { key: 'subtitle', label: t('cms.section.subtitle', 'Mô tả ngắn'), multiline: true, rows: 2 },
      ]
    },
    { 
      id: 'solutions', 
      label: t('cms.solutions.label', 'Giải pháp CareTriage'), 
      icon: <ViewQuilt />,
      desc: t('cms.solutions.desc', 'Giới thiệu các tính năng và giá trị cốt lõi của ứng dụng.'),
      fields: [
        { key: 'title', label: t('cms.section.title', 'Tiêu đề section'), multiline: false },
        { key: 'subtitle', label: t('cms.section.subtitle', 'Mô tả ngắn'), multiline: true, rows: 2 },
      ]
    },
    { 
      id: 'departments', 
      label: t('cms.departments.label', 'Danh mục Chuyên khoa'), 
      icon: <Web />,
      desc: t('cms.departments.desc', 'Tiêu đề và giới thiệu cho phần danh sách các chuyên khoa.'),
      fields: [
        { key: 'title', label: t('cms.section.title', 'Tiêu đề section'), multiline: false },
        { key: 'subtitle', label: t('cms.section.subtitle', 'Mô tả ngắn'), multiline: true, rows: 2 },
      ]
    }
  ]

  return (
    <Container maxWidth="lg" sx={{ py: 4, position: 'relative', zIndex: 1 }}>
      <Box sx={{ mb: 5 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="center" spacing={3}>
          <Box>
            <Typography variant="h3" sx={{ fontWeight: 900, color: 'text.primary', mb: 1, letterSpacing: '-0.02em' }}>
              {t('cms.header.title', 'Content Management')}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
              {t('cms.header.subtitle', 'Tùy chỉnh nội dung hiển thị trên Landing Page của CareTriage')}
            </Typography>
          </Box>
          
          <Paper 
            elevation={0}
            sx={{ 
              p: 0.5, 
              borderRadius: 4, 
              bgcolor: 'background.paper',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <Tabs 
              value={lang} 
              onChange={(_, v) => setLang(v)}
              sx={{
                minHeight: 44,
                '& .MuiTabs-indicator': { height: '100%', borderRadius: 3, zIndex: 0, bgcolor: 'primary.main', opacity: 0.1 },
                '& .MuiTab-root': { 
                  minHeight: 44, borderRadius: 3, zIndex: 1, px: 3,
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
            sx={{ mb: 4, borderRadius: 4, fontWeight: 600, boxShadow: 1 }}
          >
            {message}
          </Alert>
        </Fade>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', py: 15, gap: 2 }}>
          <CircularProgress size={50} thickness={4} sx={{ color: 'primary.main' }} />
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
            {t('common.loading', 'Đang tải dữ liệu...')}
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={4}>
          {sections.map((section) => (
            <Grid item xs={12} key={section.id}>
              <Card 
                elevation={0}
                sx={{ 
                  borderRadius: 6, 
                  bgcolor: 'background.paper',
                  border: 1,
                  borderColor: 'divider',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: 3,
                    borderColor: 'primary.main'
                  }
                }}
              >
                <CardContent sx={{ p: 4 }}>
                  <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
                    <Box sx={{ 
                      p: 1, borderRadius: 3, 
                      bgcolor: 'primary.light', color: 'primary.main',
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
                            placeholder={`${t('common.enter', 'Nhập')} ${field.label.toLowerCase()}...`}
                            value={content[fullKey] || ''}
                            onChange={(e) => updateField(fullKey, e.target.value)}
                            multiline={field.multiline}
                            rows={field.rows || 1}
                            variant="outlined"
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
            borderRadius: 25, 
            bgcolor: 'background.paper', 
            display: 'flex',
            gap: 2,
            border: 1,
            borderColor: 'divider'
          }}
        >
          <Button 
            variant="text" 
            startIcon={<Refresh />} 
            onClick={() => fetchContent(lang)}
            sx={{ borderRadius: 25, px: 3 }}
          >
            {t('common.refresh', 'Làm mới')}
          </Button>
          <Divider orientation="vertical" flexItem sx={{ my: 1 }} />
          <Button 
            variant="contained" 
            size="large" 
            startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <Save />}
            onClick={handleSave} 
            disabled={saving || loading}
            sx={{ 
              px: 6, 
              borderRadius: 25,
              fontWeight: 800,
            }}
          >
            {saving ? t('common.saving', 'Đang lưu...') : t('common.saveAll', 'Lưu tất cả thay đổi')}
          </Button>
        </Paper>
      </Box>
    </Container>
  )
}
