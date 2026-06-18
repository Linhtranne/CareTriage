import type { ReactNode } from 'react'
import type { BoxProps, ContainerProps, SxProps, Theme } from '@mui/material'
import { Box, Container, Stack, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'

const SHELL_LAYOUT = {
  containerPaddingY: { xs: 4, md: 8 },
  cardPadding: { xs: 4, md: 6 },
  badgePaddingX: 1.5,
  badgePaddingY: 0.5,
  headingGap: 4,
  stackSpacing: 3,
  subtitleMarginTop: 2,
  badgeLetterSpacing: '0.1em',
  titleLetterSpacing: '-0.05em',
  titleLineHeight: 1.05,
  subtitleLineHeight: 1.6,
  contentMaxWidth: 800,
  sectionMarginBottom: 6,
  titleMinWidth: 320,
} as const

const SHELL_SURFACE = {
  borderRadius: 2,
  badgeBorderRadius: 2,
  titleFontWeight: 700,
  subtitleFontWeight: 500,
  badgeFontWeight: 600,
  panelBorder: '1px solid var(--color-surface-200)',
  panelShadow: 'var(--shadow-elevated)',
  badgeBackground: 'var(--color-primary-100)',
  badgeColor: 'var(--color-primary-700)',
  titleColor: 'var(--color-surface-900)',
  subtitleColor: 'var(--color-surface-700)',
} as const

type ShellMaxWidth = ContainerProps['maxWidth']

type ShellProps = {
  actions?: ReactNode
  badge?: string
  children: ReactNode
  contentSx?: SxProps<Theme>
  description?: string
  maxWidth?: ShellMaxWidth
  subtitle?: string
  title: string
  transparent?: boolean
}

export default function PatientPageShell({
  actions,
  badge,
  children,
  contentSx,
  description,
  maxWidth = 'lg',
  subtitle,
  title,
  transparent = false,
}: ShellProps) {
  const { t } = useTranslation()
  const badgeLabel = badge ?? t('patient_shell.badge')
  const supportingText = subtitle ?? description

  return (
    <Box sx={{ minHeight: '100%', bgcolor: 'background.paper' }}>
      <Container maxWidth={maxWidth} sx={{ py: SHELL_LAYOUT.containerPaddingY }}>
        <Box
          sx={{
            p: transparent ? 0 : SHELL_LAYOUT.cardPadding,
            borderRadius: SHELL_SURFACE.borderRadius,
            border: transparent ? 'none' : SHELL_SURFACE.panelBorder,
            bgcolor: transparent ? 'var(--color-clear)' : 'background.paper',
            boxShadow: transparent ? 'none' : SHELL_SURFACE.panelShadow,
            mb: SHELL_LAYOUT.sectionMarginBottom,
          }}
        >
          <Stack spacing={SHELL_LAYOUT.stackSpacing}>
            <Box
              sx={{
                px: SHELL_LAYOUT.badgePaddingX,
                py: SHELL_LAYOUT.badgePaddingY,
                borderRadius: SHELL_SURFACE.badgeBorderRadius,
                bgcolor: SHELL_SURFACE.badgeBackground,
                color: SHELL_SURFACE.badgeColor,
                fontSize: '0.75rem',
                fontWeight: SHELL_SURFACE.badgeFontWeight,
                textTransform: 'uppercase',
                alignSelf: 'flex-start',
                letterSpacing: SHELL_LAYOUT.badgeLetterSpacing,
              }}
            >
              {badgeLabel}
            </Box>

            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: SHELL_LAYOUT.headingGap,
                alignItems: 'flex-start',
              }}
            >
              <Box sx={{ flex: 1, minWidth: SHELL_LAYOUT.titleMinWidth }}>
                <Typography
                  variant="h2"
                  sx={{
                    fontWeight: SHELL_SURFACE.titleFontWeight,
                    letterSpacing: SHELL_LAYOUT.titleLetterSpacing,
                    lineHeight: SHELL_LAYOUT.titleLineHeight,
                    color: SHELL_SURFACE.titleColor,
                  }}
                >
                  {title}
                </Typography>

                {supportingText ? (
                  <Typography
                    variant="h6"
                    sx={{
                      mt: SHELL_LAYOUT.subtitleMarginTop,
                      color: SHELL_SURFACE.subtitleColor,
                      lineHeight: SHELL_LAYOUT.subtitleLineHeight,
                      maxWidth: SHELL_LAYOUT.contentMaxWidth,
                      fontWeight: SHELL_SURFACE.subtitleFontWeight,
                    }}
                  >
                    {supportingText}
                  </Typography>
                ) : null}
              </Box>

              {actions ? (
                <Stack
                  direction="row"
                  spacing={2}
                  sx={{
                    flex: '0 0 auto',
                    ml: 'auto',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                  }}
                >
                  {actions}
                </Stack>
              ) : null}
            </Box>
          </Stack>
        </Box>

        <Box sx={contentSx as BoxProps['sx']}>{children}</Box>
      </Container>
    </Box>
  )
}
