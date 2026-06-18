import { createTheme } from '@mui/material/styles'
import { DESIGN_TOKENS } from '../constants/design-tokens'

const { colors, radius, shadow, typography } = DESIGN_TOKENS

const theme = createTheme({
  palette: {
    primary: {
      main: colors.primary[500],
      light: colors.primary[400],
      dark: colors.primary[600],
      contrastText: colors.neutral.paper,
    },
    secondary: {
      main: colors.accent[500],
      light: colors.accent[400],
      dark: colors.accent[600],
      contrastText: colors.neutral.paper,
    },
    success: {
      main: colors.semantic.success,
      light: colors.semantic.success,
      dark: colors.semantic.success,
      contrastText: colors.neutral.paper,
    },
    warning: {
      main: colors.semantic.warning,
      light: colors.semantic.warning,
      dark: colors.semantic.warning,
      contrastText: colors.surface[900],
    },
    error: {
      main: colors.semantic.danger,
      light: colors.semantic.danger,
      dark: colors.semantic.danger,
      contrastText: colors.neutral.paper,
    },
    info: {
      main: colors.semantic.info,
      light: colors.semantic.info,
      dark: colors.semantic.info,
      contrastText: colors.neutral.paper,
    },
    background: {
      default: colors.surface[50],
      paper: colors.neutral.paper,
    },
    text: {
      primary: colors.surface[800],
      secondary: colors.surface[700],
    },
  },
  typography: {
    fontFamily: typography.fontFamily,
    h1: { fontWeight: 700, fontSize: '2.25rem', lineHeight: 1.2 },
    h2: { fontWeight: 700, fontSize: '1.875rem', lineHeight: 1.3 },
    h3: { fontWeight: 600, fontSize: '1.5rem', lineHeight: 1.4 },
    h4: { fontWeight: 600, fontSize: '1.25rem', lineHeight: 1.4 },
    h5: { fontWeight: 600, fontSize: '1.125rem', lineHeight: 1.5 },
    h6: { fontWeight: 600, fontSize: '1rem', lineHeight: 1.5 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: {
    borderRadius: radius.md,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: radius.md,
          padding: '10px 24px',
          fontSize: '0.9375rem',
          boxShadow: 'none',
          '&:hover': { boxShadow: `0 4px 12px ${colors.primary[500]}33` },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: radius.lg,
          boxShadow: shadow.card,
          border: `1px solid ${colors.surface[200]}`,
        },
      },
    },
    MuiTextField: {
      defaultProps: { variant: 'outlined', size: 'medium' },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': { borderRadius: radius.md },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: colors.neutral.paper,
          color: colors.surface[800],
          boxShadow: shadow.card,
        },
      },
    },
  },
})

export default theme
