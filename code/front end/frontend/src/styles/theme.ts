import { createTheme } from '@mui/material/styles'
import { DESIGN_TOKENS } from '../constants/design-tokens'

const { radius, typography } = DESIGN_TOKENS

const MUI_COLORS = {
  primary: {
    main: '#08bba3',
    light: '#20d6bc',
    dark: '#039786',
  },
  secondary: {
    main: '#f43f5e',
    light: '#fb7185',
    dark: '#e11d48',
  },
  semantic: {
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#3b82f6',
  },
  surface: {
    default: '#f0fdf4',
    paper: '#f8fafc',
    border: '#e2e8f0',
    primaryText: '#1e293b',
    secondaryText: '#64748b',
  },
} as const

const MUI_SHADOWS = {
  card: '0 1px 3px rgba(15, 23, 42, 0.08), 0 1px 2px rgba(15, 23, 42, 0.06)',
  primaryHover: '0 4px 12px rgba(8, 187, 163, 0.3)',
} as const

const theme = createTheme({
  palette: {
    primary: {
      main: MUI_COLORS.primary.main,
      light: MUI_COLORS.primary.light,
      dark: MUI_COLORS.primary.dark,
      contrastText: MUI_COLORS.surface.paper,
    },
    secondary: {
      main: MUI_COLORS.secondary.main,
      light: MUI_COLORS.secondary.light,
      dark: MUI_COLORS.secondary.dark,
      contrastText: MUI_COLORS.surface.paper,
    },
    success: { main: MUI_COLORS.semantic.success },
    warning: { main: MUI_COLORS.semantic.warning },
    error: { main: MUI_COLORS.semantic.danger },
    info: { main: MUI_COLORS.semantic.info },
    background: {
      default: MUI_COLORS.surface.default,
      paper: MUI_COLORS.surface.paper,
    },
    text: {
      primary: MUI_COLORS.surface.primaryText,
      secondary: MUI_COLORS.surface.secondaryText,
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
          '&:hover': { boxShadow: MUI_SHADOWS.primaryHover },
        },
      },
      variants: [
        {
          props: { variant: 'contained', color: 'primary' },
          style: {
            background: `linear-gradient(135deg, ${MUI_COLORS.primary.main} 0%, ${MUI_COLORS.primary.light} 100%)`,
          },
        },
      ],
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: radius.lg,
          boxShadow: MUI_SHADOWS.card,
          border: `1px solid ${MUI_COLORS.surface.border}`,
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
          backgroundColor: MUI_COLORS.surface.paper,
          color: MUI_COLORS.surface.primaryText,
          boxShadow: MUI_SHADOWS.card,
        },
      },
    },
  },
})

export default theme
