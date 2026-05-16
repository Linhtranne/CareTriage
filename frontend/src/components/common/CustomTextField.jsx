import React from 'react';
import { TextField, InputAdornment, Box } from '@mui/material';

const CustomTextField = ({ icon, label, ...props }) => {
  return (
    <TextField
      fullWidth
      label={label}
      variant="outlined"
      InputLabelProps={{
        shrink: true,
        sx: {
          color: 'oklch(50% 0.05 160)',
          fontWeight: 700,
          '&.Mui-focused': {
            color: 'oklch(65% 0.15 160)',
          },
        },
      }}
      InputProps={{
        startAdornment: icon ? (
          <InputAdornment position="start">
            <Box sx={{ color: 'oklch(65% 0.15 160)', display: 'flex' }}>
              {React.cloneElement(icon, { sx: { fontSize: 20 } })}
            </Box>
          </InputAdornment>
        ) : null,
      }}
      sx={{
        '& .MuiOutlinedInput-root': {
          bgcolor: 'oklch(100% 0 0 / 0.05)',
          backdropFilter: 'blur(20px)',
          borderRadius: '16px',
          transition: 'all 0.3s ease',
          '& fieldset': {
            borderColor: 'oklch(100% 0 0 / 0.1)',
          },
          '&:hover fieldset': {
            borderColor: 'oklch(65% 0.15 160 / 0.3)',
          },
          '&.Mui-focused fieldset': {
            borderColor: 'oklch(65% 0.15 160)',
            borderWidth: '2px',
          },
          '& input': {
            fontWeight: 600,
            color: 'oklch(20% 0.05 250)',
          },
        },
        ...props.sx,
      }}
      {...props}
    />
  );
};

export default CustomTextField;
