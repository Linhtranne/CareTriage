import { Box, Chip, Container, Paper, Stack, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'

export default function PatientPageShell({
  title,
  subtitle,
  actions,
  children,
  maxWidth = 'lg',
  badge,
  contentSx = {},
}) {
  const { t } = useTranslation()
  const badgeLabel = badge || t('patient_shell.badge')

  return (
    <Box sx={{ minHeight: '100%', bgcolor: '#f4fbf8' }}>
      <Container maxWidth={maxWidth} sx={{ py: { xs: 2, md: 4 } }}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, md: 3.5 },
            borderRadius: { xs: 4, md: 5 },
            border: '1px solid rgba(8, 187, 163, 0.12)',
            bgcolor: 'rgba(255, 255, 255, 0.82)',
            backdropFilter: 'blur(18px)',
            boxShadow: '0 16px 40px rgba(15, 23, 42, 0.05)',
          }}
        >
          <Stack spacing={2}>
            <Chip
              label={badgeLabel}
              size="small"
              sx={{
                alignSelf: 'flex-start',
                height: 28,
                px: 0.5,
                fontWeight: 800,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                bgcolor: 'rgba(8, 187, 163, 0.08)',
                color: '#087f73',
                border: '1px solid rgba(8, 187, 163, 0.12)',
              }}
            />

            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 2,
                alignItems: 'flex-start',
              }}
            >
              <Box sx={{ maxWidth: 760, flex: '1 1 320px', minWidth: 0 }}>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 900,
                    letterSpacing: '-0.03em',
                    lineHeight: 1.08,
                    fontSize: { xs: '1.6rem', sm: '2rem', md: '2.25rem' },
                    color: '#0f172a',
                  }}
                >
                  {title}
                </Typography>

                {subtitle && (
                  <Typography
                    variant="body1"
                    sx={{
                      mt: 1,
                      color: 'text.secondary',
                      lineHeight: 1.65,
                      maxWidth: 680,
                    }}
                  >
                    {subtitle}
                  </Typography>
                )}
              </Box>

              {actions ? (
                <Stack
                  direction="row"
                  spacing={1.25}
                  sx={{
                    flex: '0 0 auto',
                    ml: 'auto',
                    width: 'auto',
                    justifyContent: 'flex-end',
                    alignItems: 'flex-start',
                    '& > *': { width: 'auto' },
                  }}
                >
                  {actions}
                </Stack>
              ) : null}
            </Box>
          </Stack>
        </Paper>

        <Box sx={{ mt: { xs: 2, md: 3 }, ...contentSx }}>{children}</Box>
      </Container>
    </Box>
  )
}
