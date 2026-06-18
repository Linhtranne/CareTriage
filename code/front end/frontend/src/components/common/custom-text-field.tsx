import type { ReactElement } from 'react'
import type { SxProps, TextFieldProps, Theme } from '@mui/material'
import { Box, InputAdornment, TextField } from '@mui/material'

const CUSTOM_TEXT_FIELD_STYLES = {
  borderRadius: 2,
  blur: 'blur(20px)',
  transition: 'all 0.3s ease',
  iconFontSize: 20,
  labelFontWeight: 700,
  inputFontWeight: 600,
  focusedBorderWidth: 2,
  inputBackground: 'var(--glass-surface)',
  labelColor: 'var(--color-primary-700)',
  focusColor: 'var(--color-primary-600)',
  fieldsetBorder: 'var(--glass-border)',
  inputTextColor: 'var(--color-surface-900)',
} as const

type CustomTextFieldProps = Omit<TextFieldProps, 'label'> & {
  icon?: ReactElement
  label: string
}

export default function CustomTextField({ icon, label, sx, ...props }: CustomTextFieldProps) {
  const mergedSx: SxProps<Theme> = {
    '& .MuiOutlinedInput-root': {
      bgcolor: CUSTOM_TEXT_FIELD_STYLES.inputBackground,
      backdropFilter: CUSTOM_TEXT_FIELD_STYLES.blur,
      borderRadius: CUSTOM_TEXT_FIELD_STYLES.borderRadius,
      transition: CUSTOM_TEXT_FIELD_STYLES.transition,
      '& fieldset': {
        borderColor: CUSTOM_TEXT_FIELD_STYLES.fieldsetBorder,
      },
      '&:hover fieldset': {
        borderColor: CUSTOM_TEXT_FIELD_STYLES.focusColor,
      },
      '&.Mui-focused fieldset': {
        borderColor: CUSTOM_TEXT_FIELD_STYLES.focusColor,
        borderWidth: CUSTOM_TEXT_FIELD_STYLES.focusedBorderWidth,
      },
      '& input': {
        fontWeight: CUSTOM_TEXT_FIELD_STYLES.inputFontWeight,
        color: CUSTOM_TEXT_FIELD_STYLES.inputTextColor,
      },
    },
    ...(sx ?? {}),
  }

  return (
    <TextField
      fullWidth
      label={label}
      variant="outlined"
      slotProps={{
        inputLabel: {
          shrink: true,
          sx: {
            color: CUSTOM_TEXT_FIELD_STYLES.labelColor,
            fontWeight: CUSTOM_TEXT_FIELD_STYLES.labelFontWeight,
            '&.Mui-focused': {
              color: CUSTOM_TEXT_FIELD_STYLES.focusColor,
            },
          },
        },
        input: {
          startAdornment: icon ? (
            <InputAdornment position="start">
              <Box sx={{ color: CUSTOM_TEXT_FIELD_STYLES.focusColor, display: 'flex' }}>
                {icon.type ? <icon.type {...icon.props} sx={{ fontSize: CUSTOM_TEXT_FIELD_STYLES.iconFontSize }} /> : icon}
              </Box>
            </InputAdornment>
          ) : null,
        },
      }}
      sx={mergedSx}
      {...props}
    />
  )
}
