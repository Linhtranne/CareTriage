import { Box, Typography, Button, Grid, Paper, Container } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { CheckCircleOutlined } from '@mui/icons-material'
import Navbar from './Navbar'
import InteractiveParticles from './InteractiveParticles'

export default function FeatureDetailTemplate({ 
  title, 
  category, 
  description, 
  features = [], 
  gradient = 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
}) {
  const navigate = useNavigate()
  const { i18n } = useTranslation()

  const [tTitle, setTTitle] = useState(title)
  const [tCategory, setTCategory] = useState(category)
  const [tDesc, setTDesc] = useState(description)
  const [tFeatures, setTFeatures] = useState(features)

  useEffect(() => {
    if (!i18n.language || i18n.language.startsWith('vi')) {
      return
    }

    let isMounted = true

    const translateText = async (text) => {
      try {
        const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=vi&tl=en&dt=t&q=${encodeURIComponent(text)}`)
        const data = await res.json()
        return data[0].map(item => item[0]).join('')
      } catch {
        return text
      }
    }

    const performTranslation = async () => {
      const newTitle = await translateText(title)
      const newCategory = await translateText(category)
      const newDesc = await translateText(description)
      
      const newFeatures = await Promise.all(
        features.map(async (feat) => ({
          title: await translateText(feat.title),
          desc: await translateText(feat.desc)
        }))
      )

      if (isMounted) {
        setTTitle(newTitle)
        setTCategory(newCategory)
        setTDesc(newDesc)
        setTFeatures(newFeatures)
      }
    }

    performTranslation()
    return () => { isMounted = false }
  }, [i18n.language, title, category, description, features])

  const isVi = !i18n.language || i18n.language.startsWith('vi')
  const displayTitle = isVi ? title : tTitle
  const displayCategory = isVi ? category : tCategory
  const displayDesc = isVi ? description : tDesc
  const displayFeatures = isVi ? features : tFeatures

  return (
    <Box sx={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f0fdf4 0%, #effefa 50%, #f8fafc 100%)',
      color: '#1e293b',
      pt: 16, pb: 8, position: 'relative', overflowX: 'hidden'
    }}>
      <InteractiveParticles mode="neural" />
      <Navbar />
      {/* Background Soft Shape */}
      <Box sx={{
        position: 'absolute', top: '-10%', right: '-10%',
        width: 600, height: 600, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, rgba(255,255,255,0) 70%)',
        filter: 'blur(60px)', pointerEvents: 'none'
      }} />

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 2 }}>


        {/* Hero Info */}
        <Box sx={{ mb: 8 }}>
          <Typography variant="overline" sx={{ color: '#059669', fontWeight: 800, letterSpacing: 2 }}>
            {displayCategory}
          </Typography>
          <Typography variant="h2" sx={{ fontWeight: 900, color: '#064e3b', mt: 1, mb: 3 }}>
            {displayTitle}
          </Typography>
          <Typography variant="h6" sx={{ color: '#4b5563', maxWidth: 800, lineHeight: 1.8, fontWeight: 500 }}>
            {displayDesc}
          </Typography>
        </Box>

        {/* Feature Breakdown Grid */}
        <Grid container spacing={4} sx={{ mb: 8 }}>
          {displayFeatures.map((feat, index) => (
            <Grid size={{ xs: 12, md: 4 }} key={index}>
              <Paper sx={{
                p: 4, height: '100%', borderRadius: 4,
                background: 'rgba(255, 255, 255, 0.6)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(16, 185, 129, 0.15)',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.02)',
                transition: 'all 0.3s ease',
                '&:hover': { transform: 'translateY(-6px)', boxShadow: '0 30px 60px rgba(16, 185, 129, 0.1)' }
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, color: '#059669' }}>
                  <CheckCircleOutlined sx={{ fontSize: 28, mr: 1.5 }} />
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#064e3b' }}>
                    {feat.title}
                  </Typography>
                </Box>
                <Typography variant="body1" sx={{ color: '#4b5563', lineHeight: 1.6 }}>
                  {feat.desc}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* CTA Section */}
        <Paper sx={{
          p: 6, borderRadius: 6,
          background: gradient,
          color: '#ffffff', textAlign: 'center',
          boxShadow: '0 20px 40px rgba(16, 185, 129, 0.3)'
        }}>
          <Typography variant="h4" sx={{ fontWeight: 900, mb: 2 }}>
            Trải nghiệm {displayTitle} ngay hôm nay
          </Typography>
          <Typography variant="h6" sx={{ mb: 4, opacity: 0.9, fontWeight: 400 }}>
            Đăng ký tài khoản miễn phí để bắt đầu số hóa quy trình khám chữa bệnh của bạn.
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/register')}
            sx={{
              backgroundColor: '#ffffff', color: '#064e3b',
              fontWeight: 800, px: 5, py: 1.5, borderRadius: 3,
              '&:hover': { backgroundColor: '#f0fdf4', transform: 'scale(1.05)' },
              transition: 'all 0.2s'
            }}
          >
            Bắt đầu miễn phí
          </Button>
        </Paper>
      </Container>
    </Box>
  )
}
