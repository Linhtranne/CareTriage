import { Box, Container, Stack, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'

export default function DoctorPageShell({
  title,
  subtitle,
  actions,
  children,
  maxWidth = 'lg',
  badge,
  contentSx = {},
  transparent = false
}) {
  const { t } = useTranslation()
  const badgeLabel = badge || 'Clinical Workspace'

  return (
    <Box sx={{ minHeight: '100%', bgcolor: 'white' }}>
      <Container maxWidth={maxWidth} sx={{ py: { xs: 4, md: 8 } }}>
        <Box
          sx={{
            p: transparent ? 0 : { xs: 4, md: 6 },
            borderRadius: 8,
            border: transparent ? 'none' : '1px solid oklch(92% 0.02 250)',
            bgcolor: transparent ? 'transparent' : 'white',
            boxShadow: transparent ? 'none' : '0 20px 40px oklch(20% 0.05 250 / 0.03)',
            mb: 6
          }}
        >
          <Stack spacing={3}>
            <Box
              sx={{
                px: 1.5, py: 0.5, borderRadius: 2, 
                bgcolor: 'oklch(96% 0.01 250)', color: 'oklch(50% 0.15 250)',
                fontSize: '0.75rem', fontWeight: 950, textTransform: 'uppercase',
                alignSelf: 'flex-start', letterSpacing: '0.1em',
                border: '1px solid oklch(90% 0.02 250)'
              }}
            >
              {badgeLabel}
            </Box>

            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 4,
                alignItems: 'flex-start',
              }}
            >
              <Box sx={{ flex: 1, minWidth: 320 }}>
                <Typography
                  variant="h2"
                  sx={{
                    fontWeight: 950,
                    letterSpacing: '-0.05em',
                    lineHeight: 1.05,
                    color: 'oklch(20% 0.05 250)',
                  }}
                >
                  {title}
                </Typography>

                {subtitle && (
                  <Typography
                    variant="h6"
                    sx={{
                      mt: 2,
                      color: 'oklch(50% 0.02 250)',
                      lineHeight: 1.6,
                      maxWidth: 800,
                      fontWeight: 500
                    }}
                  >
                    {subtitle}
                  </Typography>
                )}
              </Box>

              {actions ? (
                <Stack
                  direction="row"
                  spacing={2}
                  sx={{
                    flex: '0 0 auto',
                    ml: 'auto',
                    justifyContent: 'flex-end',
                    alignItems: 'center'
                  }}
                >
                  {actions}
                </Stack>
              ) : null}
            </Box>
          </Stack>
        </Box>

        <Box sx={{ ...contentSx }}>{children}</Box>
      </Container>
    </Box>
  )
}
